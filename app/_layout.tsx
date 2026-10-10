import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { useStore } from '../src/data/store';

function RootNavigator() {
  const { colors, typography, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useStore((s) => s.hydrated);
  const hasProfile = useStore((s) => s.profile !== null);

  useEffect(() => {
    void useStore.getState().hydrate();
  }, []);

  const onOnboarding = (segments[0] as string | undefined) === 'onboarding';
  useEffect(() => {
    if (hydrated && !hasProfile && !onOnboarding) router.replace('/onboarding');
  }, [hydrated, hasProfile, onOnboarding, router]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontSize: typography.headline.fontSize, fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="drive/start" options={{ presentation: 'modal', title: 'Start drive' }} />
        <Stack.Screen name="drive/manual" options={{ presentation: 'modal', title: 'Add manual drive' }} />
        <Stack.Screen name="drive/active" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="drive/summary/[id]" options={{ title: 'Drive summary', gestureEnabled: false }} />
        <Stack.Screen name="log/[id]" options={{ title: 'Drive details' }} />
        <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/supervisors" options={{ title: 'Supervisors' }} />
        <Stack.Screen name="survey/[kind]" options={{ title: 'Confidence survey' }} />
        <Stack.Screen name="sources" options={{ title: 'Sources & disclaimers' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
