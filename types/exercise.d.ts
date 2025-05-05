// ExerciseDB API types
export interface Exercise {
  id: string;           // Using uuid from wger API
  name: string;         // From wger translation data
  bodyPart: string;     // Mapped from wger category
  target: string;       // Mapped from primary muscle
  equipment: string;    // Mapped from wger equipment
  gifUrl: string;       // Using wger muscle SVG URLs
  instructions?: string[]; // From wger description
  secondaryMuscles?: string[]; // From wger muscles_secondary
}

// Local workout types
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  workoutId: string;
  sets: WorkoutSet[];
  order: number;
  notes?: string;
  exerciseDetails?: Exercise; // Store complete exercise details
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  reps?: number;
  weight?: number;
  duration?: number; // For timed exercises (in seconds)
  distance?: number; // For cardio exercises (in meters)
  completed?: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  experience_level?: string;
  created_at: string;
  updated_at: string;
  exercises: WorkoutExercise[];
  duration?: number; // Total duration in minutes
  category?: string; // e.g., "Strength", "Cardio", "Flexibility"
} 