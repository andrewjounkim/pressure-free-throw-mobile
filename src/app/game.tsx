import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BreathingOverlay } from '@/components/game/breathing-overlay';
import { Hud } from '@/components/game/hud';
import {
  Arena,
  Backboard,
  Ball,
  Hands,
  Reticle,
  RimAndNet,
  Sign,
  Vignette,
} from '@/components/game/scene';
import { ShootControls } from '@/components/game/shoot-controls';
import { Palette } from '@/constants/palette';
import {
  aimBy,
  type Bests,
  computeLayout,
  createGame,
  type Direction,
  type GameEvent,
  type GameResult,
  type GameState,
  type GameView,
  pressShoot,
  releaseShoot,
  snapshot,
  swipe,
  update,
} from '@/game/engine';
import { haptics } from '@/game/haptics';
import { loadBests, saveBestFinal, saveBestRound1 } from '@/lib/score-storage';

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Runs the side effects (haptics, saving, navigation) for engine events. */
function handleEvents(events: GameEvent[], finishedRef: { current: boolean }) {
  for (const event of events) {
    switch (event.type) {
      case 'heartbeat':
        haptics.heartbeat();
        break;
      case 'make':
        haptics.make();
        break;
      case 'miss':
        haptics.miss();
        break;
      case 'breakStart':
        haptics.breakStart();
        break;
      case 'breakEnd':
        if (event.success) haptics.breakSuccess();
        else haptics.breakFail();
        break;
      case 'round1End':
        if (event.newBestRound1 !== null) void saveBestRound1(event.newBestRound1);
        break;
      case 'gameOver':
        void finish(event.result, finishedRef);
        break;
      case 'rating':
        break;
    }
  }
}

