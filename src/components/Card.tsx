import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type CardProps = {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Left accent bar color. */
  accent?: string;
  accessibilityLabel?: string;
  padded?: boolean;
};

export function Card({ children, onPress, style, accent, accessibilityLabel, padded = true }: CardProps) {
  const { colors, spacing, radius } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.lg : 0,
    borderLeftWidth: accent ? 4 : 1,
    borderLeftColor: accent ?? colors.border,
    overflow: 'hidden',
  };
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1, minHeight: 48 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={[base, style]}>
      {children}
    </View>
  );
}
