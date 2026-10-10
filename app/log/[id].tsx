import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Badge, Button, Card, Chip, EmptyState, RouteMap, Screen, SectionHeader, StatTile } from '../../src/components';
import { confirmAction } from '../../src/components/settings/dialogs';
import { TextField } from '../../src/components/settings/TextField';
import { getLesson } from '../../src/content/curriculum';
import { useStore } from '../../src/data/store';
import { formatLocalDate, formatLocalTime } from '../../src/domain/logHtml';
import { formatDuration } from '../../src/domain/progress';
import type { LatLng, Weather } from '../../src/domain/types';
import { useTheme } from '../../src/theme/ThemeProvider';

const WEATHER: { value: Weather; label: string }[] = [
  { value: 'clear', label: 'Clear' },
  { value: 'rain', label: 'Rain' },
  { value: 'fog', label: 'Fog' },
  { value: 'snow-ice', label: 'Snow/ice' },
];

export default function LogDetail() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const driveId = id ? String(id) : '';
  const drive = useStore((s) => s.drives.find((d) => d.id === driveId));
  const supervisors = useStore((s) => s.supervisors);
  const updateDrive = useStore((s) => s.updateDrive);
  const deleteDrive = useStore((s) => s.deleteDrive);

  const [track, setTrack] = useState<LatLng[] | null>(null);
  const [supervisorId, setSupervisorId] = useState(drive?.supervisorId ?? '');
  const [weather, setWeather] = useState<Weather>(drive?.weather ?? 'clear');
  const [notes, setNotes] = useState(drive?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!driveId) return;
    useStore
      .getState()
      .getTrack(driveId)
      .then((pts) => {
        if (!cancelled) setTrack(pts.map((p) => ({ lat: p.lat, lng: p.lng })));
      })
      .catch(() => {
        if (!cancelled) setTrack([]);
      });
    return () => {
      cancelled = true;
    };
  }, [driveId]);

  const pins = useMemo(
    () => (drive?.hardBrakes ?? []).map((b) => ({ lat: b.lat, lng: b.lng, color: colors.amber, title: 'Firm stop' })),
    [drive?.hardBrakes, colors.amber],
  );

  if (!drive) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        {deleting ? null : (
          <EmptyState icon="help-circle-outline" title="Drive not found" actionLabel="Back to log" onAction={() => router.back()} />
        )}
      </Screen>
    );
  }

  const lesson = drive.lessonId ? getLesson(drive.lessonId) : undefined;
  const dirty = supervisorId !== drive.supervisorId || weather !== drive.weather || notes !== drive.notes;
  const miles = drive.distanceM / 1609.344;

  const onSave = async () => {
    setSaving(true);
    try {
      await updateDrive(drive.id, { supervisorId, weather, notes: notes.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () =>
    confirmAction({
      title: 'Delete this drive?',
      message: 'It will be removed from your totals and log. This can’t be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setDeleting(true);
        void deleteDrive(drive.id).then(() => router.back());
      },
    });

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
          {formatLocalDate(drive.startedAt)}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          {formatLocalTime(drive.startedAt)} – {formatLocalTime(drive.endedAt)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: spacing.xs }}>
          {drive.source === 'manual' ? <Badge label="Manual" /> : null}
          {lesson ? <Badge label={lesson.title} tone="primary" /> : null}
          {drive.curfewWarning ? <Badge label="Curfew" tone="amber" icon="warning" /> : null}
          {drive.nightSec > 0 ? <Badge label="Night" tone="night" icon="moon" /> : null}
        </View>
      </View>

      {drive.source === 'gps' && track && track.length > 1 ? (
        <RouteMap route={track} pins={pins} caption={pins.length ? 'Amber pins mark firm stops' : undefined} />
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatTile icon="time-outline" label="Time" value={formatDuration(drive.durationSec)} />
        <StatTile icon="moon" label="Night" value={formatDuration(drive.nightSec)} color={colors.night} />
      </View>
      {drive.source === 'gps' ? (
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile icon="navigate-outline" label="Distance" value={`${miles.toFixed(1)} mi`} />
          <StatTile icon="warning-outline" label="Firm stops" value={String(drive.hardBrakes.length)} color={drive.hardBrakes.length ? colors.amber : undefined} />
        </View>
      ) : null}
      {drive.hardBrakes.length > 0 ? (
        <Card accent={colors.amber}>
          <Text style={[typography.body, { color: colors.text }]}>
            {drive.hardBrakes.length} firm stop{drive.hardBrakes.length === 1 ? '' : 's'} — worth a quick chat?
          </Text>
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Supervisor" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {supervisors.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              selected={supervisorId === s.id}
              onPress={() => {
                setSupervisorId(s.id);
                setSaved(false);
              }}
            />
          ))}
          {!supervisors.some((s) => s.id === drive.supervisorId) && supervisors.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>No supervisors on file.</Text>
          ) : null}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Conditions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {WEATHER.map((w) => (
            <Chip
              key={w.value}
              label={w.label}
              selected={weather === w.value}
              onPress={() => {
                setWeather(w.value);
                setSaved(false);
              }}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Notes"
        value={notes}
        onChangeText={(t) => {
          setNotes(t);
          setSaved(false);
        }}
        placeholder="Anything worth remembering from this drive"
        multiline
      />

      <View style={{ gap: spacing.sm }}>
        <Button
          label={saved && !dirty ? 'Saved' : 'Save changes'}
          icon={saved && !dirty ? 'checkmark' : undefined}
          loading={saving}
          disabled={!dirty}
          onPress={() => void onSave()}
        />
        <Button label="Delete drive" variant="danger" icon="trash-outline" onPress={onDelete} />
      </View>
    </Screen>
  );
}
