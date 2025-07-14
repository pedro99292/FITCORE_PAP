import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { getUserWorkoutsWithDetails, getUserWorkoutsBasic } from '@/utils/workoutService';

const { width: screenWidth } = Dimensions.get('window');

// Simple in-memory cache for faster subsequent loads
let workoutCache: {
  data: WorkoutType[];
  timestamp: number;
  userId: string;
} | null = null;

// Define workout type based on DB schema
interface WorkoutType {
  workout_id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  exerciseCount?: number;
  duration?: number;
  muscleGroups?: string[];
}

// Workout item component
const WorkoutItem = memo(({ workout, onSelect, index }: { 
  workout: WorkoutType, 
  onSelect: (workout: WorkoutType) => void,
  index: number
}) => {
  const { colors } = useTheme();
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 30).springify()}
      style={styles.workoutItemContainer}
    >
      <TouchableOpacity 
        style={styles.workoutItem} 
        onPress={() => onSelect(workout)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.6)', 'rgba(74, 144, 226, 0.2)']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.workoutGradient}
        >
          <View style={styles.workoutContent}>
            <Text style={styles.workoutName}>{workout.title}</Text>
            
            <View style={styles.workoutDetails}>
              <View style={styles.workoutDetail}>
                <Ionicons name="barbell-outline" size={16} color="#fff" />
                <Text style={styles.workoutDetailText}>
                  {workout.exerciseCount || 0} exercises
                </Text>
              </View>
            </View>
            
            {workout.muscleGroups && workout.muscleGroups.length > 0 && (
              <View style={styles.muscleGroupsContainer}>
                {workout.muscleGroups.map((muscle, index) => (
                  <View key={index} style={styles.muscleTag}>
                    <Text style={styles.muscleTagText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Header component
const Header = memo(({ onBack }: { onBack: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Select Workout</Text>
      <View style={{ width: 24 }} />
    </View>
  );
});

const WorkoutSelectScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache duration: 10 minutes (increased for better performance)
  const CACHE_DURATION = 10 * 60 * 1000;

  // Instant cache check on component mount
  useEffect(() => {
    const checkInstantCache = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && workoutCache && 
            workoutCache.userId === userData.user.id && 
            (Date.now() - workoutCache.timestamp) < CACHE_DURATION) {
          setWorkouts(workoutCache.data);
          setLoading(false);
          setLastFetchTime(workoutCache.timestamp);
        }
      } catch (error) {
        console.log('Quick cache check failed, proceeding with normal load');
      }
    };
    
    checkInstantCache();
  }, []);

  // Memoize the workout loading check for better performance
  const shouldLoadWorkouts = useMemo(() => {
    const now = Date.now();
    return workouts.length === 0 || (now - lastFetchTime) >= CACHE_DURATION;
  }, [workouts.length, lastFetchTime, CACHE_DURATION]);

  // Fetch user's workouts from the database
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Get current user first (fast check)
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          Alert.alert('Not logged in', 'Please log in to view your workouts');
          router.replace('/(tabs)/profile');
          return;
        }

        // Check in-memory cache first (instant)
        if (workoutCache && 
            workoutCache.userId === userData.user.id && 
            (Date.now() - workoutCache.timestamp) < CACHE_DURATION) {
          setWorkouts(workoutCache.data);
          setLoading(false);
          setLastFetchTime(workoutCache.timestamp);
          return;
        }

        // Check if we have local cached data that's still fresh
        if (!shouldLoadWorkouts) {
          setLoading(false);
          return;
        }

        setLoading(true);
        console.time('🏋️ Total workout loading time');
        
        // Step 1: Load basic workout data FAST (no exercise details)
        console.time('📊 Basic workout data');
        const basicWorkouts = await getUserWorkoutsBasic(userData.user.id);
        console.timeEnd('📊 Basic workout data');
        
        console.log(`✅ Loaded ${basicWorkouts.length} basic workouts`);
        setWorkouts(basicWorkouts);
        const now = Date.now();
        setLastFetchTime(now);
        
        // Update in-memory cache
        workoutCache = {
          data: basicWorkouts,
          timestamp: now,
          userId: userData.user.id
        };
        
        setLoading(false); // Show workouts immediately
        
        console.timeEnd('🏋️ Total workout loading time');
        
        // Step 2: Load detailed stats in background (async) - removed delay for faster loading
        if (basicWorkouts.length > 0) {
          setLoadingDetails(true);
          
          // Load details immediately, no artificial delay
          (async () => {
            try {
              console.time('📊 Detailed workout stats');
              const detailedWorkouts = await getUserWorkoutsWithDetails(userData.user.id);
              console.timeEnd('📊 Detailed workout stats');
              
              setWorkouts(detailedWorkouts);
              
              // Update cache with detailed data
              if (workoutCache && workoutCache.userId === userData.user.id) {
                workoutCache.data = detailedWorkouts;
              }
              
              setLoadingDetails(false);
            } catch (detailsError) {
              console.error('Error loading workout details:', detailsError);
              setLoadingDetails(false);
              // Keep basic data if details fail
            }
          })();
        }
        
      } catch (err) {
        console.error('Error fetching workouts:', err);
        Alert.alert('Error', 'An error occurred while fetching your workouts');
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [shouldLoadWorkouts]);

  const handleSelectWorkout = useCallback((workout: WorkoutType) => {
    // Navigate to workout session with the selected workout data
    router.push({
      pathname: "/workout-session",
      params: { workoutId: workout.workout_id }
    });
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Header onBack={handleBack} />
      
      <View style={styles.headerContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Choose a workout to start
        </Text>
        {loadingDetails && (
          <View style={styles.detailsLoadingContainer}>
            <ActivityIndicator size="small" color="#4a90e2" />
            <Text style={[styles.detailsLoadingText, { color: colors.text }]}>
              Loading details...
            </Text>
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading your workouts...
          </Text>
        </View>
      ) : workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You don't have any workouts yet
          </Text>
          <TouchableOpacity 
            style={styles.createWorkoutButton}
            onPress={() => router.push('/workout-builder')}
          >
            <Text style={styles.createWorkoutButtonText}>
              CREATE WORKOUT
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.workout_id.toString()}
          renderItem={({ item, index }) => (
            <WorkoutItem 
              workout={item} 
              onSelect={handleSelectWorkout}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.06,
    paddingTop: screenWidth * 0.04,
    paddingBottom: screenWidth * 0.02,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginHorizontal: screenWidth * 0.06,
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  listContainer: {
    paddingHorizontal: screenWidth * 0.06,
    paddingBottom: 20,
  },
  workoutItemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(0, 0, 0, 0.01)',
        marginBottom: 18,
      },
    }),
  },
  workoutItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  workoutGradient: {
    borderRadius: 16,
    ...Platform.select({
      android: {
        minHeight: 120,
      },
    }),
  },
  workoutContent: {
    padding: 16,
    ...Platform.select({
      android: {
        paddingBottom: 20,
      },
    }),
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  workoutDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    ...Platform.select({
      android: {
        marginBottom: 8,
      },
    }),
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutDetailText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  workoutDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    ...Platform.select({
      android: {
        marginBottom: 4,
      },
    }),
  },
  muscleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    ...Platform.select({
      android: {
        marginBottom: 8,
        paddingVertical: 5,
      },
    }),
  },
  muscleTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    ...Platform.select({
      android: {
        fontSize: 11,
        fontWeight: '600',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.1,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createWorkoutButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createWorkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    paddingHorizontal: screenWidth * 0.06,
    marginTop: 8,
    marginBottom: 16,
  },
  detailsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default memo(WorkoutSelectScreen); 