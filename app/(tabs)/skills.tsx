import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Card, Screen } from '../../src/components';
import { TabTitle } from '../../src/components/curriculum/TabTitle';
import { SkillRow } from '../../src/components/curriculum/SkillRow';
import { ThinBar } from '../../src/components/curriculum/ThinBar';
import { SKILLS, SKILL_CATEGORIES } from '../../src/content/skills';
import { useStore } from '../../src/data/store';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Skills() {
  const { colors, spacing, typography } = useTheme();
  const ratings = useStore((s) => s.skillRatings);
  const setSkillLevel = useStore((s) => s.setSkillLevel);

  const sections = useMemo(
    () =>
      SKILL_CATEGORIES.map((cat) => {
        const skills = SKILLS.filter((s) => s.category === cat.id);
        const good = skills.filter((s) => (ratings[s.id]?.level ?? 0) >= 2).length;
        return { cat, skills, good };
      }).filter((s) => s.skills.length > 0),
    [ratings],
  );
  const practicing = sections.reduce((a, s) => a + s.good, 0);

  return (
    <Screen>
      <TabTitle title="Skills" subtitle="The supervising parent rates each skill as it develops." />
      <Card style={{ gap: spacing.sm }}>
        <Text style={[typography.title, { color: colors.text }]}>
          {practicing} of {SKILLS.length}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>skills at Practicing or better</Text>
        <ThinBar fraction={SKILLS.length ? practicing / SKILLS.length : 0} color={colors.success} />
      </Card>

      {sections.map(({ cat, skills, good }) => (
        <View key={cat.id} style={{ gap: spacing.sm }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text accessibilityRole="header" style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {cat.title}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {good}/{skills.length} practicing+
              </Text>
            </View>
            <ThinBar fraction={good / skills.length} />
          </View>
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            {skills.map((skill, i) => (
              <View
                key={skill.id}
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}
              >
                <SkillRow
                  skill={skill}
                  level={ratings[skill.id]?.level ?? 0}
                  practiceCount={ratings[skill.id]?.practiceCount ?? 0}
                  onChange={(lvl) => void setSkillLevel(skill.id, lvl)}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
