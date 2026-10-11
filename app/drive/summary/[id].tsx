import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge, Button, Card, EmptyState, RouteMap, SectionHeader, SegmentedRating, StatTile, Screen } from '../../../src/components';
import type { MapPin } from '../../../src/components';
import { Field } from '../../../src/components/drive/Field';
import { SkillPicker, SupervisorPicker, WeatherPicker, WEATHER_OPTIONS } from '../../../src/components/drive/pickers';
import { confirmAction, notify } from '../../../src/components/settings/dialogs';
import { SKILLS } from '../../../src/content/skills';
import { getLesson } from '../../../src/content/curriculum';
import { rules } from '../../../src/content/rules';
import { clearPendingDrive, getPendingDrive } from '../../../src/data/pendingDrive';
import { useStore } from '../../../src/data/store';
import { useSupervisorName } from '../../../src/data/selectors';
import { formatLocalDate, formatLocalTime } from '../../../src/domain/logHtml';
import { formatDuration } from '../../../src/domain/progress';
import type { Drive, SkillLevel, TrackPoint, Weather } from '../../../src/domain/types';
import { useTheme } from '../../../src/theme/ThemeProvider';

const METERS_PER_MILE = 1609.344;
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
const GENERIC_PROMPTS = [
  'What went well on this drive?',
  'What felt tricky, and what would help next time?',
  'What is one thing to focus on for the next drive?',
];

export default function DriveSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPending = id === 'pending';
  // Read it once; the stored copy is cleared on save or discard.
  const [pending] = useState(() => (isPending ? getPendingDrive() : null));
  const saved = useStore((s) => (isPending ? undefined : s.drives.find((d) => d.id === id)));
  const drive: Drive | undefined = pending?.drive ?? saved;

  if (!drive) {
    return <MissingDrive />;
  }
  return pending ? (
    <PendingSummary drive={pending.drive} track={pending.track} />
  ) : (
    <SavedSummary drive={drive} />
  );
}

function MissingDrive() {
  const router = useRouter();
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <EmptyState
        icon="alert-circle-outline"
        title="We couldn't find that drive"
        body="It may have already been saved or discarded."
        actionLabel="Back to Home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}

// ---------- shared pieces ----------

function DriveStats({ drive }: { drive: Drive }) {
  const { spacing } = useTheme();
  const miles = drive.distanceM / METERS_PER_MILE;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      <StatTile label="Duration" value={formatDuration(drive.durationSec)} icon="time-outline" />
      <StatTile label="Night" value={drive.nightSec > 0 ? formatDuration(drive.nightSec) : '0m'} icon="moon-outline" />
      <StatTile label="Distance" value={drive.source === 'manual' ? '—' : `${miles.toFixed(1)} mi`} icon="navigate-outline" />
      <StatTile label="Firm stops" value={String(drive.hardBrakes.length)} icon="hand-left-outline" />
    </View>
  );
}

