// ExerciseDB API types
export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
  overview?: string;
  exerciseTips?: string[];
  variations?: string[];
  keywords?: string[];
  exerciseType?: string;
  source?: 'exercisedb' | 'wger';
}

// Local workout types
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  workoutId: string;
  sets: WorkoutSet[];
  order: number;
  exerciseDetails?: Exercise; // Store complete exercise details
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  reps?: number;
  weight?: number;
  duration?: number; // Maps to rest_time in database
  setOrder?: number; // Maps to set_order in database
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  exercises: WorkoutExercise[];
} 