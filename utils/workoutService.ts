import { supabase } from './supabase';
import { Workout, WorkoutExercise, WorkoutSet } from '@/types/exercise';

// Create a new workout
export const createWorkout = async (workout: Omit<Workout, 'id' | 'created_at' | 'updated_at' | 'exercises'>) => {
  const { data, error } = await supabase
    .from('workouts')
    .insert([workout])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Create workout exercises
export const addExerciseToWorkout = async (workoutExercise: Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at' | 'sets'>) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert([{
      workout_id: workoutExercise.workoutId,
      exercise_id: workoutExercise.exerciseId,
      order_index: workoutExercise.order,
      notes: workoutExercise.notes
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Add sets to a workout exercise
export const addSetToExercise = async (workoutSet: Omit<WorkoutSet, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert([{
      workout_exercise_id: workoutSet.exerciseId,
      reps: workoutSet.reps,
      weight: workoutSet.weight,
      duration: workoutSet.duration,
      distance: workoutSet.distance,
      completed: workoutSet.completed || false
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Get a user's workouts
export const getUserWorkouts = async (userId: string) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Get a specific workout with all exercises and sets
export const getWorkout = async (workoutId: string) => {
  // Fetch the workout
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (workoutError) throw workoutError;

  // Fetch the exercises for this workout
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (exercisesError) throw exercisesError;

  // For each exercise, fetch its sets
  const exercisesWithSets = await Promise.all(
    workoutExercises.map(async (exercise) => {
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_exercise_id', exercise.id)
        .order('id', { ascending: true });

      if (setsError) throw setsError;

      return {
        id: exercise.id,
        exerciseId: exercise.exercise_id,
        workoutId: exercise.workout_id,
        order: exercise.order_index,
        notes: exercise.notes,
        sets: sets.map(set => ({
          id: set.id,
          exerciseId: set.workout_exercise_id,
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          distance: set.distance,
          completed: set.completed
        }))
      };
    })
  );

  return {
    ...workout,
    exercises: exercisesWithSets
  };
};

// Update a workout
export const updateWorkout = async (
  workoutId: string, 
  workoutData: Partial<Omit<Workout, 'id' | 'created_at' | 'updated_at' | 'exercises'>>
) => {
  const { data, error } = await supabase
    .from('workouts')
    .update(workoutData)
    .eq('id', workoutId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Delete a workout and all its related exercises and sets
export const deleteWorkout = async (workoutId: string) => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) throw error;
  return true;
};

// Update a workout exercise
export const updateWorkoutExercise = async (
  exerciseId: string,
  exerciseData: Partial<Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at' | 'sets'>>
) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .update({
      exercise_id: exerciseData.exerciseId,
      order_index: exerciseData.order,
      notes: exerciseData.notes
    })
    .eq('id', exerciseId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Delete a workout exercise
export const deleteWorkoutExercise = async (exerciseId: string) => {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) throw error;
  return true;
};

// Update a workout set
export const updateWorkoutSet = async (
  setId: string,
  setData: Partial<Omit<WorkoutSet, 'id' | 'created_at' | 'updated_at'>>
) => {
  const { data, error } = await supabase
    .from('workout_sets')
    .update({
      reps: setData.reps,
      weight: setData.weight,
      duration: setData.duration,
      distance: setData.distance,
      completed: setData.completed
    })
    .eq('id', setId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Delete a workout set
export const deleteWorkoutSet = async (setId: string) => {
  const { error } = await supabase
    .from('workout_sets')
    .delete()
    .eq('id', setId);

  if (error) throw error;
  return true;
}; 