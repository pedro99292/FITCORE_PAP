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
  Animated
} from 'react-native';
import { useExercises } from '@/hooks/useExercises';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Exercise, WorkoutExercise, WorkoutSet } from '@/types/exercise';
import { Stack, router } from 'expo-router';
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
  const [experienceLevel, setExperienceLevel] = useState<string>('beginner');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  
  // Enhanced state for exercise library
  const [activeTab, setActiveTab] = useState('bodyPart');
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ bodyPart?: string; equipment?: string; target?: string; search?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [currentEditingExerciseIndex, setCurrentEditingExerciseIndex] = useState<number | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  // Available categories based on active tab
  const [categories, setCategories] = useState<string[]>([]);
  
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
  
  // Update categories based on active tab
  useEffect(() => {
    if (!exercises || exercises.length === 0) return;
    
    let uniqueCategories: string[] = [];
    
    if (activeTab === 'bodyPart') {
      uniqueCategories = [...new Set(exercises.map(ex => ex.bodyPart))];
    } else if (activeTab === 'equipment') {
      uniqueCategories = [...new Set(exercises.map(ex => ex.equipment))];
    } else if (activeTab === 'target') {
      uniqueCategories = [...new Set(exercises.map(ex => ex.target))];
    }
    
    setCategories(uniqueCategories.sort());
    
    // Reset active category when changing tabs
    setActiveCategory('');
  }, [activeTab, exercises]);
  
  // Filter exercises when category changes
  useEffect(() => {
    const newFilters: any = { ...filters };
    
    // Clear previous filter values
    delete newFilters.bodyPart;
    delete newFilters.equipment;
    delete newFilters.target;
    
    // Set the appropriate filter based on active tab
    if (activeTab === 'bodyPart' && activeCategory) {
      newFilters.bodyPart = activeCategory;
    } else if (activeTab === 'equipment' && activeCategory) {
      newFilters.equipment = activeCategory;
    } else if (activeTab === 'target' && activeCategory) {
      newFilters.target = activeCategory;
    }
    
    // Set search query if any
    if (searchQuery) {
      newFilters.search = searchQuery;
    } else {
      delete newFilters.search;
    }
    
    setFilters(newFilters);
  }, [activeCategory, activeTab, searchQuery]);

  const handleFilterChange = (newFilters: { bodyPart?: string; equipment?: string; target?: string; search?: string }) => {
    setFilters(newFilters);
  };
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.clear();
    }
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

  const goToProfile = () => {
    router.push('/profile');
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

  // Enhanced exercise library component
  const renderExerciseLibrary = () => {
    // Filter exercises based on current filters
    const filteredExercises = exercises.filter(exercise => {
      if (activeTab === 'bodyPart' && activeCategory && exercise.bodyPart !== activeCategory) {
        return false;
      }
      if (activeTab === 'equipment' && activeCategory && exercise.equipment !== activeCategory) {
        return false;
      }
      if (activeTab === 'target' && activeCategory && exercise.target !== activeCategory) {
        return false;
      }
      if (searchQuery && !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

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
        {/* Header */}
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
          <Text style={styles.libraryTitle}>Exercise Library</Text>
          <View style={styles.headerRight}>
            <Text style={styles.selectionCount}>
              {selectedExercises.length} selected
            </Text>
        </View>
        </LinearGradient>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bodyPart' && styles.activeTab]}
            onPress={() => setActiveTab('bodyPart')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'bodyPart' && styles.activeTabText]}
            >
              Body Part
            </Text>
            {activeTab === 'bodyPart' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'equipment' && styles.activeTab]}
            onPress={() => setActiveTab('equipment')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'equipment' && styles.activeTabText]}
            >
              Equipment
            </Text>
            {activeTab === 'equipment' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'target' && styles.activeTab]}
            onPress={() => setActiveTab('target')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'target' && styles.activeTabText]}
            >
              Target
            </Text>
            {activeTab === 'target' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>
        
        {/* Categories */}
        {loadingExercises ? (
          <View style={styles.libraryLoadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" style={styles.loadingSpinner} />
            <Text style={styles.libraryLoadingText}>Loading exercises...</Text>
          </View>
        ) : categories.length > 0 ? (
          <View style={styles.contentContainer}>
            {/* Category Pills */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              <TouchableOpacity 
                key="all"
                style={[
                  styles.categoryPill, 
                  activeCategory === '' && styles.activeCategoryPill
                ]}
                onPress={() => setActiveCategory('')}
              >
                <Text 
                  style={[
                    styles.categoryPillText, 
                    activeCategory === '' && styles.activeCategoryPillText
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              
              {categories.map((category, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.categoryPill, 
                    activeCategory === category && styles.activeCategoryPill
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text 
                    style={[
                      styles.categoryPillText, 
                      activeCategory === category && styles.activeCategoryPillText
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Exercise List */}
            {filteredExercises.length > 0 ? (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.exerciseListItem,
                      selectedExercises.some(e => e.exerciseId === item.id) && styles.selectedExerciseItem
                    ]}
                    onPress={() => toggleExerciseSelection(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons name="fitness" size={24} color="#4a90e2" />
                    </View>
                    <View style={styles.exerciseItemContent}>
                      <Text style={styles.exerciseItemName}>{item.name}</Text>
                      <Text style={styles.exerciseItemDetail}>{item.bodyPart} • {item.equipment}</Text>
                    </View>
                    <View style={styles.exerciseItemRight}>
                      {selectedExercises.some(e => e.exerciseId === item.id) ? (
                        <View style={styles.checkboxChecked}>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>
                      ) : (
                        <View style={styles.checkboxUnchecked} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.exercisesList}
              />
            ) : (
              <View style={styles.emptyResultsContainer}>
                <Ionicons name="fitness-outline" size={60} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyResultsText}>No exercises found</Text>
                <Text style={styles.emptyResultsSubtext}>Try a different search or category</Text>
              </View>
            )}
          </View>
        ) : exercisesError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Error loading exercises</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetchExercises}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No exercises available</Text>
            <Text style={styles.emptySubtext}>Try again later</Text>
          </View>
        )}
        
        {/* Done Button - Fixed at the bottom */}
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
                <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
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
                        <Text style={styles.exerciseName}>{exerciseToUse.name}</Text>
                          <View style={styles.exerciseTagsRow}>
                            <View style={styles.exerciseTag}>
                              <Text style={styles.exerciseTagText}>{exerciseToUse.bodyPart}</Text>
                            </View>
                            <View style={styles.exerciseTag}>
                              <Text style={styles.exerciseTagText}>{exerciseToUse.target}</Text>
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
          
            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={goToProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Profile</Text>
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
  },
  exerciseName: {
      fontSize: 17,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    exerciseTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    exerciseTag: {
      backgroundColor: 'rgba(74, 144, 226, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginRight: 6,
    },
    exerciseTagText: {
      color: '#4a90e2',
      fontSize: 12,
      fontWeight: '500',
  },
  exerciseActions: {
    flexDirection: 'row',
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
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
      paddingVertical: 16,
    borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
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
      padding: 10,
      margin: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 8,
    },
    searchIcon: {
      marginLeft: 6,
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#fff',
      height: 40,
    },
    clearSearch: {
    padding: 4,
  },
    tabContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    tab: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginRight: 8,
      position: 'relative',
    },
    activeTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.6)',
    },
    activeTabText: {
      color: '#4a90e2',
      fontWeight: '600',
    },
    activeTabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: '#4a90e2',
      borderRadius: 3,
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
  exercisesList: {
      paddingHorizontal: 16,
    paddingBottom: 100,
  },
    exerciseListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    selectedExerciseItem: {
      borderColor: '#4a90e2',
      backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    exerciseItemContent: {
      flex: 1,
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
      backgroundColor: 'rgba(46, 46, 64, 0.9)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
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
}); 

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c3e" />
      {showExerciseSelection ? renderExerciseLibrary() : renderWorkoutBuilder()}
    </>
  );
} 