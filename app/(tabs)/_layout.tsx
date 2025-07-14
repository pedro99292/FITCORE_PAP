import React, { useEffect, memo, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { router, useSegments } from 'expo-router';
import { ActivityIndicator, View, Platform, Dimensions, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

import { Colors } from '@/constants/Colors';
import HeaderStats from '@/components/HeaderStats';
import InteractiveTabButton from '@/components/InteractiveTabButton';

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
  const segments = useSegments();
  
  // Get current route to determine which tab is active
  const currentRoute = segments[segments.length - 1] || 'home';

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
    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    height: Platform.OS === 'ios' ? 120 : 105, // Further increased height for better spacing
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // Increased padding for better spacing
    paddingTop: 15,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 10,
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
        tabBarShowLabel: false, // Hide default labels since we have custom ones
        tabBarHideOnKeyboard: true, // Hide tab bar when keyboard is visible
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarButton: (props) => {
            const isActive = currentRoute === 'home';
            return (
              <InteractiveTabButton
                {...props}
                iconName="home"
                label="Home"
                color={isActive ? colors.primary : '#888'}
                size={ICON_SIZE}
                isFocused={isActive}
                onPress={props.onPress}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarButton: (props) => {
            const isActive = currentRoute === 'achievements';
            return (
              <InteractiveTabButton
                {...props}
                iconName="trophy"
                label="Achievements"
                color={isActive ? colors.primary : '#888'}
                size={ICON_SIZE}
                isFocused={isActive}
                onPress={props.onPress}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarButton: (props) => {
            const isActive = currentRoute === 'social';
            return (
              <InteractiveTabButton
                {...props}
                iconName="users"
                label="Social"
                color={isActive ? colors.primary : '#888'}
                size={ICON_SIZE}
                isFocused={isActive}
                onPress={props.onPress}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarButton: (props) => {
            const isActive = currentRoute === 'profile';
            return (
              <InteractiveTabButton
                {...props}
                iconName="user"
                label="Profile"
                color={isActive ? colors.primary : '#888'}
                size={ICON_SIZE}
                isFocused={isActive}
                onPress={props.onPress}
              />
            );
          },
        }}
      />
    </Tabs>
  );
};

export default memo(TabLayout);