import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import type { Rating } from '@/game/engine';

type ShootControlsProps = {
  s: number;
  meter: { visible: boolean; fill: number; zoneLow: number; zoneHigh: number };
  canShoot: boolean;
  rating: Rating | null;
  onPressIn: () => void;
  onPressOut: () => void;
};

const RATING_COLORS: Record<Rating, string> = {
  Perfect: Palette.green,
  Good: Palette.orange,
  Bad: Palette.red,
};

/** Bottom-right SHOOT button with the vertical shot meter above it. */
export function ShootControls({ s, meter, canShoot, rating, onPressIn, onPressOut }: ShootControlsProps) {
  const buttonSize = Math.min(110, 96 * s);
  const meterHeight = 150 * s;
  const meterWidth = 24 * s;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {rating && (
        <Text style={[styles.rating, { color: RATING_COLORS[rating] }]} accessibilityLiveRegion="polite">
          {rating.toUpperCase()}
        </Text>
      )}
      <View
        style={[styles.meter, { height: meterHeight, width: meterWidth, opacity: meter.visible ? 1 : 0 }]}
        accessibilityElementsHidden={!meter.visible}
        importantForAccessibility={meter.visible ? 'auto' : 'no-hide-descendants'}>
        <View style={[styles.fill, { height: `${meter.fill}%` }]} />
        <View
          style={[
            styles.zone,
            { bottom: `${meter.zoneLow}%`, height: `${meter.zoneHigh - meter.zoneLow}%` },
          ]}
        />
      </View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Shoot"
        accessibilityHint="Press and hold, then let go when the meter reaches the green zone"
        accessibilityState={{ disabled: !canShoot }}
        style={({ pressed }) => [
          styles.button,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          pressed && styles.buttonPressed,
          !canShoot && !pressed && styles.buttonDisabled,
        ]}>
        <Text style={styles.buttonText}>SHOOT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  rating: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  meter: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Palette.cream,
    backgroundColor: Palette.navy,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    backgroundColor: Palette.orange,
  },
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Palette.green,
    opacity: 0.75,
  },
  button: {
    backgroundColor: Palette.orange,
    borderWidth: 4,
    borderColor: Palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  buttonPressed: {
    backgroundColor: Palette.orangeDark,
    transform: [{ scale: 0.94 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: Palette.navy,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
