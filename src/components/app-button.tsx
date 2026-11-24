import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette } from '@/constants/palette';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  accessibilityHint?: string;
};

/** A large, rounded button that darkens and shrinks slightly when pressed. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        pressed && variant === 'primary' && styles.primaryPressed,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.otherLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: Palette.orange,
  },
  secondary: {
    borderWidth: 2,
    borderColor: Palette.orange,
    backgroundColor: Palette.navyLight,
  },
  text: {
    minHeight: 44,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryPressed: {
    backgroundColor: Palette.orangeDark,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryLabel: {
    color: Palette.navy,
  },
  otherLabel: {
    color: Palette.cream,
  },
});
