import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

export type EmptyStateProps = {
  title: string;
  body?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, icon = 'car-outline', actionLabel, onAction }: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
      <Ionicons name={icon} size={40} color={colors.textMuted} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={[typography.headline, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
