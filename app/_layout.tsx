import React, { useEffect, memo, Suspense } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, TextProps, View, LogBox, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// Only import specific icons instead of entire libraries
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Asset } from 'expo-asset';

import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

// Disable specific LogBox warnings
LogBox.ignoreLogs([
  'Slow network is detected',
  'Fallback font will be used',
  /http:\/\/localhost:8081\/assets\//,
  '[Intervention]',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Since dynamic imports require module changes, we'll use regular imports instead
// for maximum compatibility
import SettingsScreen from './settings';
import EditProfileScreen from './edit-profile';

// Load only the fonts we actually need
const usedFonts = {
  // Add only the specific icon fonts you actually use in your app
  FontAwesome: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
};

// Optimized font caching - only loads fonts we actually use
const cacheFonts = async () => {
  // Create a map of used fonts
  const fontAssets = Platform.OS === 'web' 
    ? Object.values(usedFonts).map(font => Asset.fromModule(font).downloadAsync())
    : [Font.loadAsync({
        ...FontAwesome.font,
        ...Ionicons.font,
        // Only load other font families if they're actually used in your app
      })];
  
  // Wait for all fonts to load
  return Promise.all(fontAssets);
};

// Preload important images to avoid loading delays
const cacheImages = async () => {
  const imagesToCache = [
    require('@/assets/images/muscle-silhouette-front.png'),
    require('@/assets/images/muscle-silhouette-back.png')
  ];
  
  // Pre-warm the image cache by creating native Image instances
  if (Platform.OS !== 'web') {
    // Create prefetch promises for all images
    imagesToCache.forEach(image => {
      // This will trigger the native image loading process
      Image.resolveAssetSource(image);
    });
  }
  
  return Promise.all(
    imagesToCache.map(image => {
      if (typeof image === 'string') {
        return Image.prefetch(image);
      } else {
        return Asset.fromModule(image).downloadAsync();
      }
    })
  );
};

// This is a helper component to fix issues with text inside View components
// It ensures all text is properly wrapped with a Text component
export const TextWrapper = memo((props: TextProps) => {
  return <Text {...props} />;
});

// Simplified console patching logic
if (__DEV__) {
  const ignoredMessages = [
    'text node',
    'is not a valid icon name',
    'Slow network is detected',
    'Fallback font'
  ];
  
  // Fix the type issues with console methods
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0] || '';
    if (typeof message === 'string' && ignoredMessages.some(ignored => message.includes(ignored))) {
      return;
    }
    originalError(...args);
  };
  
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0] || '';
    if (typeof message === 'string' && ignoredMessages.some(ignored => message.includes(ignored))) {
      return;
    }
    originalWarn(...args);
  };
}

// Loading component for lazy loaded screens
const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

const StackNavigator = memo(() => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Suspense fallback={<LoadingScreen />}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
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
      </Suspense>
    </>
  );
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    // Initialize app and load resources
    async function prepare() {
      try {
        // Pre-load and cache fonts and images in parallel
        await Promise.all([
          cacheFonts(),
          cacheImages()
        ]);
        
        // Remove artificial delay in production
        if (__DEV__ && Platform.OS !== 'web') {
          await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms
        }
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <StackNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
