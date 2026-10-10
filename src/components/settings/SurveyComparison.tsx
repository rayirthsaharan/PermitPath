import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SURVEY_ITEMS } from '../../content/surveys';
import type { SurveyRespondent, SurveyResponse } from '../../domain/types';

function latest(surveys: SurveyResponse[], kind: 'pre' | 'post', respondent: SurveyRespondent) {
  return surveys
    .filter((s) => s.kind === kind && s.respondent === respondent)
    .sort((a, b) => b.completedAt - a.completedAt)[0];
}

/** Pre -> post comparison for one respondent; null when either survey is missing. */
export function SurveyComparison({ surveys, respondent }: { surveys: SurveyResponse[]; respondent: SurveyRespondent }) {
  const { colors, spacing, radius, typography } = useTheme();
  const pre = latest(surveys, 'pre', respondent);
  const post = latest(surveys, 'post', respondent);
  if (!pre || !post) return null;
  const label = respondent === 'teen' ? 'Teen' : 'Parent';
  return (
    <View style={{ gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, padding: spacing.md }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}: before → after</Text>
      {SURVEY_ITEMS.map((item) => {
        const a = pre.answers[item.id];
        const b = post.answers[item.id];
        if (a === undefined || b === undefined) return null;
        const delta = b - a;
        const color = delta > 0 ? colors.success : delta < 0 ? colors.amber : colors.textMuted;
        return (
          <View
            key={item.id}
            accessible
            accessibilityLabel={`${respondent === 'teen' ? item.teen : item.parent} From ${a} to ${b}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          >
            <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
              {respondent === 'teen' ? item.teen : item.parent}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {a} → {b}
            </Text>
            <Text style={[typography.caption, { color, fontWeight: '700', minWidth: 28, textAlign: 'right' }]}>
              {delta > 0 ? `+${delta}` : String(delta)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
