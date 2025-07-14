import React, { useState, useEffect, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
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
const [showSetsModal, setShowSetsModal] = useState(false);
const [completedSets, setCompletedSets] = useState<CardioSetData[]>([]);
const [customSets, setCustomSets] = useState<WorkoutSetType[]>([]);
  const rotationValue = useSharedValue(0);

  // Initialize the completed sets and custom sets
  useEffect(() => {
    setCompletedSets(Array(exercise.sets.length).fill({ time: '', distance: '' }));
    setCustomSets([...exercise.sets]);
  }, [exercise.sets.length]);

  const toggleExpand = () => {
    console.log('Opening cardio sets modal for:', exercise.name);
    setShowSetsModal(true);
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
      <TouchableOpacity 
        onPress={toggleExpand} 
        style={styles.exerciseHeader}
        activeOpacity={0.7}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseDetails, { color: colors.textSecondary }]}>
            {exercise.bodyPart} • {exercise.target}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={(event) => {
              event.stopPropagation();
              onShowExerciseDetails(exercise.name);
            }}
            style={styles.infoButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.arrowContainer}
            onPress={() => {
              console.log('Cardio arrow pressed for:', exercise.name);
              toggleExpand();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Animated.View style={arrowStyle}>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Cardio Sets Modal */}
      <Modal
        visible={showSetsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSetsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalExerciseTitle}>
                {exercise.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSetsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Column Headers */}
            <View style={styles.modalSetsHeader}>
              <Text style={styles.modalHeaderText}>Set</Text>
              {isTimeBased ? (
                <>
                  <Text style={styles.modalHeaderText}>Time (MM:SS)</Text>
                  <Text style={styles.modalHeaderText}>Distance (km)</Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalHeaderText}>Distance (km)</Text>
                  <Text style={styles.modalHeaderText}>Time (MM:SS)</Text>
                </>
              )}
            </View>
            
            {/* Sets List */}
            <ScrollView style={styles.modalSetsContainer}>
              {customSets.map((set, setIndex) => (
                <View key={`${set.id}_${setIndex}`} style={styles.modalSetRow}>
                  {/* Set Number */}
                  <View style={styles.modalSetNumber}>
                    <Text style={styles.modalSetNumberText}>{setIndex + 1}</Text>
                  </View>
                  
                  {isTimeBased ? (
                    <>
                      {/* Time Input */}
                      <View style={styles.modalInputWrapper}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="05:00"
                          placeholderTextColor="#666"
                          value={completedSets[setIndex]?.time || ''}
                          onChangeText={(text) => updateSet(setIndex, 'time', text)}
                          keyboardType="default"
                        />
                      </View>
                      
                      {/* Distance Input */}
                      <View style={styles.modalInputWrapper}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="5.0"
                          placeholderTextColor="#666"
                          value={completedSets[setIndex]?.distance || ''}
                          onChangeText={(text) => updateSet(setIndex, 'distance', text)}
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Distance Input */}
                      <View style={styles.modalInputWrapper}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="5.0"
                          placeholderTextColor="#666"
                          value={completedSets[setIndex]?.distance || ''}
                          onChangeText={(text) => updateSet(setIndex, 'distance', text)}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      {/* Time Input */}
                      <View style={styles.modalInputWrapper}>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="05:00"
                          placeholderTextColor="#666"
                          value={completedSets[setIndex]?.time || ''}
                          onChangeText={(text) => updateSet(setIndex, 'time', text)}
                          keyboardType="default"
                        />
                      </View>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
            
            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalAddButton]}
                onPress={addSet}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>Add Set</Text>
              </TouchableOpacity>
              
              {customSets.length > 1 && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalRemoveButton]}
                  onPress={removeSet}
                >
                  <Ionicons name="remove" size={18} color="#fff" />
                  <Text style={styles.modalButtonText}>Remove Set</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  arrowContainer: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContainer: {
    backgroundColor: '#2c2c3e',
    borderRadius: 20,
    padding: 0,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalExerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  modalSetsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  modalSetsContainer: {
    maxHeight: 250,
    paddingHorizontal: 20,
  },
  modalSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalSetNumber: {
    flex: 1,
    alignItems: 'center',
  },
  modalSetNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  modalInputWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 15,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  modalAddButton: {
    backgroundColor: '#4a90e2',
  },
  modalRemoveButton: {
    backgroundColor: '#ff4757',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CardioExerciseItem; 