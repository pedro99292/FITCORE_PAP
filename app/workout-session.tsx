import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, SafeAreaView, StatusBar, Platform, ActivityIndicator, Modal, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useRef, memo } from 'react';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useExerciseDB } from '@/hooks/useExerciseDB';
import { Video, ResizeMode } from 'expo-av';
import { updateAllAchievements } from '@/utils/achievementService';

const { width: screenWidth } = Dimensions.get('window');

// Types based on database schema
interface WorkoutType {
  workout_id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface WorkoutSetType {
  id: string;
  workout_id: string;
  exercise_id: string;
  planned_reps: number;
  rest_time: number;
  set_order: number;
  exercise_name: string;
  exercise_bodypart: string;
  exercise_target: string;
  exercise_equipment: string;
}

interface ExerciseType {
  id: string;
  name: string;
  sets: WorkoutSetType[];
  bodyPart?: string;
  target?: string;
  equipment?: string;
}

// Define the session set type without 'completed' field since it's not in the DB schema
interface SessionSetType {
  exercise_id: string;
  actual_reps: number | null;
  actual_weight: number | null;
  set_order: number;
}

// Add new state for exercise details modal
interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string[];
  overview?: string;
  exerciseTips?: string[];
  variations?: string[];
  secondaryMuscles?: string[];
}

