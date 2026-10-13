import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { formatLocalDate, formatLocalTime } from '../../domain/logHtml';
import { FieldLabel } from './Field';

// Never load the native picker on web.
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

/** Turn 'YYYY-MM-DD' into a date at local midnight, or null if invalid. */
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

/** Turn 24h 'HH:MM' (or 'H:MM') into a Date for today, or null. */
export function parseHm(s: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
}

/** Join one day with the clock time of another Date. */
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
 * Date / time input. Native: a field that opens the system picker.
 * Web: a plain text box (YYYY-MM-DD or HH:MM, 24-hour).
 */
export function DateTimeField({ label, mode, value, onChange, maximumDate, error, hint }: DateTimeFieldProps) {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  // Starting value for an empty field, so tapping Done without spinning still sets a time.
  const [draft, setDraft] = useState(() => new Date());
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
        setDraft(current);
        setOpen(true);
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
        {Platform.OS === 'ios' ? (
          // Full-width bottom sheet so the wheel never gets squeezed by a narrow column.
          <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
            <Pressable
              accessibilityLabel="Close picker"
              onPress={() => setOpen(false)}
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.card,
                borderTopRightRadius: radius.card,
                paddingBottom: spacing.xxl,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  onPress={() => {
                    if (!value) onChange(draft);
                    setOpen(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={[typography.headline, { color: colors.primary }]}>Done</Text>
                </Pressable>
              </View>
              <NativePicker
                value={value ?? draft}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                themeVariant={isDark ? 'dark' : 'light'}
                style={{ alignSelf: 'stretch' }}
                onChange={(_e: unknown, d?: Date) => {
                  if (d) onChange(d);
                }}
              />
            </View>
          </Modal>
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
