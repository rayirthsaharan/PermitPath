import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Hold this long before onPress fires; a fill shows progress. */
  holdToConfirmMs?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 48, md: 52, lg: 60 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth = true,
  holdToConfirmMs,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { colors, radius, typography } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const holding = useRef(false);

  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, fill: 'rgba(255,255,255,0.28)' },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.border, fill: colors.primary + '33' },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent', fill: colors.primary + '22' },
    danger: { bg: colors.danger, fg: '#FFFFFF', border: colors.danger, fill: 'rgba(255,255,255,0.28)' },
  }[variant];

  const inactive = !!disabled || !!loading;

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const cancelHold = () => {
    holding.current = false;
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const startHold = () => {
    if (inactive || !holdToConfirmMs) return;
    holding.current = true;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: holdToConfirmMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && holding.current) {
        holding.current = false;
        progress.setValue(0);
        onPress?.();
      }
    });
  };

  const hold = !!holdToConfirmMs;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (hold ? `${label}. Press and hold to confirm.` : label)}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      accessibilityHint={hold ? `Hold for ${Math.round((holdToConfirmMs ?? 0) / 100) / 10} seconds` : undefined}
      disabled={inactive}
      onPress={hold ? undefined : onPress}
      onPressIn={hold ? startHold : undefined}
      onPressOut={hold ? cancelHold : undefined}
      style={({ pressed }) => [
        {
          minHeight: HEIGHT[size],
          borderRadius: radius.button,
          backgroundColor: palette.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.5 : pressed && !hold ? 0.85 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {hold ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            backgroundColor: palette.fill,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : icon ? (
          <Ionicons name={icon} size={size === 'lg' ? 24 : 20} color={palette.fg} />
        ) : null}
        <Text style={[typography.headline, { color: palette.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}
