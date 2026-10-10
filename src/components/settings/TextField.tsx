import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  error?: string;
};

export function TextField({ label, helper, error, multiline, ...rest }: TextFieldProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        {...rest}
        style={{
          minHeight: multiline ? 96 : 48,
          borderRadius: radius.button,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surfaceAlt,
          color: colors.text,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          fontSize: typography.body.fontSize,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
}
