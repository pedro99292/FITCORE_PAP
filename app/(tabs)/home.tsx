import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolate, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import { router } from 'expo-router';
import { useWorkoutStats } from '@/contexts/WorkoutContext';
import { useAuth } from '@/contexts/AuthContext';
import InteractiveMuscleSilhouette, { MuscleState } from '../../components/InteractiveMuscleSilhouette';
import { generateMuscleStatesWithWeeklyActivity } from '@/utils/muscleColorService';
import { supabase } from '@/utils/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Pre-loaded images for faster loading - no longer needed since we're using SVG for back view

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
          <Text style={styles.statsTitle}>Statistics</Text>
        </View>
        <View style={styles.statsBox}>
          <StatItem 
            icon={<FontAwesome5 name="dumbbell" size={20} color="#fff" />}
            value={stats.totalWorkouts}
            label="Workouts"
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
            label="Minutes"
            isLoading={stats.isLoading}
            isRefreshing={isRefreshing}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// Removed OptimizedImage component since we're now using SVG for both front and back views

// Main component with performance optimizations
const HomeScreen = () => {
  // Use theme from context
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { refreshStats } = useWorkoutStats();
  
  // Animation values
  const rotation = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const silhouetteScale = useSharedValue(0.95);
  
  // Add state for button cooldown and loading overlay
  const [isFlipCooldown, setIsFlipCooldown] = useState(false);
  
  // State for muscle states
  const [muscleStates, setMuscleStates] = useState<Record<string, MuscleState>>({});
  const [muscleStatesLoading, setMuscleStatesLoading] = useState(true);
  const [isUpdatingMuscles, setIsUpdatingMuscles] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [lastSessionCount, setLastSessionCount] = useState<number | null>(null);
  
  // Animation value for muscle update effects
  const muscleUpdateScale = useSharedValue(1);

  // Function to load muscle states with optional animation
  const loadMuscleStates = useCallback(async (animate = false) => {
    if (!user?.id) return;
    
    try {
      setMuscleStatesLoading(true);
      
      // Show updating indicator for animations
      if (animate) {
        setIsUpdatingMuscles(true);
        
        // Add subtle animation when updating after workout completion
        muscleUpdateScale.value = withSpring(0.95, {
          damping: 15,
          stiffness: 400,
        });
      }
      
      const states = await generateMuscleStatesWithWeeklyActivity(user.id);
      setMuscleStates(states);
      
      // Mark as initially loaded and store session count for workout completion detection
      if (!hasLoadedInitially) {
        setHasLoadedInitially(true);
        
        // Store initial session count to detect new workouts
        if (user?.id && lastSessionCount === null) {
          try {
            const { data: sessionData } = await supabase
              .from('sessions')
              .select('session_id', { count: 'exact' })
              .eq('user_id', user.id)
              .eq('status', 'completed');
            
            setLastSessionCount(sessionData?.length || 0);
          } catch (error) {
            console.log('Error fetching initial session count:', error);
          }
        }
      }
      
      // Animate back to normal size with a slight bounce
      if (animate) {
        setTimeout(() => {
          muscleUpdateScale.value = withSpring(1, {
            damping: 12,
            stiffness: 300,
          });
          
          // Hide updating indicator after animation completes
          setTimeout(() => {
            setIsUpdatingMuscles(false);
          }, 400);
        }, 300);
      }
    } catch (error) {
      console.error('Error loading muscle states:', error);
      // Set default states if error occurs
      setMuscleStates({});
    } finally {
      setMuscleStatesLoading(false);
    }
  }, [user?.id, muscleUpdateScale]);

  // Load muscle states with weekly activity on mount
  useEffect(() => {
    loadMuscleStates(false);
  }, [loadMuscleStates]);

  // Auto-refresh muscle states and stats when screen comes into focus (ONLY after completing a workout)
  useFocusEffect(
    useCallback(() => {
      const checkForNewWorkouts = async () => {
        // Only check if we have loaded initially and have a baseline session count
        if (!user?.id || !hasLoadedInitially || lastSessionCount === null) {
          return;
        }

        try {
          // Check current session count
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('session_id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'completed');
          
          const currentSessionCount = sessionData?.length || 0;
          
          // Only refresh if there are new completed sessions
          if (currentSessionCount > lastSessionCount) {
            console.log(`🎯 New workout detected! Sessions: ${lastSessionCount} → ${currentSessionCount}`);
            console.log('🔄 Refreshing muscle silhouette with animation...');
            
            // Update the session count first
            setLastSessionCount(currentSessionCount);
            
            // Add a small delay to ensure database updates have finished
            setTimeout(async () => {
              // Refresh both muscle states and workout stats with animation
              await Promise.all([
                loadMuscleStates(true), // Pass true to enable animation
                refreshStats()
              ]);
            }, 500);
          }
        } catch (error) {
          console.log('Error checking for new workouts:', error);
        }
      };
      
      checkForNewWorkouts();
    }, [user?.id, hasLoadedInitially, lastSessionCount, loadMuscleStates, refreshStats])
  );

  // No longer need to preload images since we're using SVG for both front and back views
  
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
    transform: [
      { scale: silhouetteScale.value },
      { scale: muscleUpdateScale.value } // Add muscle update animation
    ]
  }));

  const handleMusclePress = (muscleId: string) => {
    const muscle = muscleStates[muscleId];
    if (muscle) {
      const frequency = Math.round(muscle.intensity * 3); // Convert back to frequency
      let message = `${muscle.name}: `;
      
      if (frequency === 0) {
        message += 'Not trained this week';
      } else if (frequency === 1) {
        message += 'Trained 1 day this week';
      } else {
        message += `Trained ${frequency} days this week`;
      }
      
      Alert.alert('Muscle Activity', message);
    }
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Stats Box */}
      <StatsContainer statsOpacity={statsOpacity} />
      
      {/* Silhouette Components - True 3D flip with both front and back SVG views */}
      <Animated.View style={[styles.silhouetteContainer, silhouetteAnimatedStyle]}>
        {/* Container for front view */}
        <Animated.View style={[rotateStyle, styles.silhouetteWrapper]}>
          <InteractiveMuscleSilhouette
            view="front"
            interactive={true}
            showIntensityColors={true}
            muscleStates={muscleStates}
            onMusclePress={handleMusclePress}
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
          <InteractiveMuscleSilhouette
            view="back"
            interactive={true}
            showIntensityColors={true}
            muscleStates={muscleStates}
            onMusclePress={handleMusclePress}
          />
        </Animated.View>
      </Animated.View>
      
      {/* Loading indicator for muscle states */}
      {muscleStatesLoading && (
        <View style={styles.loadingOverlay}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color="rgba(255, 255, 255, 0.8)" />
        </View>
      )}
      
      {/* Updating indicator for muscle state refresh */}
      {isUpdatingMuscles && (
        <View style={styles.updatingOverlay}>
          <LinearGradient
            colors={['rgba(74, 144, 226, 0.9)', 'rgba(53, 112, 178, 0.9)']}
            style={styles.updatingContent}
          >
            <MaterialCommunityIcons name="arm-flex" size={20} color="#fff" />
          </LinearGradient>
        </View>
      )}
      
      
      
      {/* Bottom Button - Only main button now */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.mainButton} onPress={handleStartWorkout}>
          <LinearGradient
            colors={['#4a90e2', '#3570b2']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.mainButtonGradient}
          >
            <Text style={styles.mainButtonText}>START WORKOUT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Rotate Button */}
      <View style={styles.floatingButtonsContainer}>
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
      </View>
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
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: screenWidth * 0.06,
    right: screenWidth * 0.06,
    flexDirection: 'column',
    gap: 12,
    zIndex: 10,
  },

  rotateButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    zIndex: 10,
  },
  updatingOverlay: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -15 }],
    zIndex: 15,
  },
  updatingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
  },
  legendContainer: {
    position: 'absolute',
    top: screenWidth * 0.25,
    left: screenWidth * 0.06,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    zIndex: 5,
  },
  legendTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
  },
});

// Export as a memoized component to prevent unnecessary re-renders
export default memo(HomeScreen); 