// Header component
const Header = memo(({ title, onClose }: { title: string, onClose: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
});

// Stopwatch component
const Stopwatch = memo(({ onTimeUpdate }: { onTimeUpdate: (time: number) => void }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef<number | null>(null);
  const { colors } = useTheme();
  
  // Format time as mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          onTimeUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);
  
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()}
      style={styles.stopwatchContainer}
    >
      <LinearGradient
        colors={['rgba(74, 144, 226, 0.6)', 'rgba(74, 144, 226, 0.2)']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.stopwatchGradient}
      >
        <View style={styles.stopwatchContent}>
          <Text style={styles.stopwatchTime}>{formatTime(time)}</Text>
          <TouchableOpacity 
            onPress={toggleTimer}
            style={[
              styles.stopwatchButton,
              { backgroundColor: isRunning ? 'rgba(231, 76, 60, 0.8)' : 'rgba(46, 204, 113, 0.8)' }
            ]}
          >
            <Ionicons 
              name={isRunning ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// Exercise item component with set tracking
const ExerciseItem = memo(({ exercise, index, onSetUpdate, onShowExerciseDetails }: { 
  exercise: ExerciseType,
  index: number,
  onSetUpdate: (exerciseId: string, setIndex: number, reps: string, weight: string) => void,
  onShowExerciseDetails: (exerciseName: string) => void
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [completedSets, setCompletedSets] = useState<Array<{reps: string, weight: string}>>([]);
  const [customSets, setCustomSets] = useState<WorkoutSetType[]>([]);
  const rotationValue = useSharedValue(0);
  
  // Initialize the completed sets and custom sets
  useEffect(() => {
    setCompletedSets(Array(exercise.sets.length).fill({reps: '', weight: ''}));
    setCustomSets([...exercise.sets]);
  }, [exercise.sets.length]);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
    rotationValue.value = withTiming(expanded ? 0 : 1, { duration: 300 });
  };
  
  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationValue.value * 180}deg` }]
    };
  });
  
  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    // Ensure only numeric input
    if (value && !/^[0-9]*\.?[0-9]*$/.test(value)) {
      return; // Reject non-numeric input
    }
    
    const newSets = [...completedSets];
    
    // Initialize the set if it doesn't exist
    if (!newSets[index]) {
      newSets[index] = { reps: '', weight: '' };
    }
    
    newSets[index] = { ...newSets[index], [field]: value };
    setCompletedSets(newSets);
    
    // Always notify parent to ensure state is updated
    const repsValue = field === 'reps' ? value : newSets[index].reps || '';
    const weightValue = field === 'weight' ? value : newSets[index].weight || '';
    
    onSetUpdate(
      exercise.id,
      index,
      repsValue,
      weightValue
    );
  };
  
  // Function to handle when user completes a set without editing
  const handleBlankInput = (setIndex: number, field: 'reps' | 'weight') => {
    const currentValue = completedSets[setIndex]?.[field] || '';
    
    // If the user didn't enter anything, use the placeholder value
    if (currentValue === '' && field === 'reps') {
      const plannedReps = customSets[setIndex]?.planned_reps?.toString() || '';
      if (plannedReps) {
        // Update the state to reflect we're using the planned value
        const newSets = [...completedSets];
        if (!newSets[setIndex]) {
          newSets[setIndex] = { reps: '', weight: '' };
        }
        // Don't update the visual input, but notify parent that we should use the planned value
        onSetUpdate(
          exercise.id,
          setIndex,
          plannedReps, // Use the planned value
          completedSets[setIndex]?.weight || ''
        );
      }
    }
  };
  
  // Add a new set
  const addSet = () => {
    const lastSet = customSets[customSets.length - 1];
    
    // Create a new set based on the last one
    const newSet: WorkoutSetType = {
      ...lastSet,
      id: `${lastSet.id}_custom_${customSets.length}`,
      set_order: customSets.length
    };
    
    // Update custom sets
    const updatedCustomSets = [...customSets, newSet];
    setCustomSets(updatedCustomSets);
    
    // Update completed sets state with a new empty entry
    const newCompletedSets = [...completedSets, { reps: '', weight: '' }];
    setCompletedSets(newCompletedSets);
    
    // Notify parent about the empty set
    onSetUpdate(
      exercise.id,
      updatedCustomSets.length - 1,
      '',
      ''
    );
  };
  
  // Remove the last set
  const removeSet = () => {
    if (customSets.length <= 1) return; // Don't remove the last set
    
    // Remove the last set
    const updatedCustomSets = customSets.slice(0, -1);
    setCustomSets(updatedCustomSets);
    
    // Update completed sets
    const newCompletedSets = completedSets.slice(0, -1);
    setCompletedSets(newCompletedSets);
  };
  
  // Format rest time from seconds to minutes
  const formatRestTime = (seconds: number): string => {
    if (!seconds) return '';
    
    if (seconds < 60) {
      return `${seconds}s rest`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      if (remainingSeconds === 0) {
        return `${minutes} min rest`;
      } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min rest`;
      }
    }
  };
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.exerciseContainer}
    >
      <TouchableOpacity 
        onPress={toggleExpand} 
        style={styles.exerciseHeader}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseNameRow}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>
              {exercise.name}
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => onShowExerciseDetails(exercise.name)}
            >
              <Ionicons name="information-circle-outline" size={24} color="#4a90e2" />
            </TouchableOpacity>
          </View>
          <Text style={styles.exerciseDetails}>
            {customSets.length} séries 
            {exercise.sets[0]?.planned_reps ? ` • ${exercise.sets[0]?.planned_reps} reps` : ''} 
            {exercise.sets[0]?.rest_time ? ` • ${formatRestTime(exercise.sets[0]?.rest_time)}` : ''}
          </Text>
        </View>
        
        <Animated.View style={arrowStyle}>
          <Ionicons 
            name="chevron-down" 
            size={24} 
            color={colors.text} 
          />
        </Animated.View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={[styles.setsHeaderText, { flex: 0.2 }]}>Série</Text>
            <Text style={[styles.setsHeaderText, { flex: 0.4 }]}>Reps</Text>
            <Text style={[styles.setsHeaderText, { flex: 0.4 }]}>Peso (kg)</Text>
          </View>
          
          {customSets.map((set, setIndex) => (
            <View key={`${set.id}_${setIndex}`} style={styles.setRow}>
              <View style={[styles.setNumber, { flex: 0.2 }]}>
                <Text style={styles.setNumberText}>{setIndex + 1}</Text>
              </View>
              
              <View style={[styles.inputContainer, { flex: 0.4 }]}>
                <TextInput
                  style={styles.input}
                  placeholder={set.planned_reps?.toString() || "0"}
                  keyboardType="number-pad"
                  value={completedSets[setIndex]?.reps || ''}
                  onChangeText={(text) => updateSet(setIndex, 'reps', text)}
                  maxLength={3}
                  onEndEditing={() => {
                    // Handle the case where user didn't enter anything
                    handleBlankInput(setIndex, 'reps');
                    
                    // Also do the regular update
                    const currentValue = completedSets[setIndex]?.reps || '';
                    onSetUpdate(
                      exercise.id,
                      setIndex,
                      currentValue,
                      completedSets[setIndex]?.weight || ''
                    );
                  }}
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 0.4 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={completedSets[setIndex]?.weight || ''}
                  onChangeText={(text) => updateSet(setIndex, 'weight', text)}
                  maxLength={5}
                  onEndEditing={() => {
                    // Handle the case where user didn't enter anything
                    handleBlankInput(setIndex, 'weight');
                    
                    // Make sure the update is triggered on blur/end editing
                    const currentValue = completedSets[setIndex]?.weight || '';
                    onSetUpdate(
                      exercise.id,
                      setIndex,
                      completedSets[setIndex]?.reps || '',
                      currentValue
                    );
                  }}
                />
              </View>
            </View>
          ))}
          
          {/* Set management buttons */}
          <View style={styles.setManagementContainer}>
            <TouchableOpacity 
              style={[
                styles.setButton, 
                customSets.length <= 1 ? styles.disabledButton : styles.removeButton
              ]}
              onPress={removeSet}
              disabled={customSets.length <= 1}
            >
              <Ionicons 
                name="remove" 
                size={16} 
                color={customSets.length <= 1 ? "rgba(255,255,255,0.3)" : "#fff"} 
              />
              <Text style={styles.setButtonText}>
                Remover
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.setButton, styles.addButton]}
              onPress={addSet}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.setButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
});

