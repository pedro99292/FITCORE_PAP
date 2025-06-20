import React, { useEffect, memo, Suspense } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, TextProps, View, LogBox, ActivityIndicator, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// Only import specific icons instead of entire libraries
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Asset } from 'expo-asset';

import { Colors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionModal from '../components/SubscriptionModal';
import SurveyModal from '../components/SurveyModal';
import WorkoutGenerationModal from '../components/WorkoutGenerationModal';
import { initializeAppResources } from '../utils/appInit';

// Disable specific LogBox warnings
LogBox.ignoreLogs([
  'Slow network is detected',
  'Fallback font will be used',
  /http:\/\/localhost:8081\/assets\//,
  '[Intervention]',
  'Unknown event handler property',
  'entry.bundleIsolationFor.routerRoot=app:4987',
  /Unknown event handler property `entry\.bundleIsolationFor\.routerRoot=app:\d+`/,
  /onStart.*onResponder.*onGrant.*onMove.*onEnd.*onTerminate.*onTerminationRequest/,
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
    'Fallback font',
    'Unknown event handler property',
    'entry.bundleIsolationFor.routerRoot',
    'onStartShouldSetResponder',
    'onMoveShouldSetResponder',
    'onResponderGrant',
    'onResponderMove',
    'onResponderEnd',
    'onResponderTerminate',
    'onResponderTerminationRequest',
    'findNodeHandle',
    'findNodeHandle is not supported on web',
    'Layout children must be of type Screen',
    'Property [opacity] may be overwritten by a layout animation',
    'Added non-passive event listener',
    'silhouette images preloaded successfully',
    'entry.bundlePlatform',
    'entry.bundleIsolationFor',
    '400 (Bad Request)',
    'Reanimated'
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

const SubscriptionWrapper = () => {
  const { user } = useAuth();
  const { 
    showSubscriptionModal, 
    showSurveyModal, 
    showWorkoutGenerationModal,
    setShowSubscriptionModal, 
    setShowSurveyModal, 
    setShowWorkoutGenerationModal,
    subscribe 
  } = useSubscription();

  // Only show subscription modals if user is authenticated
  if (!user) return null;

  const handleSubscribe = async (type: 'monthly' | 'annual' | 'lifetime') => {
    const success = await subscribe(type);
    
    // If subscription was successful but survey modal didn't show (user already completed it)
    if (success && !showSurveyModal) {
      // Give a brief moment for the survey modal check to complete
      setTimeout(async () => {
        // Import and check if survey was completed
        const { subscriptionService } = await import('@/utils/subscriptionService');
        const hasCompletedSurvey = await subscriptionService.hasUserCompletedSurvey(user.id);
        
        if (hasCompletedSurvey) {
          // Show success message since user already has complete profile
          Alert.alert(
            'Welcome to Premium! 🎉',
            'You\'re all set! You can now access all premium features including personalized workout generation.',
            [
              { text: 'Continue', onPress: () => {} }
            ]
          );
        }
      }, 500);
    }
  };

  return (
    <>
      {showSubscriptionModal && (
        <SubscriptionModal
          isVisible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribe={handleSubscribe}
          onStartTrial={async () => {
            // Add trial functionality if needed
            setShowSubscriptionModal(false);
          }}
        />
      )}
      {showSurveyModal && (
        <SurveyModal
          isVisible={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          onSubmit={async (data) => {
            // Handle survey submission
            setShowSurveyModal(false);
            
            // After survey completion, check if user needs workout generation
            if (user) {
              try {
                const { subscriptionService } = await import('@/utils/subscriptionService');
                const hasAutoWorkouts = await subscriptionService.hasAutoGeneratedWorkouts(user.id);
                
                if (!hasAutoWorkouts) {
                  // Show workout generation modal if no auto-generated workouts exist
                  setShowWorkoutGenerationModal(true);
                }
              } catch (error) {
                console.error('Error checking for auto-generated workouts after survey:', error);
              }
            }
          }}
        />
      )}
      {showWorkoutGenerationModal && (
        <WorkoutGenerationModal
          isVisible={showWorkoutGenerationModal}
          onClose={() => setShowWorkoutGenerationModal(false)}
          onWorkoutGenerated={() => {
            // Handle successful workout generation
            console.log('Workout generated successfully');
          }}
        />
      )}
    </>
  );
};

const MainLayout = () => {
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <StatusBar 
        style={isDarkMode ? 'light' : 'dark'} 
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
      />
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
        {/* Show auth screens when not logged in */}
        {!user ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: true }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerShown: true }} />
          </>
        )}
      </Stack>
      {/* Only render subscription components when user is logged in */}
      {user && <SubscriptionWrapper />}
    </>
  );
};

const RootLayout = () => {
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
        
        // Initialize app resources (including exercise pre-caching)
        // This is done after other resources to not delay initial loading
        try {
          await initializeAppResources();
        } catch (error) {
          console.warn('App resource initialization failed:', error);
          // App can still function without these resources
        }
        
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
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ExerciseProvider>
            <SubscriptionProvider>
              <MainLayout />
            </SubscriptionProvider>
          </ExerciseProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
