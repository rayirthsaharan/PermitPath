import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, LessonCard, Screen, StageNode } from '../../src/components';
import { TabTitle } from '../../src/components/curriculum/TabTitle';
import { RouteDisclaimerGate } from '../../src/components/curriculum/RouteDisclaimerGate';
import { confirmAction } from '../../src/components/settings/dialogs';
import { STAGES } from '../../src/content/curriculum';
import { useCompletedLessonIds, useNextLesson, useStageStatuses } from '../../src/data/selectors';
import { useStore } from '../../src/data/store';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { Stage } from '../../src/domain/types';

export default function Routes() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const statuses = useStageStatuses();
  const completed = useCompletedLessonIds();
  const next = useNextLesson();
  const overrideStage = useStore((s) => s.overrideStage);

  const confirmUnlock = (stage: Stage) =>
    confirmAction({
      title: `Unlock Stage ${stage.id} anyway?`,
      message:
        "You know your teen best. Unlocking skips the suggested hours and skill checks for this stage. You're the coach, so only continue if you feel they're ready.",
      confirmLabel: 'Unlock',
      onConfirm: () => void overrideStage(stage.id),
    });

  return (
    <Screen>
      <TabTitle
        title="Practice path"
        subtitle="Each stage adds a new kind of road. Unlocks are suggestions — you're the coach."
      />
      <View>
        {STAGES.map((stage, i) => {
          const status = statuses.get(stage.id);
          const unlocked = status?.unlocked ?? false;
          const allDone = stage.lessons.length > 0 && stage.lessons.every((l) => completed.includes(l.id));
          const state = !unlocked ? 'locked' : allDone ? 'complete' : 'unlocked';
          const doneCount = stage.lessons.filter((l) => completed.includes(l.id)).length;
          return (
            <StageNode key={stage.id} number={stage.id} state={state} showConnector={i < STAGES.length - 1}>
              <View style={{ gap: spacing.md }}>
                <View style={{ gap: 2, minHeight: 40, justifyContent: 'center' }}>
                  <Text style={[typography.caption, { color: colors.textMuted, textTransform: 'uppercase' }]}>
                    Stage {stage.id}
                    {unlocked ? ` · ${doneCount} of ${stage.lessons.length} done` : ' · Locked'}
                  </Text>
                  <Text style={[typography.title, { color: unlocked ? colors.text : colors.textMuted }]}>{stage.title}</Text>
                  <Text style={[typography.body, { color: colors.textMuted }]}>{stage.theme}</Text>
                  {status?.overridden ? (
                    <View style={{ marginTop: spacing.xs }}>
                      <Badge label="Unlocked by you" tone="amber" icon="key" />
                    </View>
                  ) : null}
                </View>

                {unlocked ? (
                  <View style={{ gap: spacing.sm }}>
                    {stage.lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        completed={completed.includes(lesson.id)}
                        isNext={next?.id === lesson.id}
                        onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
                      />
                    ))}
                  </View>
                ) : (
                  <Card style={{ gap: spacing.sm }}>
                    <Text style={[typography.caption, { color: colors.textMuted, textTransform: 'uppercase' }]}>
                      Suggested before this stage
                    </Text>
                    {(status?.reasons ?? []).map((r) => (
                      <View key={r} style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Text style={[typography.body, { color: colors.textMuted }]}>•</Text>
                        <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{r}</Text>
                      </View>
                    ))}
                    <Button
                      label="Unlock anyway"
                      variant="ghost"
                      size="sm"
                      fullWidth={false}
                      accessibilityLabel={`Unlock stage ${stage.id} anyway`}
                      onPress={() => confirmUnlock(stage)}
                    />
                  </Card>
                )}
              </View>
            </StageNode>
          );
        })}
      </View>
      <RouteDisclaimerGate />
    </Screen>
  );
}
