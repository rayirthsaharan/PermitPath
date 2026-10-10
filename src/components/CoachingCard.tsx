import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import type { CoachingCard as CoachingCardData, CoachingCardKind } from '../domain/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const KIND_META: Record<CoachingCardKind, { icon: IconName; label: string }> = {
  watch: { icon: 'eye', label: 'Watch for' },
  say: { icon: 'chatbubble', label: 'Say' },
  mistake: { icon: 'warning', label: 'Common mistake' },
  why: { icon: 'information-circle', label: 'Why it matters' },
};

export type CoachingCardProps = {
  card: CoachingCardData;
  /** Optional fixed width (for carousels). */
  width?: number;
};

export function CoachingCard({ card, width }: CoachingCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const color = { watch: colors.primary, say: colors.success, mistake: colors.amber, why: colors.night }[card.kind];
  const meta = KIND_META[card.kind];
  return (
    <View
      accessible
      accessibilityLabel={`${meta.label}: ${card.title}. ${card.body}`}
      style={{
        width,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: color,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={meta.icon} size={18} color={color} />
        <Text style={[typography.caption, { color, fontWeight: '700', textTransform: 'uppercase' }]}>{meta.label}</Text>
      </View>
      <Text style={[typography.headline, { color: colors.text }]}>{card.title}</Text>
      <Text style={[typography.body, { color: colors.text }]}>{card.body}</Text>
    </View>
  );
}