function DriveCallouts({ drive }: { drive: Drive }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {drive.curfewWarning ? (
        <Card accent={colors.amber}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Ionicons name="information-circle-outline" size={22} color={colors.amber} />
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              Part of this drive was between {hourLabel(rules.curfew.startHour)} and {hourLabel(rules.curfew.endHour)}. Learner permits don&apos;t
              allow driving then — check the TN handbook.
            </Text>
          </View>
        </Card>
      ) : null}
      {drive.hardBrakes.length > 0 ? (
        <Card accent={colors.amber}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Ionicons name="chatbubbles-outline" size={22} color={colors.amber} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {drive.hardBrakes.length} firm stop{drive.hardBrakes.length === 1 ? '' : 's'} — worth a quick chat?
              </Text>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                Amber pins on the map show where. A firm stop is a conversation starter, not a score.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function DebriefPrompts({ prompts }: { prompts: string[] }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Talk it over" subtitle="Three questions for the ride home" />
      <Card>
        <View style={{ gap: spacing.md }}>
          {prompts.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
              <Text style={[typography.headline, { color: colors.primary }]}>{i + 1}</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{p}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

function mapPins(drive: Drive, amber: string): MapPin[] {
  return drive.hardBrakes.map((b, i) => ({ lat: b.lat, lng: b.lng, color: amber, title: `Firm stop ${i + 1}` }));
}

function Heading({ drive, title }: { drive: Drive; title: string }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text accessibilityRole="header" style={[typography.display, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        {formatLocalDate(drive.startedAt)} · {formatLocalTime(drive.startedAt)} – {formatLocalTime(drive.endedAt)}
      </Text>
    </View>
  );
}

// ---------- pending (just finished) ----------

function PendingSummary({ drive, track }: { drive: Drive; track: TrackPoint[] }) {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const addDrive = useStore((s) => s.addDrive);
  const setSkillLevel = useStore((s) => s.setSkillLevel);
  const skillRatings = useStore((s) => s.skillRatings);
  const supervisors = useStore((s) => s.supervisors);

  const lesson = drive.lessonId ? getLesson(drive.lessonId) : undefined;
  const [skillIds, setSkillIds] = useState<string[]>(() => lesson?.skillIds ?? []);
  const [ratingEdits, setRatingEdits] = useState<Record<string, SkillLevel>>({});
  const [supervisorId, setSupervisorId] = useState<string | null>(
    () => supervisors.find((s) => s.id === drive.supervisorId)?.id ?? drive.supervisorId ?? null,
  );
  const [weather, setWeather] = useState<Weather>(drive.weather);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const route = useMemo(() => track.map((p) => ({ lat: p.lat, lng: p.lng })), [track]);
  const pins = useMemo(() => mapPins(drive, colors.amber), [drive, colors.amber]);
  const levelFor = (sid: string): SkillLevel => ratingEdits[sid] ?? skillRatings[sid]?.level ?? 0;

  const toggleSkill = (sid: string) =>
    setSkillIds((cur) => (cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid]));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const finalDrive: Drive = {
        ...drive,
        supervisorId: supervisorId ?? drive.supervisorId,
        weather,
        skillIds,
        notes: notes.trim(),
      };
      await addDrive(finalDrive, track);
      for (const sid of skillIds) {
        const level = ratingEdits[sid];
        if (level !== undefined) await setSkillLevel(sid, level);
      }
      clearPendingDrive();
      router.replace('/');
    } catch {
      setSaving(false);
      notify("Couldn't save the drive", 'Please try again.');
    }
  };

  const discard = () => {
    confirmAction({
      title: 'Discard this drive?',
      message: 'The time and route will not be added to your log.',
      confirmLabel: 'Discard',
      destructive: true,
      onConfirm: () => {
        clearPendingDrive();
        router.replace('/');
      },
    });
  };

  // Very short drives: offer to discard right away (Cancel keeps it).
  useEffect(() => {
    if (drive.durationSec < 120) {
      confirmAction({
        title: 'Very short drive',
        message: 'This drive was under 2 minutes. Discard it, or tap Cancel to keep it and add details.',
        confirmLabel: 'Discard',
        destructive: true,
        onConfirm: () => {
          clearPendingDrive();
          router.replace('/');
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Heading drive={drive} title="Nice work" />

      {route.length >= 2 ? <RouteMap route={route} pins={pins} height={220} /> : null}
      <DriveStats drive={drive} />
      <DriveCallouts drive={drive} />

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Skills practiced" subtitle="Tap to mark what came up on this drive" />
        <SkillPicker lessonSkillIds={lesson?.skillIds ?? []} selected={skillIds} onToggle={toggleSkill} />
      </View>

      {skillIds.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Quick rating" subtitle="Parent's view of each skill right now" />
          {skillIds.map((sid) => {
            const skill = SKILLS.find((s) => s.id === sid);
            if (!skill) return null;
            return (
              <Card key={sid}>
                <View style={{ gap: spacing.sm }}>
                  <Text style={[typography.headline, { color: colors.text }]}>{skill.title}</Text>
                  <SegmentedRating
                    label={skill.title}
                    value={levelFor(sid)}
                    onChange={(lvl) => setRatingEdits((cur) => ({ ...cur, [sid]: lvl }))}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      <DebriefPrompts prompts={lesson?.debriefPrompts ?? GENERIC_PROMPTS} />

      <SupervisorPicker value={supervisorId} onChange={setSupervisorId} />
      <WeatherPicker value={weather} onChange={setWeather} />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Anything worth remembering" />

      <View style={{ gap: spacing.sm }}>
        <Button label="Save drive" icon="checkmark" size="lg" loading={saving} onPress={save} />
        <Button label="Discard drive" variant="ghost" disabled={saving} onPress={discard} />
      </View>
    </Screen>
  );
}

// ---------- saved (view only) ----------

function SavedSummary({ drive }: { drive: Drive }) {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const getTrack = useStore((s) => s.getTrack);
  const supervisorName = useSupervisorName(drive.supervisorId);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const lesson = drive.lessonId ? getLesson(drive.lessonId) : undefined;

  useEffect(() => {
    let alive = true;
    getTrack(drive.id)
      .then((t) => alive && setTrack(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [drive.id, getTrack]);

  const route = useMemo(() => track.map((p) => ({ lat: p.lat, lng: p.lng })), [track]);
  const pins = useMemo(() => mapPins(drive, colors.amber), [drive, colors.amber]);
  const weatherLabel = WEATHER_OPTIONS.find((w) => w.value === drive.weather)?.label ?? drive.weather;
  const skills = drive.skillIds.map((sid) => SKILLS.find((s) => s.id === sid)).filter(Boolean);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Heading drive={drive} title={lesson ? lesson.title : 'Practice drive'} />
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {drive.source === 'manual' ? <Badge label="Manual" /> : null}
        <Badge label={weatherLabel} />
        <Badge label={`With ${supervisorName}`} />
      </View>

      {route.length >= 2 ? <RouteMap route={route} pins={pins} height={220} /> : null}
      <DriveStats drive={drive} />
      <DriveCallouts drive={drive} />

      {skills.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Skills practiced" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {skills.map((s) => (s ? <Badge key={s.id} label={s.title} tone="primary" /> : null))}
          </View>
        </View>
      ) : null}

      {lesson ? <DebriefPrompts prompts={lesson.debriefPrompts} /> : null}

      {drive.notes ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Notes" />
          <Text style={[typography.body, { color: colors.text }]}>{drive.notes}</Text>
        </View>
      ) : null}

      <Button label="Edit in log" variant="secondary" onPress={() => router.push(`/log/${drive.id}`)} />
    </Screen>
  );
}
