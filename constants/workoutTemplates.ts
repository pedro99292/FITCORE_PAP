import { WorkoutTemplate } from '@/types/workoutGeneration';

// Upper A Template - 2 sets version
export const upperATemplate: WorkoutTemplate = {
  name: 'Upper A',
  focus: ['Chest', 'Shoulders', 'Triceps', 'Back', 'Biceps'],
  exercises: {
    male: [
      { name: 'Barbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Cable triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Cable triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell front raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Upper B Template - 2 sets version
export const upperBTemplate: WorkoutTemplate = {
  name: 'Upper B',
  focus: ['Back', 'Shoulders', 'Biceps', 'Chest', 'Triceps'],
  exercises: {
    male: [
      { name: 'Assisted pull-up', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'One-arm row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'French press', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Pec deck', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Wide-grip pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Pec deck', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine front pulldown', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Seated lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Lower A Template - 2 sets version
export const lowerATemplate: WorkoutTemplate = {
  name: 'Lower A',
  focus: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  exercises: {
    male: [
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg extension', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Lunge', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Lunge', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Box squat', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Light leg press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg extension', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Seated calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ]
  }
};

// Lower B Template - 2 sets version
export const lowerBTemplate: WorkoutTemplate = {
  name: 'Lower B',
  focus: ['Glutes', 'Hamstrings', 'Core', 'Quads'],
  exercises: {
    male: [
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Front squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Plank', sets: 2, reps: {min: 30, max: 40}, rest: 120 }, // seconds
      { name: 'Machine crunch', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ],
    female: [
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Sumo squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Plank', sets: 2, reps: {min: 30, max: 40}, rest: 120 }, // seconds
      { name: 'Machine crunch', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ],
    senior: [
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Box squat', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Seated calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Modified plank', sets: 2, reps: {min: 20, max: 30}, rest: 120 } // seconds
    ]
  }
};

// Push A Template - 2 sets version
export const pushATemplate: WorkoutTemplate = {
  name: 'Push A',
  focus: ['Chest', 'Shoulders', 'Triceps'],
  exercises: {
    male: [
      { name: 'Barbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Cable triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'French press', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Bench triceps dip', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine incline press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine shoulder press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Seated lateral raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Push B Template - 2 sets version
export const pushBTemplate: WorkoutTemplate = {
  name: 'Push B',
  focus: ['Chest', 'Shoulders', 'Triceps'],
  exercises: {
    male: [
      { name: 'Decline bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Military press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Front raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Cable triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Bench triceps dip', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Pec deck', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Decline bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Military press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Front raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Bench triceps dip', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Pec deck', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine shoulder press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine fly', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Seated front raise', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Pull A Template - 2 sets version
export const pullATemplate: WorkoutTemplate = {
  name: 'Pull A',
  focus: ['Back', 'Biceps', 'Hamstrings'],
  exercises: {
    male: [
      { name: 'Assisted pull-up', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Hammer curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine front pulldown', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Pull B Template - 2 sets version
export const pullBTemplate: WorkoutTemplate = {
  name: 'Pull B',
  focus: ['Back', 'Biceps', 'Hamstrings'],
  exercises: {
    male: [
      { name: 'One-arm row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Wide-grip pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Hammer curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Shrug', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'One-arm row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Wide-grip pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Hammer curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Shrug', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine front pulldown', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Hammer curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Face pull', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Legs A Template - 2 sets version (Same as Lower A for PPL split)
export const legsATemplate: WorkoutTemplate = {
  name: 'Legs A',
  focus: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  exercises: {
    male: [
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg extension', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Lunge', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Lunge', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Box squat', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Light leg press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg extension', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Seated calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ]
  }
};

// Legs B Template - 2 sets version (Same as Lower B for PPL split)
export const legsBTemplate: WorkoutTemplate = {
  name: 'Legs B',
  focus: ['Glutes', 'Hamstrings', 'Core', 'Quads'],
  exercises: {
    male: [
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Front squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Plank', sets: 2, reps: {min: 30, max: 40}, rest: 120 }, // seconds
      { name: 'Machine crunch', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ],
    female: [
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Sumo squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Plank', sets: 2, reps: {min: 30, max: 40}, rest: 120 }, // seconds
      { name: 'Machine crunch', sets: 2, reps: {min: 12, max: 15}, rest: 120 }
    ],
    senior: [
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Box squat', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Abductor', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Machine glute', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Seated calf raise', sets: 2, reps: {min: 12, max: 15}, rest: 120 },
      { name: 'Modified plank', sets: 2, reps: {min: 20, max: 30}, rest: 120 } // seconds
    ]
  }
};

// Full Body A Template - 2 sets version (Push dominant)
export const fullBodyATemplate: WorkoutTemplate = {
  name: 'Full Body A',
  focus: ['Chest', 'Legs', 'Back', 'Shoulders', 'Arms'],
  exercises: {
    male: [
      { name: 'Barbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Cable triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Free squat', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Bent-over row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Dumbbell shoulder press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Barbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Box squat', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine shoulder press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Dumbbell curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
};

// Full Body B Template - 2 sets version (Pull dominant)
export const fullBodyBTemplate: WorkoutTemplate = {
  name: 'Full Body B',
  focus: ['Back', 'Legs', 'Chest', 'Shoulders', 'Arms'],
  exercises: {
    male: [
      { name: 'Assisted pull-up', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'French press', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    female: [
      { name: 'Front pulldown', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Leg press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Incline dumbbell bench press', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Seated row', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Romanian deadlift', sets: 2, reps: {min: 8, max: 10}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ],
    senior: [
      { name: 'Machine front pulldown', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Light leg press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine chest press', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Machine row', sets: 2, reps: {min: 8, max: 12}, rest: 120 },
      { name: 'Dumbbell deadlift', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Alternating curl', sets: 2, reps: {min: 10, max: 12}, rest: 120 },
      { name: 'Rope triceps pushdown', sets: 2, reps: {min: 10, max: 12}, rest: 120 }
    ]
  }
}; 