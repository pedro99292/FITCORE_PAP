import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, ScrollView, Dimensions, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

export default function WorkoutHistoryDetailScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const sessionId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  
  // Fetch session data and exercises when component mounts
  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);
  
  // Fetch session data and related workout
  const fetchSessionData = async () => {
    try {
      setIsLoading(true);
      
      // Get session data with related workout
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          session_id,
          start_time,
          end_time,
          duration,
          status,
          notes,
          workouts:workout_id (
            title,
            description
          )
        `)
        .eq('session_id', sessionId)
        .single();
      
      if (sessionError) {
        console.error('Error fetching session data:', sessionError);
        return;
      }
      
      if (sessionData) {
        setSessionData(sessionData);
        
        // Get session exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('session_sets')
          .select(`
            id,
            exercise_name,
            actual_reps,
            actual_weight,
            actual_time,
            actual_distance,
            set_order,
            timestamp,
            exercise_target
          `)
          .eq('session_id', sessionId)
          .order('set_order', { ascending: true });
        
        if (exercisesError) {
          console.error('Error fetching exercises data:', exercisesError);
        } else {
          setExercises(exercisesData || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchSessionData:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Format duration from seconds to minutes
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // Format time from seconds to MM:SS
  const formatExerciseTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to check if an exercise is cardio-based
  const isCardioExercise = (exerciseName: string, exerciseTarget?: string): boolean => {
    const timeBasedCardioExercises = [
      'run', 'run (equipment)', 'stationary bike walk', 'stationary bike run v.3',
      'walk elliptical cross trainer', 'walking on stepmill', 'cycle cross trainer',
      'jump rope', 'wheel run', 'push to run', 'treadmill running', 'cycling',
      'elliptical', 'rowing', 'swimming'
    ];
    
    return timeBasedCardioExercises.some(timeBasedName => 
      exerciseName.toLowerCase().includes(timeBasedName.toLowerCase())
    ) || (exerciseTarget?.toLowerCase().includes('cardiovascular') ?? false);
  };
  
  // Group exercises by name for better display
  const groupedExercises = exercises.reduce((groups: any, set: any) => {
    const name = set.exercise_name;
    if (!groups[name]) {
      groups[name] = [];
    }
    groups[name].push(set);
    return groups;
  }, {});
  
  // Navigate back
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Workout Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading details...</Text>
        </View>
      ) : sessionData ? (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Session Header Card */}
          <LinearGradient
            colors={['#4a90e2', '#5a6bff']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.sessionHeader}
          >
            <View style={styles.sessionTitleContainer}>
              <Text style={styles.sessionTitle}>{sessionData.workouts?.title || 'Workout'}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{sessionData.status}</Text>
              </View>
            </View>
            
            <Text style={styles.sessionDescription}>{sessionData.workouts?.description || ''}</Text>
            
            <View style={styles.sessionMetaContainer}>
              <View style={styles.sessionMetaItem}>
                <Ionicons name="calendar-outline" size={18} color="#fff" style={styles.metaIcon} />
                <Text style={styles.metaText}>{formatDate(sessionData.start_time)}</Text>
              </View>
              
              <View style={styles.sessionMetaItem}>
                <Ionicons name="time-outline" size={18} color="#fff" style={styles.metaIcon} />
                <Text style={styles.metaText}>{formatDuration(sessionData.duration)}</Text>
              </View>
              
              <View style={styles.sessionMetaItem}>
                <Ionicons name="hourglass-outline" size={18} color="#fff" style={styles.metaIcon} />
                <Text style={styles.metaText}>
                  {formatTime(sessionData.start_time)} - {formatTime(sessionData.end_time)}
                </Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Exercises Section */}
          <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
            
            {Object.keys(groupedExercises).length === 0 ? (
              <View style={styles.emptyExercisesContainer}>
                <Ionicons name="barbell-outline" size={40} color="rgba(150, 150, 150, 0.8)" />
                <Text style={[styles.emptyExercisesText, { color: colors.text }]}>
                  No exercises recorded
                </Text>
              </View>
            ) : (
              Object.entries(groupedExercises).map(([name, sets]: [string, any]) => {
                const isCardio = isCardioExercise(name, sets[0]?.exercise_target);
                
                return (
                  <View key={name} style={styles.exerciseContainer}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{name}</Text>
                    
                    <View style={styles.setsHeaderContainer}>
                      <Text style={[styles.setsHeaderText, { color: colors.text, flex: 0.2 }]}>Set</Text>
                      {isCardio ? (
                        <>
                          <Text style={[styles.setsHeaderText, { color: colors.text, flex: 0.4 }]}>Time</Text>
                          <Text style={[styles.setsHeaderText, { color: colors.text, flex: 0.4 }]}>Distance</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.setsHeaderText, { color: colors.text, flex: 0.4 }]}>Weight</Text>
                          <Text style={[styles.setsHeaderText, { color: colors.text, flex: 0.4 }]}>Reps</Text>
                        </>
                      )}
                    </View>
                    
                    {sets.map((set: any, index: number) => (
                      <View key={set.id} style={styles.setRow}>
                        <View style={[styles.setNumberContainer, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.setNumber, { color: colors.primary }]}>{index + 1}</Text>
                        </View>
                        {isCardio ? (
                          <>
                            <View style={{ flex: 0.4 }}>
                              <Text style={[styles.setValue, { color: colors.text }]}>
                                {set.actual_time ? formatExerciseTime(set.actual_time) : '-'}
                              </Text>
                            </View>
                            <View style={{ flex: 0.4 }}>
                              <Text style={[styles.setValue, { color: colors.text }]}>
                                {set.actual_distance ? `${set.actual_distance} km` : '-'}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={{ flex: 0.4 }}>
                              <Text style={[styles.setValue, { color: colors.text }]}>
                                {set.actual_weight ? `${set.actual_weight} kg` : '-'}
                              </Text>
                            </View>
                            <View style={{ flex: 0.4 }}>
                              <Text style={[styles.setValue, { color: colors.text }]}>
                                {set.actual_reps ? `${set.actual_reps} reps` : '-'}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </View>
          
          {/* Notes Section */}
          {sessionData.notes && (
            <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>
                {sessionData.notes}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="rgba(150, 150, 150, 0.8)" />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Could not load the details of this workout.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

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
    paddingBottom: screenWidth * 0.04,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.1,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: screenWidth * 0.06,
  },
  sessionHeader: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDescription: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  sessionMetaContainer: {
    marginTop: 20,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  metaIcon: {
    marginRight: 8,
  },
  metaText: {
    color: '#fff',
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyExercisesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyExercisesText: {
    marginTop: 12,
    fontSize: 15,
    opacity: 0.7,
  },
  exerciseContainer: {
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  setsHeaderContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  setsHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  setNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.2,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    fontSize: 15,
    textAlign: 'center',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
}); 