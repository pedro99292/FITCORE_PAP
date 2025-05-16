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