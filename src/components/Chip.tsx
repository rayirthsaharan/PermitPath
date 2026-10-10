import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, icon, disabled, accessibilityLabel }: ChipProps) {
  const { colors, radius, typography } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={{
        minHeight: 48,
        paddingHorizontal: 16,
        borderRadius: radius.chip,
        backgroundColor: selected ? colors.primary : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text style={[typography.body, { color: fg, fontWeight: '500' }]}>{label}</Text>
    </Pressable>
  );
}
