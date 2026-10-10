import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../Card';

/** Titled group card used by Settings. */
export function SettingsGroup({ title, children, footer }: { title: string; children: React.ReactNode; footer?: string }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        accessibilityRole="header"
        style={[typography.caption, { color: colors.textMuted, textTransform: 'uppercase', paddingHorizontal: spacing.xs }]}
      >
        {title}
      </Text>
      <Card style={{ gap: spacing.md }}>{children}</Card>
      {footer ? (
        <Text style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.xs }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

export function SettingsRow({
  title,
  value,
  icon,
  onPress,
}: {
  title: string;
  value?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={22} color={colors.primary} /> : null}
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{title}</Text>
      {value ? <Text style={[typography.body, { color: colors.textMuted }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}
