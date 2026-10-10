import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type SectionHeaderProps = {
  title: string;
  /** Optional trailing text action. */
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
};

export function SectionHeader({ title, actionLabel, onAction, subtitle }: SectionHeaderProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={[typography.headline, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{ minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' }}
        >
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
