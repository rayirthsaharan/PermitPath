import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, EmptyState, Screen } from '../../src/components';
import { SURVEY_ITEMS } from '../../src/content/surveys';
import { useStore } from '../../src/data/store';
import type { SurveyKind, SurveyRespondent } from '../../src/domain/types';
import { useTheme } from '../../src/theme/ThemeProvider';

const PILL_LABELS = ['Not at all', 'A little', 'Somewhat', 'Fairly', 'Very'] as const;

export default function Survey() {
  const { colors, spacing, radius, typography } = useTheme();
  const router = useRouter();
  const { kind: rawKind } = useLocalSearchParams<{ kind: string }>();
  const addSurvey = useStore((s) => s.addSurvey);

  const [respondent, setRespondent] = useState<SurveyRespondent>('teen');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [teenDone, setTeenDone] = useState(false);

  if (rawKind !== 'pre' && rawKind !== 'post') {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState icon="help-circle-outline" title="Survey not found" actionLabel="Go back" onAction={() => leave()} />
      </Screen>
    );
  }
  const kind: SurveyKind = rawKind;

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const complete = SURVEY_ITEMS.every((i) => answers[i.id] !== undefined);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await addSurvey({ kind, respondent, answers, completedAt: Date.now() });
      if (respondent === 'teen') {
        setTeenDone(true);
      } else {
        leave();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchRespondent = (r: SurveyRespondent) => {
    if (r === respondent) return;
    setRespondent(r);
    setAnswers({});
    setTeenDone(false);
  };

  if (teenDone) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Card style={{ gap: spacing.md, alignItems: 'center' }}>
          <Text style={[typography.title, { color: colors.text, textAlign: 'center' }]}>Thanks — that’s saved</Text>
          <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
            Now hand the phone to the parent. The parent answers the same questions about their teen.
          </Text>
        </Card>
        <Button
          label="Parent survey"
          onPress={() => {
            setRespondent('parent');
            setAnswers({});
            setTeenDone(false);
          }}
        />
        <Button label="Skip parent survey" variant="ghost" onPress={leave} />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {kind === 'pre' ? 'Before we start' : 'After the program'}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          How much do you agree with each statement? There are no wrong answers, and this isn’t a test.
        </Text>
      </View>

      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.button, padding: 4 }}
      >
        {(['teen', 'parent'] as SurveyRespondent[]).map((r) => {
          const sel = respondent === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={r === 'teen' ? 'Teen' : 'Parent'}
              onPress={() => switchRespondent(r)}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.button - 4,
                backgroundColor: sel ? colors.primary : 'transparent',
              }}
            >
              <Text style={[typography.headline, { color: sel ? colors.onPrimary : colors.textMuted }]}>
                {r === 'teen' ? 'Teen' : 'Parent'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {SURVEY_ITEMS.map((item, idx) => (
        <Card key={item.id} style={{ gap: spacing.md }}>
          <Text style={[typography.headline, { color: colors.text }]}>
            {idx + 1}. {respondent === 'teen' ? item.teen : item.parent}
          </Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((v) => {
              const sel = answers[item.id] === v;
              return (
                <Pressable
                  key={v}
                  accessibilityRole="radio"
                  accessibilityLabel={`${v} of 5, ${PILL_LABELS[v - 1]}`}
                  accessibilityState={{ selected: sel }}
                  onPress={() => setAnswers((a) => ({ ...a, [item.id]: v }))}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: radius.chip,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: sel ? colors.primary : colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: sel ? colors.primary : colors.border,
                  }}
                >
                  <Text style={[typography.headline, { color: sel ? colors.onPrimary : colors.text }]}>{v}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{PILL_LABELS[0]}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{PILL_LABELS[4]}</Text>
          </View>
        </Card>
      ))}

      <Button
        label={respondent === 'teen' ? 'Submit teen answers' : 'Submit parent answers'}
        loading={submitting}
        disabled={!complete}
        onPress={() => void onSubmit()}
      />
      <Button label="Not now" variant="ghost" onPress={leave} />
    </Screen>
  );
}
