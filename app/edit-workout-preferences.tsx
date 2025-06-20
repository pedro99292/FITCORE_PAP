import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

interface UserPreferences {
  goals: string[] | null;
  experience_level: string | null;
  workouts_per_week: number | null;
  workout_split: string | null;
  sets_per_exercise: number | null;
  rest_time: string | null;
}

export default function EditWorkoutPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    goals: null,
    experience_level: null,
    workouts_per_week: null,
    workout_split: null,
    sets_per_exercise: null,
    rest_time: null,
  });

  const goalOptions = ['Gain muscle', 'Lose fat', 'Gain strength', 'Maintain muscle'];
  const experienceOptions = ['Novice', 'Experienced', 'Advanced'];
  const workoutsPerWeekOptions = [1, 2, 3, 4, 5, 6];
  const workoutSplitOptions = [
    { value: 'full_body', label: 'Full Body' },
    { value: 'upper_lower', label: 'Upper Lower' },
    { value: 'push_pull_legs', label: 'Push Pull Legs' },
    { value: 'body_part_split', label: 'Body Part Split' },
  ];
  const setsPerExerciseOptions = [2, 3, 4, 5];
  const restTimeOptions = ['1-2', '2-3', '3+'];

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      setIsFetchingData(true);
      const { data, error } = await supabase
        .from('users_data')
        .select(`
          goals,
          experience_level,
          workouts_per_week,
          workout_split,
          sets_per_exercise,
          rest_time
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error is ok
          console.error('Error fetching user preferences:', error);
        }
        return;
      }

      setUserPreferences(data || {});
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleBackNavigation = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('users_data')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not a "not found" error
        throw checkError;
      }

      // Update or insert preferences in users_data table
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('users_data')
          .update({
            goals: userPreferences.goals,
            experience_level: userPreferences.experience_level,
            workouts_per_week: userPreferences.workouts_per_week,
            workout_split: userPreferences.workout_split,
            sets_per_exercise: userPreferences.sets_per_exercise,
            rest_time: userPreferences.rest_time,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('users_data')
          .insert({
            user_id: user.id,
            goals: userPreferences.goals,
            experience_level: userPreferences.experience_level,
            workouts_per_week: userPreferences.workouts_per_week,
            workout_split: userPreferences.workout_split,
            sets_per_exercise: userPreferences.sets_per_exercise,
            rest_time: userPreferences.rest_time,
          });

        if (insertError) throw insertError;
      }

      Alert.alert('Success', 'Workout preferences updated successfully');
      handleBackNavigation();
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (field: keyof UserPreferences, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getWorkoutSplitLabel = (value: string | null) => {
    if (!value) return 'Select workout split';
    const option = workoutSplitOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Show loading while fetching data
  if (isFetchingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const OptionSelector = ({ 
    title, 
    options, 
    selectedValue, 
    onSelect, 
    icon, 
    formatter 
  }: {
    title: string;
    options: any[];
    selectedValue: any;
    onSelect: (value: any) => void;
    icon: string;
    formatter?: (value: any) => string;
  }) => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const value = typeof option === 'object' ? option.value : option;
          const label = typeof option === 'object' ? option.label : (formatter ? formatter(option) : option.toString());
          const isSelected = selectedValue === value;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                { 
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.surface + '40'
                },
                isSelected && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => onSelect(value)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionRadio,
                  { borderColor: isSelected ? colors.primary : colors.text + '40' }
                ]}>
                  {isSelected && (
                    <View style={[styles.optionRadioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  { color: isSelected ? colors.primary : colors.text }
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={handleBackNavigation}>
                <FontAwesome name="arrow-left" size={20} color={colors.text} style={{marginRight: 10}} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Workout Preferences</Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => null,
          headerShadowVisible: false,
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.mainContainer}>
            <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
              {/* Fitness Goal */}
              <OptionSelector
                title="Fitness Goal"
                options={goalOptions}
                selectedValue={userPreferences.goals?.[0] || null}
                onSelect={(value) => updatePreference('goals', [value])}
                icon="bullseye"
              />

              {/* Experience Level */}
              <OptionSelector
                title="Experience Level"
                options={experienceOptions}
                selectedValue={userPreferences.experience_level}
                onSelect={(value) => updatePreference('experience_level', value)}
                icon="trophy"
              />

              {/* Workouts per Week */}
              <OptionSelector
                title="Workouts per Week"
                options={workoutsPerWeekOptions}
                selectedValue={userPreferences.workouts_per_week}
                onSelect={(value) => updatePreference('workouts_per_week', value)}
                icon="calendar"
                formatter={(value) => `${value} day${value > 1 ? 's' : ''}`}
              />

              {/* Workout Split */}
              <OptionSelector
                title="Workout Split"
                options={workoutSplitOptions}
                selectedValue={userPreferences.workout_split}
                onSelect={(value) => updatePreference('workout_split', value)}
                icon="list"
              />

              {/* Sets per Exercise */}
              <OptionSelector
                title="Sets per Exercise"
                options={setsPerExerciseOptions}
                selectedValue={userPreferences.sets_per_exercise}
                onSelect={(value) => updatePreference('sets_per_exercise', value)}
                icon="repeat"
                formatter={(value) => `${value} set${value > 1 ? 's' : ''}`}
              />

              {/* Rest Time */}
              <OptionSelector
                title="Rest Time (minutes)"
                options={restTimeOptions}
                selectedValue={userPreferences.rest_time}
                onSelect={(value) => updatePreference('rest_time', value)}
                icon="clock-o"
                formatter={(value) => `${value} minutes`}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>SAVE PREFERENCES</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBackNavigation}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text + '80' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContainer: {
    padding: 20,
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
  formContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  footerContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 