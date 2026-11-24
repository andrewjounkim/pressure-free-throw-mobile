import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Palette } from '@/constants/palette';
import { MAX_SCORE } from '@/game/constants';
import { formatScore } from '@/lib/format';
import { goHome } from '@/lib/navigation';

type ResultParams = {
  round1?: string;
  round2?: string;
  final?: string;
  bestFinal?: string;
  newRecord?: string;
};

/** Reads a score from a route param; anything missing or invalid becomes null. */
function toScore(value: string | undefined): number | null {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= MAX_SCORE ? n : null;
}

export default function ResultsScreen() {
  const params = useLocalSearchParams<ResultParams>();
  const round1 = toScore(params.round1);
  const round2 = toScore(params.round2);
  const final = toScore(params.final);
  const bestFinal = toScore(params.bestFinal);
  const newRecord = params.newRecord === '1';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Game Over
        </Text>

        {newRecord && (
          <View style={styles.banner} accessibilityLiveRegion="polite">
            <Text style={styles.bannerText}>NEW RECORD</Text>
          </View>
        )}

        <View style={styles.card}>
          <Row label="Round 1" value={formatScore(round1)} />
          <Row
            label="Round 2"
            value={formatScore(round2)}
            note={round2 === null ? 'Not reached' : undefined}
          />
          <View style={styles.rule} />
          <Row label="Final score" value={formatScore(final)} big />
          <Row label="Best final" value={formatScore(bestFinal)} />
        </View>

        <View style={styles.buttons}>
          <AppButton label="PLAY AGAIN" onPress={() => router.replace('/game')} />
          <AppButton label="HOME" variant="secondary" onPress={goHome} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, note, big }: { label: string; value: string; note?: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={[styles.rowLabel, big && styles.rowLabelBig]}>{label}</Text>
        {note && <Text style={styles.rowNote}>{note}</Text>}
      </View>
      <Text style={[styles.rowValue, big && styles.rowValueBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.navy,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: Palette.cream,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
  },
  banner: {
    alignSelf: 'center',
    backgroundColor: Palette.orange,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  bannerText: {
    color: Palette.navy,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: Palette.navyLight,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: Palette.creamDim,
    fontSize: 18,
    fontWeight: '600',
  },
  rowLabelBig: {
    color: Palette.cream,
    fontWeight: '800',
  },
  rowNote: {
    color: Palette.creamDim,
    fontSize: 13,
  },
  rowValue: {
    color: Palette.cream,
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rowValueBig: {
    color: Palette.orange,
    fontSize: 36,
    fontWeight: '900',
  },
  rule: {
    height: 1,
    backgroundColor: Palette.creamDim,
    opacity: 0.3,
  },
  buttons: {
    gap: 12,
  },
});
