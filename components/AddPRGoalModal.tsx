import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/hooks/useTheme';
import { useExerciseDB } from '@/hooks/useExerciseDB';
import { Exercise } from '@/types/exercise';
import { NewPersonalRecord, PersonalRecord, RecordType } from '@/types/personalRecords';
import SimpleDatePicker from './SimpleDatePicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddPRGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: NewPersonalRecord) => Promise<void>;
  initialExercise?: Exercise;
  initialGoal?: PersonalRecord | null;
}

const AddPRGoalModal: React.FC<AddPRGoalModalProps> = ({ visible, onClose, onSave, initialExercise, initialGoal }) => {
  const { colors, isDarkMode } = useTheme();
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Pagination state
  const [displayLimit, setDisplayLimit] = useState(20);
  const [displayedExercises, setDisplayedExercises] = useState<Exercise[]>([]);
  const [loadingMoreExercises, setLoadingMoreExercises] = useState(false);
  
  // Use ExerciseDB hook with search filter
  const { exercises, loading: exercisesLoading } = useExerciseDB({
    search: debouncedSearchQuery && debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : undefined
  });
  
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(initialExercise || null);
  const [recordType, setRecordType] = useState<RecordType>('strength');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('kg');
  const [targetReps, setTargetReps] = useState('');
  const [notes, setNotes] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Date picker states
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  
  // Endurance-specific states
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [distanceValue, setDistanceValue] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showTimeUnitPicker, setShowTimeUnitPicker] = useState(false);
  const [showDistanceUnitPicker, setShowDistanceUnitPicker] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3 || searchQuery.length === 0) {
        setDebouncedSearchQuery(searchQuery);
      } else {
        setDebouncedSearchQuery('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use effect to control how many exercises are displayed with pagination
  useEffect(() => {
    if (exercises.length > 0) {
      let filteredExercises = exercises;
      
      if (searchQuery.length > 0 && searchQuery.length < 3) {
        filteredExercises = exercises.filter(exercise =>
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setDisplayedExercises(filteredExercises.slice(0, displayLimit));
    } else {
      setDisplayedExercises([]);
    }
  }, [exercises, displayLimit, searchQuery, debouncedSearchQuery]);

  // Reset display limit when exercises change
  useEffect(() => {
    setDisplayLimit(20);
  }, [exercises]);

  // Handle loading more exercises
  const handleLoadMoreExercises = () => {
    setLoadingMoreExercises(true);
    
    setTimeout(() => {
      setDisplayLimit(prevLimit => prevLimit + 20);
      setLoadingMoreExercises(false);
    }, 500);
  };

  useEffect(() => {
    if (initialExercise) {
      setSelectedExercise(initialExercise);
    }
  }, [initialExercise]);

  // Effect to populate form when editing
  useEffect(() => {
    if (initialGoal) {
      // Find the exercise from the database
      const exercise = exercises.find(ex => ex.id === initialGoal.exercise_id);
      if (exercise) {
        setSelectedExercise(exercise);
      }
      
      setRecordType(initialGoal.record_type);
      setTargetValue((initialGoal.target_value || initialGoal.value).toString());
      setUnit(initialGoal.unit);
      setTargetReps((initialGoal.target_reps || initialGoal.reps)?.toString() || '');
      setNotes(initialGoal.notes || '');
      
      if (initialGoal.target_date) {
        setTargetDate(new Date(initialGoal.target_date));
      }
      
      // Set endurance-specific values
      if (initialGoal.record_type === 'time') {
        setTimeValue((initialGoal.target_value || initialGoal.value).toString());
        setTimeUnit(initialGoal.unit);
      } else if (initialGoal.record_type === 'distance') {
        setDistanceValue((initialGoal.target_value || initialGoal.value).toString());
        setDistanceUnit(initialGoal.unit);
      }
    }
  }, [initialGoal, exercises]);

  const resetForm = () => {
    setSelectedExercise(initialExercise || null);
    setRecordType('strength');
    setTargetValue('');
    setUnit('kg');
    setTargetReps('');
    setNotes('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setTimeValue('');
    setTimeUnit('minutes');
    setDistanceValue('');
    setDistanceUnit('km');
    setDisplayLimit(20);
    setTargetDate(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getUnitsForRecordType = (type: RecordType): string[] => {
    switch (type) {
      case 'strength':
        return ['kg', 'lbs'];
      case 'endurance':
        return [];
      default:
        return ['kg'];
    }
  };

  const getTimeUnits = (): string[] => ['seconds', 'minutes', 'hours'];
  const getDistanceUnits = (): string[] => ['m', 'km', 'miles'];

  const handleRecordTypeChange = (newType: RecordType) => {
    setRecordType(newType);
    if (newType === 'strength') {
      const newUnits = getUnitsForRecordType(newType);
      setUnit(newUnits[0]);
    }
    setTargetValue('');
    setTargetReps('');
    setTimeValue('');
    setDistanceValue('');
  };



  const handleSave = async () => {
    if (!selectedExercise) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    if (recordType === 'strength') {
      if (!targetValue || !targetReps) {
        Alert.alert('Error', 'Please enter both target weight and repetitions for strength goals');
        return;
      }

      const numericValue = parseFloat(targetValue);
      const numericReps = parseInt(targetReps);

      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'Please enter a valid weight');
        return;
      }

      if (isNaN(numericReps) || numericReps <= 0) {
        Alert.alert('Error', 'Please enter valid repetitions');
        return;
      }
    } else if (recordType === 'time') {
      if (!timeValue) {
        Alert.alert('Error', 'Please enter a target time');
        return;
      }

      const numericValue = parseFloat(timeValue);
      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'Please enter a valid time');
        return;
      }
    } else if (recordType === 'distance') {
      if (!distanceValue) {
        Alert.alert('Error', 'Please enter a target distance');
        return;
      }

      const numericValue = parseFloat(distanceValue);
      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'Please enter a valid distance');
        return;
      }
    } else {
      if (!targetValue) {
        Alert.alert('Error', 'Please enter a target value');
        return;
      }

      const numericValue = parseFloat(targetValue);
      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'Please enter a valid target value');
        return;
      }
    }

    try {
      setSaving(true);

      let finalValue: number;
      let finalUnit: string;

      if (recordType === 'time') {
        finalValue = parseFloat(timeValue);
        finalUnit = timeUnit;
      } else if (recordType === 'distance') {
        finalValue = parseFloat(distanceValue);
        finalUnit = distanceUnit;
      } else {
        finalValue = parseFloat(targetValue);
        finalUnit = unit;
      }

      const goal: NewPersonalRecord = {
        exercise_id: selectedExercise.id,
        exercise_name: selectedExercise.name,
        exercise_body_part: selectedExercise.bodyPart,
        exercise_target: selectedExercise.target,
        exercise_equipment: selectedExercise.equipment,
        record_type: recordType,
        target_value: finalValue,
        value: finalValue,
        unit: finalUnit,
        target_reps: recordType === 'strength' ? parseInt(targetReps) : undefined,
        reps: recordType === 'strength' ? parseInt(targetReps) : undefined,
        target_date: targetDate?.toISOString(),
        notes: notes.trim() || undefined,
        record_category: 'goal',
        status: 'active',
      };

      await onSave(goal);
      handleClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderExerciseItem = (exercise: Exercise, index: number) => (
    <TouchableOpacity
      key={`${exercise.id}-${index}`}
      style={[
        styles.exerciseItem,
        { borderColor: colors.border },
        selectedExercise?.id === exercise.id && { borderColor: '#4a90e2', backgroundColor: '#4a90e2' + '15' }
      ]}
      onPress={() => {
        setSelectedExercise(exercise);
        setShowExercisePicker(false);
      }}
    >
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: colors.text }]}>
          {exercise.name}
        </Text>
        <View style={styles.exerciseDetails}>
          {exercise.bodyPart && (
            <Text style={[styles.exerciseDetail, { color: colors.text + '80' }]}>
              {exercise.bodyPart}
            </Text>
          )}
          {exercise.target && (
            <Text style={[styles.exerciseDetail, { color: colors.text + '60' }]}>
              • {exercise.target}
            </Text>
          )}
        </View>
      </View>
      
      {selectedExercise?.id === exercise.id && (
        <Ionicons name="checkmark-circle" size={24} color="#4a90e2" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {initialGoal ? 'Edit Goal' : 'Set PR Goal'}
            </Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, { opacity: saving ? 0.5 : 1 }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#4a90e2" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Exercise Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercise</Text>
              <TouchableOpacity
                style={[styles.exerciseSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowExercisePicker(true)}
              >
                <View style={styles.exerciseSelectorContent}>
                  {selectedExercise ? (
                    <View>
                      <Text style={[styles.selectedExerciseName, { color: colors.text }]}>
                        {selectedExercise.name}
                      </Text>
                      <Text style={[styles.selectedExerciseDetails, { color: colors.text + '80' }]}>
                        {selectedExercise.bodyPart} • {selectedExercise.equipment}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.placeholderText, { color: colors.text + '60' }]}>
                      Select an exercise
                    </Text>
                  )}
                  <FontAwesome name="chevron-down" size={14} color={colors.text + '60'} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Record Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Goal Type</Text>
              <View style={styles.recordTypeContainer}>
                {(['strength', 'time', 'distance'] as RecordType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.recordTypeButton,
                      { borderColor: colors.border },
                      recordType === type && { backgroundColor: '#4a90e2', borderColor: '#4a90e2' }
                    ]}
                    onPress={() => handleRecordTypeChange(type)}
                  >
                    <Text style={[
                      styles.recordTypeText,
                      { color: recordType === type ? '#ffffff' : colors.text }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Value Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Value</Text>
              
              {recordType === 'strength' && (
                <View style={styles.strengthContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text + '80' }]}>Weight</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                          borderColor: colors.border, 
                          color: colors.text 
                        }]}
                        placeholder="0"
                        placeholderTextColor={colors.text + '60'}
                        value={targetValue}
                        onChangeText={setTargetValue}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={[styles.unitButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowUnitPicker(!showUnitPicker)}
                      >
                        <Text style={[styles.unitText, { color: colors.text }]}>{unit}</Text>
                        <FontAwesome name="chevron-down" size={10} color={colors.text + '60'} />
                      </TouchableOpacity>
                    </View>
                    
                    {showUnitPicker && (
                      <View style={[styles.unitPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {getUnitsForRecordType(recordType).map((unitOption) => (
                          <TouchableOpacity
                            key={unitOption}
                            style={[styles.unitOption, unit === unitOption && { backgroundColor: '#4a90e2' + '20' }]}
                            onPress={() => {
                              setUnit(unitOption);
                              setShowUnitPicker(false);
                            }}
                          >
                            <Text style={[styles.unitOptionText, { color: colors.text }]}>{unitOption}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text + '80' }]}>Repetitions</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                        borderColor: colors.border, 
                        color: colors.text 
                      }]}
                      placeholder="0"
                      placeholderTextColor={colors.text + '60'}
                      value={targetReps}
                      onChangeText={setTargetReps}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {recordType === 'time' && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                        borderColor: colors.border, 
                        color: colors.text 
                      }]}
                      placeholder="0"
                      placeholderTextColor={colors.text + '60'}
                      value={timeValue}
                      onChangeText={setTimeValue}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={[styles.unitButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => setShowTimeUnitPicker(!showTimeUnitPicker)}
                    >
                      <Text style={[styles.unitText, { color: colors.text }]}>{timeUnit}</Text>
                      <FontAwesome name="chevron-down" size={10} color={colors.text + '60'} />
                    </TouchableOpacity>
                  </View>
                  
                  {showTimeUnitPicker && (
                    <View style={[styles.unitPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {getTimeUnits().map((unitOption) => (
                        <TouchableOpacity
                          key={unitOption}
                          style={[styles.unitOption, timeUnit === unitOption && { backgroundColor: '#4a90e2' + '20' }]}
                          onPress={() => {
                            setTimeUnit(unitOption);
                            setShowTimeUnitPicker(false);
                          }}
                        >
                          <Text style={[styles.unitOptionText, { color: colors.text }]}>{unitOption}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {recordType === 'distance' && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                        borderColor: colors.border, 
                        color: colors.text 
                      }]}
                      placeholder="0"
                      placeholderTextColor={colors.text + '60'}
                      value={distanceValue}
                      onChangeText={setDistanceValue}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={[styles.unitButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => setShowDistanceUnitPicker(!showDistanceUnitPicker)}
                    >
                      <Text style={[styles.unitText, { color: colors.text }]}>{distanceUnit}</Text>
                      <FontAwesome name="chevron-down" size={10} color={colors.text + '60'} />
                    </TouchableOpacity>
                  </View>
                  
                  {showDistanceUnitPicker && (
                    <View style={[styles.unitPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {getDistanceUnits().map((unitOption) => (
                        <TouchableOpacity
                          key={unitOption}
                          style={[styles.unitOption, distanceUnit === unitOption && { backgroundColor: '#4a90e2' + '20' }]}
                          onPress={() => {
                            setDistanceUnit(unitOption);
                            setShowDistanceUnitPicker(false);
                          }}
                        >
                          <Text style={[styles.unitOptionText, { color: colors.text }]}>{unitOption}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {!['strength', 'time', 'distance'].includes(recordType) && (
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                    borderColor: colors.border, 
                    color: colors.text 
                  }]}
                  placeholder="Enter target value"
                  placeholderTextColor={colors.text + '60'}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                />
              )}
            </View>

            {/* Target Date */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Date (Optional)</Text>
              <SimpleDatePicker
                date={targetDate}
                onDateChange={setTargetDate}
                placeholder="Set target date"
                minimumDate={new Date()}
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.notesInput, { 
                  backgroundColor: isDarkMode ? colors.surface : '#f8f9fa', 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                placeholder="Add any notes about this goal..."
                placeholderTextColor={colors.text + '60'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Exercise Picker Modal */}
        <Modal visible={showExercisePicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
                <FontAwesome name="times" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Exercise</Text>
              <View style={{ width: 20 }} />
            </View>

            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color={colors.text + '60'} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search exercises${searchQuery.length > 0 && searchQuery.length < 3 ? ` (${3 - searchQuery.length} more)` : '...'}`}
                placeholderTextColor={colors.text + '60'}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.searchActions}>
                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <View style={styles.searchIndicator}>
                    <Text style={styles.searchIndicatorText}>{searchQuery.length}/3</Text>
                  </View>
                )}
                {searchQuery.length >= 3 && (
                  <View style={styles.searchActiveIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  </View>
                )}
                {searchQuery && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }} 
                    style={styles.clearSearch}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.text + '60'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={styles.exerciseList}>
              {exercisesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4a90e2" />
                  <Text style={[styles.loadingText, { color: colors.text }]}>Loading exercises...</Text>
                </View>
              ) : displayedExercises.length > 0 ? (
                <>
                  {displayedExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedExercise(exercise);
                        setShowExercisePicker(false);
                      }}
                    >
                      <View>
                        <Text style={[styles.exerciseItemName, { color: colors.text }]}>
                          {exercise.name}
                        </Text>
                        <Text style={[styles.exerciseItemDetails, { color: colors.text + '80' }]}>
                          {exercise.bodyPart} • {exercise.target} • {exercise.equipment}
                        </Text>
                      </View>
                      <FontAwesome name="chevron-right" size={14} color={colors.text + '60'} />
                    </TouchableOpacity>
                  ))}
                  <View style={styles.listFooter}>
                    {displayedExercises.length < exercises.length && (
                      <TouchableOpacity 
                        style={styles.loadMoreButton}
                        onPress={handleLoadMoreExercises}
                        disabled={loadingMoreExercises}
                      >
                        {loadingMoreExercises ? (
                          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        ) : (
                          <Ionicons name="arrow-down-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.loadMoreButtonText}>
                          {loadingMoreExercises ? 'Loading...' : 'Load More'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.listFooterText, { color: colors.text + '60' }]}>
                      Showing {displayedExercises.length} of {exercises.length} exercises
                      {searchQuery.length >= 3 && ` for "${searchQuery}"`}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyResultsContainer}>
                  <Ionicons name="fitness-outline" size={60} color="rgba(255,255,255,0.2)" />
                  <Text style={[styles.emptyResultsText, { color: colors.text }]}>
                    {searchQuery.length >= 3 ? 'No exercises found' : searchQuery.length > 0 ? 'Keep typing to search...' : 'Start typing to search exercises'}
                  </Text>
                  <Text style={[styles.emptyResultsSubtext, { color: colors.text + '60' }]}>
                    {searchQuery.length >= 3 ? 'Try a different search term' : 'Search for exercises by name'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseSelector: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exerciseSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  exercisePicker: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDetail: {
    fontSize: 12,
    marginRight: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recordTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  recordTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  strengthContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    flex: 1,
  },
  inputWithUnit: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
    minWidth: 70,
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unitPicker: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  unitOptionText: {
    fontSize: 14,
  },

  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 80,
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedExerciseDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIndicator: {
    backgroundColor: '#ff9800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  searchIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  searchActiveIndicator: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    padding: 2,
  },
  clearSearch: {
    padding: 2,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseItemDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  listFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listFooterText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddPRGoalModal; 