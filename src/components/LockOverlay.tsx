import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Full-screen near-black overlay that blocks every touch.
 * Put the timer or message inside as children; nothing in it is tappable.
 */
export function LockOverlay({ children }: { children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityViewIsModal
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.driveBg, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }]}
    >
      {children}
    </View>
  );
}
