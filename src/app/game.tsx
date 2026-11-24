import { router } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector, useLongPressGesture, usePanGesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { BreathingOverlay } from '@/components/game/breathing-overlay';
import { Hud } from '@/components/game/hud';
import {
  Arena,
  Backboard,
  Basketball,
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
  cancelShot,
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
import { goHome } from '@/lib/navigation';
import { loadBests, saveBestFinal, saveBestRound1 } from '@/lib/score-storage';

type SessionFlags = {
  /** Set once the game has ended or been quit, so it only finishes once. */
  finished: boolean;
  /** False if saved bests failed to load; we then don't save, so a real best isn't overwritten. */
  canSave: boolean;
};

/** Runs the side effects (haptics, navigation) for engine events. */
function handleEvents(events: GameEvent[], flags: SessionFlags) {
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
      case 'gameOver':
        void finish(event.result, flags);
        break;
      case 'rating':
      case 'round1End':
        break;
    }
  }
}

/** Saves any new bests (only once the game is over, so quitting saves nothing) and shows results. */
async function finish(result: GameResult, flags: SessionFlags) {
  if (flags.finished) return;
  flags.finished = true;
  if (flags.canSave) {
    if (result.newBestRound1 !== null) await saveBestRound1(result.newBestRound1);
    if (result.newRecord) await saveBestFinal(result.final);
  }
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
  const flagsRef = useRef<SessionFlags>({ finished: false, canSave: true });
  /** True while the quit dialog is open. */
  const dialogOpenRef = useRef(false);
  /** True while the PAUSED screen (after backgrounding) is showing. */
  const pausedRef = useRef(false);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [bests, setBests] = useState<Bests | null>(null);
  const [view, setView] = useState<GameView | null>(null);
  const [paused, setPaused] = useState(false);

  // 1. Load saved bests once (loadBests never throws; on failure it returns "no bests").
  useEffect(() => {
    let active = true;
    loadBests().then((result) => {
      if (!active) return;
      flagsRef.current.canSave = !result.failed;
      setBests(result.bests);
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Once we know the screen size and bests, start the game loop.
  useEffect(() => {
    if (!size || !bests) return;
    const state = createGame(computeLayout(size.width, size.height), bests);
    const flags = flagsRef.current;
    engineRef.current = state;
    flags.finished = false;

    let frameId = 0;
    let lastTime: number | null = null;
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      const dt = lastTime === null ? 0 : (now - lastTime) / 1000;
      lastTime = now;
      if (!dialogOpenRef.current && !pausedRef.current) handleEvents(update(state, dt), flags);
      setView(snapshot(state));
      if (state.phase !== 'over') frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [size, bests]);

  function confirmQuit() {
    if (flagsRef.current.finished) return;
    dialogOpenRef.current = true;
    if (engineRef.current) cancelShot(engineRef.current);
    const closeDialog = () => {
      dialogOpenRef.current = false;
    };
    Alert.alert(
      'Quit this game?',
      "This game's scores won't be saved.",
      [
        { text: 'Keep playing', style: 'cancel', onPress: closeDialog },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            flagsRef.current.finished = true;
            goHome();
          },
        },
      ],
      { cancelable: true, onDismiss: closeDialog },
    );
  }

  // Effect Events always see the latest render's functions, so the listeners below never go stale.
  const onBackPress = useEffectEvent(() => {
    confirmQuit();
    return true;
  });

  // 3. Android back button asks before quitting, like the ✕ button.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => onBackPress());
    return () => subscription.remove();
  }, []);

  // 4. Leaving the app pauses the game and drops any held shot; you resume when you're ready.
  const onAppStateChange = useEffectEvent((next: string) => {
    if (next === 'active' || flagsRef.current.finished || !engineRef.current) return;
    cancelShot(engineRef.current);
    pausedRef.current = true;
    setPaused(true);
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => onAppStateChange(next));
    return () => subscription.remove();
  }, []);

  function resume() {
    pausedRef.current = false;
    setPaused(false);
  }

  const onSwipe = useCallback((direction: Direction) => {
    const state = engineRef.current;
    if (state && !dialogOpenRef.current && !pausedRef.current) {
      handleEvents(swipe(state, direction), flagsRef.current);
    }
  }, []);

  // Native gestures (react-native-gesture-handler) so aiming and SHOOT can be used
  // at the same time with two thumbs. runOnJS keeps the callbacks on the JS thread,
  // where the game engine lives.
  const shootGesture = useLongPressGesture({
    runOnJS: true,
    minDuration: 0,
    maxDistance: 10000,
    shouldCancelWhenOutside: false,
    onActivate: () => {
      const state = engineRef.current;
      if (state && !dialogOpenRef.current && !pausedRef.current) pressShoot(state);
    },
    onFinalize: () => {
      const state = engineRef.current;
      if (state && !dialogOpenRef.current && !pausedRef.current) {
        handleEvents(releaseShoot(state), flagsRef.current);
      }
    },
  });
  const aimGesture = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    simultaneousWith: shootGesture,
    onUpdate: (event) => {
      // changeX/changeY are the movement since the last event, so nothing piles up while paused.
      const state = engineRef.current;
      if (state && !dialogOpenRef.current && !pausedRef.current) {
        aimBy(state, event.changeX, event.changeY);
      }
    },
  });

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
        onLayout={onLayout}>
        {!view ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Getting ready…</Text>
          </View>
        ) : (
          <>
            <GestureDetector gesture={aimGesture}>
              <View style={StyleSheet.absoluteFill}>
                <Arena
                  layout={view.layout}
                  crowdTime={view.crowdTime}
                  finalSeconds={view.finalSeconds}
                />
                <Sign
                  layout={view.layout}
                  bpm={view.bpm}
                  jumbotron={view.jumbotron}
                  clock={view.clock}
                />
                <Backboard rim={view.rim} s={view.layout.s} />
                {view.ball?.behindNet && <Basketball {...view.ball} />}
                <RimAndNet rim={view.rim} s={view.layout.s} />
                <Hands layout={view.layout} shake={view.shake} holdingBall={view.showHeldBall} />
                {view.ball && !view.ball.behindNet && <Basketball {...view.ball} />}
                {view.phase !== 'break' && <Reticle position={view.reticle} s={view.layout.s} />}

                {view.message && (
                  <Text
                    style={[styles.message, { top: view.layout.rimY + 60 * view.layout.s }]}
                    pointerEvents="none">
                    {view.message}
                  </Text>
                )}

                {view.finalSeconds && <Vignette pulse={pulse} />}

                {view.phase === 'finishing' && (
                  <View style={styles.timeUp} pointerEvents="none">
                    <Text style={styles.timeUpText}>TIME!</Text>
                  </View>
                )}
              </View>
            </GestureDetector>

            <ShootControls
              s={view.layout.s}
              meter={view.meter}
              held={view.charging}
              available={view.canShoot || view.charging}
              rating={view.rating}
              gesture={shootGesture}
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
              <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                <Text style={styles.overlaySmall}>
                  Round 1: {view.round1Score ?? 0} made. You qualified!
                </Text>
                <Text style={styles.overlayTitle}>ROUND 2</Text>
                <Text style={styles.overlaySmall}>The hoop is moving. Stay calm.</Text>
              </View>
            )}

            {/* The HUD sits above the overlays so ✕ always works, even during a break. */}
            <Hud
              round={view.round}
              timer={view.timer}
              score={view.score}
              bpm={view.bpm}
              finalSeconds={view.finalSeconds}
              pulse={pulse}
              onQuit={confirmQuit}
            />

            {paused && (
              <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                <Text style={styles.overlayTitle}>PAUSED</Text>
                <Text style={styles.overlaySmall}>The clock stopped while you were away.</Text>
                <View style={styles.pauseButtons}>
                  <AppButton label="RESUME" onPress={resume} />
                  <AppButton label="QUIT" variant="secondary" onPress={confirmQuit} />
                </View>
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
  overlay: {
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  overlayTitle: {
    color: Palette.orange,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
  },
  overlaySmall: {
    color: Palette.cream,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  pauseButtons: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 12,
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
