import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export type StageNodeState = 'locked' | 'unlocked' | 'complete';

export type StageNodeProps = {
  number: number;
  state: StageNodeState;
  /** Draw the connector line below the node (false for the last stage). */
  showConnector?: boolean;
  /** Content to the right of the node (title, lessons, gate text). */
  children?: React.ReactNode;
};

export function StageNode({ number, state, showConnector = true, children }: StageNodeProps) {
  const { colors, typography } = useTheme();
  const bg = state === 'complete' ? colors.success : state === 'unlocked' ? colors.primary : colors.surfaceAlt;
  const fg = state === 'locked' ? colors.textMuted : colors.onPrimary;
  const stateLabel = state === 'complete' ? 'complete' : state === 'unlocked' ? 'unlocked' : 'locked';
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 40 }}>
        <View
          accessible
          accessibilityLabel={`Stage ${number}, ${stateLabel}`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: bg,
            borderWidth: state === 'locked' ? 1 : 0,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {state === 'complete' ? (
            <Ionicons name="checkmark" size={22} color={fg} />
          ) : state === 'locked' ? (
            <Ionicons name="lock-closed" size={18} color={fg} />
          ) : (
            <Text style={[typography.headline, { color: fg }]}>{number}</Text>
          )}
        </View>
        {showConnector ? (
          <View style={{ flex: 1, width: 3, marginVertical: 4, borderRadius: 2, backgroundColor: state === 'complete' ? colors.success : colors.border }} />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: 20 }}>{children}</View>
    </View>
  );
}
