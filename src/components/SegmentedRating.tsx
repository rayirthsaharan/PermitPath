import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SKILL_LEVEL_LABELS } from '../domain/progress';
import type { SkillLevel } from '../domain/types';

export type SegmentedRatingProps = {
  value: SkillLevel;
  onChange: (level: SkillLevel) => void;
  /** Accessible name of the thing being rated (skill title). */
  label?: string;
};

export function SegmentedRating({ value, onChange, label }: SegmentedRatingProps) {
  const { colors, radius, typography } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label ? `Rating for ${label}` : 'Rating'}
      style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, padding: 4 }}
    >
      {([0, 1, 2, 3] as SkillLevel[]).map((lvl) => {
        const selected = value === lvl;
        return (
          <Pressable
            key={lvl}
            accessibilityRole="radio"
            accessibilityLabel={`${SKILL_LEVEL_LABELS[lvl]}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(lvl)}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: radius.button - 4,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? colors.primary : 'transparent',
              paddingHorizontal: 2,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[typography.caption, { color: selected ? colors.onPrimary : colors.textMuted, fontWeight: selected ? '700' : '500' }]}
            >
              {SKILL_LEVEL_LABELS[lvl]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
