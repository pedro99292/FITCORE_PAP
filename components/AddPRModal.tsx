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
import { NewPersonalRecord, RecordType } from '@/types/personalRecords';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddPRModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (record: NewPersonalRecord) => Promise<void>;
  initialExercise?: Exercise;
}

const AddPRModal: React.FC<AddPRModalProps> = ({ visible, onClose, onSave, initialExercise }) => {
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
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('kg');
  const [reps, setReps] = useState('');
  const [notes, setNotes] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
      // Only set search query if it's 3 characters or more, or empty
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
      // Apply client-side filtering for searches under 3 characters
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

  // Reset display limit when exercises change (new search, etc.)
  useEffect(() => {
    setDisplayLimit(20);
  }, [exercises]);

  // Handle loading more exercises
  const handleLoadMoreExercises = () => {
    setLoadingMoreExercises(true);
    
    // Simulate a short delay for better UX
    setTimeout(() => {
      // Load next batch of exercises
      setDisplayLimit(prevLimit => prevLimit + 20);
      setLoadingMoreExercises(false);
    }, 500);
  };

  // Helper function to get the current filtered exercises count
  const getFilteredExercisesCount = () => {
    if (exercises.length === 0) return 0;
    
    let filteredExercises = exercises;
    
    // Apply the same filtering logic as in the useEffect
    if (searchQuery.length > 0 && searchQuery.length < 3) {
      filteredExercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filteredExercises.length;
  };

  useEffect(() => {
    if (initialExercise) {
      setSelectedExercise(initialExercise);
    }
  }, [initialExercise]);

  const resetForm = () => {
    setSelectedExercise(initialExercise || null);
    setRecordType('strength');
    setValue('');
    setUnit('kg');
    setReps('');
    setNotes('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setTimeValue('');
    setTimeUnit('minutes');
    setDistanceValue('');
    setDistanceUnit('km');
    setDisplayLimit(20);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getUnitsForRecordType = (type: RecordType, currentEnduranceType?: 'time' | 'distance'): string[] => {
    switch (type) {
      case 'strength':
        return ['kg', 'lbs'];
      case 'endurance':
        return []; // Not used anymore since we have separate time/distance units
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
    setValue('');
    setReps('');
    setTimeValue('');
    setDistanceValue('');
  };

  const handleSave = async () => {
    if (!selectedExercise) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    if (recordType === 'strength') {
      // Strength record validation
      if (!value || !reps) {
        Alert.alert('Error', 'Please enter both weight and repetitions for strength records');
        return;
      }

      const numericValue = parseFloat(value);
      const numericReps = parseInt(reps);
      
      if (isNaN(numericValue) || numericValue <= 0) {
        Alert.alert('Error', 'Please enter a valid weight');
        return;
      }
      
      if (isNaN(numericReps) || numericReps <= 0) {
        Alert.alert('Error', 'Please enter valid reps');
        return;
      }

      try {
        setSaving(true);
        await onSave({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          exercise_body_part: selectedExercise.bodyPart,
          exercise_target: selectedExercise.target,
          exercise_equipment: selectedExercise.equipment,
          record_type: 'weight' as any,
          value: numericValue,
          unit,
          reps: numericReps,
          notes: notes.trim() || undefined,
        });
        handleClose();
      } catch (error) {
        Alert.alert('Error', 'Failed to save personal record');
      } finally {
        setSaving(false);
      }
    } else {
      // Endurance record validation - at least one field must be filled
      if (!timeValue && !distanceValue) {
        Alert.alert('Error', 'Please enter either time or distance (or both) for endurance records');
        return;
      }

      const records: NewPersonalRecord[] = [];

      // Create time record if provided
      if (timeValue) {
        const numericTimeValue = parseFloat(timeValue);
        if (isNaN(numericTimeValue) || numericTimeValue <= 0) {
          Alert.alert('Error', 'Please enter a valid time value');
          return;
        }
        
        records.push({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          exercise_body_part: selectedExercise.bodyPart,
          exercise_target: selectedExercise.target,
          exercise_equipment: selectedExercise.equipment,
          record_type: 'time' as any,
          value: numericTimeValue,
          unit: timeUnit,
          notes: notes.trim() || undefined,
        });
      }

      // Create distance record if provided
      if (distanceValue) {
        const numericDistanceValue = parseFloat(distanceValue);
        if (isNaN(numericDistanceValue) || numericDistanceValue <= 0) {
          Alert.alert('Error', 'Please enter a valid distance value');
          return;
        }
        
        records.push({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          exercise_body_part: selectedExercise.bodyPart,
          exercise_target: selectedExercise.target,
          exercise_equipment: selectedExercise.equipment,
          record_type: 'distance' as any,
          value: numericDistanceValue,
          unit: distanceUnit,
          notes: notes.trim() || undefined,
        });
      }

      try {
        setSaving(true);
        // Save all records
        for (const record of records) {
          await onSave(record);
        }
        handleClose();
      } catch (error) {
        Alert.alert('Error', 'Failed to save personal record');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Add New PR</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, { opacity: saving ? 0.6 : 1 }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#4a90e2" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
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

            {/* Record Type */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Record Type</Text>
              <View style={styles.recordTypeContainer}>
                {(['strength', 'endurance'] as RecordType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.recordTypeButton,
                      { 
                        backgroundColor: recordType === type ? '#4a90e2' : colors.surface,
                        borderColor: recordType === type ? '#4a90e2' : colors.border,
                      }
                    ]}
                    onPress={() => handleRecordTypeChange(type)}
                  >
                    <View style={styles.recordTypeContent}>
                      <FontAwesome 
                        name={type === 'strength' ? 'balance-scale' : 'clock-o'} 
                        size={16} 
                        color={recordType === type ? '#ffffff' : colors.text} 
                        style={styles.recordTypeIcon}
                      />
                      <View style={styles.recordTypeTextContainer}>
                        <Text style={[
                          styles.recordTypeText,
                          { color: recordType === type ? '#ffffff' : colors.text }
                        ]}>
                          {type === 'strength' ? 'STRENGTH' : 'ENDURANCE'}
                        </Text>
                        <Text style={[
                          styles.recordTypeSubtext,
                          { color: recordType === type ? 'rgba(255,255,255,0.8)' : colors.text + '60' }
                        ]}>
                          {type === 'strength' ? 'Weight & Reps' : 'Time & Distance'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Value Input */}
            <View style={styles.section}>
              {recordType === 'strength' ? (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Weight</Text>
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[styles.valueInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={value}
                      onChangeText={setValue}
                      placeholder="Enter weight"
                      placeholderTextColor={colors.text + '60'}
                      keyboardType="numeric"
                    />
                    <View style={[styles.unitContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setShowUnitPicker(true)}
                      >
                        <Text style={[styles.unitText, { color: colors.text }]}>
                          {unit.toUpperCase()}
                        </Text>
                        <FontAwesome name="chevron-down" size={12} color={colors.text + '80'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Time Input */}
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Time (Optional)</Text>
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[styles.valueInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={timeValue}
                      onChangeText={setTimeValue}
                      placeholder="Enter time"
                      placeholderTextColor={colors.text + '60'}
                      keyboardType="numeric"
                    />
                    <View style={[styles.unitContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setShowTimeUnitPicker(true)}
                      >
                        <Text style={[styles.unitText, { color: colors.text }]}>
                          {timeUnit.toUpperCase()}
                        </Text>
                        <FontAwesome name="chevron-down" size={12} color={colors.text + '80'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Distance Input */}
                  <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Distance (Optional)</Text>
                  <View style={styles.valueContainer}>
                    <TextInput
                      style={[styles.valueInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      value={distanceValue}
                      onChangeText={setDistanceValue}
                      placeholder="Enter distance"
                      placeholderTextColor={colors.text + '60'}
                      keyboardType="numeric"
                    />
                    <View style={[styles.unitContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setShowDistanceUnitPicker(true)}
                      >
                        <Text style={[styles.unitText, { color: colors.text }]}>
                          {distanceUnit.toUpperCase()}
                        </Text>
                        <FontAwesome name="chevron-down" size={12} color={colors.text + '80'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Reps Input (for strength records) */}
            {recordType === 'strength' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Repetitions</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="Enter number of reps"
                  placeholderTextColor={colors.text + '60'}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this PR..."
                placeholderTextColor={colors.text + '60'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
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
                    {displayedExercises.length < getFilteredExercisesCount() && (
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
                      Showing {displayedExercises.length} of {getFilteredExercisesCount()} exercises
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

        {/* Unit Picker Modals */}
        <Modal visible={showUnitPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.unitModalOverlay}
            activeOpacity={1}
            onPress={() => setShowUnitPicker(false)}
          >
            <View style={[styles.unitModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {getUnitsForRecordType(recordType).map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  style={[
                    styles.unitOption,
                    { borderBottomColor: colors.border },
                    unit === unitOption && { backgroundColor: '#4a90e2' + '20' }
                  ]}
                  onPress={() => {
                    setUnit(unitOption);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text style={[
                    styles.unitOptionText,
                    { color: unit === unitOption ? '#4a90e2' : colors.text }
                  ]}>
                    {unitOption.toUpperCase()}
                  </Text>
                  {unit === unitOption && (
                    <FontAwesome name="check" size={14} color="#4a90e2" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Time Unit Picker Modal */}
        <Modal visible={showTimeUnitPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.unitModalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimeUnitPicker(false)}
          >
            <View style={[styles.unitModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {getTimeUnits().map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  style={[
                    styles.unitOption,
                    { borderBottomColor: colors.border },
                    timeUnit === unitOption && { backgroundColor: '#4a90e2' + '20' }
                  ]}
                  onPress={() => {
                    setTimeUnit(unitOption);
                    setShowTimeUnitPicker(false);
                  }}
                >
                  <Text style={[
                    styles.unitOptionText,
                    { color: timeUnit === unitOption ? '#4a90e2' : colors.text }
                  ]}>
                    {unitOption.toUpperCase()}
                  </Text>
                  {timeUnit === unitOption && (
                    <FontAwesome name="check" size={14} color="#4a90e2" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Distance Unit Picker Modal */}
        <Modal visible={showDistanceUnitPicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.unitModalOverlay}
            activeOpacity={1}
            onPress={() => setShowDistanceUnitPicker(false)}
          >
            <View style={[styles.unitModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {getDistanceUnits().map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  style={[
                    styles.unitOption,
                    { borderBottomColor: colors.border },
                    distanceUnit === unitOption && { backgroundColor: '#4a90e2' + '20' }
                  ]}
                  onPress={() => {
                    setDistanceUnit(unitOption);
                    setShowDistanceUnitPicker(false);
                  }}
                >
                  <Text style={[
                    styles.unitOptionText,
                    { color: distanceUnit === unitOption ? '#4a90e2' : colors.text }
                  ]}>
                    {unitOption.toUpperCase()}
                  </Text>
                  {distanceUnit === unitOption && (
                    <FontAwesome name="check" size={14} color="#4a90e2" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  saveText: {
    color: '#4a90e2',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseSelector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  exerciseSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedExerciseDetails: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  placeholderText: {
    fontSize: 16,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recordTypeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    minHeight: 80,
  },
  recordTypeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTypeIcon: {
    marginBottom: 8,
  },
  recordTypeTextContainer: {
    alignItems: 'center',
  },
  recordTypeText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  recordTypeSubtext: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  unitContainer: {
    borderWidth: 1,
    borderRadius: 12,
    width: 100,
    height: 48,
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    height: 48,
    textAlignVertical: 'top',
  },
  // Exercise Picker Modal Styles
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 36,
    paddingVertical: 0,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIndicator: {
    backgroundColor: 'rgba(255,165,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
    marginRight: 6,
  },
  searchActiveIndicator: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginRight: 6,
  },
  searchIndicatorText: {
    color: '#ffa500',
    fontSize: 12,
    fontWeight: '600',
  },
  clearSearch: {
    padding: 4,
  },
  exerciseList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseItemDetails: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  unitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitModal: {
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 120,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  unitOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyResultsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyResultsSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  listFooter: {
    padding: 16,
    alignItems: 'center',
  },
  listFooterText: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 16,
    width: '80%',
    alignSelf: 'center',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPRModal; 