import React from 'react';
import { KeyboardTypeOptions, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>{children}</Text>;
}

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  maxLength?: number;
  error?: string | null;
  hint?: string;
};

/** Labelled text input with optional error / hint line. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
  error,
  hint,
}: FieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={[
          typography.body,
          {
            minHeight: multiline ? 96 : 48,
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.button,
            paddingHorizontal: spacing.md,
            paddingVertical: multiline ? spacing.md : 0,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Checkbox row with a 48pt+ touch target. */
export function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        minHeight: 48,
        padding: spacing.md,
        borderRadius: radius.button,
        backgroundColor: checked ? colors.primary + '14' : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: checked ? colors.primary : colors.border,
      }}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={26}
        color={checked ? colors.primary : colors.textMuted}
      />
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{children}</Text>
    </Pressable>
  );
}
