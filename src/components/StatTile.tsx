import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export type StatTileProps = {
  label: string;
  value: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
};

export function StatTile({ label, value, icon, color }: StatTileProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flex: 1,
        minWidth: 72,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.card,
        padding: spacing.md,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon ? <Ionicons name={icon} size={14} color={color ?? colors.textMuted} /> : null}
        <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[typography.headline, { color: color ?? colors.text }]}>{value}</Text>
    </View>
  );
}
