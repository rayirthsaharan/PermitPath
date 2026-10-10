import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Thin horizontal progress bar. `fraction` is 0..1. */
export function ThinBar({ fraction, color }: { fraction: number; color?: string }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}
