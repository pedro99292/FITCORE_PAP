import React, { useState, useEffect, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

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

interface CardioSetData {
  time: string;
  distance: string;
}

interface CardioExerciseItemProps {
  exercise: ExerciseType;
  index: number;
  onSetUpdate: (exerciseId: string, setIndex: number, reps: string, weight: string, time?: string, distance?: string) => void;
  onShowExerciseDetails: (exerciseName: string) => void;
  isTimeBased: boolean;
}

// Helper function to format time as MM:SS
const formatTimeInput = (seconds: number | undefined): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to parse time input (MM:SS) to seconds
const parseTimeInput = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else if (parts.length === 1) {
    // If only one number, treat as minutes
    const minutes = parseInt(parts[0]) || 0;
    return minutes * 60;
  }
  return 0;
};

const CardioExerciseItem = memo(({ 
  exercise, 
  index, 
  onSetUpdate, 
  onShowExerciseDetails,
  isTimeBased 
}: CardioExerciseItemProps) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [completedSets, setCompletedSets] = useState<CardioSetData[]>([]);
  const [customSets, setCustomSets] = useState<WorkoutSetType[]>([]);
  const rotationValue = useSharedValue(0);

  // Initialize the completed sets and custom sets
  useEffect(() => {
    setCompletedSets(Array(exercise.sets.length).fill({ time: '', distance: '' }));
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

  const updateSet = (index: number, field: 'time' | 'distance', value: string) => {
    // Ensure only valid input
    if (value && field === 'distance' && !/^[0-9]*\.?[0-9]*$/.test(value)) {
      return; // Reject non-numeric input for distance
    }

    const newSets = [...completedSets];
    
    // Initialize the set if it doesn't exist
    if (!newSets[index]) {
      newSets[index] = { time: '', distance: '' };
    }

    newSets[index] = { ...newSets[index], [field]: value };
    setCompletedSets(newSets);

    // Get the current values (including the just-updated one)
    const currentTimeValue = field === 'time' ? value : newSets[index].time;
    const currentDistanceValue = field === 'distance' ? value : newSets[index].distance;

    // Convert time to seconds for the backend
    const timeInSeconds = currentTimeValue ? parseTimeInput(currentTimeValue).toString() : '';

    // For cardio exercises, we still send some values for reps/weight to maintain compatibility
    // but the actual tracking is done via time/distance
    onSetUpdate(
      exercise.id,
      index,
      isTimeBased ? timeInSeconds : '1', // Use 1 rep for non-time based cardio
      '0', // No weight for cardio
      timeInSeconds,
      currentDistanceValue || ''
    );
  };

  const addSet = () => {
    const lastSet = customSets[customSets.length - 1];
    
    // Create a new set based on the last one
    const newSet: WorkoutSetType = {
      ...lastSet,
      id: `temp-set-${Date.now()}-${exercise.id}`,
      set_order: customSets.length + 1
    };

    setCustomSets([...customSets, newSet]);
    setCompletedSets([...completedSets, { time: '', distance: '' }]);
  };

  const removeSet = () => {
    if (customSets.length <= 1) return; // Don't remove the last set
    
    const updatedCustomSets = customSets.slice(0, -1);
    setCustomSets(updatedCustomSets);
    
    const newCompletedSets = completedSets.slice(0, -1);
    setCompletedSets(newCompletedSets);
  };

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
      entering={FadeIn.delay(index * 100).springify()}
      style={[styles.exerciseCard, { backgroundColor: colors.surface }]}
    >
      <TouchableOpacity onPress={toggleExpand} style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
            {exercise.bodyPart} • {exercise.target}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => onShowExerciseDetails(exercise.name)}
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <Animated.View style={arrowStyle}>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={[styles.setsHeaderText, { flex: 0.2, color: colors.textSecondary }]}>Set</Text>
            {isTimeBased ? (
              <>
                <Text style={[styles.setsHeaderText, { flex: 0.4, color: colors.textSecondary }]}>Time (MM:SS)</Text>
                <Text style={[styles.setsHeaderText, { flex: 0.4, color: colors.textSecondary }]}>Distance (km)</Text>
              </>
            ) : (
              <>
                <Text style={[styles.setsHeaderText, { flex: 0.4, color: colors.textSecondary }]}>Distance (km)</Text>
                <Text style={[styles.setsHeaderText, { flex: 0.4, color: colors.textSecondary }]}>Time (MM:SS)</Text>
              </>
            )}
          </View>
          
          {customSets.map((set, setIndex) => (
            <View key={`${set.id}_${setIndex}`} style={styles.setRow}>
              <View style={[styles.setNumber, { flex: 0.2 }]}>
                <Text style={[styles.setNumberText, { color: colors.text }]}>{setIndex + 1}</Text>
              </View>
              
              {isTimeBased ? (
                <>
                  <View style={[styles.inputContainer, { flex: 0.4 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="05:00"
                      placeholderTextColor={colors.textSecondary}
                      value={completedSets[setIndex]?.time || ''}
                      onChangeText={(text) => updateSet(setIndex, 'time', text)}
                      keyboardType="default"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 0.4 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="5.0"
                      placeholderTextColor={colors.textSecondary}
                      value={completedSets[setIndex]?.distance || ''}
                      onChangeText={(text) => updateSet(setIndex, 'distance', text)}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.inputContainer, { flex: 0.4 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="5.0"
                      placeholderTextColor={colors.textSecondary}
                      value={completedSets[setIndex]?.distance || ''}
                      onChangeText={(text) => updateSet(setIndex, 'distance', text)}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 0.4 }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="05:00"
                      placeholderTextColor={colors.textSecondary}
                      value={completedSets[setIndex]?.time || ''}
                      onChangeText={(text) => updateSet(setIndex, 'time', text)}
                      keyboardType="default"
                    />
                  </View>
                </>
              )}
            </View>
          ))}

          <View style={styles.setControls}>
            <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
            </TouchableOpacity>
            
            {customSets.length > 1 && (
              <TouchableOpacity onPress={removeSet} style={styles.removeSetButton}>
                <Ionicons name="remove" size={16} color="#ff4757" />
                <Text style={styles.removeSetText}>Remove Set</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  exerciseCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
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
    textAlign: 'center',
  },
  restContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  restText: {
    fontSize: 12,
    textAlign: 'center',
  },
  setControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  removeSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff4757',
  },
});

export default CardioExerciseItem; 