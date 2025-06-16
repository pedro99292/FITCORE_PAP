import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ChatLayout() {
  const { isDarkMode } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#2b2b45' : '#f5f5f5'
        },
        headerShadowVisible: false,
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerTitleStyle: {
          fontWeight: '600',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Messages',
        }}
      />
      <Stack.Screen
        name="new-message"
        options={{
          headerShown: true,
          title: 'New Message',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="conversation/[id]"
        options={{
          headerShown: true,
          title: 'Chat',
        }}
      />
    </Stack>
  );
} 