import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, SectionHeader } from '../../src/components';
import { Field } from '../../src/components/drive/Field';
import { DateTimeField, combineDayAndTime } from '../../src/components/drive/DateTimeField';
import { LessonPicker, SkillPicker, SupervisorPicker, WeatherPicker } from '../../src/components/drive/pickers';
import { notify } from '../../src/components/settings/dialogs';
import { getLesson } from '../../src/content/curriculum';
import { rules } from '../../src/content/rules';
import { newId } from '../../src/data/id';
import { useStore } from '../../src/data/store';
import { overlapsCurfew } from '../../src/domain/curfew';
import { formatDuration } from '../../src/domain/progress';
import type { Drive, Weather } from '../../src/domain/types';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ManualDrive() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const supervisors = useStore((s) => s.supervisors);
  const lastSupervisorId = useStore((s) => s.drives[0]?.supervisorId);
  const addDrive = useStore((s) => s.addDrive);

  const today = useMemo(() => new Date(), []);
  const [day, setDay] = useState<Date | null>(today);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [nightText, setNightText] = useState('');
  const [supervisorId, setSupervisorId] = useState<string | null>(
    () => supervisors.find((s) => s.id === lastSupervisorId)?.id ?? supervisors[0]?.id ?? null,
  );
  const [weather, setWeather] = useState<Weather>('clear');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const startMs = day && startTime ? combineDayAndTime(day, startTime).getTime() : null;
  const endMs = day && endTime ? combineDayAndTime(day, endTime).getTime() : null;
  const durationSec = startMs != null && endMs != null ? Math.round((endMs - startMs) / 1000) : null;

  const nightMin = nightText.trim() === '' ? 0 : Number(nightText);

  const errors = {
    day: !day ? 'Enter a valid date.' : day.getTime() > Date.now() ? 'The date can’t be in the future.' : null,
    start: !startTime ? 'Enter a start time.' : null,
    end: !endTime
      ? 'Enter an end time.'
      : durationSec != null && durationSec <= 0
        ? 'End time must be after the start time.'
        : null,
    night: !Number.isFinite(nightMin) || nightMin < 0 || !Number.isInteger(nightMin)
      ? 'Enter whole minutes, like 25.'
      : durationSec != null && durationSec > 0 && nightMin * 60 > durationSec
        ? 'Night minutes can’t be more than the drive length.'
        : null,
    future: startMs != null && endMs != null && endMs > Date.now() ? 'That drive ends in the future.' : null,
    supervisor: !supervisorId ? 'Choose who supervised.' : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (e: string | null) => (submitted ? e : null);

  const onLessonChange = (id: string | null) => {
    setLessonId(id);
    const l = id ? getLesson(id) : undefined;
    if (l) setSkillIds(l.skillIds);
  };
  const lesson = lessonId ? getLesson(lessonId) : undefined;

  const save = async () => {
    setSubmitted(true);
    if (!valid || startMs == null || endMs == null || durationSec == null || !supervisorId) return;
    setSaving(true);
    try {
      const drive: Drive = {
        id: newId(),
        startedAt: startMs,
        endedAt: endMs,
        supervisorId,
        source: 'manual',
        durationSec,
        nightSec: Math.min(durationSec, Math.round(nightMin * 60)),
        distanceM: 0,
        weather,
        lessonId: lessonId ?? undefined,
        skillIds,
        hardBrakes: [],
        curfewWarning: overlapsCurfew(startMs, endMs, rules.curfew),
        notes: notes.trim(),
      };
      await addDrive(drive);
      router.back();
    } catch {
      setSaving(false);
      notify("Couldn't save the drive", 'Please try again.');
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        For drives taken without the phone. It will be marked &ldquo;Manual&rdquo; in your log.
      </Text>

      <DateTimeField label="Date" mode="date" value={day} onChange={setDay} maximumDate={today} error={show(errors.day)} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateTimeField label="Start time" mode="time" value={startTime} onChange={setStartTime} error={show(errors.start)} />
        </View>
        <View style={{ flex: 1 }}>
          <DateTimeField label="End time" mode="time" value={endTime} onChange={setEndTime} error={show(errors.end ?? errors.future)} />
        </View>
      </View>

      {durationSec != null && durationSec > 0 ? (
        <Card>
          <Text style={[typography.body, { color: colors.text }]}>
            Drive length: <Text style={{ fontWeight: '700' }}>{formatDuration(durationSec)}</Text>
          </Text>
        </Card>
      ) : null}

      <Field
        label="Night minutes"
        value={nightText}
        onChangeText={setNightText}
        keyboardType="number-pad"
        placeholder="0"
        error={show(errors.night)}
        hint="Minutes of this drive after sunset and before sunrise."
      />

      <SupervisorPicker value={supervisorId} onChange={setSupervisorId} />
      {show(errors.supervisor) ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{errors.supervisor}</Text>
      ) : null}
      <WeatherPicker value={weather} onChange={setWeather} />
      <LessonPicker value={lessonId} onChange={onLessonChange} freeLabel="No lesson (free drive)" />

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Skills practiced" subtitle="Optional" />
        <SkillPicker
          lessonSkillIds={lesson?.skillIds ?? []}
          selected={skillIds}
          onToggle={(id) => setSkillIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}
        />
      </View>

      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Anything worth remembering" />

      <Button label="Save drive" icon="checkmark" size="lg" loading={saving} onPress={save} />
    </Screen>
  );
}
