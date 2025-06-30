import { WorkoutTemplate } from '@/types/workoutGeneration';

// Helper function to create templates with different set counts
function createTemplate(name: string, focus: string[], baseExercises: any, sets: number): WorkoutTemplate {
  return {
    name: `${name}`,
    focus,
    exercises: {
      male: baseExercises.male.map((ex: any) => ({ ...ex, sets })),
      female: baseExercises.female.map((ex: any) => ({ ...ex, sets })),
      senior: baseExercises.senior.map((ex: any) => ({ ...ex, sets }))
    }
  };
}

// Base exercise definitions for Upper A
const upperABase = {
  male: [
    { name: 'Barbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Front pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell fly', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Cable triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Front pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell fly', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Cable triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell front raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Front pulldown', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Upper B
const upperBBase = {
  male: [
    { name: 'Assisted pull-up', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'One-arm row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'French press', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Pec deck', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Wide-grip pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Pec deck', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine front pulldown', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Seated lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Lower A
const lowerABase = {
  male: [
    { name: 'Free squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg extension', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Leg curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Calf raise', reps: {min: 12, max: 15}, rest: 120 },
    { name: 'Lunge', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Free squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Machine glute', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Abductor', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Calf raise', reps: {min: 12, max: 15}, rest: 120 },
    { name: 'Lunge', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Box squat', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Light leg press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell deadlift', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Leg extension', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Leg curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Seated calf raise', reps: {min: 12, max: 15}, rest: 120 }
  ]
};

// Base exercise definitions for Lower B
const lowerBBase = {
  male: [
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Front squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Machine glute', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Calf raise', reps: {min: 12, max: 15}, rest: 120 },
    { name: 'Plank', reps: {min: 30, max: 40}, rest: 120 },
    { name: 'Machine crunch', reps: {min: 12, max: 15}, rest: 120 }
  ],
  female: [
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Sumo squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Abductor', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Machine glute', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Calf raise', reps: {min: 12, max: 15}, rest: 120 },
    { name: 'Plank', reps: {min: 30, max: 40}, rest: 120 },
    { name: 'Machine crunch', reps: {min: 12, max: 15}, rest: 120 }
  ],
  senior: [
    { name: 'Dumbbell deadlift', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Box squat', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Abductor', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Machine glute', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Seated calf raise', reps: {min: 12, max: 15}, rest: 120 },
    { name: 'Modified plank', reps: {min: 20, max: 30}, rest: 120 }
  ]
};

// Base exercise definitions for Push A
const pushABase = {
  male: [
    { name: 'Barbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Cable triceps pushdown', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'French press', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Dumbbell fly', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Bench triceps dip', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Dumbbell fly', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine incline press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine shoulder press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Seated lateral raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Push B
const pushBBase = {
  male: [
    { name: 'Decline bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Military press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell fly', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Front raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Cable triceps pushdown', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Bench triceps dip', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Pec deck', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Decline bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Military press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell fly', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Front raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Bench triceps dip', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Pec deck', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine shoulder press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine fly', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Seated front raise', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Pull A
const pullABase = {
  male: [
    { name: 'Assisted pull-up', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Front pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Front pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Hammer curl', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine front pulldown', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Pull B
const pullBBase = {
  male: [
    { name: 'One-arm row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Wide-grip pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Hammer curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Shrug', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'One-arm row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Wide-grip pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Hammer curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Shrug', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine front pulldown', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Hammer curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Face pull', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Legs A (same as Lower A)
const legsABase = lowerABase;

// Base exercise definitions for Legs B (same as Lower B)
const legsBBase = lowerBBase;

// Base exercise definitions for Full Body A
const fullBodyABase = {
  male: [
    { name: 'Barbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Free squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Cable triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Free squat', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Bent-over row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Dumbbell shoulder press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Barbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Box squat', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine shoulder press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell deadlift', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Dumbbell curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Base exercise definitions for Full Body B
const fullBodyBBase = {
  male: [
    { name: 'Assisted pull-up', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'French press', reps: {min: 10, max: 12}, rest: 120 }
  ],
  female: [
    { name: 'Front pulldown', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Leg press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Incline dumbbell bench press', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Seated row', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Romanian deadlift', reps: {min: 8, max: 10}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ],
  senior: [
    { name: 'Machine front pulldown', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Light leg press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine chest press', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Machine row', reps: {min: 8, max: 12}, rest: 120 },
    { name: 'Dumbbell deadlift', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Alternating curl', reps: {min: 10, max: 12}, rest: 120 },
    { name: 'Rope triceps pushdown', reps: {min: 10, max: 12}, rest: 120 }
  ]
};

// Create all template variations (2 sets by default for now - the service will adjust based on split type)
export const upperATemplate = createTemplate('Upper A', ['Chest', 'Shoulders', 'Triceps', 'Back', 'Biceps'], upperABase, 2);
export const upperBTemplate = createTemplate('Upper B', ['Back', 'Shoulders', 'Biceps', 'Chest', 'Triceps'], upperBBase, 2);
export const lowerATemplate = createTemplate('Lower A', ['Quads', 'Glutes', 'Hamstrings', 'Calves'], lowerABase, 2);
export const lowerBTemplate = createTemplate('Lower B', ['Glutes', 'Hamstrings', 'Core', 'Quads'], lowerBBase, 2);
export const pushATemplate = createTemplate('Push A', ['Chest', 'Shoulders', 'Triceps'], pushABase, 2);
export const pushBTemplate = createTemplate('Push B', ['Chest', 'Shoulders', 'Triceps'], pushBBase, 2);
export const pullATemplate = createTemplate('Pull A', ['Back', 'Biceps', 'Hamstrings'], pullABase, 2);
export const pullBTemplate = createTemplate('Pull B', ['Back', 'Biceps', 'Hamstrings'], pullBBase, 2);
export const legsATemplate = createTemplate('Legs A', ['Quads', 'Glutes', 'Hamstrings', 'Calves'], legsABase, 2);
export const legsBTemplate = createTemplate('Legs B', ['Glutes', 'Hamstrings', 'Core', 'Quads'], legsBBase, 2);
export const fullBodyATemplate = createTemplate('Full Body A', ['Chest', 'Legs', 'Back', 'Shoulders', 'Arms'], fullBodyABase, 2);
export const fullBodyBTemplate = createTemplate('Full Body B', ['Back', 'Legs', 'Chest', 'Shoulders', 'Arms'], fullBodyBBase, 2);

// Export template creation utilities for dynamic use
export { createTemplate, upperABase, upperBBase, lowerABase, lowerBBase, pushABase, pushBBase, pullABase, pullBBase, legsABase, legsBBase, fullBodyABase, fullBodyBBase }; 