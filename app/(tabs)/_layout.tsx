import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import HeaderStats from '@/components/HeaderStats';

const { width: screenWidth } = Dimensions.get('window');

// Calculate responsive icon size with minimum and maximum constraints
const getIconSize = () => {
  const calculatedSize = screenWidth * 0.11; // Increased from 9% to 12% of screen width
  return Math.max(38, Math.min(calculatedSize, 46)); // Increased min from 32 to 38, max from 42 to 48
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const iconSize = getIconSize();

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