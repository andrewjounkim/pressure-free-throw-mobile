import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Palette } from '@/constants/palette';

const SECTIONS = [
  {
    title: 'Aim',
    body: 'Drag your finger anywhere on the court. The ring (reticle) moves with your drag, so your finger never covers it. Keep it on the rim.',
  },
  {
    title: 'Shoot',
    body: 'Press and hold SHOOT with your other thumb. The meter fills in one second. Let go inside the green zone for a PERFECT shot. Hold too long and it fires on its own as a BAD shot.',
  },
  {
    title: 'Ratings',
    body: 'PERFECT goes in 95% of the time, GOOD 60%, BAD 15%. If the reticle is off the rim, the shot always misses.',
  },
  {
    title: 'Heartbeat',
    body: 'Your heart rate climbs every second, faster in the last 10 seconds, and jumps after each miss. A higher heart rate means more sway, shakier hands and a smaller green zone. Above 100 BPM you will feel it in your hand.',
  },
  {
    title: 'Breathing breaks',
    body: 'At 40 and 20 seconds the clock stops. Swipe the four arrows in order within 5 seconds to drop your heart rate by 20.',
  },
  {
    title: 'Round 2',
    body: 'Tie or beat your best Round 1 score (or play for the first time) to unlock Round 2, where the hoop slides left and right. Your final score is both rounds added together.',
  },
];

export default function HowToPlayScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}
      <AppButton label="GOT IT" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.navy,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Palette.navyLight,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: Palette.orange,
  },
  cardTitle: {
    color: Palette.orange,
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    color: Palette.cream,
    fontSize: 16,
    lineHeight: 23,
  },
});
