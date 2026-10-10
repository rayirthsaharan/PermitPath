import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Large in-screen title for tab screens (tabs have no native header). */
export function TabTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle ? <Text style={[typography.body, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}
