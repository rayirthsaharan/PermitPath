import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../Card';
import { Button } from '../Button';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type BannerProps = {
  icon: IconName;
  title: string;
  body?: string;
  tone?: 'amber' | 'primary' | 'success';
  /** Tapping the whole banner. */
  onPress?: () => void;
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' }[];
};

/** Attention card at the top of Home (unfinished drive, drive in progress, post survey). */
export function Banner({ icon, title, body, tone = 'primary', onPress, actions }: BannerProps) {
  const { colors, spacing, typography } = useTheme();
  const accent = colors[tone];
  const content = (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <Ionicons name={icon} size={24} color={accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[typography.headline, { color: colors.text }]}>{title}</Text>
          {body ? <Text style={[typography.body, { color: colors.textMuted }]}>{body}</Text> : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
      </View>
      {actions && actions.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {actions.map((a) => (
            <View key={a.label} style={{ flex: 1 }}>
              <Button label={a.label} variant={a.variant ?? 'secondary'} size="sm" onPress={a.onPress} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
  if (onPress && !actions) {
    return (
      <Card accent={accent} onPress={onPress} accessibilityLabel={`${title}. ${body ?? ''}`}>
        {content}
      </Card>
    );
  }
  return (
    <Card accent={accent}>
      <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
        {content}
      </Pressable>
    </Card>
  );
}
