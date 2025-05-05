import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useExercises } from '@/hooks/useExercises';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, WorkoutExercise, WorkoutSet } from '@/types/exercise';
import { Stack, router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import ExerciseCard from '@/components/ExerciseCard';
import ExerciseFilters from '@/components/ExerciseFilters';
import WorkoutSetEditor from '@/components/WorkoutSetEditor';
import { createWorkout, addExerciseToWorkout, addSetToExercise } from '@/utils/workoutService';

export default function WorkoutBuilderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('beginner');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [filters, setFilters] = useState<{ bodyPart?: string; equipment?: string; target?: string; search?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [currentEditingExerciseIndex, setCurrentEditingExerciseIndex] = useState<number | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { exercises, loading: loadingExercises, error: exercisesError, refetch: refetchExercises } = useExercises({
    bodyPart: filters.bodyPart,
    equipment: filters.equipment,
    name: filters.search,
    target: filters.target
  });

  // Get the current user
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    
    getUser();
  }, []);

  const handleFilterChange = (newFilters: { bodyPart?: string; equipment?: string; target?: string; search?: string }) => {
    setFilters(newFilters);
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    const isSelected = selectedExercises.some(e => e.exerciseId === exercise.id);
    
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter(e => e.exerciseId !== exercise.id));
    } else {
      const newWorkoutExercise: WorkoutExercise = {
        id: `temp-${Date.now()}-${exercise.id}`, // Temporary ID until saved to DB
        exerciseId: exercise.id,
        workoutId: '', // Will be set when workout is created
        order: selectedExercises.length,
        exerciseDetails: exercise, // Store the complete exercise details
        sets: [
          {
            id: `temp-set-${Date.now()}`,
            exerciseId: `temp-${Date.now()}-${exercise.id}`, // Temporary parent ID
            reps: 10,
            weight: 0,
          }
        ]
      };
      
      setSelectedExercises([...selectedExercises, newWorkoutExercise]);
    }
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...selectedExercises];
    const exercise = updatedExercises[exerciseIndex];

    // Create a new set
    const newSet: WorkoutSet = {
      id: `temp-set-${Date.now()}-${exercise.exerciseId}`,
      exerciseId: exercise.id,
      reps: 10, // Default values
      weight: 0,
    };

    // Add the new set to the exercise
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    setSelectedExercises(updatedExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, setData: Partial<WorkoutSet>) => {
    const updatedExercises = [...selectedExercises];
    const exercise = updatedExercises[exerciseIndex];
    const updatedSets = [...exercise.sets];
    
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      ...setData,
    };
    
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: updatedSets,
    };
    
    setSelectedExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...selectedExercises];
    const exercise = updatedExercises[exerciseIndex];
    
    // If this is the last set, don't remove it
    if (exercise.sets.length === 1) {
      Alert.alert('Cannot Remove', 'You need at least one set per exercise.');
      return;
    }
    
    const updatedSets = exercise.sets.filter((_, index) => index !== setIndex);
    
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: updatedSets,
    };
    
    setSelectedExercises(updatedExercises);
  };

  const removeExercise = (exerciseIndex: number) => {
    const updatedExercises = selectedExercises.filter((_, index) => index !== exerciseIndex);
    
    // Update order indices
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    setSelectedExercises(reorderedExercises);
  };

  const moveExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && exerciseIndex === 0) ||
      (direction === 'down' && exerciseIndex === selectedExercises.length - 1)
    ) {
      return;
    }
    
    const updatedExercises = [...selectedExercises];
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    
    // Swap exercises
    [updatedExercises[exerciseIndex], updatedExercises[newIndex]] = 
    [updatedExercises[newIndex], updatedExercises[exerciseIndex]];
    
    // Update order indices
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    setSelectedExercises(reorderedExercises);
  };

  const handleSaveWorkout = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Missing Information', 'Please provide a workout title.');
        return;
      }
      
      if (selectedExercises.length === 0) {
        Alert.alert('No Exercises', 'Please add at least one exercise to your workout.');
        return;
      }
      
      if (!user) {
        Alert.alert('Not Logged In', 'Please log in to save workouts.');
        return;
      }
      
      setSaving(true);
      
      // 1. Create the workout
      const workout = await createWorkout({
        user_id: user.id,
        title,
        description,
        experience_level: experienceLevel,
        duration: 0 // Placeholder
      });
      
      // 2. Add exercises to the workout
      const savedExercises = await Promise.all(
        selectedExercises.map(async (exercise) => {
          const savedExercise = await addExerciseToWorkout({
            workoutId: workout.id,
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            notes: exercise.notes
          });
          
          // 3. Add sets to each exercise
          const savedSets = await Promise.all(
            exercise.sets.map(async (set) => {
              return await addSetToExercise({
                exerciseId: savedExercise.id,
                reps: set.reps,
                weight: set.weight,
                duration: set.duration,
                distance: set.distance
              });
            })
          );
          
          return {
            ...savedExercise,
            sets: savedSets
          };
        })
      );
      
      Alert.alert(
        'Workout Saved',
        'Your workout has been saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form and navigate back to workouts list
              setTitle('');
              setDescription('');
              setExperienceLevel('beginner');
              setSelectedExercises([]);
              router.replace('/home');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'There was an error saving your workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderExerciseLibrary = () => {
    return (
      <View style={styles.libraryContainer}>
        <View style={styles.libraryHeader}>
          <Text style={styles.libraryTitle}>Exercise Library</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowExerciseSelection(false)}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <ExerciseFilters onFilterChange={handleFilterChange} />
        
        {loadingExercises ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        ) : exercisesError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Error loading exercises</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetchExercises}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No exercises found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseCard
                exercise={item}
                onSelect={toggleExerciseSelection}
                selected={selectedExercises.some(e => e.exerciseId === item.id)}
              />
            )}
            contentContainerStyle={styles.exercisesList}
          />
        )}
      </View>
    );
  };

  const renderWorkoutBuilder = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Stack.Screen 
            options={{ 
              title: 'Create Workout',
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                  <Ionicons name="arrow-back" size={24} color="#4f46e5" />
                </TouchableOpacity>
              )
            }} 
          />
          
          {/* Workout Details */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Workout Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Full Body Strength, Leg Day"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your workout..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Experience Level</Text>
              <View style={styles.levelButtons}>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      experienceLevel === level && styles.activeLevelButton
                    ]}
                    onPress={() => setExperienceLevel(level)}
                  >
                    <Text
                      style={[
                        styles.levelButtonText,
                        experienceLevel === level && styles.activeLevelButtonText
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          {/* Exercises Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowExerciseSelection(true);
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addExerciseButtonText}>Add Exercises</Text>
              </TouchableOpacity>
            </View>
            
            {selectedExercises.length === 0 ? (
              <View style={styles.noExercisesContainer}>
                <Ionicons name="barbell-outline" size={48} color="#9ca3af" />
                <Text style={styles.noExercisesText}>No exercises added yet</Text>
                <Text style={styles.noExercisesSubtext}>
                  Tap "Add Exercises" to build your workout
                </Text>
              </View>
            ) : (
              selectedExercises.map((workoutExercise, index) => {
                // Use the stored exercise details instead of looking it up
                const exercise = workoutExercise.exerciseDetails;
                
                // Fall back to finding in the exercises array if exerciseDetails is not available
                // This ensures backward compatibility with existing data
                const exerciseToUse = exercise || exercises.find(e => e.id === workoutExercise.exerciseId);
                
                if (!exerciseToUse) return null;
                
                return (
                  <View key={workoutExercise.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exerciseToUse.name}</Text>
                        <Text style={styles.exerciseTarget}>{exerciseToUse.target}</Text>
                      </View>
                      
                      <View style={styles.exerciseActions}>
                        <TouchableOpacity
                          style={styles.exerciseActionButton}
                          onPress={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <Ionicons 
                            name="chevron-up" 
                            size={20} 
                            color={index === 0 ? '#d1d5db' : '#6b7280'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.exerciseActionButton}
                          onPress={() => moveExercise(index, 'down')}
                          disabled={index === selectedExercises.length - 1}
                        >
                          <Ionicons 
                            name="chevron-down" 
                            size={20} 
                            color={index === selectedExercises.length - 1 ? '#d1d5db' : '#6b7280'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.exerciseActionButton}
                          onPress={() => removeExercise(index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <WorkoutSetEditor
                      sets={workoutExercise.sets}
                      onAddSet={() => addSet(index)}
                      onUpdateSet={(setIndex, setData) => updateSet(index, setIndex, setData)}
                      onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                    />
                  </View>
                );
              })
            )}
          </View>
          
          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveWorkout}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Workout</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return showExerciseSelection ? renderExerciseLibrary() : renderWorkoutBuilder();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeLevelButton: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  activeLevelButtonText: {
    color: '#fff',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  noExercisesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  noExercisesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 8,
  },
  noExercisesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  exerciseItem: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseTarget: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
  },
  exerciseActionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  libraryContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  exercisesList: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
}); 