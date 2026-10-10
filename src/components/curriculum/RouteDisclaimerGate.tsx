import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useStore } from '../../data/store';
import { LESSON_FOOTER } from '../../content/rules';
import { Button } from '../Button';

const POINTS = [
  'Suggested routes are practice ideas, not guarantees of safety.',
  'The supervising adult decides if roads, traffic, and conditions are appropriate.',
  'Corridors start off-peak on purpose. Pick a quiet time, and head home if it feels like too much.',
  'Routes are overviews only, with no turn-by-turn directions. Follow road signs and obey all traffic laws.',
];

/** One-time liability gate. Renders nothing once settings.disclaimerAcceptedAt is set. */
export function RouteDisclaimerGate() {
  const { colors, spacing, radius, typography } = useTheme();
  const hydrated = useStore((s) => s.hydrated);
  const accepted = useStore((s) => s.settings.disclaimerAcceptedAt);
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <Modal visible={hydrated && !accepted} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,7,12,0.7)', justifyContent: 'center', padding: spacing.lg }}>
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: '90%',
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text accessibilityRole="header" style={[typography.title, { color: colors.text, flex: 1 }]}>
              Before you use practice routes
            </Text>
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.md }}>
            {POINTS.map((p) => (
              <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Text style={[typography.body, { color: colors.primary }]}>•</Text>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{p}</Text>
              </View>
            ))}
            <Text style={[typography.caption, { color: colors.textMuted }]}>{LESSON_FOOTER}</Text>
          </ScrollView>
          <Button label="I understand" onPress={() => void updateSettings({ disclaimerAcceptedAt: Date.now() })} />
        </View>
      </View>
    </Modal>
  );
}
