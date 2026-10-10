import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../../src/components';
import { useTheme } from '../../src/theme/ThemeProvider';

// TODO(phase 3): implement Settings screen.
export default function Settings() {
  const { colors, typography } = useTheme();
  return (
    <Screen>
      <Text style={[typography.title, { color: colors.text }]}>Settings</Text>
    </Screen>
  );
}
