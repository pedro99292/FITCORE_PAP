import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/dateUtils';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

// Interface for workout data
interface Workout {
  workout_id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
  exercise_count?: number;
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

export default function WorkoutsScreen() {
  const { colors, isDarkMode } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Extended theme with additional colors
  const extendedColors = {
    ...colors,
    cardBackground: isDarkMode ? 'rgba(30, 30, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    textLight: colors.textSecondary,
    textMuted: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    danger: '#ef4444',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  };

  // Primary gradient colors from theme - hardcoded to match app style
  const primaryColor = colors.primary;
  // Use a consistent secondary color that works with the app's theme
  const secondaryColor = '#4A90E2';

  // Fetch user's workouts
  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        Alert.alert('Not logged in', 'Please log in to view your workouts');
        router.push('/(tabs)/profile');
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
      
      if (!data) {
        setWorkouts([]);
        return;
      }
      
      // For each workout, fetch the count of exercises
      const workoutsWithCounts = await Promise.all(data.map(async (workout) => {
        const { data: setData, error: setsError } = await supabase
          .from('workout_sets')
          .select('exercise_id')
          .eq('workout_id', workout.workout_id);
        
        if (setsError) {
          console.error('Error fetching workout sets:', setsError);
          return { ...workout, exercise_count: 0 };
        }
        
        // Count unique exercise IDs
        const uniqueExerciseIds = new Set(setData?.map(set => set.exercise_id) || []);
        
        return {
          ...workout,
          exercise_count: uniqueExerciseIds.size
        };
      }));
      
      setWorkouts(workoutsWithCounts);
    } catch (error) {
      console.error('Error in fetchWorkouts:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleRefresh = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchWorkouts();
  };

  const handleAddWorkout = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/workout-builder');
  };

  const handleViewWorkout = (workout: Workout) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/workout-preview/${workout.workout_id}`);
  };

  const handleEditWorkout = (workout: Workout) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/workout-builder',
      params: { workoutId: workout.workout_id }
    });
  };

  const handleDeleteWorkout = async (workout: Workout) => {
    // Trigger haptic feedback
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    
    // Ask for confirmation before deleting
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.title}"? Your workout history will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              setLoading(true);
              
              // Update sessions to remove the workout reference (set workout_id to null to preserve history)
              const { error: sessionsUpdateError } = await supabase
                .from('sessions')
                .update({ workout_id: null })
                .eq('workout_id', workout.workout_id);
              
              if (sessionsUpdateError) {
                console.error('Error updating sessions:', sessionsUpdateError);
                // Don't throw error here - we can still delete the workout even if session update fails
                console.warn('Failed to update sessions, continuing with workout deletion');
              }
              
              // Delete workout_sets (these are the planned sets, not the actual workout history)
              const { error: workoutSetsError } = await supabase
                .from('workout_sets')
                .delete()
                .eq('workout_id', workout.workout_id);
              
              if (workoutSetsError) {
                console.error('Error deleting workout sets:', workoutSetsError);
                throw new Error(`Failed to delete workout sets: ${workoutSetsError.message}`);
              }
              
              // Finally delete the workout itself
              const { error: workoutError } = await supabase
                .from('workouts')
                .delete()
                .eq('workout_id', workout.workout_id);
                
              if (workoutError) {
                console.error('Error deleting workout:', workoutError);
                throw new Error(`Failed to delete workout: ${workoutError.message}`);
              }
              
              // Update the UI by removing the deleted workout
              setWorkouts(workouts.filter(w => w.workout_id !== workout.workout_id));
              
              // Show success message
              Alert.alert('Success', `"${workout.title}" has been deleted successfully. Your workout history has been preserved.`);
            } catch (error) {
              // Log and display any errors
              console.error('Error in workout deletion process:', error);
              Alert.alert(
                'Error', 
                `Failed to delete workout: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            } finally {
              // Always clear loading state when done
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  });

  const renderWorkoutItem = ({ item, index }: { item: Workout, index: number }) => {
    // Format date for display
    const formattedDate = formatRelativeTime(item.created_at);
    
    // Use a single consistent gradient for all cards
    const cardColors = [primaryColor, secondaryColor];
    
    return (
      <Animated.View
        style={{
          opacity: 1,
          transform: [{ translateY: 0 }],
        }}
      >
        <TouchableOpacity
          style={[styles.workoutCard, { 
            backgroundColor: extendedColors.cardBackground,
            borderColor: extendedColors.cardBorder 
          }]}
          onPress={() => handleViewWorkout(item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={["#4A90E2", "#4A70E2"]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.cardIconCircle}
              >
                <MaterialCommunityIcons name="dumbbell" size={20} color="#fff" />
              </LinearGradient>
              
              <View style={styles.cardTitle}>
                <Text style={[styles.workoutTitle, { color: extendedColors.text }]}>{item.title}</Text>
                <Text style={[styles.workoutDate, { color: extendedColors.textMuted }]}>{formattedDate}</Text>
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleEditWorkout(item);
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleDeleteWorkout(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            {item.description ? (
              <Text style={[styles.workoutDescription, { color: extendedColors.textMuted }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            
            <View style={styles.cardDivider} />
            
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <View style={[styles.statIconBg, { backgroundColor: `${primaryColor}15` }]}>
                  <MaterialCommunityIcons name="weight-lifter" size={16} color={primaryColor} />
                </View>
                <Text style={[styles.statText, { color: extendedColors.textMuted }]}>
                  {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderEmptyList = () => (
    <Animated.View
      style={[styles.emptyContainer, {
        opacity: 1,
        transform: [{ scale: 1 }]
      }]}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: `${primaryColor}15` }]}>
        <MaterialCommunityIcons name="dumbbell" size={80} color={primaryColor} />
        <View style={[styles.emptyIconOverlay, { backgroundColor: extendedColors.background }]}>
          <Ionicons name="add-circle" size={30} color={primaryColor} />
        </View>
      </View>
      <Text style={[styles.emptyText, { color: extendedColors.text }]}>
        No workouts yet
      </Text>
      <Text style={[styles.emptySubtext, { color: extendedColors.textMuted }]}>
        Create your first workout routine to get started tracking your fitness journey
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: primaryColor }]}
        onPress={handleAddWorkout}
      >
        <Text style={styles.emptyButtonText}>Create Your First Workout</Text>
        <Ionicons name="add-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </Animated.View>
  );

  // Hero section with workout stats
  const renderHeroSection = () => (
    <Animated.View style={[styles.heroSection, { transform: [{ scale: heroScale }] }]}>
      <LinearGradient
        colors={[primaryColor, secondaryColor]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>My Workout Collection</Text>
            <Text style={styles.heroSubtitle}>
              {workouts.length} workout{workouts.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <View style={styles.heroIconContainer}>
            <MaterialCommunityIcons name="dumbbell" size={28} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: extendedColors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: extendedColors.text }]}>
            Loading workouts...
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.workout_id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeroSection}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
      
      {/* Back button FAB */}
      <TouchableOpacity 
        style={styles.backFab}
        onPress={() => router.push('/(tabs)/profile')}
        activeOpacity={0.9}
      >
        <View style={[styles.fabGradient, { backgroundColor: primaryColor }]}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
      
      {/* Add Workout FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddWorkout}
        activeOpacity={0.9}
      >
        <View style={[styles.fabGradient, { backgroundColor: primaryColor }]}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    borderRadius: 20,
  },
  heroContent: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heroIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 90,
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
  workoutCard: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.01)',
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },

  backFab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(0, 0, 0, 0.01)',
      },
    }),
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(0, 0, 0, 0.01)',
      },
    }),
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  emptyIconOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 