// Main component
const WorkoutSessionScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ workoutId: string }>();
  const workoutId = params.workoutId;
  
  const [workout, setWorkout] = useState<WorkoutType | null>(null);
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  // Store completed sets data for saving to the database
  const [sessionSets, setSessionSets] = useState<Map<string, SessionSetType[]>>(new Map());
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Add exercise details modal state
  const [selectedExerciseDetails, setSelectedExerciseDetails] = useState<Exercise | null>(null);
  
  // Fetch all exercises using the same hook as workout builder
  const { exercises: allExercises, loading: loadingAllExercises } = useExerciseDB({});
  
  // Fetch workout and exercise data
  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!workoutId) return;
      
      try {
        setLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          Alert.alert('Not logged in', 'Please log in to view workout details');
          router.replace('/(tabs)/profile');
          return;
        }
        
        // 1. Fetch the workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('workout_id', workoutId)
          .single();
        
        if (workoutError || !workoutData) {
          console.error('Error fetching workout:', workoutError);
          Alert.alert('Error', 'Failed to load workout details');
          return;
        }
        
        setWorkout(workoutData);
        
        // 2. Fetch workout sets
        const { data: workoutSets, error: setsError } = await supabase
          .from('workout_sets')
          .select('*')
          .eq('workout_id', workoutId)
          .order('set_order', { ascending: true });
        
        if (setsError) {
          console.error('Error fetching workout sets:', setsError);
          Alert.alert('Error', 'Failed to load workout exercises');
          return;
        }
        
        if (!workoutSets || workoutSets.length === 0) {
          setExercises([]);
          setLoading(false);
          return;
        }
        
        // 3. Group sets by exercise
        const exerciseMap = new Map<string, ExerciseType>();
        
        workoutSets.forEach(set => {
          const exerciseId = set.exercise_id;
          
          if (!exerciseMap.has(exerciseId)) {
            exerciseMap.set(exerciseId, {
              id: exerciseId,
              name: set.exercise_name,
              sets: [],
              bodyPart: set.exercise_bodypart,
              target: set.exercise_target,
              equipment: set.exercise_equipment
            });
          }
          
          exerciseMap.get(exerciseId)?.sets.push(set);
        });
        
        // Sort by exercise order (using the first set's order)
        const exerciseList = Array.from(exerciseMap.values()).sort((a, b) => {
          return a.sets[0]?.set_order - b.sets[0]?.set_order;
        });
        
        setExercises(exerciseList);
        
        // 4. Create a new session in the database
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            workout_id: workoutId,
            user_id: userData.user.id,
            start_time: new Date().toISOString(),
            status: 'in_progress'
          })
          .select()
          .single();
        
        if (sessionError) {
          console.error('Error creating workout session:', sessionError);
        } else {
          // Store the session ID for later use
          setSessionId(sessionData.session_id.toString());
        }
      } catch (error) {
        console.error('Error fetching workout data:', error);
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutData();
  }, [workoutId]);
  
  // Handle set data updates
  const handleSetUpdate = (exerciseId: string, setIndex: number, reps: string, weight: string) => {
    setSessionSets(prev => {
      const newMap = new Map(prev);
      
      // Get current sets for this exercise or initialize a new array
      const currentSets = newMap.get(exerciseId) || [];
      
      // Update or create the set entry
      const updatedSets = [...currentSets];
      
      // Ensure the set exists at this index
      while (updatedSets.length <= setIndex) {
        updatedSets.push({
          exercise_id: exerciseId,
          actual_reps: null,
          actual_weight: null, 
          set_order: updatedSets.length
        });
      }
      
      // Parse the numeric values from the input strings
      const parsedReps = reps ? parseInt(reps) : null;
      const parsedWeight = weight ? parseFloat(weight) : null;
      
      // Update the specific set with the parsed values
      updatedSets[setIndex] = {
        exercise_id: exerciseId,
        actual_reps: parsedReps,
        actual_weight: parsedWeight,
        set_order: setIndex
      };
      
      newMap.set(exerciseId, updatedSets);
      return newMap;
    });
  };
  
  // Handle timer updates
  const handleTimeUpdate = (time: number) => {
    setElapsed(time);
  };
  
  // Function to handle showing exercise details
  const handleShowExerciseDetails = (exerciseName: string) => {
    if (!allExercises || allExercises.length === 0) {
      Alert.alert('Exercise Details', 'Exercise details are still loading. Please try again in a moment.');
      return;
    }
    
    console.log('Searching for exercise:', exerciseName);
    console.log('Available exercises count:', allExercises.length);
    
    // First try exact match (case insensitive)
    let exerciseDetails = allExercises.find(ex => 
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!exerciseDetails) {
      exerciseDetails = allExercises.find(ex => 
        ex.name.toLowerCase().includes(exerciseName.toLowerCase()) ||
        exerciseName.toLowerCase().includes(ex.name.toLowerCase())
      );
    }
    
    // If still no match, try matching individual words
    if (!exerciseDetails) {
      const searchWords = exerciseName.toLowerCase().split(/\s+/);
      exerciseDetails = allExercises.find(ex => {
        const exerciseWords = ex.name.toLowerCase().split(/\s+/);
        return searchWords.some(searchWord => 
          exerciseWords.some(exerciseWord => 
            exerciseWord.includes(searchWord) || searchWord.includes(exerciseWord)
          )
        );
      });
    }
    
    if (exerciseDetails) {
      console.log('Found exercise:', exerciseDetails.name);
      setSelectedExerciseDetails(exerciseDetails);
    } else {
      console.log('No exercise found. First 5 available exercises:', 
        allExercises.slice(0, 5).map(ex => ex.name));
      
      Alert.alert(
        'Exercise Details', 
        `Could not find details for "${exerciseName}". This might be because:\n\n• The exercise is not in our database\n• The exercise name doesn't match exactly\n• The exercise database is still loading\n\nTry again in a few moments.`,
        [{ text: 'OK' }]
      );
    }
  };
  
  // Add the modal component for exercise details
  const renderExerciseDetailsModal = () => {
    if (!selectedExerciseDetails) return null;

    return (
      <Modal
        visible={!!selectedExerciseDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedExerciseDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exerciseModalContent}>
            <ScrollView style={styles.modalScrollView}>
              {/* Header with close button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedExerciseDetails.name}</Text>
                <TouchableOpacity 
                  onPress={() => setSelectedExerciseDetails(null)}
                  style={styles.closeButtonModal}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Exercise Image/Video */}
              {selectedExerciseDetails.videoUrl ? (
                <View style={styles.modalImageContainer}>
                  <Video
                    source={{ uri: selectedExerciseDetails.videoUrl }}
                    style={styles.modalVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay={false}
                    isLooping={false}
                  />
                </View>
              ) : selectedExerciseDetails.imageUrl ? (
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedExerciseDetails.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </View>
              ) : selectedExerciseDetails.gifUrl ? (
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedExerciseDetails.gifUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.modalNoImageContainer}>
                  <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.modalNoImageText}>No media available</Text>
                </View>
              )}

              {/* Exercise Details */}
              <View style={styles.modalDetailsContainer}>
                {/* Overview */}
                {selectedExerciseDetails.overview && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitleModal}>Overview</Text>
                    <Text style={styles.overviewText}>{selectedExerciseDetails.overview}</Text>
                  </View>
                )}

                {/* Category and Equipment */}
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="body-outline" size={20} color="#4a90e2" />
                      <Text style={styles.detailLabel}>Body Part:</Text>
                      <Text style={styles.detailValue}>{selectedExerciseDetails.bodyPart}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="barbell-outline" size={20} color="#4a90e2" />
                      <Text style={styles.detailLabel}>Equipment:</Text>
                      <Text style={styles.detailValue}>{selectedExerciseDetails.equipment}</Text>
                    </View>
                  </View>
                </View>

                {/* Target Muscles */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitleModal}>Target Muscles</Text>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="fitness-outline" size={20} color="#4a90e2" />
                      <Text style={styles.detailLabel}>Primary:</Text>
                      <Text style={styles.detailValue}>{selectedExerciseDetails.target}</Text>
                    </View>
                  </View>
                  {selectedExerciseDetails.secondaryMuscles && selectedExerciseDetails.secondaryMuscles.length > 0 && (
                    <View style={styles.secondaryMusclesContainer}>
                      <Text style={styles.detailLabel}>Secondary Muscles:</Text>
                      {selectedExerciseDetails.secondaryMuscles.map((muscle, index) => (
                        <Text key={index} style={styles.secondaryMuscleText}>• {muscle}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Instructions */}
                {selectedExerciseDetails.instructions && selectedExerciseDetails.instructions.length > 0 && (
                  <View style={styles.instructionsSection}>
                    <Text style={styles.sectionTitleModal}>Instructions</Text>
                    {selectedExerciseDetails.instructions.map((instruction, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <Text style={styles.instructionNumber}>{index + 1}.</Text>
                        <Text style={styles.instructionText}>{instruction}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Exercise Tips */}
                {selectedExerciseDetails.exerciseTips && selectedExerciseDetails.exerciseTips.length > 0 && (
                  <View style={styles.tipsSection}>
                    <Text style={styles.sectionTitleModal}>Tips</Text>
                    {selectedExerciseDetails.exerciseTips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <Ionicons name="bulb-outline" size={20} color="#4a90e2" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Variations */}
                {selectedExerciseDetails.variations && selectedExerciseDetails.variations.length > 0 && (
                  <View style={styles.variationsSection}>
                    <Text style={styles.sectionTitleModal}>Variations</Text>
                    {selectedExerciseDetails.variations.map((variation, index) => (
                      <View key={index} style={styles.variationItem}>
                        <Text style={styles.variationText}>• {variation}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Finish workout and save session data
  const saveWorkoutSession = async () => {
    try {
      setSaving(true);
      if (!sessionId || !workout) return false;
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      
      // Calculate total sets completed
      let totalSetsCompleted = 0;
      const setsToInsert: any[] = [];
      
      // We need to generate an ID for each set
      let nextSetId = 1; // Start with 1 as the first ID
      
      // First try to get the max ID from the database to avoid conflicts
      try {
        const { data: maxIdResult, error: maxIdError } = await supabase
          .from('session_sets')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);
        
        if (!maxIdError && maxIdResult?.length > 0) {
          // Start from the next available ID
          nextSetId = (maxIdResult[0].id || 0) + 1;
        }
      } catch (err) {
        console.warn('Error getting max set ID, using default starting ID:', err);
      }
      
      // Make sure we process ALL exercises, even if they're not in sessionSets
      const exercisesToProcess = new Set<string>();
      
      // First add all exercises from the sessionSets map
      sessionSets.forEach((_, exerciseId) => {
        exercisesToProcess.add(exerciseId);
      });
      
      // Then add any exercises that might not be in the map yet
      exercises.forEach(exercise => {
        exercisesToProcess.add(exercise.id);
      });
      
      // Now process each exercise
      for (const exerciseId of exercisesToProcess) {
        const exercise = exercises.find(e => e.id === exerciseId);
        if (!exercise) {
          console.warn(`Exercise with ID ${exerciseId} not found, skipping`);
          continue;
        }
        
        const existingSets = sessionSets.get(exerciseId) || [];
        
        // Use the actual number of sets from existingSets if it's greater than the original exercise sets
        // This handles cases where the user added sets
        const actualSetCount = Math.max(exercise.sets.length, existingSets.length);
        
        // Process each set for this exercise, including any added sets
        for (let i = 0; i < actualSetCount; i++) {
          // Get the workout set if available, otherwise use the last set as template
          const workoutSet = i < exercise.sets.length 
            ? exercise.sets[i] 
            : {...exercise.sets[exercise.sets.length - 1], set_order: i};
          
          let sessionSet = existingSets[i];
          
          // If there's no session set yet, or reps/weight are null, create or update with defaults
          if (!sessionSet || (sessionSet.actual_reps === null && sessionSet.actual_weight === null)) {
            sessionSet = {
              exercise_id: exerciseId,
              actual_reps: workoutSet.planned_reps,
              actual_weight: 0,
              set_order: i
            };
          } else {
            // If reps is null but we have a planned value, use the planned value
            if (sessionSet.actual_reps === null && workoutSet.planned_reps) {
              sessionSet.actual_reps = workoutSet.planned_reps;
            }
          }
          
          // Count as completed
          totalSetsCompleted++;
          
          // Add to insertion batch
          setsToInsert.push({
            id: nextSetId++,
            session_id: sessionId,
            exercise_name: exercise.name,
            actual_reps: sessionSet.actual_reps !== null ? sessionSet.actual_reps : workoutSet.planned_reps || 0,
            actual_weight: sessionSet.actual_weight !== null ? sessionSet.actual_weight : 0,
            set_order: i,
            timestamp: new Date().toISOString(),
            exercise_target: exercise.target || ""
          });
        }
      }
      
      // 1. Update the session record
      const { error: sessionUpdateError } = await supabase
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          duration: elapsed,
          status: 'completed',
          notes: `Completed ${totalSetsCompleted} sets`
        })
        .eq('session_id', sessionId);
      
      if (sessionUpdateError) {
        console.error('Error updating session:', sessionUpdateError);
        throw new Error(`Error updating session: ${sessionUpdateError.message}`);
      }
      
      // 2. Insert all session sets one at a time
      let insertedSetsCount = 0;
      for (const setData of setsToInsert) {
        try {
          const { data, error } = await supabase
            .from('session_sets')
            .insert(setData)
            .select();
          
          if (error) {
            console.error('Error inserting set with ID:', setData.id, 'Error:', error.message);
          } else {
            insertedSetsCount++;
          }
        } catch (err) {
          console.error('Exception inserting set:', err);
        }
      }
      
      // Update achievements for the user after successful workout completion
      try {
        if (userData?.user?.id) {
          await updateAllAchievements(userData.user.id);
        }
      } catch (achievementError) {
        // Don't fail the workout save if achievements fail
        console.warn('Error updating achievements:', achievementError);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving workout session:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Handle close button (X) - now deletes the session and goes back
  const handleClose = async () => {
    // Function to delete the session
    const deleteSession = async () => {
      try {
        if (!sessionId) return;
        
        // Delete any related session sets first (due to foreign key constraints)
        const { error: setsDeleteError } = await supabase
          .from('session_sets')
          .delete()
          .eq('session_id', sessionId);
          
        if (setsDeleteError) {
          console.error('Error deleting session sets:', setsDeleteError);
        }
        
        // Then delete the session itself
        const { error: sessionDeleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('session_id', sessionId);
          
        if (sessionDeleteError) {
          console.error('Error deleting session:', sessionDeleteError);
        }
      } catch (error) {
        console.error('Error in delete session operation:', error);
      } finally {
        // Return to previous screen regardless of delete success
        router.back();
      }
    };
    
    if (Platform.OS === 'web') {
      await deleteSession();
      return;
    }
    
    // On native platforms, confirm before discarding and deleting
    Alert.alert(
      'Sair do Treino',
      'Deseja sair sem salvar este treino? O treino será excluído.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair e Excluir',
          style: 'destructive',
          onPress: deleteSession
        }
      ]
    );
  };
  
  // Handle finish workout button - save and go back
  const handleFinishWorkout = () => {
    // On web, simplify the flow
    if (Platform.OS === 'web') {
      // Show saving indicator
      setSaving(true);
      
      // Save the session
      saveWorkoutSession().then(success => {
        if (success) {
          router.back();
        } else {
          setSaving(false);
          // Since Alert doesn't work well on web, we can use a simple confirm dialog
          if (window.confirm('Error saving workout. Return anyway?')) {
            router.back();
          }
        }
      });
      return;
    }
    
    // On native platforms, show the Alert dialog
    Alert.alert(
      'Finalizar Treino',
      'Tem certeza que deseja finalizar este treino?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Finalizar',
          onPress: async () => {
            // Show loading
            Alert.alert('Salvando treino...', 'Por favor, aguarde...');
            
            // Save session data
            const success = await saveWorkoutSession();
            
            if (success) {
              Alert.alert(
                'Treino Finalizado',
                'Seu treino foi salvo com sucesso!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } else {
              Alert.alert(
                'Erro',
                'Ocorreu um erro ao salvar seu treino. Tente novamente.',
                [
                  {
                    text: 'Tentar Novamente',
                    onPress: () => saveWorkoutSession()
                  },
                  {
                    text: 'Voltar Mesmo Assim',
                    onPress: () => router.back(),
                    style: 'destructive'
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <Header title="Carregando treino..." onClose={() => router.back()} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={{ color: colors.text, marginTop: 16 }}>
            Carregando detalhes do treino...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <Header title="Treino não encontrado" onClose={() => router.back()} />
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>O treino selecionado não foi encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Header title={workout.title} onClose={handleClose} />
      
      <Stopwatch onTimeUpdate={handleTimeUpdate} />
      
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.savingText}>Salvando treino...</Text>
          </View>
        </View>
      )}
      
      <ScrollView 
        style={styles.exercisesContainer}
        contentContainerStyle={styles.exercisesContent}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Este treino não possui exercícios.
            </Text>
          </View>
        ) : (
          exercises.map((exercise, index) => (
            <ExerciseItem 
              key={exercise.id} 
              exercise={exercise} 
              index={index} 
              onSetUpdate={handleSetUpdate}
              onShowExerciseDetails={handleShowExerciseDetails}
            />
          ))
        )}
        
        <View style={styles.completeButtonContainer}>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleFinishWorkout}
          >
            <LinearGradient
              colors={['#4a90e2', '#3570b2']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>FINALIZAR TREINO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {renderExerciseDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  stopwatchContainer: {
    marginHorizontal: screenWidth * 0.06,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  stopwatchGradient: {
    borderRadius: 16,
  },
  stopwatchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  stopwatchTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  stopwatchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisesContainer: {
    flex: 1,
    marginTop: 16,
  },
  exercisesContent: {
    paddingHorizontal: screenWidth * 0.06,
    paddingBottom: 20,
  },
  exerciseContainer: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoButton: {
    padding: 8,
  },
  exerciseDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  setsContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsHeaderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    height: 40,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  input: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  completeButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  savingContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  setManagementContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  setButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  addButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
  },
  removeButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
  disabledButton: {
    backgroundColor: 'rgba(120, 120, 120, 0.1)',
  },
  setButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseModalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#2c2c3e',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  closeButtonModal: {
    padding: 8,
    borderRadius: 20,
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'relative',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalNoImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    height: '100%',
  },
  modalNoImageText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  modalDetailsContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 16,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  secondaryMusclesContainer: {
    marginTop: 12,
  },
  secondaryMuscleText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 16,
    marginTop: 4,
  },
  instructionsSection: {
    marginTop: 16,
  },
  instructionItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 24,
  },
  instructionText: {
    color: '#fff',
    lineHeight: 20,
    flex: 1,
  },
  tipsSection: {
    marginTop: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginLeft: 12,
  },
  variationsSection: {
    marginTop: 24,
  },
  variationItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  variationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  overviewText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  modalScrollView: {
    flex: 1,
  },
});

export default memo(WorkoutSessionScreen); 