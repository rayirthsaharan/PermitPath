import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import type { Skill, SkillLevel } from '../../domain/types';
import { SegmentedRating } from '../SegmentedRating';

export type SkillRowProps = {
  skill: Skill;
  level: SkillLevel;
  practiceCount: number;
  onChange: (level: SkillLevel) => void;
};

export function SkillRow({ skill, level, practiceCount, onChange }: SkillRowProps) {
  const { colors, spacing, typography } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${skill.title}. ${open ? 'Hide' : 'Show'} what good looks like.`}
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}
      >
        <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>{skill.title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {open ? (
        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: spacing.md, gap: 2 }}>
          <Text style={[typography.caption, { color: colors.textMuted, textTransform: 'uppercase' }]}>What good looks like</Text>
          <Text style={[typography.body, { color: colors.text }]}>{skill.whatGoodLooksLike}</Text>
        </View>
      ) : null}
      <SegmentedRating value={level} onChange={onChange} label={skill.title} />
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        {practiceCount === 0 ? 'Not practiced on a logged drive yet' : `Practiced ${practiceCount}×`}
      </Text>
    </View>
  );
}
