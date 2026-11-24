import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Palette } from '@/constants/palette';

export default function RootLayout() {
  return (
    // Required for react-native-gesture-handler (used for the game's two-thumb controls).
    <GestureHandlerRootView style={styles.root}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.navy,
  },
});
