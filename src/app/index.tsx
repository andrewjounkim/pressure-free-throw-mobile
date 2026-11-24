import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Basketball } from '@/components/game/scene';
import { Palette } from '@/constants/palette';
import type { Bests } from '@/game/engine';
import { formatScore } from '@/lib/format';
import { clearBests, loadBests, NO_BESTS } from '@/lib/score-storage';

export default function HomeScreen() {
  const [bests, setBests] = useState<Bests>(NO_BESTS);
  const [loadFailed, setLoadFailed] = useState(false);

  // Reload bests every time this screen comes back into view (e.g. after a game).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadBests().then((result) => {
        if (!active) return;
        setBests(result.bests);
        setLoadFailed(result.failed);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  function confirmReset() {
    Alert.alert('Reset best scores?', 'This clears your saved Round 1 and final bests.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const ok = await clearBests();
          if (ok) setBests(NO_BESTS);
          else Alert.alert('Could not reset', 'Please try again.');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Basketball x={44} y={44} size={88} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Pressure Free Throw
        </Text>
        <Text style={styles.tagline}>
          Halftime. One minute. A million dollars on the line. Can you keep your heart rate down?
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR BESTS</Text>
          <View style={styles.bestRow}>
            <View style={styles.best}>
              <Text style={styles.bestValue}>{formatScore(bests.bestRound1)}</Text>
              <Text style={styles.bestLabel}>Best Round 1</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.best}>
              <Text style={styles.bestValue}>{formatScore(bests.bestFinal)}</Text>
              <Text style={styles.bestLabel}>Best Final</Text>
            </View>
          </View>
          {loadFailed && <Text style={styles.warning}>Couldn&apos;t load saved scores.</Text>}
        </View>

        <View style={styles.buttons}>
          <AppButton label="START" onPress={() => router.push('/game')} />
          <AppButton label="HOW TO PLAY" variant="secondary" onPress={() => router.push('/how-to-play')} />
          <AppButton label="Reset best scores" variant="text" onPress={confirmReset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.navy,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  hero: {
    width: 88,
    height: 88,
  },
  title: {
    color: Palette.cream,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  tagline: {
    color: Palette.creamDim,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: Palette.navyLight,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    color: Palette.orange,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  best: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Palette.creamDim,
    opacity: 0.4,
  },
  bestValue: {
    color: Palette.cream,
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  bestLabel: {
    color: Palette.creamDim,
    fontSize: 15,
    fontWeight: '600',
  },
  warning: {
    color: Palette.orange,
    fontSize: 14,
    textAlign: 'center',
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 12,
  },
});
