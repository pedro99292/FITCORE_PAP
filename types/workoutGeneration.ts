export interface UserProfile {
  age: number;
  gender: 'Male' | 'Female' | 'Prefer not to say';
  goal: 'Lose weight' | 'Gain muscle' | 'Gain strength' | 'Maintain muscle';
  experience: 'Novice' | 'Experienced' | 'Advanced';
  daysPerWeek: number;
}

export interface GoalSettings {
  sets: number;
  reps: number;
  rest: number; // in seconds
  focus: string[];
  cardio?: boolean;
}

export interface GeneratedExercise {
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  sets: number;
  reps: number;
  rest: number; // in seconds
  exerciseId: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedWorkoutPlan {
  plan: WorkoutDay[];
  notes: {
    cardio: boolean;
    recommendation: string;
  };
}

export interface SplitTemplate {
  [key: number]: string[];
}

export interface ExerciseGroup {
  exercise_id: string;
  exercise_name: string;
  exercise_bodypart: string;
  exercise_target: string;
  exercise_equipment: string;
  sets: Array<{
    planned_reps: number;
    rest_time: number;
    set_order: number;
  }>;
} 