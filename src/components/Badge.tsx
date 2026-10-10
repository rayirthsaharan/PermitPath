import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export type BadgeTone = 'neutral' | 'primary' | 'night' | 'amber' | 'success' | 'danger';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { colors, radius } = useTheme();
  const c = tone === 'neutral' ? colors.textMuted : colors[tone];
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.chip,
        backgroundColor: c + '22',
      }}
    >
      {icon ? <Ionicons name={icon} size={12} color={c} /> : null}
      <Text style={{ color: c, fontSize: 12, fontWeight: '700', lineHeight: 16 }}>{label}</Text>
    </View>
  );
}
