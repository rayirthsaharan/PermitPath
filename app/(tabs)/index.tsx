import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Badge,
  Button,
  Card,
  DriveRow,
  EmptyState,
  ProgressRing,
  Screen,
  SectionHeader,
} from '../../src/components';
import { Banner } from '../../src/components/home/Banner';
import { confirmAction } from '../../src/components/settings/dialogs';
import { getStage } from '../../src/content/curriculum';
import { rules } from '../../src/content/rules';
import { setPendingDrive } from '../../src/data/pendingDrive';
import { useNextLesson, useProgress } from '../../src/data/selectors';
import type { ActiveDriveSnapshot } from '../../src/data/storage';
import { useStore } from '../../src/data/store';
import {
  daysUntilEligible,
  formatDuration,
  formatHours,
  permitDayNumber,
  thisWeekSummary,
} from '../../src/domain/progress';
import { driveRecorder, useDriveRecorder } from '../../src/services/recorder';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function Home() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const drives = useStore((s) => s.drives);
  const supervisors = useStore((s) => s.supervisors);
  const surveys = useStore((s) => s.surveys);
  const progress = useProgress();
  const nextLesson = useNextLesson();
  const rec = useDriveRecorder();
  const [recovered, setRecovered] = useState<ActiveDriveSnapshot | null>(null);

  // Look for an unfinished drive each time Home gains focus (and nothing is recording).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (driveRecorder.getState().status === 'idle') {
        driveRecorder
          .recoverActiveDrive()
          .then((snap) => alive && setRecovered(snap))
          .catch(() => {});
      } else {
        setRecovered(null);
      }
      return () => {
        alive = false;
      };
    }, []),
  );

  const now = Date.now();
  const supName = (id: string) => supervisors.find((s) => s.id === id)?.name;
  const week = thisWeekSummary(drives, now);
  const stage = nextLesson ? getStage(nextLesson.stageId) : undefined;

  const permitLine = (() => {
    if (!profile) return '';
    const day = permitDayNumber(profile.permitIssueDate, now);
    const left = daysUntilEligible(profile.permitIssueDate, now, rules.minPermitDays);
    if (day === 0) return 'Welcome aboard';
    return left === 0
      ? `Permit day ${day} · Eligible for road test ✓`
      : `Permit day ${day} · road test eligible in ${left} day${left === 1 ? '' : 's'}`;
  })();

  const saveRecovered = async () => {
    if (!recovered) return;
    const result = await driveRecorder.finalizeRecovered(recovered);
    setRecovered(null);
    setPendingDrive(result);
    router.push('/drive/summary/pending');
  };
  const discardRecovered = () => {
    confirmAction({
      title: 'Discard the unfinished drive?',
      message: 'Its time and route will not be added to your log.',
      confirmLabel: 'Discard',
      destructive: true,
      onConfirm: () => {
        void driveRecorder.discardRecovered().then(() => setRecovered(null));
      },
    });
  };

  const recording = rec.status === 'recording' || rec.status === 'stopping';
  const needsPostSurvey = progress.totalComplete && !surveys.some((s) => s.kind === 'post');

  return (
    <Screen
      title={profile ? `Hi, ${profile.firstName}` : 'Hi there'}
      headerRight={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      }
    >
      {permitLine ? <Text style={[typography.body, { color: colors.textMuted }]}>{permitLine}</Text> : null}

      {recording ? (
        <Banner
          icon="radio-button-on"
          tone="success"
          title="Drive in progress"
          body="Tap to return to the drive screen."
          onPress={() => router.push('/drive/active')}
        />
      ) : recovered ? (
        <Banner
          icon="alert-circle-outline"
          tone="amber"
          title="You have an unfinished drive"
          body="The app closed before it was saved. You can keep what was recorded or discard it."
          actions={[
            { label: 'Save', onPress: saveRecovered, variant: 'primary' },
            { label: 'Discard', onPress: discardRecovered, variant: 'secondary' },
          ]}
        />
      ) : null}

      {needsPostSurvey ? (
        <Banner
          icon="trophy-outline"
          tone="success"
          title="You've reached 50 hours"
          body="Take a 1-minute confidence survey to see how far you've come."
          actions={[{ label: 'Take the survey', onPress: () => router.push('/survey/post'), variant: 'primary' }]}
        />
      ) : null}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <ProgressRing
              value={progress.totalHours}
              max={rules.requiredTotalHours}
              color={colors.primary}
              size={136}
              label={formatHours(progress.totalSec)}
              sublabel={`/ ${rules.requiredTotalHours} h`}
              accessibilityLabel={`Total driving: ${formatHours(progress.totalSec)} of ${rules.requiredTotalHours} hours`}
            />
            <Text style={[typography.caption, { color: colors.textMuted }]}>Total</Text>
          </View>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <ProgressRing
              value={progress.nightHours}
              max={rules.requiredNightHours}
              color={colors.night}
              size={136}
              label={formatHours(progress.nightSec)}
              sublabel={`/ ${rules.requiredNightHours} h`}
              accessibilityLabel={`Night driving: ${formatHours(progress.nightSec)} of ${rules.requiredNightHours} hours`}
            />
            <Text style={[typography.caption, { color: colors.textMuted }]}>Night</Text>
          </View>
        </View>
      </Card>

      {nextLesson ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }]}>
                NEXT LESSON · STAGE {nextLesson.stageId}
              </Text>
              <Text style={[typography.title, { color: colors.text }]}>{nextLesson.title}</Text>
              {stage ? <Text style={[typography.caption, { color: colors.textMuted }]}>{stage.title}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
                <Badge label={`${nextLesson.estimatedMinutes} min`} icon="time-outline" />
                <Badge label={`Best: ${nextLesson.bestTimes}`} icon="calendar-outline" />
                {nextLesson.isNight ? <Badge label="Night" tone="night" icon="moon" /> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="View briefing" variant="secondary" onPress={() => router.push(`/lesson/${nextLesson.id}`)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Start"
                  icon="play"
                  onPress={() => router.push(`/drive/start?lessonId=${nextLesson.id}`)}
                />
              </View>
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Text style={[typography.headline, { color: colors.text }]}>You&apos;re caught up on unlocked lessons</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Keep logging practice drives. More lessons unlock as hours and skills build up.
            </Text>
            <Button label="Start a free drive" icon="play" onPress={() => router.push('/drive/start')} />
          </View>
        </Card>
      )}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>This week</Text>
            <Text style={[typography.headline, { color: colors.text }]}>
              {week.driveCount} drive{week.driveCount === 1 ? '' : 's'} · {formatDuration(week.totalSec)}
            </Text>
          </View>
          {week.nightSec > 0 ? <Badge label={`${formatDuration(week.nightSec)} night`} tone="night" icon="moon" /> : null}
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader
          title="Recent drives"
          actionLabel={drives.length > 0 ? 'See all' : undefined}
          onAction={drives.length > 0 ? () => router.push('/log') : undefined}
        />
        {drives.length === 0 ? (
          <Card>
            <EmptyState
              title="No drives yet"
              body="Your first drive is the hardest one to start. Pick a quiet lot and take it slow."
              actionLabel="Start a drive"
              onAction={() => router.push('/drive/start')}
            />
          </Card>
        ) : (
          drives.slice(0, 5).map((d) => (
            <DriveRow key={d.id} drive={d} supervisorName={supName(d.supervisorId)} onPress={() => router.push(`/log/${d.id}`)} />
          ))
        )}
      </View>
    </Screen>
  );
}
