import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export type ProgressRingProps = {
  value: number;
  max: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  /** Large centered text, e.g. "21.5". */
  label?: string;
  /** Small text under the label, e.g. "/50h". */
  sublabel?: string;
  accessibilityLabel?: string;
};

export function ProgressRing({
  value,
  max,
  color,
  size = 132,
  strokeWidth = 12,
  label,
  sublabel,
  accessibilityLabel,
}: ProgressRingProps) {
  const { colors, typography } = useTheme();
  const stroke = color ?? colors.primary;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const frac = max <= 0 ? 1 : Math.max(0, Math.min(1, value / max));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${label ?? ''} ${sublabel ?? ''}`.trim()}
      accessibilityValue={{ min: 0, max: Math.max(1, Math.round(max)), now: Math.round(Math.min(value, max)) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? <Text style={[typography.title, { color: colors.text }]}>{label}</Text> : null}
      {sublabel ? <Text style={[typography.caption, { color: colors.textMuted }]}>{sublabel}</Text> : null}
    </View>
  );
}
