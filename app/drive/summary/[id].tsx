import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../../../src/components';
import { useTheme } from '../../../src/theme/ThemeProvider';

// TODO(phase 3): implement Drive summary screen.
export default function DriveSummary() {
  const { colors, typography } = useTheme();
  return (
    <Screen>
      <Text style={[typography.title, { color: colors.text }]}>Drive summary</Text>
    </Screen>
  );
}
