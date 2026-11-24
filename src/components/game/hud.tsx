import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';

type HudProps = {
  round: 1 | 2;
  timer: number;
  score: number;
  bpm: number;
  finalSeconds: boolean;
  pulse: number;
  onQuit: () => void;
};

/** Top bar: quit button, round, timer, score and BPM. */
export function Hud({ round, timer, score, bpm, finalSeconds, pulse, onQuit }: HudProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onQuit}
        accessibilityRole="button"
        accessibilityLabel="Quit game"
        hitSlop={10}
        style={({ pressed }) => [styles.quit, pressed && styles.quitPressed]}>
        <Text style={styles.quitText}>✕</Text>
      </Pressable>

      <View style={styles.stat}>
        <Text style={styles.label}>ROUND {round}</Text>
        <Text style={styles.small} accessibilityLabel={`Heart rate ${bpm}`}>
          ♥ {bpm}
        </Text>
      </View>

      <View style={styles.timerBox}>
        <Text
          style={[
            styles.timer,
            finalSeconds && styles.timerFinal,
            finalSeconds && { transform: [{ scale: 1 + 0.15 * pulse }] },
          ]}
          accessibilityLabel={`${timer} seconds left`}>
          {timer}
        </Text>
      </View>

      <View style={[styles.stat, styles.statRight]}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  quit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.navyLight,
    borderWidth: 2,
    borderColor: Palette.creamDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitPressed: {
    backgroundColor: Palette.navy,
    transform: [{ scale: 0.94 }],
  },
  quitText: {
    color: Palette.cream,
    fontSize: 18,
    fontWeight: '800',
  },
  stat: {
    flex: 1,
  },
  statRight: {
    alignItems: 'flex-end',
  },
  label: {
    color: Palette.orange,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  small: {
    color: Palette.cream,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  score: {
    color: Palette.cream,
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerBox: {
    minWidth: 72,
    alignItems: 'center',
  },
  timer: {
    color: Palette.cream,
    fontSize: 40,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerFinal: {
    color: Palette.red,
  },
});
