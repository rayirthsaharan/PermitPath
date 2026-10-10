import React from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export type ScreenProps = {
  children?: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  title?: string;
  /** Element shown at the right of the header (e.g. a gear button). */
  headerRight?: React.ReactNode;
  /** Element shown at the left of the header (e.g. a back button). */
  headerLeft?: React.ReactNode;
  /** Remove default padding (default false). */
  noPadding?: boolean;
  /** Safe-area edges to respect; tabs screens typically omit 'bottom'. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
};

export function Screen({
  children,
  scroll = true,
  title,
  headerRight,
  headerLeft,
  noPadding,
  edges = ['top', 'left', 'right'],
  contentStyle,
  backgroundColor,
}: ScreenProps) {
  const { colors, spacing, typography } = useTheme();
  const padding = noPadding ? 0 : spacing.lg;
  const header =
    title || headerRight || headerLeft ? (
      <View style={[styles.header, { paddingHorizontal: padding, paddingTop: spacing.sm, paddingBottom: spacing.md }]}>
        {headerLeft ? <View style={styles.side}>{headerLeft}</View> : null}
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[typography.title, { color: colors.text, flex: 1 }]}
        >
          {title}
        </Text>
        {headerRight ? <View style={styles.side}>{headerRight}</View> : null}
      </View>
    ) : null;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: backgroundColor ?? colors.bg }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[{ padding, paddingTop: header ? 0 : padding, paddingBottom: spacing.xxl * 2, gap: spacing.lg }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { padding, gap: spacing.lg }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  side: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
