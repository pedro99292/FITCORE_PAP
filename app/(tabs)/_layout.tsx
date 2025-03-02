import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { ActivityIndicator, View, Platform, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

import { Colors } from '@/constants/Colors';
import HeaderStats from '@/components/HeaderStats';

// Helper function to calculate icon size based on screen width
function getIconSize() {
  const { width } = Dimensions.get('window');
  return Math.max(36, width * 0.1);
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const colorScheme = useColorScheme();
  const iconSize = getIconSize();

  useEffect(() => {
    // If not loading and no session, redirect to login
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  // While checking authentication state, show a loading indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4757" />
      </View>
    );
  }

  // If user is not authenticated, don't render tabs
  if (!session) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#888',
        header: () => <HeaderStats />,
        tabBarStyle: {
          backgroundColor: '#2D2B3F',
          borderTopWidth: 1,
          borderTopColor: 'white',
          height: 75,
          paddingBottom: 12,
          paddingTop: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 13,
          marginTop: 3,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Conquistas',
          tabBarIcon: ({ color }) => <FontAwesome name="trophy" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}