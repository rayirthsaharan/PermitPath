import React from 'react';
import { ColorValue, Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (focused: IconName, outline: IconName) =>
  ({ color, size, focused: f }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={f ? focused : outline} size={size} color={color} />
  );

/** Raised circular center button: opens the Start Drive sheet instead of a tab screen. */
function DriveTabButton() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center' }} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start a drive"
        onPress={() => router.push('/drive/start')}
        style={({ pressed }) => ({
          top: -18,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        })}
      >
        <Ionicons name="car" size={30} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="routes" options={{ title: 'Routes', tabBarIcon: tabIcon('map', 'map-outline') }} />
      <Tabs.Screen
        name="drive"
        options={{
          title: 'Drive',
          tabBarLabel: () => null,
          tabBarButton: () => <DriveTabButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/drive/start');
          },
        }}
      />
      <Tabs.Screen name="skills" options={{ title: 'Skills', tabBarIcon: tabIcon('checkbox', 'checkbox-outline') }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: tabIcon('document-text', 'document-text-outline') }} />
    </Tabs>
  );
}
