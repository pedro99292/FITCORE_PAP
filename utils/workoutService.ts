import { supabase } from './supabase';
import { Workout, WorkoutExercise, WorkoutSet } from '@/types/exercise';

// Create a new workout
export const createWorkout = async (workout: Omit<Workout, 'id' | 'created_at' | 'updated_at' | 'exercises'> & { workout_type?: 'user_created' | 'auto_generated' }) => {
  const { data, error } = await supabase
    .from('workouts')
    .insert([{ ...workout, workout_type: workout.workout_type || 'user_created' }])
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
      order: workoutExercise.order
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
      planned_reps: workoutSet.reps,
      rest_time: workoutSet.duration,
      set_order: workoutSet.setOrder || 0
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// Get a user's workouts with exercise counts (optimized)
export const getUserWorkoutsWithDetails = async (userId: string) => {
  console.time('🔍 Database query time');
  
  // Step 1: Get basic workout data first (fast query)
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('workout_id, user_id, title, description, created_at, workout_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (workoutsError) throw workoutsError;
  
  if (!workouts || workouts.length === 0) {
    console.timeEnd('🔍 Database query time');
    return [];
  }

  // Step 2: Get aggregated exercise data for all workouts in one query
  const workoutIds = workouts.map(w => w.workout_id);
  
  const { data: workoutStats, error: statsError } = await supabase
    .from('workout_sets')
    .select('workout_id, exercise_id, exercise_target')
    .in('workout_id', workoutIds);

  console.timeEnd('🔍 Database query time');

  if (statsError) throw statsError;

  console.time('⚙️ Data processing time');
  
  // Step 3: Process the data efficiently
  const statsMap = new Map<string, { exerciseIds: Set<string>, muscleTargets: Set<string> }>();
  
  // Initialize stats for all workouts
  workouts.forEach(workout => {
    statsMap.set(workout.workout_id, {
      exerciseIds: new Set(),
      muscleTargets: new Set()
    });
  });
  
  // Process workout sets data
  workoutStats?.forEach(set => {
    const stats = statsMap.get(set.workout_id);
    if (stats) {
      if (set.exercise_id) stats.exerciseIds.add(set.exercise_id);
      if (set.exercise_target) stats.muscleTargets.add(set.exercise_target);
    }
  });

  // Step 4: Combine data
  const result = workouts.map(workout => {
    const stats = statsMap.get(workout.workout_id);
    return {
      ...workout,
      exerciseCount: stats?.exerciseIds.size || 0,
      muscleGroups: Array.from(stats?.muscleTargets || [])
    };
  });
  
  console.timeEnd('⚙️ Data processing time');
  
  // Query stats logging removed for cleaner console output
  
  return result;
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
    .order('order', { ascending: true });

  if (exercisesError) throw exercisesError;

  // For each exercise, fetch its sets
  const exercisesWithSets = await Promise.all(
    workoutExercises.map(async (exercise) => {
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_exercise_id', exercise.id)
        .order('set_order', { ascending: true });

      if (setsError) throw setsError;

      return {
        id: exercise.id,
        exerciseId: exercise.exercise_id,
        workoutId: exercise.workout_id,
        order: exercise.order,
        sets: sets.map(set => ({
          id: set.id,
          exerciseId: set.workout_exercise_id,
          reps: set.planned_reps,
          duration: set.rest_time,
          setOrder: set.set_order
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

// Delete a workout while preserving workout history (sessions)
export const deleteWorkout = async (workoutId: string) => {
  // First, update any sessions to remove the workout reference (preserve history)
  const { error: sessionsUpdateError } = await supabase
    .from('sessions')
    .update({ workout_id: null })
    .eq('workout_id', workoutId);
  
  if (sessionsUpdateError) {
    console.warn('Error updating sessions during workout deletion:', sessionsUpdateError);
    // Continue with deletion even if session update fails
  }

  // Delete workout_sets (these are the planned sets, not the actual workout history)
  const { error: setsError } = await supabase
    .from('workout_sets')
    .delete()
    .eq('workout_id', workoutId);
  
  if (setsError) {
    console.error('Error deleting workout sets:', setsError);
    throw setsError;
  }

  // Finally delete the workout itself
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
      order: exerciseData.order
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
      planned_reps: setData.reps,
      rest_time: setData.duration,
      set_order: setData.setOrder
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

// Get a user's workouts (basic, very fast)
export const getUserWorkoutsBasic = async (userId: string) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('workout_id, user_id, title, description, created_at, workout_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50); // Limit for performance

  if (error) throw error;
  
  return data.map(workout => ({
    ...workout,
    exerciseCount: 0,
    muscleGroups: []
  }));
}; 