async function finish(result: GameResult, finishedRef: { current: boolean }) {
  if (finishedRef.current) return;
  finishedRef.current = true;
  if (result.newRecord) await saveBestFinal(result.final);
  router.replace({
    pathname: '/results',
    params: {
      round1: String(result.round1),
      round2: result.round2 === null ? '' : String(result.round2),
      final: String(result.final),
      bestFinal: result.bestFinal === null ? '' : String(result.bestFinal),
      newRecord: result.newRecord ? '1' : '0',
    },
  });
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const engineRef = useRef<GameState | null>(null);
  const pausedRef = useRef(false);
  const finishedRef = useRef(false);
  const lastDragRef = useRef({ dx: 0, dy: 0 });

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [bests, setBests] = useState<Bests | null>(null);
  const [view, setView] = useState<GameView | null>(null);

  // 1. Load saved bests once (loadBests never throws; it falls back to "no bests").
  useEffect(() => {
    let active = true;
    loadBests().then((result) => {
      if (active) setBests(result.bests);
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Once we know the screen size and bests, start the game loop.
  useEffect(() => {
    if (!size || !bests) return;
    const state = createGame(computeLayout(size.width, size.height), bests);
    engineRef.current = state;
    finishedRef.current = false;

    let frameId = 0;
    let lastTime: number | null = null;
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      const dt = lastTime === null ? 0 : (now - lastTime) / 1000;
      lastTime = now;
      if (!pausedRef.current) handleEvents(update(state, dt), finishedRef);
      setView(snapshot(state));
      if (state.phase !== 'over') frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [size, bests]);

  // 3. Android back button asks before quitting, like the ✕ button.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true;
    });
    return () => subscription.remove();
  }, []);

  function confirmQuit() {
    if (finishedRef.current) return;
    pausedRef.current = true;
    const resume = () => {
      pausedRef.current = false;
    };
    Alert.alert(
      'Quit this game?',
      "This game's score won't be saved.",
      [
        { text: 'Keep playing', style: 'cancel', onPress: resume },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            finishedRef.current = true;
            goHome();
          },
        },
      ],
      { cancelable: true, onDismiss: resume },
    );
  }

  function onShootIn() {
    const state = engineRef.current;
    if (state && !pausedRef.current) pressShoot(state);
  }

  function onShootOut() {
    const state = engineRef.current;
    if (state) handleEvents(releaseShoot(state), finishedRef);
  }

  function onSwipe(direction: Direction) {
    const state = engineRef.current;
    if (state && !pausedRef.current) handleEvents(swipe(state, direction), finishedRef);
  }

  // Drag anywhere on the court to move the reticle by the same amount.
  const [aimResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const state = engineRef.current;
        return !!state && state.phase === 'playing' && !state.charging;
      },
      onPanResponderGrant: () => {
        lastDragRef.current = { dx: 0, dy: 0 };
      },
      onPanResponderMove: (_event, gesture) => {
        const state = engineRef.current;
        if (!state || pausedRef.current) return;
        aimBy(state, gesture.dx - lastDragRef.current.dx, gesture.dy - lastDragRef.current.dy);
        lastDragRef.current = { dx: gesture.dx, dy: gesture.dy };
      },
      onPanResponderTerminationRequest: () => true,
    }),
  );

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    // Only measure once: resizing mid-game would restart it.
    if (!size && width > 0 && height > 0) setSize({ width, height });
  }

  const pulse = view ? Math.abs(Math.sin(view.clock * Math.PI * 2)) : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.topInset, { height: insets.top }]} />
      <View
        style={[styles.playArea, { marginTop: insets.top, marginBottom: insets.bottom }]}
        onLayout={onLayout}
        {...aimResponder.panHandlers}>
        {!view ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Getting ready…</Text>
          </View>
        ) : (
          <>
            <Arena
              layout={view.layout}
              crowdTime={view.crowdTime}
              excited={view.finalSeconds}
            />
            <Sign layout={view.layout} bpm={view.bpm} clock={view.clock} />
            <Backboard rim={view.rim} s={view.layout.s} />
            {view.ball?.behindNet && <Ball {...view.ball} />}
            <RimAndNet rim={view.rim} s={view.layout.s} />
            <Hands layout={view.layout} shake={view.shake} holdingBall={view.showHeldBall} />
            {view.ball && !view.ball.behindNet && <Ball {...view.ball} />}
            {view.phase !== 'break' && (
              <Reticle position={view.reticle} s={view.layout.s} />
            )}

            {view.message && (
              <Text style={[styles.message, { top: view.layout.rimY + 60 * view.layout.s }]}>
                {view.message}
              </Text>
            )}

            {view.finalSeconds && <Vignette pulse={pulse} />}

            <Hud
              round={view.round}
              timer={view.timer}
              score={view.score}
              bpm={view.bpm}
              finalSeconds={view.finalSeconds}
              pulse={pulse}
              onQuit={confirmQuit}
            />

            <ShootControls
              s={view.layout.s}
              meter={view.meter}
              canShoot={view.canShoot}
              rating={view.rating}
              onPressIn={onShootIn}
              onPressOut={onShootOut}
            />

            {view.phase === 'break' && view.breathing && (
              <BreathingOverlay
                s={view.layout.s}
                sequence={view.breathing.sequence}
                progress={view.breathing.progress}
                timeLeft={view.breathing.timeLeft}
                onSwipe={onSwipe}
              />
            )}

            {view.phase === 'roundIntro' && (
              <View style={[StyleSheet.absoluteFill, styles.intro]}>
                <Text style={styles.introSmall}>
                  Round 1: {view.round1Score ?? 0} made — you qualified!
                </Text>
                <Text style={styles.introTitle}>ROUND 2</Text>
                <Text style={styles.introSmall}>The hoop is moving. Stay calm.</Text>
              </View>
            )}

            {view.phase === 'finishing' && (
              <View style={styles.timeUp} pointerEvents="none">
                <Text style={styles.timeUpText}>TIME!</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.wood,
  },
  topInset: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Palette.stands,
  },
  playArea: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.navy,
  },
  loadingText: {
    color: Palette.cream,
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: Palette.cream,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  intro: {
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  introTitle: {
    color: Palette.orange,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
  },
  introSmall: {
    color: Palette.cream,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeUp: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUpText: {
    color: Palette.cream,
    fontSize: 64,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
  },
});
