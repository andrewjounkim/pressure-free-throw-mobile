import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Palette } from '@/constants/palette';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Palette.navy },
          headerTintColor: Palette.cream,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: Palette.navy },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="how-to-play" options={{ title: 'How to Play' }} />
        <Stack.Screen
          name="game"
          options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="results"
          options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
        />
      </Stack>
    </>
  );
}
