import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolate } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { Asset } from 'expo-asset';
import { router } from 'expo-router';
import { useWorkoutStats } from '@/contexts/WorkoutContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Pre-loaded images for faster loading
const FRONT_SILHOUETTE = require('../../assets/images/muscle-silhouette-front.png');
const BACK_SILHOUETTE = require('../../assets/images/muscle-silhouette-back.png');

// Removed local useWorkoutStats hook - now using context

// Memoized StatItem component to prevent unnecessary re-renders
const StatItem = memo(({ icon, value, label, isLoading, isRefreshing }: { 
  icon: React.ReactNode, 
  value: number, 
  label: string, 
  isLoading: boolean,
  isRefreshing: boolean
}) => {
  // Animated value for counting animation
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  // Animate the value when it changes or when loading completes
  useEffect(() => {
    if (!isLoading && !isRefreshing) {
      animatedValue.value = 0;
      animatedValue.value = withTiming(value, {
        duration: 1000,
        easing: Easing.out(Easing.cubic)
      });
    }
  }, [value, isLoading, isRefreshing]);

  // Update the display value during animation
  useEffect(() => {
    const id = setInterval(() => {
      // Formula to make the animation gradually slow down
      const current = Math.round(animatedValue.value);
      setDisplayValue(current);
    }, 16); // ~60fps

    return () => clearInterval(id);
  }, []);

  // Format the display value (add K suffix for values over 1000)
  const formatValue = (val: number): string => {
    if (val >= 1000) {
      if (val < 10000) {
        // Format with one decimal place (like 1.2K)
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        // Format without decimal places (like 10K)
        return Math.floor(val / 1000) + 'K';
      }
    }
    return val.toString();
  };

  return (
    <View style={styles.statItem}>
      {icon}
      <Text style={styles.statValue}>
        {isLoading || isRefreshing ? '-' : formatValue(displayValue)}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

// Memoized StatsContainer component
const StatsContainer = memo(({ statsOpacity }: { statsOpacity: Animated.SharedValue<number> }) => {
  const { stats, isRefreshing } = useWorkoutStats();
  
  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: statsOpacity.value,
      transform: [
        { translateY: interpolate(statsOpacity.value, [0, 1], [-20, 0]) }
      ]
    };
  });

  return (
    <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
      <LinearGradient
        colors={['rgba(74, 144, 226, 0.6)', 'rgba(74, 144, 226, 0.2)']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.statsGradient}
      >
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Estatísticas</Text>
        </View>
        <View style={styles.statsBox}>
          <StatItem 
            icon={<FontAwesome5 name="dumbbell" size={20} color="#fff" />}
            value={stats.totalWorkouts}
            label="Treinos"
            isLoading={stats.isLoading}
            isRefreshing={isRefreshing}
          />
          
          <View style={styles.statDivider} />
          
          <StatItem 
            icon={<FontAwesome5 name="weight" size={20} color="#fff" />}
            value={stats.totalVolume}
            label="Kgs Volume"
            isLoading={stats.isLoading}
            isRefreshing={isRefreshing}
          />
          
          <View style={styles.statDivider} />
          
          <StatItem 
            icon={<Ionicons name="time-outline" size={20} color="#fff" />}
            value={stats.totalMinutes}
            label="Minutos"
            isLoading={stats.isLoading}
            isRefreshing={isRefreshing}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// Create a platform-optimized image component
const OptimizedImage = ({ 
  source, 
  style, 
  ...props 
}: { 
  source: any; 
  style?: any; 
  [key: string]: any 
}) => {
  // Use standard Image on web to avoid fetchPriority warning
  if (Platform.OS === 'web') {
    return <Image source={source} style={style} {...props} />;
  }
  
  // Use ExpoImage on native platforms for better performance
  return <ExpoImage source={source} style={style} {...props} />;
};

// Main component with performance optimizations
const HomeScreen = () => {
  // Use theme from context
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const rotation = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const silhouetteScale = useSharedValue(0.95);
  
  // Add state for button cooldown and loading overlay
  const [isFlipCooldown, setIsFlipCooldown] = useState(false);

  // Preload silhouette images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        await Asset.loadAsync([FRONT_SILHOUETTE, BACK_SILHOUETTE]);
        console.log('Silhouette images preloaded successfully');
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };
    
    preloadImages();
  }, []);
  
  // Animate elements on component mount - deferred for better startup performance
  useEffect(() => {
    const timer = setTimeout(() => {
      statsOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      silhouetteScale.value = withTiming(1, { duration: 1000, easing: Easing.elastic(1.2) });
    }, 100); // Short delay to prioritize UI rendering

    return () => clearTimeout(timer);
  }, []);

  // Function to toggle between front and back views with animation
  const toggleSilhouetteView = () => {
    // Prevent rotation if cooldown is active
    if (isFlipCooldown) return;
    
    // Set cooldown
    setIsFlipCooldown(true);
    
    // Animate rotation - no need to swap images
    rotation.value = withTiming(rotation.value + 180, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    
    // Reset cooldown after 2 seconds
    setTimeout(() => {
      setIsFlipCooldown(false);
    }, 1000);
  };

  // Function to handle starting a workout
  const handleStartWorkout = () => {
    router.push('/workout-select');
  };

  // Memoized animated styles for front silhouette
  const rotateStyle = useAnimatedStyle(() => {
    // Calculate opacity manually to avoid interpolate issues
    const currentAngle = rotation.value % 360;
    const opacity = (currentAngle > 90 && currentAngle < 270) ? 0 : 1;
    
    return {
      transform: [{ rotateY: `${rotation.value}deg` }],
      opacity
    };
  });

  const silhouetteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: silhouetteScale.value }]
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Stats Box */}
      <StatsContainer statsOpacity={statsOpacity} />
      
      {/* Silhouette Image - True 3D flip with both images preloaded */}
      <Animated.View style={[styles.silhouetteContainer, silhouetteAnimatedStyle]}>
        {/* Container for front view */}
        <Animated.View style={[rotateStyle, styles.silhouetteWrapper]}>
          <OptimizedImage
            source={FRONT_SILHOUETTE}
            contentFit="contain"
            style={styles.silhouette}
          />
        </Animated.View>
        
        {/* Container for back view - separate animated container rotated 180 degrees from front */}
        <Animated.View
          style={[
            styles.silhouetteWrapper,
            useAnimatedStyle(() => {
              // Calculate opacity manually to avoid interpolate issues
              const currentAngle = rotation.value % 360;
              const opacity = (currentAngle > 90 && currentAngle < 270) ? 1 : 0;
              
              return {
                position: 'absolute',
                transform: [{ rotateY: `${rotation.value + 180}deg` }],
                opacity
              };
            })
          ]}
        >
          <OptimizedImage
            source={BACK_SILHOUETTE}
            contentFit="contain"
            style={styles.silhouette}
          />
        </Animated.View>
      </Animated.View>
      
      {/* Bottom Button - Only main button now */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.mainButton} onPress={handleStartWorkout}>
          <LinearGradient
            colors={['#4a90e2', '#3570b2']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.mainButtonGradient}
          >
            <Text style={styles.mainButtonText}>INICIAR TREINO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Rotate Button - Now positioned at bottom right of screen */}
      <TouchableOpacity 
        style={[
          styles.rotateButton,
          isFlipCooldown && styles.disabledRotateButton
        ]}
        onPress={toggleSilhouetteView}
        disabled={isFlipCooldown}
      >
        <LinearGradient
          colors={isFlipCooldown 
            ? ['rgba(150, 150, 150, 0.9)', 'rgba(120, 120, 120, 0.9)'] 
            : ['rgba(74, 144, 226, 0.9)', 'rgba(53, 112, 178, 0.9)']}
          style={styles.rotateButtonGradient}
        >
          <MaterialCommunityIcons name="rotate-3d-variant" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.06,
    paddingTop: screenWidth * 0.04,
    paddingBottom: screenWidth * 0.02,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    padding: 6,
  },
  statsContainer: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: screenWidth * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statsGradient: {
    borderRadius: 16,
  },
  statsHeader: {
    alignItems: 'center',
    paddingTop: screenWidth * 0.04,
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: 0,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: screenWidth * 0.02,
    paddingBottom: screenWidth * 0.05,
    paddingHorizontal: screenWidth * 0.04,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  silhouetteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 35,
    marginBottom: 20,
  },
  silhouetteWrapper: {
    width: screenWidth * 0.76,
    height: screenHeight * 0.49,
    justifyContent: 'center',
    alignItems: 'center',
    // Enable 3D transformations
    perspective: '1000px',
  },
  silhouette: {
    width: screenWidth * 0.76,
    height: screenHeight * 0.49,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  rotateButton: {
    position: 'absolute',
    bottom: screenWidth * 0.06,
    right: screenWidth * 0.06,
    zIndex: 10,
  },
  disabledRotateButton: {
    opacity: 0.5,
  },
  rotateButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.06,
    paddingBottom: screenWidth * 0.05,
  },
  mainButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Export as a memoized component to prevent unnecessary re-renders
export default memo(HomeScreen); 