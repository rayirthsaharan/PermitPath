import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { LESSON_FOOTER } from '../content/rules';

export function DisclaimerFooter({ text = LESSON_FOOTER }: { text?: string }) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={text}
      style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.button, padding: spacing.md }}
    >
      <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}
