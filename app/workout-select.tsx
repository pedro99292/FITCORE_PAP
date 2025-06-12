import { StyleSheet, View, Text, TouchableOpacity, FlatList, Dimensions, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, memo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';

const { width: screenWidth } = Dimensions.get('window');

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
const WorkoutItem = memo(({ workout, onSelect }: { 
  workout: WorkoutType, 
  onSelect: (workout: WorkoutType) => void 
}) => {
  const { colors } = useTheme();
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(parseInt(workout.workout_id) * 50).springify()}
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

  // Fetch user's workouts from the database
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          Alert.alert('Not logged in', 'Please log in to view your workouts');
          router.replace('/(tabs)/profile');
          return;
        }
        
        // Fetch all workouts for the current user
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching workouts:', error);
          Alert.alert('Error', 'Failed to load workouts');
          return;
        }
        
        if (!data || data.length === 0) {
          setWorkouts([]);
          setLoading(false);
          return;
        }
        
        // Process the workout data
        const processedWorkouts = await Promise.all(data.map(async (workout) => {
          try {
            // Get the workout sets for each workout along with exercise information
            const { data: workoutSets, error: setsError } = await supabase
              .from('workout_sets')
              .select('exercise_id, exercise_target, exercise_name')
              .eq('workout_id', workout.workout_id);
            
            if (setsError) throw setsError;
            
            // Get unique exercise IDs to count exercises
            const uniqueExerciseIds = new Set(workoutSets?.map(set => set.exercise_id) || []);
            
            // Extract all unique muscle targets
            const muscleTargets = new Set();
            workoutSets?.forEach(set => {
              if (set.exercise_target) {
                muscleTargets.add(set.exercise_target);
              }
            });
            
            return {
              ...workout,
              exerciseCount: uniqueExerciseIds.size,
              muscleGroups: Array.from(muscleTargets) as string[]
            };
          } catch (err) {
            console.error('Error processing workout:', err);
            return {
              ...workout,
              exerciseCount: 0,
              muscleGroups: []
            };
          }
        }));
        
        setWorkouts(processedWorkouts);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        Alert.alert('Error', 'An error occurred while fetching your workouts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, []);

  const handleSelectWorkout = (workout: WorkoutType) => {
    // Navigate to workout session with the selected workout data
    router.push({
      pathname: "/workout-session",
      params: { workoutId: workout.workout_id }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Header onBack={handleBack} />
      
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Choose a workout to start
      </Text>
      
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
          renderItem={({ item }) => (
            <WorkoutItem 
              workout={item} 
              onSelect={handleSelectWorkout}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  workoutItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  workoutGradient: {
    borderRadius: 16,
  },
  workoutContent: {
    padding: 16,
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
  },
  muscleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  muscleTagText: {
    color: '#fff',
    fontSize: 12,
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
});

export default memo(WorkoutSelectScreen); 