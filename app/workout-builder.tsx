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
  Platform,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Image,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { useExerciseDB, useTargets, useEquipment } from '@/hooks/useExerciseDB';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Exercise, WorkoutExercise, WorkoutSet } from '@/types/exercise';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import ExerciseCard from '@/components/ExerciseCard';
import ExerciseFilters from '@/components/ExerciseFilters';
import WorkoutSetEditor from '@/components/WorkoutSetEditor';
import { createWorkout, addExerciseToWorkout, addSetToExercise } from '@/utils/workoutService';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define exercise category icons
const categoryIcons = {
  'abs': 'stomach',
  'arms': 'fitness',
  'back': 'human-handsup',
  'chest': 'pectorals',
  'legs': 'human-male',
  'shoulders': 'arm-flex',
  'cardio': 'run'
};

// Define types for our exercise groups
interface ExerciseGroup {
  exerciseId: string;
  order: number;
  sets: WorkoutSet[];
  exerciseDetails: Exercise;
}

export default function WorkoutBuilderScreen() {
  const { colors, isDarkMode } = useTheme();
  
  // Extended theme with additional colors to match the app design
  const extendedColors = {
    ...colors,
    cardBackground: colors.surface,
    textLight: colors.textSecondary,
    textMuted: colors.textSecondary,
    secondary: '#6366f1',
    success: '#10b981',
    accent: '#4a90e2'
  };
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  
  // Track expanded exercises
  const [expandedExercises, setExpandedExercises] = useState<{[key: string]: boolean}>({});
  
  // Add state for cardio exercises
  const [selectedCardioExercises, setSelectedCardioExercises] = useState<WorkoutExercise[]>([]);
  const [expandedCardioExercises, setExpandedCardioExercises] = useState<{[key: string]: boolean}>({});
  
  // Toggle exercise expansion
  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };
  
  const toggleCardioExerciseExpansion = (exerciseId: string) => {
    setExpandedCardioExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };
  
  // Enhanced state for exercise library
  const [activeTarget, setActiveTarget] = useState('');
  const [activeEquipment, setActiveEquipment] = useState('');
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ target?: string; equipment?: string; search?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [currentEditingExerciseIndex, setCurrentEditingExerciseIndex] = useState<number | null>(null);
  const [loadingMoreExercises, setLoadingMoreExercises] = useState(false);
  const [displayedExercises, setDisplayedExercises] = useState<Exercise[]>([]);
  const [displayLimit, setDisplayLimit] = useState(20);
  
  // Add state to track cardio selection mode
  const [isCardioSelectionMode, setIsCardioSelectionMode] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  // Available categories based on filter type
  const [targetMuscles, setTargetMuscles] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);

  // Use the hooks to fetch all options
  const { equipment: allEquipment, loading: loadingEquipment } = useEquipment();
  const { targets: allTargets, loading: loadingTargets } = useTargets();

  const { exercises, loading: loadingExercises, error: exercisesError, isMissingApiKey, refetch: refetchExercises } = useExerciseDB({
    target: filters.target,
    equipment: filters.equipment,
    name: filters.search
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
  
  // Run animation when exercise selection modal opens
  useEffect(() => {
    if (showExerciseSelection) {
      // Reset position
      slideAnim.setValue(screenWidth);
      fadeAnim.setValue(0);
      
      // Run animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showExerciseSelection]);
  
  // Update target muscles and equipment categories based on loaded data
  useEffect(() => {
    if (allTargets && allTargets.length > 0) {
      setTargetMuscles(allTargets);
    }
  }, [allTargets]);
  
  // Update equipment list when allEquipment changes
  useEffect(() => {
    if (allEquipment && allEquipment.length > 0) {
      setEquipmentList(allEquipment);
    }
  }, [allEquipment]);
  
  // Add debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only set search query if it's 2 characters or more, or empty
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        setDebouncedSearchQuery(searchQuery);
      } else {
        setDebouncedSearchQuery('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter exercises when category changes
  useEffect(() => {
    const newFilters: any = { ...filters };
    
    // Clear previous filter values
    delete newFilters.target;
    delete newFilters.equipment;
    
    // Set filters based on active selections
    if (activeTarget) {
      newFilters.target = activeTarget;
    }
    
    if (activeEquipment) {
      newFilters.equipment = activeEquipment;
    }
    
    // Set search query only if it's 2 characters or more
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      newFilters.search = debouncedSearchQuery;
    } else {
      delete newFilters.search;
    }
    
    setFilters(newFilters);
  }, [activeTarget, activeEquipment, debouncedSearchQuery]);

  const handleFilterChange = (newFilters: { target?: string; equipment?: string; search?: string }) => {
    setFilters(newFilters);
  };
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.clear();
    }
  };

  const toggleExerciseSelection = (exercise: Exercise, isCardio: boolean = false) => {
    // Automatically detect if it's a cardio exercise based on bodyPart
    const exerciseIsCardio = isCardio || 
      exercise.bodyPart.toLowerCase() === 'cardio' || 
      exercise.target.toLowerCase().includes('cardiovascular');
    
    const selectedArray = exerciseIsCardio ? selectedCardioExercises : selectedExercises;
    const setSelectedArray = exerciseIsCardio ? setSelectedCardioExercises : setSelectedExercises;
    
    const isSelected = selectedArray.some(e => e.exerciseId === exercise.id);
    
    if (isSelected) {
      const updatedExercises = selectedArray.filter(e => e.exerciseId !== exercise.id);
      // Re-number the remaining exercises to maintain 1-based ordering
      const reorderedExercises = updatedExercises.map((ex, idx) => ({
        ...ex,
        order: idx + 1
      }));
      setSelectedArray(reorderedExercises);
    } else {
      const isTimeBased = exerciseIsCardio && isTimeBasedExercise(exercise.name);
      
      const newWorkoutExercise: WorkoutExercise = {
        id: `temp-${Date.now()}-${exercise.id}`, // Temporary ID until saved to DB
        exerciseId: exercise.id,
        workoutId: '', // Will be set when workout is created
        order: selectedArray.length + 1, // 1-based ordering
        exerciseDetails: exercise, // Store the complete exercise details
        sets: [
          {
            id: `temp-set-${Date.now()}`,
            exerciseId: `temp-${Date.now()}-${exercise.id}`, // Temporary parent ID
            reps: isTimeBased ? 300 : 10, // Default to 5 minutes (300 seconds) for time-based, 10 reps for others
            weight: 0,
            duration: 60, // Default rest time in seconds
            setOrder: 1 // First set
          }
        ]
      };
      
      setSelectedArray([...selectedArray, newWorkoutExercise]);
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
      duration: 60, // Default rest time in seconds
      setOrder: exercise.sets.length + 1 // Set order based on position
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
    
    // Update order indices to be 1-based (1, 2, 3...)
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1
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
    
    // Update order indices - make sure they're 1-based (1, 2, 3...)
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1
    }));
    
    setSelectedExercises(reorderedExercises);
  };

  // List of cardio exercises that should use time-based input
  const timeBasedCardioExercises = [
    'run',
    'run (equipment)',
    'stationary bike walk',
    'stationary bike run v.3',
    'walk elliptical cross trainer',
    'walking on stepmill',
    'cycle cross trainer',
    'jump rope',
    'wheel run',
    'push to run'
  ];

  // Helper function to check if an exercise should use time-based input
  const isTimeBasedExercise = (exerciseName: string): boolean => {
    return timeBasedCardioExercises.some(timeBasedName => 
      exerciseName.toLowerCase().includes(timeBasedName.toLowerCase())
    );
  };

  const addCardioSet = (exerciseIndex: number) => {
    const updatedExercises = [...selectedCardioExercises];
    const exercise = updatedExercises[exerciseIndex];
    const isTimeBased = isTimeBasedExercise(exercise.exerciseDetails?.name || '');

    // Create a new set
    const newSet: WorkoutSet = {
      id: `temp-set-${Date.now()}-${exercise.exerciseId}`,
      exerciseId: exercise.id,
      reps: isTimeBased ? 300 : 10, // Default to 5 minutes (300 seconds) for time-based, 10 reps for others
      weight: 0,
      duration: 60, // Default rest time in seconds
      setOrder: exercise.sets.length + 1 // Set order based on position
    };

    // Add the new set to the exercise
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    setSelectedCardioExercises(updatedExercises);
  };

  const updateCardioSet = (exerciseIndex: number, setIndex: number, setData: Partial<WorkoutSet>) => {
    const updatedExercises = [...selectedCardioExercises];
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
    
    setSelectedCardioExercises(updatedExercises);
  };

  const removeCardioSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...selectedCardioExercises];
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
    
    setSelectedCardioExercises(updatedExercises);
  };

  const removeCardioExercise = (exerciseIndex: number) => {
    const updatedExercises = selectedCardioExercises.filter((_, index) => index !== exerciseIndex);
    
    // Update order indices to be 1-based (1, 2, 3...)
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1
    }));
    
    setSelectedCardioExercises(reorderedExercises);
  };

  const moveCardioExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && exerciseIndex === 0) ||
      (direction === 'down' && exerciseIndex === selectedCardioExercises.length - 1)
    ) {
      return;
    }
    
    const updatedExercises = [...selectedCardioExercises];
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    
    // Swap exercises
    [updatedExercises[exerciseIndex], updatedExercises[newIndex]] = 
    [updatedExercises[newIndex], updatedExercises[exerciseIndex]];
    
    // Update order indices - make sure they're 1-based (1, 2, 3...)
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1
    }));
    
    setSelectedCardioExercises(reorderedExercises);
  };

  // State for edit mode and workout ID
  const [isEditMode, setIsEditMode] = useState(false);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);

  // Add useLocalSearchParams to get the workoutId from URL
  const params = useLocalSearchParams();

  // First, let's add a flag to prevent infinite retrying
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Then modify the useEffect that checks for workoutId
  useEffect(() => {
    const id = params?.workoutId;
    if (id && !fetchAttempted) {
      setIsEditMode(true);
      setWorkoutId(id.toString());
      setFetchAttempted(true);
      fetchWorkoutDetails(id.toString());
    }
  }, [params, fetchAttempted]);

  // Modify the fetch function to use exercise details from workout_sets table
  const fetchWorkoutDetails = async (id: string) => {
    try {
      setIsLoadingWorkout(true);
      
      // Fetch workout details
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('workout_id', id)
        .single();
      
      if (workoutError) {
        console.error('Error fetching workout details:', workoutError);
        Alert.alert('Error', 'Failed to load workout details');
        return;
      }
      
      if (!workout) {
        Alert.alert('Error', 'Workout not found');
        return;
      }
      
      // Set basic workout info
      setTitle(workout.title);
      setDescription(workout.description || '');
      
      // Fetch workout sets
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', id)
        .order('set_order', { ascending: true });
      
      if (setsError) {
        console.error('Error fetching workout sets:', setsError);
        return;
      }
      
      if (!sets || sets.length === 0) {
        setSelectedExercises([]);
        setSelectedCardioExercises([]);
        return;
      }
      
      // Group sets by exercise first
      const exerciseGroups: Record<string, ExerciseGroup> = {};
      const cardioExerciseGroups: Record<string, ExerciseGroup> = {};
      
      for (const set of sets) {
        const exerciseId = set.exercise_id;
        const exerciseOrder = Math.floor(set.set_order / 100);
        const setOrder = set.set_order % 100;
        const isCardio = set.is_cardio === true;
        
        const targetGroups = isCardio ? cardioExerciseGroups : exerciseGroups;
        
        if (!targetGroups[exerciseId]) {
          targetGroups[exerciseId] = {
            exerciseId,
            order: exerciseOrder,
            // Create object with exercise details from the workout_sets table
            exerciseDetails: {
              id: exerciseId,
              name: set.exercise_name || `Exercise ${exerciseOrder}`,
              bodyPart: set.exercise_bodypart || 'General',
              target: set.exercise_target || 'Muscle',
              equipment: set.exercise_equipment || 'Body weight',
              gifUrl: '', // Required by type but not used in display
              instructions: []
            },
            sets: []
          };
        }
        
        targetGroups[exerciseId].sets.push({
          id: set.id,
          exerciseId: `workout-${id}-exercise-${exerciseId}`,
          reps: set.planned_reps || 0,
          weight: set.weight || 0,
          duration: set.rest_time || 60,
          setOrder: setOrder
        });
      }
      
      // Now create the workout exercises with data from the workout_sets table
      const workoutExercises: WorkoutExercise[] = Object.values(exerciseGroups).map((group) => {
        const { exerciseId, order, exerciseDetails, sets } = group;
        
        return {
          id: `workout-${id}-exercise-${exerciseId}`,
          exerciseId: exerciseId,
          workoutId: id,
          order: order,
          exerciseDetails: exerciseDetails,
          sets: sets
        };
      });
      
      // Create cardio exercises
      const cardioWorkoutExercises: WorkoutExercise[] = Object.values(cardioExerciseGroups).map((group) => {
        const { exerciseId, order, exerciseDetails, sets } = group;
        
        return {
          id: `workout-${id}-exercise-${exerciseId}-cardio`,
          exerciseId: exerciseId,
          workoutId: id,
          order: order,
          exerciseDetails: exerciseDetails,
          sets: sets
        };
      });
      
      // Sort by order
      workoutExercises.sort((a, b) => a.order - b.order);
      cardioWorkoutExercises.sort((a, b) => a.order - b.order);
      
      setSelectedExercises(workoutExercises);
      setSelectedCardioExercises(cardioWorkoutExercises);
    } catch (error) {
      console.error('Error loading workout details:', error);
      Alert.alert('Error', 'Failed to load workout');
    } finally {
      setIsLoadingWorkout(false);
    }
  };
  
  const handleSaveWorkout = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Missing Information', 'Please provide a workout title.');
        return;
      }
      
      if (selectedExercises.length === 0 && selectedCardioExercises.length === 0) {
        Alert.alert('No Exercises', 'Please add at least one exercise to your workout.');
        return;
      }
      
      if (!user) {
        Alert.alert('Not Logged In', 'Please log in to save workouts.');
        return;
      }
      
      setSaving(true);
      
      let workoutData;
      
      if (isEditMode && workoutId) {
        // Update existing workout
        const { data: updatedWorkout, error: updateError } = await supabase
          .from('workouts')
          .update({
            title: title,
            description: description || null,
          })
          .eq('workout_id', workoutId)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error updating workout:', updateError);
          throw new Error(`Failed to update workout: ${updateError.message}`);
        }
        
        workoutData = updatedWorkout;
        
        // Delete existing sets to replace them
        const { error: deleteError } = await supabase
          .from('workout_sets')
          .delete()
          .eq('workout_id', workoutId);
        
        if (deleteError) {
          console.error('Error deleting existing sets:', deleteError);
        }
      } else {
        // Create new workout
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            title: title,
            description: description || null,
            workout_type: 'user_created',
          })
          .select()
          .single();
        
        // Log any workout creation errors
        if (workoutError) {
          console.error('Supabase workout creation error:', workoutError);
          throw new Error(`Failed to create workout: ${workoutError.message}`);
        }
        
        if (!newWorkout) {
          console.error('No workout data returned');
          throw new Error('Failed to create workout: No data returned');
        }
        
        workoutData = newWorkout;
      }
      
      if (!workoutData) {
        console.error('No workout data returned');
        throw new Error('Failed to create workout: No data returned');
      }
      
      console.log('Created workout:', workoutData);
      
      // 2. Add workout sets directly
      try {
        // Save regular exercises
        for (const exercise of selectedExercises) {
          // Get exercise details to store in workout_sets
          const exerciseDetails = exercise.exerciseDetails || {
            name: 'Unknown Exercise',
            bodyPart: 'General',
            target: 'Muscle',
            equipment: 'Body weight'
          };
          
          for (const set of exercise.sets) {
            const { data: setData, error: setError } = await supabase
              .from('workout_sets')
              .insert({
                workout_id: workoutData.workout_id, // Use the workout_id from the created workout
                exercise_id: exercise.exerciseId,
                planned_reps: set.reps || 0,
                rest_time: set.duration || 60,
                set_order: (exercise.order * 100) + (set.setOrder || 1),
                is_cardio: false,
                // Add exercise details directly to the workout_sets table
                exercise_name: exerciseDetails.name,
                exercise_bodypart: exerciseDetails.bodyPart,
                exercise_target: exerciseDetails.target,
                exercise_equipment: exerciseDetails.equipment
              });
            
            if (setError) {
              console.error('Error saving set:', setError);
              throw new Error(`Failed to save set: ${setError.message}`);
            }
          }
        }
        
        // Save cardio exercises
        for (const exercise of selectedCardioExercises) {
          // Get exercise details to store in workout_sets
          const exerciseDetails = exercise.exerciseDetails || {
            name: 'Unknown Cardio Exercise',
            bodyPart: 'Cardio',
            target: 'Cardiovascular System',
            equipment: 'Body weight'
          };
          
          for (const set of exercise.sets) {
            const { data: setData, error: setError } = await supabase
              .from('workout_sets')
              .insert({
                workout_id: workoutData.workout_id,
                exercise_id: exercise.exerciseId,
                planned_reps: set.reps || 0,
                rest_time: set.duration || 60,
                set_order: (exercise.order * 100) + (set.setOrder || 1),
                is_cardio: true,
                // Add exercise details directly to the workout_sets table
                exercise_name: exerciseDetails.name,
                exercise_bodypart: exerciseDetails.bodyPart,
                exercise_target: exerciseDetails.target,
                exercise_equipment: exerciseDetails.equipment
              });
            
            if (setError) {
              console.error('Error saving cardio set:', setError);
              throw new Error(`Failed to save cardio set: ${setError.message}`);
            }
          }
        }
        
        // Clear form data
        setTitle('');
        setDescription('');
        setSelectedExercises([]);
        setSelectedCardioExercises([]);
        
        // Show success message
        Alert.alert(
          'Workout Saved',
          'Your workout has been saved successfully!',
          [{ text: 'OK' }]
        );
        
        // Navigate to workouts page
        router.push('/workouts');
        
      } catch (error) {
        console.error('Error saving workout details:', error);
        Alert.alert('Error', 'There was an error saving your workout details. Please try again.');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', `There was an error saving your workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const goToProfile = () => {
    router.push('/(tabs)/profile');
  };
  
  const goBack = () => {
    router.push('/workouts');
  };
  
  const closeExerciseLibrary = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowExerciseSelection(false);
      // Reset cardio selection mode when closing
      setIsCardioSelectionMode(false);
    });
  };
  
  // Get exercise icon based on category
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    
    for (const [key, value] of Object.entries(categoryIcons)) {
      if (lowerCategory.includes(key)) {
        return value;
      }
    }
    
    // Default icon if no match
    return 'dumbbell';
  };

  // First, update the renderExerciseLibrary function with a simpler button approach
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<'target' | 'equipment' | null>(null);
  
  // Add this function to handle filter selection
  const handleFilterSelect = (type: 'target' | 'equipment', value: string) => {
    if (type === 'target') {
      setActiveTarget(value);
    } else {
      setActiveEquipment(value);
    }
    setFilterModalVisible(false);
  };

  // Modify the renderExerciseLibrary function
  const renderExerciseLibrary = () => {
    return (
      <Animated.View
        style={[
          styles.libraryContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {/* Fixed Header with SafeAreaView */}
        <SafeAreaViewRN style={styles.libraryHeaderSafeArea} edges={['top']}>
          <LinearGradient
            colors={['#2e2e40', '#262635']}
            style={styles.libraryHeader}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeExerciseLibrary}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.libraryTitle}>
              {isCardioSelectionMode ? 'Cardio Exercises' : 'Exercise Library'}
            </Text>
            <View style={styles.headerRight}>
              <Text style={styles.selectionCount}>
                {selectedExercises.length + selectedCardioExercises.length} selected
              </Text>
            </View>
          </LinearGradient>
        </SafeAreaViewRN>
        
        {/* Fixed Search and Filters */}
        <View style={styles.fixedTopContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={`Search exercises${searchQuery.length > 0 && searchQuery.length < 2 ? ` (${2 - searchQuery.length} more)` : '...'}`}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.searchActions}>
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <View style={styles.searchIndicator}>
                  <Text style={styles.searchIndicatorText}>{searchQuery.length}/2</Text>
                </View>
              )}
              {searchQuery.length >= 2 && (
                <View style={styles.searchActiveIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                </View>
              )}
              {searchQuery ? (
                <TouchableOpacity onPress={clearSearch} style={styles.clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          {/* Filter Buttons */}
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.simpleFilterButton,
                activeTarget ? styles.activeSimpleFilterButton : null
              ]}
              onPress={() => {
                setActiveFilterType('target');
                setFilterModalVisible(true);
              }}
            >
              <Ionicons name="fitness-outline" size={18} color="#fff" style={styles.filterButtonIcon} />
              <Text style={styles.filterButtonText}>
                {activeTarget || 'Target Muscle'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.simpleFilterButton,
                activeEquipment ? styles.activeSimpleFilterButton : null
              ]}
              onPress={() => {
                setActiveFilterType('equipment');
                setFilterModalVisible(true);
              }}
            >
              <Ionicons name="barbell-outline" size={18} color="#fff" style={styles.filterButtonIcon} />
              <Text style={styles.filterButtonText}>
                {activeEquipment || 'Equipment'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>
            
            {(activeTarget || activeEquipment) && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setActiveTarget('');
                  setActiveEquipment('');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear</Text>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Scrollable Exercise List */}
        <View style={styles.exerciseListContainer}>
          {loadingExercises ? (
            <View style={styles.libraryLoadingContainer}>
              <ActivityIndicator size="large" color="#4a90e2" style={styles.loadingSpinner} />
              <Text style={styles.libraryLoadingText}>Loading exercises...</Text>
            </View>
          ) : exercises.length > 0 ? (
            <FlatList
              data={displayedExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.exerciseListItem,
                    (selectedExercises.some(e => e.exerciseId === item.id) || 
                     selectedCardioExercises.some(e => e.exerciseId === item.id)) && 
                    styles.selectedExerciseItem
                  ]}
                  onPress={() => {
                    // Check if it's a cardio exercise based on bodyPart or target
                    const isCardio = item.bodyPart.toLowerCase() === 'cardio' || 
                                    item.target.toLowerCase().includes('cardiovascular');
                    toggleExerciseSelection(item, isCardio);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseImageWrapper}>
                    {item.gifUrl ? (
                      <Image
                        source={{ uri: item.gifUrl }}
                        style={styles.exerciseImage}
                        resizeMode="cover"
                        defaultSource={require('@/assets/images/muscle-silhouette-front.png')}
                      />
                    ) : (
                      <View style={styles.noImageContainer}>
                        <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.noImageText}>No image available</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.exerciseItemContent}>
                    <Text style={styles.exerciseItemName}>{item.name}</Text>
                    <Text style={styles.exerciseItemDetail}>{item.target} • {item.equipment}</Text>
                  </View>

                  <View style={styles.exerciseItemActions}>
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() => setSelectedExerciseDetails(item)}
                    >
                      <Ionicons name="information-circle-outline" size={24} color="#4a90e2" />
                    </TouchableOpacity>
                    
                    <View style={styles.exerciseItemRight}>
                      {(selectedExercises.some(e => e.exerciseId === item.id) || 
                        selectedCardioExercises.some(e => e.exerciseId === item.id)) ? (
                        <View style={styles.checkboxChecked}>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>
                      ) : (
                        <View style={styles.checkboxUnchecked} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.exercisesList}
              showsVerticalScrollIndicator={true}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={21}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => (
                { length: 100, offset: 100 * index, index }
              )}
              ListFooterComponent={() => (
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
                  <Text style={styles.listFooterText}>
                    Showing {displayedExercises.length} of {getFilteredExercisesCount()} exercises
                    {(activeTarget || activeEquipment || (debouncedSearchQuery && debouncedSearchQuery.length >= 2)) && 
                      ` (filtered from ${exercises.length} total)`
                    }
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyResultsContainer}>
              <Ionicons name="fitness-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyResultsText}>No exercises found</Text>
              <Text style={styles.emptyResultsSubtext}>Try a different search or filter</Text>
            </View>
          )}
        </View>
        
        {/* Filter Selection Modal */}
        {filterModalVisible && (
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {activeFilterType === 'target' ? 'Target Muscle' : 'Equipment'}
                </Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => handleFilterSelect(
                    activeFilterType === 'target' ? 'target' : 'equipment', 
                    ''
                  )}
                >
                  <Text style={styles.modalItemText}>All</Text>
                  {(activeFilterType === 'target' && activeTarget === '') || 
                   (activeFilterType === 'equipment' && activeEquipment === '') ? (
                    <Ionicons name="checkmark-circle" size={20} color="#4a90e2" />
                  ) : null}
                </TouchableOpacity>
                
                {activeFilterType === 'target' ? 
                  targetMuscles.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.modalItem}
                      onPress={() => handleFilterSelect('target', item)}
                    >
                      <Text style={styles.modalItemText}>{item}</Text>
                      {activeTarget === item && (
                        <Ionicons name="checkmark-circle" size={20} color="#4a90e2" />
                      )}
                    </TouchableOpacity>
                  )) : 
                  allEquipment.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.modalItem}
                      onPress={() => handleFilterSelect('equipment', item)}
                    >
                      <Text style={styles.modalItemText}>{item}</Text>
                      {activeEquipment === item && (
                        <Ionicons name="checkmark-circle" size={20} color="#4a90e2" />
                      )}
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Fixed Bottom Button */}
        <View style={styles.doneButtonContainer}>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={closeExerciseLibrary}
          >
            <Text style={styles.doneButtonText}>
              Done{selectedExercises.length > 0 ? ` (${selectedExercises.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderWorkoutBuilder = () => {
    return (
      <SafeAreaView style={styles.container}>
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
                headerStyle: {
                  backgroundColor: extendedColors.background,
                },
                headerTitleStyle: {
                  color: extendedColors.text,
                  fontWeight: '600',
                },
                headerShadowVisible: false,
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.push('/workouts')} style={{ marginLeft: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={extendedColors.accent} />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <TouchableOpacity onPress={goToProfile} style={{ marginRight: 16 }}>
                    <Ionicons name="person-circle-outline" size={28} color={extendedColors.accent} />
                </TouchableOpacity>
              )
            }} 
          />
          
            <View style={styles.formCard}>
          {/* Workout Details */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Workout Details</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Full Body Strength, Leg Day"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={styles.inputContainer}>
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
            </View>
          </View>
          
          {/* Exercises Section */}
            <View style={styles.exercisesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => {
                  Keyboard.dismiss();
                  // Ensure cardio selection mode is off
                  setIsCardioSelectionMode(false);
                  setShowExerciseSelection(true);
                }}
                  activeOpacity={0.8}
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
                
                // Check if this exercise is expanded
                const isExpanded = expandedExercises[workoutExercise.id] || false;
                
                return (
                  <View key={workoutExercise.id} style={styles.exerciseItem}>
                    <LinearGradient
                      colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
                      style={styles.exerciseHeader}
                    >
                      <View style={styles.exerciseIconContainer}>
                        <Ionicons name="fitness" size={22} color="#4a90e2" />
                      </View>
                      
                      <View style={styles.exerciseInfo}>
                        <TouchableOpacity 
                          onPress={() => fetchExerciseDetailsById(workoutExercise.exerciseId, exerciseToUse.name)}
                          style={styles.exerciseNameTouchable}
                          disabled={fetchingExerciseDetails}
                        >
                          <Text style={styles.exerciseName}>
                            {exerciseToUse.name}
                            {fetchingExerciseDetails ? ' (loading...)' : ''}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.exerciseTagsRow}>
                          <View style={styles.exerciseTag}>
                            <Text style={styles.exerciseTagText} numberOfLines={1} ellipsizeMode="tail">
                              {exerciseToUse.bodyPart}
                            </Text>
                          </View>
                          <View style={styles.exerciseTag}>
                            <Text style={styles.exerciseTagText} numberOfLines={1} ellipsizeMode="tail">
                              {exerciseToUse.target}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.exerciseActions}>
                        <TouchableOpacity
                          style={[styles.exerciseActionButton, index === 0 && styles.disabledActionButton]}
                          onPress={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <Ionicons 
                            name="chevron-up" 
                            size={20} 
                            color={index === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.exerciseActionButton, 
                            index === selectedExercises.length - 1 && styles.disabledActionButton
                          ]}
                          onPress={() => moveExercise(index, 'down')}
                          disabled={index === selectedExercises.length - 1}
                        >
                          <Ionicons 
                            name="chevron-down" 
                            size={20} 
                            color={index === selectedExercises.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.exerciseActionButton}
                          onPress={() => removeExercise(index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  
                    {!isExpanded ? (
                      <TouchableOpacity 
                        style={styles.setsCollapseInfo}
                        onPress={() => toggleExerciseExpansion(workoutExercise.id)}
                      >
                        <Text style={styles.setsCollapseText}>
                          {workoutExercise.sets.length} {workoutExercise.sets.length === 1 ? 'set' : 'sets'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <WorkoutSetEditor
                          sets={workoutExercise.sets}
                          onAddSet={() => addSet(index)}
                          onUpdateSet={(setIndex, setData) => updateSet(index, setIndex, setData)}
                          onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                        />
                        <TouchableOpacity 
                          style={styles.setsExpandedInfo}
                          onPress={() => toggleExerciseExpansion(workoutExercise.id)}
                        >
                          <Text style={styles.setsCollapseText}>Hide sets</Text>
                          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
          
          {/* Cardio Section */}
          <View style={styles.cardioCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cardio</Text>
              <TouchableOpacity
                style={[styles.addExerciseButton, styles.cardioButton]}
                onPress={() => {
                  Keyboard.dismiss();
                  // Set cardio selection mode
                  setIsCardioSelectionMode(true);
                  // Clear other filters
                  setActiveTarget('');
                  setActiveEquipment('');
                  setShowExerciseSelection(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addExerciseButtonText}>Add Cardio</Text>
              </TouchableOpacity>
            </View>
            
            {selectedCardioExercises.length === 0 ? (
              <View style={styles.noExercisesContainer}>
                <Ionicons name="heart-outline" size={48} color="#9ca3af" />
                <Text style={styles.noExercisesText}>No cardio added yet</Text>
                <Text style={styles.noExercisesSubtext}>
                  Tap "Add Cardio" to include cardiovascular exercises
                </Text>
              </View>
            ) : (
              selectedCardioExercises.map((workoutExercise, index) => {
                const exercise = workoutExercise.exerciseDetails;
                const exerciseToUse = exercise || exercises.find(e => e.id === workoutExercise.exerciseId);
                
                if (!exerciseToUse) return null;
                
                const isExpanded = expandedCardioExercises[workoutExercise.id] || false;
                
                return (
                  <View key={workoutExercise.id} style={[styles.exerciseItem, styles.cardioExerciseItem]}>
                    <LinearGradient
                      colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
                      style={styles.exerciseHeader}
                    >
                      <View style={[styles.exerciseIconContainer, styles.cardioIconContainer]}>
                        <Ionicons name="heart" size={22} color="#e74c3c" />
                      </View>
                      
                      <View style={styles.exerciseInfo}>
                        <TouchableOpacity 
                          onPress={() => fetchExerciseDetailsById(workoutExercise.exerciseId, exerciseToUse.name)}
                          style={styles.exerciseNameTouchable}
                          disabled={fetchingExerciseDetails}
                        >
                          <Text style={styles.exerciseName}>
                            {exerciseToUse.name}
                            {fetchingExerciseDetails ? ' (loading...)' : ''}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.exerciseTagsRow}>
                          <View style={[styles.exerciseTag, styles.cardioTag]}>
                            <Text style={[styles.exerciseTagText, styles.cardioTagText]}>Cardio</Text>
                          </View>
                          <View style={[styles.exerciseTag, styles.cardioTag]}>
                            <Text style={[styles.exerciseTagText, styles.cardioTagText]} numberOfLines={1} ellipsizeMode="tail">
                              {exerciseToUse.equipment}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.exerciseActions}>
                        <TouchableOpacity
                          style={[styles.exerciseActionButton, index === 0 && styles.disabledActionButton]}
                          onPress={() => moveCardioExercise(index, 'up')}
                          disabled={index === 0}
                        >
                          <Ionicons 
                            name="chevron-up" 
                            size={20} 
                            color={index === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.exerciseActionButton, 
                            index === selectedCardioExercises.length - 1 && styles.disabledActionButton
                          ]}
                          onPress={() => moveCardioExercise(index, 'down')}
                          disabled={index === selectedCardioExercises.length - 1}
                        >
                          <Ionicons 
                            name="chevron-down" 
                            size={20} 
                            color={index === selectedCardioExercises.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} 
                          />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.exerciseActionButton}
                          onPress={() => removeCardioExercise(index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  
                    {!isExpanded ? (
                      <TouchableOpacity 
                        style={styles.setsCollapseInfo}
                        onPress={() => toggleCardioExerciseExpansion(workoutExercise.id)}
                      >
                        <Text style={styles.setsCollapseText}>
                          {workoutExercise.sets.length} {isTimeBasedExercise(exerciseToUse.name) ? 
                            (workoutExercise.sets.length === 1 ? 'time set' : 'time sets') : 
                            (workoutExercise.sets.length === 1 ? 'set' : 'sets')
                          }
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <WorkoutSetEditor
                          sets={workoutExercise.sets}
                          onAddSet={() => addCardioSet(index)}
                          onUpdateSet={(setIndex, setData) => updateCardioSet(index, setIndex, setData)}
                          onRemoveSet={(setIndex) => removeCardioSet(index, setIndex)}
                          exerciseType={isTimeBasedExercise(exerciseToUse.name) ? 'time' : 'weight_reps'}
                        />
                        <TouchableOpacity 
                          style={styles.setsExpandedInfo}
                          onPress={() => toggleCardioExerciseExpansion(workoutExercise.id)}
                        >
                          <Text style={styles.setsCollapseText}>Hide sets</Text>
                          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
          
            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/workouts')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>

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
                <Text style={styles.buttonText}>Save Workout</Text>
              </>
            )}
          </TouchableOpacity>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  // Add new state near other state declarations
  const [selectedExerciseDetails, setSelectedExerciseDetails] = useState<Exercise | null>(null);

  // Add the modal component before the return statement
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
                  style={styles.closeButton}
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
                    <Text style={styles.sectionTitle}>Overview</Text>
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
                  <Text style={styles.sectionTitle}>Target Muscles</Text>
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
                    <Text style={styles.sectionTitle}>Instructions</Text>
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
                    <Text style={styles.sectionTitle}>Tips</Text>
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
                    <Text style={styles.sectionTitle}>Variations</Text>
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

  // Advanced multi-strategy search system
  const advancedSearchExercises = (exercises: Exercise[], searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) return exercises;

    // Comprehensive exercise terminology and abbreviations
    const exerciseTerminology: { [key: string]: string[] } = {
      // Muscle abbreviations and synonyms
      'lat': ['lateral', 'latissimus', 'lats', 'latissimus dorsi'],
      'lateral': ['lat', 'lats', 'latissimus'],
      'bi': ['bicep', 'biceps', 'bicep brachii'],
      'bicep': ['bi', 'biceps', 'bicep brachii'],
      'tri': ['tricep', 'triceps', 'tricep brachii'],
      'tricep': ['tri', 'triceps', 'tricep brachii'],
      'delts': ['deltoid', 'deltoids', 'shoulder', 'shoulders'],
      'delt': ['deltoid', 'shoulder', 'delts'],
      'deltoid': ['delt', 'delts', 'shoulder'],
      'pec': ['pectoral', 'pectorals', 'chest', 'pecs'],
      'pecs': ['pec', 'pectoral', 'chest'],
      'chest': ['pec', 'pecs', 'pectoral'],
      'abs': ['abdominal', 'abdominals', 'core', 'abs'],
      'core': ['abs', 'abdominal', 'abdominals'],
      'quads': ['quadriceps', 'quadricep', 'quad'],
      'quad': ['quads', 'quadriceps'],
      'hams': ['hamstring', 'hamstrings', 'ham'],
      'ham': ['hams', 'hamstring'],
      'glutes': ['gluteus', 'glute', 'butt', 'gluteal'],
      'glute': ['glutes', 'gluteus', 'gluteal'],
      'calves': ['calf', 'gastrocnemius', 'calfs'],
      'calf': ['calves', 'gastrocnemius'],
      
      // Equipment abbreviations
      'db': ['dumbbell', 'dumbell', 'dumbells', 'dumbbells'],
      'dumbbell': ['db', 'dumbell'],
      'bb': ['barbell', 'barbel', 'barbells'],
      'barbell': ['bb', 'barbel'],
      'cb': ['cable', 'cables'],
      'cable': ['cb', 'cables'],
      
      // Exercise movements and variations
      'pulldown': ['pull down', 'pulldowns', 'pull downs', 'lat pulldown'],
      'pullup': ['pull up', 'pullups', 'pull ups', 'chin up'],
      'pushup': ['push up', 'pushups', 'push ups'],
      'situp': ['sit up', 'situps', 'sit ups'],
      'chinup': ['chin up', 'chinups', 'chin ups', 'pullup'],
      'legpress': ['leg press'],
      'deadlift': ['dead lift'],
      'benchpress': ['bench press'],
      'squats': ['squat'],
      'squat': ['squats'],
      'flyes': ['fly', 'flies', 'flys', 'flye'],
      'fly': ['flyes', 'flies', 'flys'],
      'raises': ['raise', 'elevation', 'lifted'],
      'raise': ['raises', 'elevation'],
      'rows': ['row', 'rowing'],
      'row': ['rows', 'rowing'],
      'curls': ['curl', 'curling'],
      'curl': ['curls', 'curling'],
      'extensions': ['extension', 'extend'],
      'extension': ['extensions', 'extend'],
      'kicks': ['kick', 'kicking'],
      'kick': ['kicks', 'kicking'],
      'crunches': ['crunch'],
      'crunch': ['crunches'],
      'planks': ['plank', 'planking'],
      'plank': ['planks', 'planking'],
      'press': ['pressing', 'pressed'],
      'pressing': ['press', 'pressed']
    };

    // Advanced text normalization
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Smart term expansion with context awareness
    const expandSearchTerms = (query: string) => {
      const normalizedQuery = normalizeText(query);
      let expandedTerms = [normalizedQuery];
      const words = normalizedQuery.split(' ');

      // Expand each word and create combinations
      words.forEach(word => {
        if (exerciseTerminology[word]) {
          exerciseTerminology[word].forEach(synonym => {
            // Add individual synonyms
            expandedTerms.push(synonym);
            // Add combinations with other words in the query
            words.forEach(otherWord => {
              if (otherWord !== word) {
                expandedTerms.push(`${synonym} ${otherWord}`);
                expandedTerms.push(`${otherWord} ${synonym}`);
              }
            });
          });
        }
      });

      // Remove duplicates and return unique terms
      return [...new Set(expandedTerms)];
    };

    // Levenshtein distance for typo tolerance
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
      matrix[0] = Array.from({ length: str1.length + 1 }, (_, i) => i);

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2[i - 1] === str1[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + 1
            );
          }
        }
      }

      return matrix[str2.length][str1.length];
    };

    // Advanced similarity calculation with multiple algorithms
    const calculateAdvancedSimilarity = (str1: string, str2: string) => {
      if (str1 === str2) return 1;
      if (!str1 || !str2) return 0;

      // Dice coefficient (bigram similarity)
      const diceCoefficient = () => {
        if (str1.length < 2 || str2.length < 2) return 0;
        const bigrams1 = new Set();
        const bigrams2 = new Set();

        for (let i = 0; i < str1.length - 1; i++) {
          bigrams1.add(str1.substr(i, 2));
        }
        for (let i = 0; i < str2.length - 1; i++) {
          bigrams2.add(str2.substr(i, 2));
        }

        const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
        return (2 * intersection.size) / (bigrams1.size + bigrams2.size);
      };

      // Jaro-Winkler similarity
      const jaroWinkler = () => {
        const maxLength = Math.max(str1.length, str2.length);
        const matchWindow = Math.floor(maxLength / 2) - 1;
        
        if (matchWindow < 0) return str1 === str2 ? 1 : 0;
        
        const str1Matches = new Array(str1.length).fill(false);
        const str2Matches = new Array(str2.length).fill(false);
        
        let matches = 0;
        let transpositions = 0;
        
        // Find matches
        for (let i = 0; i < str1.length; i++) {
          const start = Math.max(0, i - matchWindow);
          const end = Math.min(i + matchWindow + 1, str2.length);
          
          for (let j = start; j < end; j++) {
            if (str2Matches[j] || str1[i] !== str2[j]) continue;
            str1Matches[i] = true;
            str2Matches[j] = true;
            matches++;
            break;
          }
        }
        
        if (matches === 0) return 0;
        
        // Count transpositions
        let k = 0;
        for (let i = 0; i < str1.length; i++) {
          if (!str1Matches[i]) continue;
          while (!str2Matches[k]) k++;
          if (str1[i] !== str2[k]) transpositions++;
          k++;
        }
        
        const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
        
        // Winkler modification
        let prefix = 0;
        for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
          if (str1[i] === str2[i]) prefix++;
          else break;
        }
        
        return jaro + 0.1 * prefix * (1 - jaro);
      };

      // Normalized Levenshtein distance
      const normalizedLevenshtein = () => {
        const distance = levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
      };

      // Combine multiple similarity measures
      const dice = diceCoefficient();
      const jw = jaroWinkler();
      const lev = normalizedLevenshtein();
      
      // Weighted average of different similarity measures
      return (dice * 0.4 + jw * 0.3 + lev * 0.3);
    };

    // Multi-strategy scoring system
    const calculateExerciseScore = (exercise: Exercise, searchTerms: string[]) => {
      const searchableFields = [
        { text: exercise.name, weight: 5, isName: true },
        { text: exercise.bodyPart, weight: 2, isName: false },
        { text: exercise.target, weight: 2, isName: false },
        { text: exercise.equipment, weight: 1, isName: false }
      ];

      let totalScore = 0;
      let matchedTerms = new Set<string>();

      searchTerms.forEach(searchTerm => {
        const searchWords = searchTerm.split(' ').filter(w => w.length > 0);
        
        searchableFields.forEach(field => {
          const normalizedField = normalizeText(field.text);
          const fieldWords = normalizedField.split(' ');
          let fieldScore = 0;

          // Strategy 1: Exact phrase matching
          if (normalizedField.includes(searchTerm)) {
            fieldScore += field.weight * 10;
            matchedTerms.add(searchTerm);
          }

          // Strategy 2: All words present (any order)
          const allWordsPresent = searchWords.every(word => 
            fieldWords.some(fieldWord => 
              fieldWord === word || 
              fieldWord.includes(word) || 
              word.includes(fieldWord) ||
              calculateAdvancedSimilarity(fieldWord, word) > 0.8
            )
          );

          if (allWordsPresent && searchWords.length > 1) {
            fieldScore += field.weight * 8;
            matchedTerms.add(searchTerm);
          }

          // Strategy 3: Individual word matching with various techniques
          searchWords.forEach(searchWord => {
            fieldWords.forEach(fieldWord => {
              // Exact word match
              if (fieldWord === searchWord) {
                fieldScore += field.weight * 6;
                matchedTerms.add(searchWord);
              }
              // Prefix matching (excellent for abbreviations)
              else if (fieldWord.startsWith(searchWord) && searchWord.length >= 2) {
                fieldScore += field.weight * 5;
                matchedTerms.add(searchWord);
              }
              // Suffix matching
              else if (fieldWord.endsWith(searchWord) && searchWord.length >= 3) {
                fieldScore += field.weight * 4;
                matchedTerms.add(searchWord);
              }
              // Contains matching
              else if (fieldWord.includes(searchWord) && searchWord.length >= 3) {
                fieldScore += field.weight * 3;
                matchedTerms.add(searchWord);
              }
              // Reverse contains (query contains field word)
              else if (searchWord.includes(fieldWord) && fieldWord.length >= 3) {
                fieldScore += field.weight * 3;
                matchedTerms.add(searchWord);
              }
              // Advanced similarity matching
              else if (searchWord.length >= 3 && fieldWord.length >= 3) {
                const similarity = calculateAdvancedSimilarity(fieldWord, searchWord);
                if (similarity > 0.7) {
                  fieldScore += field.weight * similarity * 4;
                  matchedTerms.add(searchWord);
                }
              }
            });
          });

          totalScore += fieldScore;
        });
      });

      // Bonus scoring for comprehensive matches
      const uniqueMatchedTerms = matchedTerms.size;
      const originalSearchWords = normalizeText(searchQuery).split(' ').length;
      
      // Multi-term bonus
      if (uniqueMatchedTerms > 1) {
        totalScore += uniqueMatchedTerms * 3;
      }

      // Completeness bonus (percentage of search terms matched)
      const completenessRatio = uniqueMatchedTerms / Math.max(originalSearchWords, 1);
      totalScore += completenessRatio * 5;

      // Name field bonus (exercises matching in name are more relevant)
      const nameMatches = matchedTerms.size > 0 && 
        searchableFields[0].text.toLowerCase().split(' ').some(word =>
          [...matchedTerms].some(term => 
            word.includes(term) || term.includes(word) || 
            calculateAdvancedSimilarity(word, term) > 0.7
          )
        );
      
      if (nameMatches) {
        totalScore *= 1.5; // 50% bonus for name matches
      }

      return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
    };

    // Execute search with expanded terms
    const expandedSearchTerms = expandSearchTerms(searchQuery);
    
    // Score all exercises
    const scoredExercises = exercises
      .map(exercise => ({
        exercise,
        score: calculateExerciseScore(exercise, expandedSearchTerms)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // Primary sort by score
        if (b.score !== a.score) return b.score - a.score;
        // Secondary sort by name length (shorter names first for relevance)
        return a.exercise.name.length - b.exercise.name.length;
      });

    return scoredExercises.map(item => item.exercise);
  };

  // Use effect to control how many exercises are displayed
  useEffect(() => {
    if (exercises.length > 0) {
      // Apply additional client-side filtering to ensure both filters work together
      let filteredExercises = exercises;
      
      // If in cardio selection mode, filter to only show cardio exercises
      if (isCardioSelectionMode) {
        filteredExercises = exercises.filter(exercise => 
          exercise.bodyPart.toLowerCase() === 'cardio' || 
          exercise.target.toLowerCase().includes('cardiovascular')
        );
      }
      // If both target and equipment are selected, apply AND logic
      else if (activeTarget && activeEquipment) {
        filteredExercises = exercises.filter(exercise => 
          exercise.target.toLowerCase().includes(activeTarget.toLowerCase()) &&
          exercise.equipment.toLowerCase().includes(activeEquipment.toLowerCase())
        );
      }
      // If only target is selected
      else if (activeTarget && !activeEquipment) {
        filteredExercises = exercises.filter(exercise => 
          exercise.target.toLowerCase().includes(activeTarget.toLowerCase())
        );
      }
      // If only equipment is selected
      else if (activeEquipment && !activeTarget) {
        filteredExercises = exercises.filter(exercise => 
          exercise.equipment.toLowerCase().includes(activeEquipment.toLowerCase())
        );
      }
      
      // Apply advanced search filter if active (2+ characters now)
      if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
        filteredExercises = advancedSearchExercises(filteredExercises, debouncedSearchQuery);
      }
      
      setDisplayedExercises(filteredExercises.slice(0, displayLimit));
    } else {
      setDisplayedExercises([]);
    }
  }, [exercises, displayLimit, activeTarget, activeEquipment, debouncedSearchQuery, isCardioSelectionMode]);

  // Modify the handleLoadMoreExercises function
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
    // If in cardio selection mode, filter to only show cardio exercises
    if (isCardioSelectionMode) {
      filteredExercises = exercises.filter(exercise => 
        exercise.bodyPart.toLowerCase() === 'cardio' || 
        exercise.target.toLowerCase().includes('cardiovascular')
      );
    }
    else if (activeTarget && activeEquipment) {
      filteredExercises = exercises.filter(exercise => 
        exercise.target.toLowerCase().includes(activeTarget.toLowerCase()) &&
        exercise.equipment.toLowerCase().includes(activeEquipment.toLowerCase())
      );
    }
    else if (activeTarget && !activeEquipment) {
      filteredExercises = exercises.filter(exercise => 
        exercise.target.toLowerCase().includes(activeTarget.toLowerCase())
      );
    }
    else if (activeEquipment && !activeTarget) {
      filteredExercises = exercises.filter(exercise => 
        exercise.equipment.toLowerCase().includes(activeEquipment.toLowerCase())
      );
    }
    
    // Apply advanced search filter if active
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      filteredExercises = advancedSearchExercises(filteredExercises, debouncedSearchQuery);
    }
    
    return filteredExercises.length;
  };

  // Define styles using the extendedColors object
const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: '#2c2c3e',
  },
  contentContainer: {
    padding: 16,
      paddingBottom: 120,
    },
    formCard: {
      backgroundColor: '#3e3e50',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    marginBottom: 16,
    },
    exercisesCard: {
      backgroundColor: '#3e3e50',
      borderRadius: 16,
      padding: 16,
    shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: 20,
    },
    formSection: {
      padding: 16,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
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
  input: {
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 12,
      padding: 14,
    fontSize: 16,
      color: '#fff',
    borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 100,
      textAlignVertical: 'top',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: '#4a90e2',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
  },
  addExerciseButtonText: {
    color: '#fff',
    fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
  },
  noExercisesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
      paddingVertical: 40,
    borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.2)',
  },
  noExercisesText: {
    fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      marginTop: 12,
  },
  noExercisesSubtext: {
    fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 6,
  },
  exerciseItem: {
      marginBottom: 20,
      borderRadius: 14,
    overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
      padding: 14,
    borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    exerciseIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 8,
  },
  exerciseName: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    exerciseNameTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    exerciseTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 2,
    },
    exerciseTag: {
      backgroundColor: 'rgba(74, 144, 226, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginRight: 6,
      marginBottom: 2,
      maxWidth: 120,
    },
    exerciseTagText: {
      color: '#4a90e2',
      fontSize: 11,
      fontWeight: '500',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  exerciseActionButton: {
    width: 36,
    height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
      marginLeft: 6,
    },
    disabledActionButton: {
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      marginBottom: 32,
  },
  profileButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
      flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
      borderRadius: 12,
      marginLeft: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  libraryContainer: {
    flex: 1,
    backgroundColor: '#2c2c3e',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  libraryHeaderSafeArea: {
    backgroundColor: '#2e2e40',
    zIndex: 2,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  libraryTitle: {
      fontSize: 20,
    fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
      flex: 1,
  },
  closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    headerRight: {
      minWidth: 80,
      alignItems: 'flex-end',
    },
    selectionCount: {
      color: '#4a90e2',
      fontSize: 14,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#fff',
      height: 36,
      paddingVertical: 0,
    },
    searchActions: {
      flexDirection: 'row',
      alignItems: 'center',
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
    filterButtonsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 16,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    simpleFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginRight: 10,
      marginBottom: 8,
    },
    activeSimpleFilterButton: {
      backgroundColor: 'rgba(74, 144, 226, 0.3)',
      borderColor: '#4a90e2',
      borderWidth: 1,
    },
    filterButtonIcon: {
      marginRight: 8,
    },
    filterButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    libraryContent: {
      flex: 1,
    },
    exerciseListContainer: {
      flex: 1,
    },
    exercisesList: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    exerciseListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      height: 100,
    },
    selectedExerciseItem: {
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    exerciseItemContent: {
      flex: 1,
      marginRight: 8,
    },
    exerciseItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 4,
    },
    exerciseItemDetail: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
    },
    exerciseItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoButton: {
      padding: 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    exerciseItemRight: {
      paddingLeft: 8,
    },
    checkboxUnchecked: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    checkboxChecked: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4a90e2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    libraryLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingSpinner: {
      marginBottom: 12,
    },
    libraryLoadingText: {
      color: '#fff',
      fontSize: 16,
    },
    emptyResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
    emptyResultsText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
      marginTop: 16,
    },
    emptyResultsSubtext: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 8,
    },
    doneButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: 'rgba(46, 46, 64, 0.95)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
      zIndex: 2,
    },
    doneButton: {
      backgroundColor: '#4a90e2',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneButtonText: {
      color: '#fff',
    fontSize: 16,
      fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
      color: extendedColors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
      backgroundColor: extendedColors.accent,
    paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
      fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
      fontWeight: '600',
      color: extendedColors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
      color: extendedColors.textMuted,
      marginTop: 6,
  },
  categoriesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  activeCategoryPill: {
    backgroundColor: '#4a90e2',
  },
  activeCategoryPillText: {
    color: '#fff',
    fontWeight: '600',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
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
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalDetailsContainer: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
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
  instructionsSection: {
    marginTop: 16,
  },
  instructionItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionText: {
    color: '#fff',
    lineHeight: 20,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  clearFiltersText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginRight: 6,
  },
  exerciseImageWrapper: {
    width: 76,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 12,
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    height: '100%',
  },
  noImageText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#2e2e40',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
    textTransform: 'capitalize',
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
  modalVideo: {
    width: '100%',
    height: 300,
  },
  overviewText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
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
  instructionNumber: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 24,
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
  fixedTopContent: {
    backgroundColor: '#2c2c3e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
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
  loadingMoreIndicator: {
    marginVertical: 16,
    alignItems: 'center',
  },
  clearSearch: {
    padding: 4,
    marginLeft: 8,
  },
  setsCollapseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  setsCollapseText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  setsExpandedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  cardioCard: {
    backgroundColor: '#3e3e50',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    marginTop: 16,
  },
  cardioButton: {
    backgroundColor: '#e74c3c',
  },
  cardioExerciseItem: {
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  cardioIconContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  cardioTag: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    maxWidth: 100,
  },
  cardioTagText: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: '500',
  },
}); 

  // Add a function to fetch exercise details by ID after the other state declarations
  const [fetchingExerciseDetails, setFetchingExerciseDetails] = useState(false);

  // Function to fetch complete exercise details from the API
  const fetchExerciseDetailsById = async (exerciseId: string, exerciseName?: string) => {
    try {
      setFetchingExerciseDetails(true);
      
      // First try to find the exercise in the current exercises array
      const existingExercise = exercises.find(e => e.id === exerciseId);
      if (existingExercise && existingExercise.instructions && existingExercise.instructions.length > 0) {
        setSelectedExerciseDetails(existingExercise);
        return;
      }
      
      // If not found or incomplete, fetch from API by name
      if (exerciseName) {
        const { fetchFromExerciseDB } = await import('@/utils/apiConfig');
        
        try {
          const results = await fetchFromExerciseDB(`/name/${encodeURIComponent(exerciseName)}`);
          
          if (results && results.length > 0) {
            // Find the exact match by ID or name
            const exactMatch = results.find((ex: any) => ex.id === exerciseId || ex.name.toLowerCase() === exerciseName.toLowerCase());
            const exerciseToUse = exactMatch || results[0];
            
            // Transform to our Exercise type
            const completeExercise = {
              id: exerciseToUse.id,
              name: exerciseToUse.name,
              bodyPart: exerciseToUse.bodyPart,
              target: exerciseToUse.target,
              equipment: Array.isArray(exerciseToUse.equipment) ? exerciseToUse.equipment[0] : exerciseToUse.equipment,
              gifUrl: exerciseToUse.gifUrl,
              imageUrl: exerciseToUse.imageUrl,
              videoUrl: exerciseToUse.videoUrl,
              instructions: exerciseToUse.instructions || [],
              secondaryMuscles: exerciseToUse.secondaryMuscles || [],
              overview: exerciseToUse.overview,
              exerciseTips: exerciseToUse.exerciseTips || [],
              variations: exerciseToUse.variations || [],
              keywords: exerciseToUse.keywords || [],
              exerciseType: exerciseToUse.exerciseType,
              source: 'exercisedb' as const
            };
            
            setSelectedExerciseDetails(completeExercise);
          } else {
            // Fallback: create a basic exercise object with available data
            const basicExercise = {
              id: exerciseId,
              name: exerciseName,
              bodyPart: 'General',
              target: 'Muscle',
              equipment: 'Body weight',
              gifUrl: '',
              instructions: [],
              secondaryMuscles: [],
              overview: `${exerciseName} exercise`,
              exerciseTips: [],
              variations: [],
              keywords: [],
              source: 'exercisedb' as const
            };
            setSelectedExerciseDetails(basicExercise);
          }
        } catch (apiError) {
          console.error('Error fetching exercise from API:', apiError);
          // Fallback: create a basic exercise object
          const basicExercise = {
            id: exerciseId,
            name: exerciseName || 'Unknown Exercise',
            bodyPart: 'General',
            target: 'Muscle',
            equipment: 'Body weight',
            gifUrl: '',
            instructions: [],
            secondaryMuscles: [],
            overview: `${exerciseName || 'Unknown'} exercise`,
            exerciseTips: [],
            variations: [],
            keywords: [],
            source: 'exercisedb' as const
          };
          setSelectedExerciseDetails(basicExercise);
        }
      }
    } catch (error) {
      console.error('Error fetching exercise details:', error);
    } finally {
      setFetchingExerciseDetails(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c3e" />
      {showExerciseSelection ? renderExerciseLibrary() : renderWorkoutBuilder()}
      {renderExerciseDetailsModal()}
    </>
  );
} 