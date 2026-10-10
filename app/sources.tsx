import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Button, Card, DisclaimerFooter, Screen } from '../src/components';
import { RULES_DISCLAIMER, LOG_BANNER } from '../src/content/rules';
import { SOURCES } from '../src/content/sources';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Sources() {
  const { colors, spacing, typography } = useTheme();
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Card accent={colors.amber} style={{ gap: spacing.xs }}>
        <Text style={[typography.headline, { color: colors.text }]}>Check the official rules</Text>
        <Text style={[typography.body, { color: colors.text }]}>{RULES_DISCLAIMER}</Text>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text accessibilityRole="header" style={[typography.headline, { color: colors.text }]}>
          Sources
        </Text>
        {SOURCES.map((s) => (
          <Card key={s.id} style={{ gap: spacing.xs }}>
            <Text style={[typography.headline, { color: colors.text }]}>{s.title}</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>{s.note}</Text>
            {s.url ? (
              <Button label="Open source" variant="ghost" size="sm" fullWidth={false} onPress={() => void Linking.openURL(s.url as string)} />
            ) : null}
          </Card>
        ))}
      </View>

      <Card style={{ gap: spacing.xs }}>
        <Text style={[typography.headline, { color: colors.text }]}>About the practice corridors</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Corridor locations are approximate and pending verification against the Mt. Juliet Safety Action Plan and city
          roundabout maps. Routes are overviews only, with no turn-by-turn directions. Always follow road signs and your
          supervisor.
        </Text>
      </Card>

      <Card style={{ gap: spacing.xs }}>
        <Text style={[typography.headline, { color: colors.text }]}>About the printed log</Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{LOG_BANNER}</Text>
      </Card>

      <DisclaimerFooter />
    </Screen>
  );
}
