import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { formatLocalDate, formatLocalTime } from '../../domain/logHtml';
import { FieldLabel } from './Field';

// The native picker must never be evaluated on web.
/* eslint-disable @typescript-eslint/no-explicit-any */
let NativePicker: any = null;
let NativePickerAndroid: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-community/datetimepicker');
  NativePicker = mod.default;
  NativePickerAndroid = mod.DateTimePickerAndroid;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local 'YYYY-MM-DD'. */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse 'YYYY-MM-DD' into a local-midnight Date, or null if malformed / not a real date. */
export function parseYmdLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** Parse 24h 'HH:MM' (also accepts 'H:MM'); returns a Date today at that time, or null. */
export function parseHm(s: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
}

/** Combine a calendar day with the clock time of another Date. */
export function combineDayAndTime(day: Date, time: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes(), 0, 0);
}

export type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (d: Date | null) => void;
  maximumDate?: Date;
  error?: string | null;
  hint?: string;
};

/**
 * Date / time input. Native: a tappable field that opens the platform picker.
 * Web: a plain text input (YYYY-MM-DD or HH:MM, 24-hour).
 */
export function DateTimeField({ label, mode, value, onChange, maximumDate, error, hint }: DateTimeFieldProps) {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => (value ? (mode === 'date' ? toYmd(value) : `${pad(value.getHours())}:${pad(value.getMinutes())}`) : ''));

  const boxStyle = {
    minHeight: 48,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: error ? colors.danger : colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
  } as const;

  let control: React.ReactNode;
  if (Platform.OS === 'web') {
    control = (
      <TextInput
        accessibilityLabel={label}
        value={text}
        onChangeText={(t) => {
          setText(t);
          onChange(mode === 'date' ? parseYmdLocal(t) : parseHm(t));
        }}
        placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM (24-hour)'}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        style={[typography.body, boxStyle, { color: colors.text }]}
      />
    );
  } else {
    const shown = value ? (mode === 'date' ? formatLocalDate(value.getTime()) : formatLocalTime(value.getTime())) : null;
    const openPicker = () => {
      const current = value ?? new Date();
      if (Platform.OS === 'android') {
        NativePickerAndroid.open({
          value: current,
          mode,
          maximumDate,
          is24Hour: false,
          onChange: (_e: unknown, d?: Date) => {
            if (d) onChange(d);
          },
        });
      } else {
        setOpen((o) => !o);
      }
    };
    control = (
      <View style={{ gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${shown ?? 'not set'}`}
          onPress={openPicker}
          style={[boxStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <Text style={[typography.body, { color: shown ? colors.text : colors.textMuted }]}>
            {shown ?? (mode === 'date' ? 'Choose a date' : 'Choose a time')}
          </Text>
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={20} color={colors.textMuted} />
        </Pressable>
        {Platform.OS === 'ios' && open ? (
          <NativePicker
            value={value ?? new Date()}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_e: unknown, d?: Date) => {
              if (d) onChange(d);
            }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel>{label}</FieldLabel>
      {control}
      {error ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
