import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useStore } from '../../data/store';
import { SKILLS, SKILL_CATEGORIES } from '../../content/skills';
import { STAGES, getLesson } from '../../content/curriculum';
import type { Weather } from '../../domain/types';
import { Chip } from '../Chip';
import { Button } from '../Button';
import { FieldLabel } from './Field';

export const WEATHER_OPTIONS: { value: Weather; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'clear', label: 'Clear', icon: 'sunny-outline' },
  { value: 'rain', label: 'Rain', icon: 'rainy-outline' },
  { value: 'fog', label: 'Fog', icon: 'cloud-outline' },
  { value: 'snow-ice', label: 'Snow/ice', icon: 'snow-outline' },
];

export function ChipRow({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

export function SupervisorPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const supervisors = useStore((s) => s.supervisors);
  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel>Supervising adult</FieldLabel>
      {supervisors.length === 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.body, { color: colors.textMuted }]}>
            Add a supervising adult (licensed driver age 21 or older) to log drives.
          </Text>
          <Button label="Add a supervisor" variant="secondary" onPress={() => router.push('/settings/supervisors')} />
        </View>
      ) : (
        <ChipRow>
          {supervisors.map((s) => (
            <Chip key={s.id} label={s.name} selected={value === s.id} onPress={() => onChange(s.id)} />
          ))}
        </ChipRow>
      )}
    </View>
  );
}

export function WeatherPicker({ value, onChange }: { value: Weather; onChange: (w: Weather) => void }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel>Conditions</FieldLabel>
      <ChipRow>
        {WEATHER_OPTIONS.map((w) => (
          <Chip key={w.value} label={w.label} icon={w.icon} selected={value === w.value} onPress={() => onChange(w.value)} />
        ))}
      </ChipRow>
    </View>
  );
}

/** Lesson chooser: a summary card that opens to a list grouped by stage. `null` = free drive. */
export function LessonPicker({
  value,
  onChange,
  freeLabel = 'Free drive (no lesson)',
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  freeLabel?: string;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const [open, setOpen] = useState(false);
  const lesson = value ? getLesson(value) : undefined;

  const row = (key: string, title: string, subtitle: string | undefined, selected: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel>Lesson</FieldLabel>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lesson: ${lesson ? lesson.title : freeLabel}. ${open ? 'Collapse' : 'Change'} list`}
          onPress={() => setOpen((o) => !o)}
          style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.headline, { color: colors.text }]}>{lesson ? lesson.title : freeLabel}</Text>
            {lesson ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Stage {lesson.stageId} · {lesson.estimatedMinutes} min
              </Text>
            ) : null}
          </View>
          <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>{open ? 'Done' : 'Change'}</Text>
        </Pressable>
        {open ? (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: spacing.sm }}>
            {row('free', freeLabel, undefined, value === null, () => {
              onChange(null);
              setOpen(false);
            })}
            {STAGES.map((stage) => (
              <View key={stage.id}>
                <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', marginTop: spacing.md, textTransform: 'uppercase' }]}>
                  Stage {stage.id} · {stage.title}
                </Text>
                {stage.lessons.map((l) =>
                  row(l.id, l.title, `${l.estimatedMinutes} min`, value === l.id, () => {
                    onChange(l.id);
                    setOpen(false);
                  }),
                )}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Skill chips: lesson skills first, the rest under "More skills" by category. */
export function SkillPicker({
  lessonSkillIds,
  selected,
  onToggle,
}: {
  lessonSkillIds: string[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { colors, spacing, typography } = useTheme();
  const [more, setMore] = useState(false);
  const lessonSet = useMemo(() => new Set(lessonSkillIds), [lessonSkillIds]);
  const sel = new Set(selected);
  // Lesson skills first; other skills the parent picked stay visible too.
  const lessonSkills = SKILLS.filter((s) => lessonSet.has(s.id) || sel.has(s.id));
  const topSet = new Set(lessonSkills.map((s) => s.id));
  const chip = (id: string, title: string) => (
    <Chip key={id} label={title} selected={sel.has(id)} icon={sel.has(id) ? 'checkmark' : undefined} onPress={() => onToggle(id)} />
  );
  return (
    <View style={{ gap: spacing.md }}>
      {lessonSkills.length > 0 ? <ChipRow>{lessonSkills.map((s) => chip(s.id, s.title))}</ChipRow> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: more }}
        onPress={() => setMore((m) => !m)}
        style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
      >
        <Text style={[typography.body, { color: colors.primary, fontWeight: '600' }]}>
          {lessonSkills.length > 0 ? 'More skills' : 'Choose skills'}
        </Text>
        <Ionicons name={more ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {more
        ? SKILL_CATEGORIES.map((cat) => {
            const items = SKILLS.filter((s) => s.category === cat.id && !topSet.has(s.id));
            if (items.length === 0) return null;
            return (
              <View key={cat.id} style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' }]}>{cat.title}</Text>
                <ChipRow>{items.map((s) => chip(s.id, s.title))}</ChipRow>
              </View>
            );
          })
        : null}
    </View>
  );
}
