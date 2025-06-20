import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/utils/subscriptionService';
import { supabase } from '@/utils/supabase';
import { formatRelativeTime } from '@/utils/dateUtils';
import { generateAndSaveWorkout } from '@/utils/workoutGenerationService';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';

const { width: screenWidth } = Dimensions.get('window');

interface UserWorkout {
  workout_id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
  workout_type?: 'user_created' | 'auto_generated';
}

interface UserPreferences {
  goals: string[] | null;
  experience_level: string | null;
  workouts_per_week: number | null;
  workout_split: string | null;
  sets_per_exercise: number | null;
  rest_time: string | null;
}

export default function WorkoutPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    goals: null,
    experience_level: null,
    workouts_per_week: null,
    workout_split: null,
    sets_per_exercise: null,
    rest_time: null,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const fetchUserWorkouts = async () => {
    if (!user) return;
    
    try {
      setWorkoutsLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          workout_id,
          title,
          description,
          created_at,
          user_id,
          workout_type
        `)
        .eq('user_id', user.id)
        .eq('workout_type', 'auto_generated')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching user workouts:', error);
      setUserWorkouts([]);
    } finally {
      setWorkoutsLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      setPreferencesLoading(true);
      const { data, error } = await supabase
        .from('users_data')
        .select(`
          goals,
          experience_level,
          workouts_per_week,
          workout_split,
          sets_per_exercise,
          rest_time
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error is ok
          console.error('Error fetching user preferences:', error);
        }
        return;
      }

      setUserPreferences(data || {});
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  useEffect(() => {
    fetchUserWorkouts();
    fetchUserPreferences();
  }, [user]);

  // Refresh preferences when screen comes into focus (e.g., returning from edit screen)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserPreferences();
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserWorkouts(),
      fetchUserPreferences(),
    ]);
    setRefreshing(false);
  };

  const handleEditPreferences = () => {
    router.push('/edit-workout-preferences');
  };



  const handleGenerateWorkout = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to generate a workout');
      return;
    }

    // Check if user has completed the necessary survey data
    const hasCompletedSurvey = await subscriptionService.hasUserCompletedSurvey(user.id);
    if (!hasCompletedSurvey) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your fitness profile first to generate personalized workouts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile', onPress: () => router.push('/edit-profile') }
        ]
      );
      return;
    }

    setGeneratingWorkout(true);
    try {
      Alert.alert(
        'Generating Workout',
        'Creating your personalized workout plan. This may take a moment...',
        [{ text: 'OK' }]
      );

      const workoutId = await generateAndSaveWorkout(user.id);
      
      if (workoutId) {
        // Refresh the workouts list
        await fetchUserWorkouts();
        
        Alert.alert(
          'Workout Generated! 💪',
          'Your personalized workout plan has been created successfully! Each training day is now a separate workout that you can start individually.',
          [
            { text: 'View Workouts', onPress: () => router.push('/workouts') },
            { text: 'Stay Here', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Generation Failed',
          'We couldn\'t create your workout plan. Please try again later or contact support if the problem persists.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error generating workout:', error);
      Alert.alert(
        'Workout Generation Error',
        'There was an issue creating your workout plan. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingWorkout(false);
    }
  };

  const getGoalDisplay = (goals: string[] | null) => {
    if (!goals || goals.length === 0) return 'Not set';
    return goals[0]; // Display the first goal
  };

  const getExperienceLevelDisplay = (level: string | null) => {
    if (!level) return 'Not set';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getWorkoutSplitDisplay = (split: string | null) => {
    if (!split) return 'Not set';
    
    // Convert snake_case to readable format
    return split
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRestTimeDisplay = (restTime: string | null) => {
    if (!restTime) return 'Not set';
    return `${restTime} minutes`;
  };

  const WorkoutCard = ({ workout }: { workout: UserWorkout }) => (
    <TouchableOpacity 
      style={[styles.workoutCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/workout-preview/${workout.workout_id}`)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FF9800' + '15', '#FF6F00' + '10']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.workoutGradient}
      >
        <View style={styles.workoutIconContainer}>
          <MaterialCommunityIcons name="dumbbell" size={24} color="#FF9800" />
        </View>
        <View style={styles.workoutContent}>
          <View style={styles.workoutHeader}>
            <Text style={[styles.workoutTitle, { color: colors.text }]} numberOfLines={1}>
              {workout.title}
            </Text>
            <View style={styles.workoutTypeBadge}>
              <Text style={styles.workoutTypeText}>AUTO</Text>
            </View>
          </View>
          {workout.description && (
            <Text style={[styles.workoutDescription, { color: colors.text + '80' }]} numberOfLines={2}>
              {workout.description}
            </Text>
          )}
          <Text style={[styles.workoutDate, { color: colors.text + '60' }]}>
            {formatRelativeTime(workout.created_at)}
          </Text>
        </View>
        <View style={[styles.workoutArrow, { backgroundColor: colors.background + '30' }]}>
          <FontAwesome name="chevron-right" size={14} color={colors.text + '60'} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const PreferenceItem = ({ 
    icon, 
    title, 
    value
  }: {
    icon: keyof typeof FontAwesome.glyphMap;
    title: string;
    value: string;
  }) => (
    <View style={[styles.preferenceCard, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '10']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.preferenceGradient}
      >
        <View style={[styles.preferenceIconContainer, { backgroundColor: colors.primary }]}>
          <FontAwesome name={icon} size={18} color="#fff" />
        </View>
        <View style={styles.preferenceContent}>
          <Text style={[styles.preferenceTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.preferenceValue, { color: colors.text + '90' }]}>{value}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Workout Preferences',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <LinearGradient
        colors={[colors.background, colors.background + 'F0', colors.background + 'E0']}
        start={[0, 0]}
        end={[0, 1]}
        style={styles.gradientContainer}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Workout Preferences Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Your Preferences</Text>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={handleEditPreferences}
                disabled={loading}
              >
                <FontAwesome name="edit" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            {preferencesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : (
              <View style={styles.preferencesContainer}>
                <PreferenceItem
                  icon="bullseye"
                  title="Fitness Goal"
                  value={getGoalDisplay(userPreferences.goals)}
                />
                <PreferenceItem
                  icon="trophy"
                  title="Experience Level"
                  value={getExperienceLevelDisplay(userPreferences.experience_level)}
                />
                <PreferenceItem
                  icon="calendar"
                  title="Workouts per Week"
                  value={userPreferences.workouts_per_week ? `${userPreferences.workouts_per_week} days` : 'Not set'}
                />
                <PreferenceItem
                  icon="list"
                  title="Workout Split"
                  value={getWorkoutSplitDisplay(userPreferences.workout_split)}
                />
                <PreferenceItem
                  icon="repeat"
                  title="Sets per Exercise"
                  value={userPreferences.sets_per_exercise ? `${userPreferences.sets_per_exercise} sets` : 'Not set'}
                />
                <PreferenceItem
                  icon="clock-o"
                  title="Rest Time"
                  value={getRestTimeDisplay(userPreferences.rest_time)}
                />
              </View>
            )}
          </View>

          {/* Generated Workouts Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginHorizontal: 20 }]}>Your Generated Workouts</Text>
            
            {workoutsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : userWorkouts.length > 0 ? (
              <View style={styles.workoutsContainer}>
                {userWorkouts.map((workout) => (
                  <WorkoutCard key={workout.workout_id} workout={workout} />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.emptyGradient}
                >
                  <MaterialCommunityIcons name="dumbbell" size={64} color={colors.primary + '60'} />
                  <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                    No generated workouts yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
                    Create your first personalized workout plan
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.generateButton, 
                      { 
                        backgroundColor: generatingWorkout ? '#FF9800' + '80' : '#FF9800',
                        opacity: generatingWorkout ? 0.7 : 1 
                      }
                    ]}
                    onPress={handleGenerateWorkout}
                    activeOpacity={0.8}
                    disabled={generatingWorkout}
                  >
                    {generatingWorkout ? (
                      <View style={styles.generateButtonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={[styles.generateButtonText, { marginLeft: 8 }]}>Generating...</Text>
                      </View>
                    ) : (
                      <Text style={styles.generateButtonText}>Generate Your First Workout</Text>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  preferencesContainer: {
    marginHorizontal: 20,
    gap: 12,
  },
  preferenceCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  preferenceGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutsContainer: {
    marginHorizontal: 20,
    gap: 12,
  },
  workoutCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  workoutGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutContent: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  workoutTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF9800',
  },
  workoutTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  workoutDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  generateButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    gap: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  gradientContainer: {
    flex: 1,
  },
}); 