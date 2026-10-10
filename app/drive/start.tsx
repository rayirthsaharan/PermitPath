import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, CoachingCard, Screen } from '../../src/components';
import { LessonPicker, SupervisorPicker, WeatherPicker } from '../../src/components/drive/pickers';
import { confirmAction, notify } from '../../src/components/settings/dialogs';
import { getLesson } from '../../src/content/curriculum';
import { useStore } from '../../src/data/store';
import { useNextLesson } from '../../src/data/selectors';
import { driveRecorder } from '../../src/services/recorder';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { Weather } from '../../src/domain/types';

export default function StartDrive() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const supervisors = useStore((s) => s.supervisors);
  const lastSupervisorId = useStore((s) => s.drives[0]?.supervisorId);
  const nextLesson = useNextLesson();

  const [supervisorId, setSupervisorId] = useState<string | null>(() =>
    supervisors.find((s) => s.id === lastSupervisorId)?.id ?? supervisors[0]?.id ?? null,
  );
  const [lessonId, setLessonId] = useState<string | null>(() => {
    const fromParam = typeof params.lessonId === 'string' ? getLesson(params.lessonId) : undefined;
    return fromParam?.id ?? nextLesson?.id ?? null;
  });
  const [weather, setWeather] = useState<Weather>('clear');
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const lesson = lessonId ? getLesson(lessonId) : undefined;

  const start = async () => {
    if (!supervisorId || starting) return;
    setStarting(true);
    try {
      const res = await driveRecorder.start({ supervisorId, lessonId: lessonId ?? undefined, weather });
      if (res.ok) {
        router.replace('/drive/active');
        return;
      }
      if (res.reason === 'permission-denied') {
        confirmAction({
          title: 'Location is needed to record a drive',
          message:
            'PermitPath uses your location only during a drive, to log the route, distance, and night time. It stays on this phone. You can allow it in Settings, or log this drive without GPS.',
          confirmLabel: 'Log a drive manually',
          onConfirm: () => router.replace('/drive/manual'),
        });
      } else {
        notify("Couldn't start the drive", res.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <SupervisorPicker value={supervisorId} onChange={setSupervisorId} />
      <LessonPicker value={lessonId} onChange={setLessonId} freeLabel="Free drive (no lesson)" />
      <WeatherPicker value={weather} onChange={setWeather} />

      {lesson ? (
        <View style={{ gap: spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: briefingOpen }}
            onPress={() => setBriefingOpen((o) => !o)}
            style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.headline, { color: colors.text }]}>Briefing for the parent</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {lesson.coachingCards.length} coaching cards · read before you roll
              </Text>
            </View>
            <Ionicons name={briefingOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
          </Pressable>
          {briefingOpen ? (
            <View style={{ gap: spacing.md }}>
              <Text style={[typography.body, { color: colors.text }]}>{lesson.goal}</Text>
              {lesson.coachingCards.map((c, i) => (
                <CoachingCard key={`${c.kind}-${i}`} card={c} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Card accent={colors.amber}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.amber} />
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
            Only the passenger uses the app, and only when the car is stopped. The screen locks automatically while moving.
          </Text>
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Button
          label="Start drive"
          icon="play"
          size="lg"
          loading={starting}
          disabled={!supervisorId}
          onPress={start}
        />
        {!supervisorId ? (
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
            Choose a supervising adult to start.
          </Text>
        ) : null}
        <Button label="Log a drive without GPS" variant="ghost" onPress={() => router.replace('/drive/manual')} />
      </View>
    </Screen>
  );
}
