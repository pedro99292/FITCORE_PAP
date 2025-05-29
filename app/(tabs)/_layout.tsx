import React, { useEffect, memo, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { ActivityIndicator, View, Platform, Dimensions, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

import { Colors } from '@/constants/Colors';
import HeaderStats from '@/components/HeaderStats';

// Memoized TabIcon component to prevent unnecessary re-renders
const TabIcon = memo(({ name, color, size }: { name: string, color: string, size: number }) => (
  <FontAwesome name={name as any} size={size} color={color} />
));

// Helper function to calculate icon size based on screen width
const getIconSize = () => {
  const { width } = Dimensions.get('window');
  // Increased icon size for better visibility while ensuring they fit properly
  return Math.min(32, Math.max(26, width * 0.08));
};

// Precomputed icon size to avoid recalculation
const ICON_SIZE = getIconSize();

// Loading spinner component
const LoadingIndicator = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#FF4757" />
  </View>
);

const TabLayout = () => {
  const { session, loading } = useAuth();
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    // If not loading and no session, redirect to login
    if (!loading && !session) {
      // Use setTimeout to defer navigation until after initial render
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [session, loading]);

  // Memoize tab styles to prevent recalculation on each render
  const tabBarStyle = useMemo(() => ({
    backgroundColor: isDarkMode ? '#2D2B3F' : '#ffffff',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    height: Platform.OS === 'ios' ? 90 : 75,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    paddingTop: 10,
  }), [isDarkMode]);

  const tabBarItemStyle = useMemo((): ViewStyle => ({
    paddingVertical: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  }), []);

  // While checking authentication state, show a loading indicator
  if (loading) {
    return <LoadingIndicator />;
  }

  // If user is not authenticated, don't render tabs
  if (!session) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#888',
        header: () => <HeaderStats />,
        tabBarStyle,
        tabBarItemStyle,
        tabBarShowLabel: false, // Hide all labels
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Conquistas',
          tabBarIcon: ({ color }) => <TabIcon name="trophy" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <TabIcon name="users" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon name="user" size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default memo(TabLayout);