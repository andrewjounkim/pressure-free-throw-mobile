import { useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import { BREAK_SECONDS, SWIPE_MIN_DISTANCE } from '@/game/constants';
import type { Direction } from '@/game/engine';

const ARROWS: Record<Direction, string> = { left: '←', up: '↑', right: '→', down: '↓' };

type BreathingOverlayProps = {
  s: number;
  sequence: Direction[];
  progress: number;
  timeLeft: number;
  onSwipe: (direction: Direction) => void;
};

/** Dimmed full-screen layer for the breathing break. Swipe anywhere to answer. */
export function BreathingOverlay({ s, sequence, progress, timeLeft, onSwipe }: BreathingOverlayProps) {
  // Created once; onSwipe comes from the screen and always reads the latest game state.
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_event, gesture) => {
        const { dx, dy } = gesture;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_DISTANCE * s) return;
        if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
        else onSwipe(dy > 0 ? 'down' : 'up');
      },
    }),
  );

  const timeFraction = Math.max(0, Math.min(1, timeLeft / BREAK_SECONDS));
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} {...responder.panHandlers}>
      <Text style={styles.title}>BREATHE</Text>
      <Text style={styles.subtitle}>Swipe these directions in order</Text>
      <View style={styles.arrows} accessibilityLabel={`Swipe ${sequence.join(', ')}`}>
        {sequence.map((direction, index) => (
          <View
            key={index}
            style={[
              styles.arrowBox,
              { width: 64 * s, height: 64 * s },
              index < progress && styles.arrowDone,
              index === progress && styles.arrowCurrent,
            ]}>
            <Text style={[styles.arrow, { fontSize: 36 * s }]}>{ARROWS[direction]}</Text>
          </View>
        ))}
      </View>
      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, { width: `${timeFraction * 100}%` }]} />
      </View>
      <Text style={styles.seconds}>{Math.ceil(timeLeft)}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: Palette.cream,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: {
    color: Palette.creamDim,
    fontSize: 17,
    fontWeight: '600',
  },
  arrows: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  arrowBox: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Palette.creamDim,
    backgroundColor: Palette.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCurrent: {
    borderColor: Palette.orange,
    transform: [{ scale: 1.08 }],
  },
  arrowDone: {
    borderColor: Palette.green,
    backgroundColor: 'rgba(61, 220, 132, 0.25)',
  },
  arrow: {
    color: Palette.cream,
    fontWeight: '900',
  },
  timerTrack: {
    width: '80%',
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.navyLight,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: Palette.orange,
  },
  seconds: {
    color: Palette.cream,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
