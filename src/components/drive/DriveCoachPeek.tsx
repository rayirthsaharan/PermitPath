import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, radius, spacing, typography } from '../../theme/tokens';
import type { CoachingCard, CoachingCardKind } from '../../domain/types';

const KIND: Record<CoachingCardKind, { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  watch: { icon: 'eye', label: 'Watch for' },
  say: { icon: 'chatbubble', label: 'Say' },
  mistake: { icon: 'warning', label: 'Common mistake' },
  why: { icon: 'information-circle', label: 'Why it matters' },
};

/**
 * Swipeable coaching-card peek for the always-dark drive screen.
 * Uses the dark palette directly so it stays dark in light mode.
 */
export function DriveCoachPeek({ cards, width }: { cards: CoachingCard[]; width: number }) {
  const c = darkColors;
  const [index, setIndex] = useState(0);
  if (cards.length === 0) return null;
  const accent: Record<CoachingCardKind, string> = { watch: c.primary, say: c.success, mistake: c.amber, why: c.night };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.caption, { color: c.textMuted, fontWeight: '600' }]}>
        Coaching card {index + 1}/{cards.length}
      </Text>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        style={{ width }}
      >
        {cards.map((card, i) => {
          const meta = KIND[card.kind];
          return (
            <View key={i} style={{ width }}>
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: radius.card,
                  borderLeftWidth: 4,
                  borderLeftColor: accent[card.kind],
                  padding: spacing.lg,
                  gap: spacing.sm,
                  marginRight: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={meta.icon} size={18} color={accent[card.kind]} />
                  <Text style={[typography.caption, { color: accent[card.kind], fontWeight: '700', textTransform: 'uppercase' }]}>
                    {meta.label}
                  </Text>
                </View>
                <Text style={[typography.headline, { color: c.text }]}>{card.title}</Text>
                <Text style={[typography.body, { color: c.text }]}>{card.body}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === index ? c.primary : c.border }}
          />
        ))}
      </View>
    </View>
  );
}
