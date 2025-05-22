import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Interface for workout data
interface Workout {
  workout_id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

// Interface for workout set data
interface WorkoutSet {
  workout_set_id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  planned_reps: number;
  weight: number | null;
  rest_time: number | null;
  notes: string | null;
  set_order: number;
}

// Helper function to safely use haptics
const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    try {
      Haptics.impactAsync(style);
    } catch (error) {
      console.log('Haptics not available', error);
    }
  }
};

export default function WorkoutPreviewScreen() {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Extended theme with additional colors
  const extendedColors = {
    ...colors,
    cardBackground: isDarkMode ? 'rgba(30, 30, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    textLight: colors.textSecondary,
    textMuted: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    danger: '#ef4444',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    cardShadow: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
  };

  // Primary gradient colors from theme
  const primaryColor = colors.primary;
  const secondaryColor = '#4A90E2';

  // Group workout sets by exercise name
  const groupedExercises = React.useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    
    workoutSets.forEach(set => {
      if (!groups[set.exercise_name]) {
        groups[set.exercise_name] = [];
      }
      groups[set.exercise_name].push(set);
    });
    
    return Object.entries(groups).map(([name, sets], index) => ({
      exercise_name: name,
      exercise_id: sets[0].exercise_id,
      sets: sets.length,
      planned_reps: sets[0].planned_reps,
      weight: sets[0].weight,
      rest_time: sets[0].rest_time,
      notes: sets[0].notes,
      index: index,
      allSets: sets.sort((a, b) => a.set_order - b.set_order)
    }));
  }, [workoutSets]);
  
  // Count unique exercises by exercise_id
  const uniqueExerciseCount = React.useMemo(() => {
    const uniqueIds = new Set(workoutSets.map(set => set.exercise_id));
    return uniqueIds.size;
  }, [workoutSets]);

  // Fetch workout details and sets
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          Alert.alert('Not logged in', 'Please log in to view your workouts');
          router.push('/(tabs)/profile');
          return;
        }
        
        // Fetch the specific workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('workout_id', id)
          .eq('user_id', userData.user.id)
          .single();
        
        if (workoutError || !workoutData) {
          console.error('Error fetching workout:', workoutError);
          Alert.alert('Error', 'Failed to load workout details');
          router.back();
          return;
        }
        
        setWorkout(workoutData);
        
        // Fetch the workout sets
        const { data: setsData, error: setsError } = await supabase
          .from('workout_sets')
          .select('*')
          .eq('workout_id', id)
          .order('set_order', { ascending: true });
        
        if (setsError) {
          console.error('Error fetching workout sets:', setsError);
          Alert.alert('Error', 'Failed to load workout exercises');
          return;
        }
        
        setWorkoutSets(setsData || []);
        
        // Animate content in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true
          })
        ]).start();
        
      } catch (error) {
        console.error('Error in fetchWorkoutDetails:', error);
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkoutDetails();
    } else {
      Alert.alert('Error', 'No workout ID provided');
      router.back();
    }
  }, [id, fadeAnim, slideAnim]);

  const handleStartWorkout = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/start-workout/${id}`);
  };

  const handleEditWorkout = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/workout-builder',
      params: { workoutId: id }
    });
  };

  const formatRestTime = (seconds: number | null) => {
    if (!seconds) return 'No rest';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m `;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  const renderMuscleIcon = (exerciseName: string) => {
    // Simple logic to determine muscle group based on exercise name
    // Could be expanded with a more comprehensive library of exercises
    const lowerName = exerciseName.toLowerCase();
    
    if (lowerName.includes('bench') || lowerName.includes('chest') || lowerName.includes('pec')) {
      return <FontAwesome5 name="dumbbell" size={16} color={primaryColor} />;
    } else if (lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('quad')) {
      return <FontAwesome5 name="running" size={16} color={primaryColor} />;
    } else if (lowerName.includes('shoulder') || lowerName.includes('press') || lowerName.includes('delt')) {
      return <FontAwesome5 name="child" size={16} color={primaryColor} />;
    } else if (lowerName.includes('bicep') || lowerName.includes('curl')) {
      return <FontAwesome5 name="hand-rock" size={16} color={primaryColor} />;
    } else if (lowerName.includes('tricep')) {
      return <FontAwesome5 name="hand-paper" size={16} color={primaryColor} />;
    } else if (lowerName.includes('back') || lowerName.includes('row') || lowerName.includes('pull')) {
      return <FontAwesome5 name="accessible-icon" size={16} color={primaryColor} />;
    } else if (lowerName.includes('ab') || lowerName.includes('core') || lowerName.includes('crunch')) {
      return <FontAwesome5 name="heartbeat" size={16} color={primaryColor} />;
    } else {
      return <MaterialCommunityIcons name="dumbbell" size={16} color={primaryColor} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: extendedColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      {/* Animated header removed */}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: extendedColors.text }]}>
            Loading workout details...
          </Text>
        </View>
      ) : (
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Workout Header */}
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.headerGradient}
          >
            <View style={styles.headerIllustration}>
              <MaterialCommunityIcons name="dumbbell" size={48} color="rgba(255,255,255,0.2)" />
            </View>
            
            <View style={styles.headerContent}>
              <Animated.Text 
                style={[
                  styles.workoutTitle,
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                {workout?.title}
              </Animated.Text>
              
              {workout?.description && (
                <Animated.Text 
                  style={[
                    styles.workoutDescription,
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  {workout.description}
                </Animated.Text>
              )}
              
              <View style={styles.statsContainer}>
                <Animated.View 
                  style={[
                    styles.stat, 
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }]
                    }
                  ]} 
                  key="exercise-count"
                >
                  <MaterialCommunityIcons name="dumbbell" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>{uniqueExerciseCount} Exercises</Text>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    styles.stat, 
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }]
                    }
                  ]}
                  key="set-count"
                >
                  <MaterialCommunityIcons name="repeat" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>{workoutSets.length} Sets</Text>
                </Animated.View>
              </View>
            </View>
          </LinearGradient>
          
          {/* Exercises List */}
          <View style={styles.exercisesContainer}>
            <Text style={[styles.sectionTitle, { color: extendedColors.text }]}>
              Exercises
            </Text>
            
            {groupedExercises.length === 0 ? (
              <Animated.View 
                style={[
                  styles.emptyContainer, 
                  { 
                    backgroundColor: extendedColors.cardBackground,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name="dumbbell" 
                  size={48} 
                  color={extendedColors.textMuted} 
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyText, { color: extendedColors.textMuted }]}>
                  No exercises in this workout
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: primaryColor }]}
                  onPress={handleEditWorkout}
                >
                  <Text style={styles.emptyButtonText}>Add Exercises</Text>
                  <Ionicons name="add-circle" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              groupedExercises.map((exercise, index) => (
                <Animated.View 
                  key={exercise.exercise_name} 
                  style={[
                    styles.exerciseCard, 
                    { 
                      backgroundColor: extendedColors.cardBackground,
                      borderColor: extendedColors.cardBorder,
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: Animated.multiply(
                          slideAnim, 
                          new Animated.Value(1 + (index * 0.2))
                        ) 
                      }]
                    }
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <View style={[styles.exerciseNumberBadge, { backgroundColor: `${primaryColor}30` }]}>
                      <Text style={[styles.exerciseNumber, { color: primaryColor }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.exerciseNameContainer}>
                      <Text style={[styles.exerciseName, { color: extendedColors.text }]}>
                        {exercise.exercise_name}
                      </Text>
                      {exercise.notes && (
                        <Text style={[styles.exerciseNotes, { color: extendedColors.textMuted }]}>
                          {exercise.notes}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.muscleTag, { backgroundColor: `${primaryColor}20` }]}>
                      {renderMuscleIcon(exercise.exercise_name)}
                    </View>
                  </View>
                  
                  {/* Display each individual set */}
                  <View style={styles.setsList}>
                    {exercise.allSets.map((set, setIndex) => (
                      <View key={`set-${setIndex}`} style={styles.setItem}>
                        <View style={[styles.setNumber, { backgroundColor: `${primaryColor}10` }]}>
                          <Text style={[styles.setNumberText, { color: primaryColor }]}>
                            {setIndex + 1}
                          </Text>
                        </View>
                        <View style={styles.setDetails}>
                          <Text style={[styles.setDetailsText, { color: extendedColors.text }]}>
                            {set.planned_reps} reps
                            {set.weight ? ` at ${set.weight} kg` : ''}
                            {set.rest_time ? ` with ${formatRestTime(set.rest_time)} rest` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ))
            )}
          </View>
          
          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.actionButtons,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                router.back();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.startButtonText}>
                Back
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton, { borderColor: primaryColor }]}
              onPress={handleEditWorkout}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={20} color={primaryColor} />
              <Text style={[styles.actionButtonText, { color: primaryColor }]}>
                Edit Workout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.ScrollView>
      )}
      
      {/* Back button removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  headerGradient: {
    paddingTop: 70, // Space for the back button
    paddingBottom: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  headerIllustration: {
    position: 'absolute',
    top: 30,
    right: 20,
    opacity: 0.2,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  workoutTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  workoutDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  statText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  exercisesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  exerciseNotes: {
    fontSize: 14,
  },
  muscleTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setsList: {
    marginTop: 8,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  setNumberText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  setDetails: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 10,
    borderRadius: 8,
  },
  setDetailsText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  startButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },

  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

}); 