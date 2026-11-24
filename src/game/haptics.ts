/**
 * Haptic feedback. Haptics are a nice-to-have, so any failure (unsupported
 * device, web, haptics turned off) is silently ignored.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function fire(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    run().catch(() => {});
  } catch {
    // Ignore: haptics are optional.
  }
}

export const haptics = {
  heartbeat: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  make: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  miss: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  breakStart: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  breakSuccess: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  breakFail: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
