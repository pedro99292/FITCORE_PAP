import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, TextProps, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';

// This is a helper component to fix issues with text inside View components
// It ensures all text is properly wrapped with a Text component
export function TextWrapper(props: TextProps) {
  return <Text {...props} />;
}

// Monkey patch the console.error to suppress specific text node warnings in development
if (__DEV__ && Platform.OS !== 'web') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args[0] || '';
    if (typeof errorMessage === 'string' && 
        (errorMessage.includes('text node') || 
         errorMessage.includes('is not a valid icon name'))) {
      // Skip these specific error messages
      return;
    }
    originalConsoleError(...args);
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Configure the global status bar
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors[colorScheme ?? 'light'].background,
            },
            headerTintColor: Colors[colorScheme ?? 'light'].text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShown: false,
          }}>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerShown: true }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
