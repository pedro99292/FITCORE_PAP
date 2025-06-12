// General workout rules
export const workoutRules = {
  maxSetsPerExercise: 3,
  maxSetsForFullBodyUpperLower: 2, // Upper, Lower, and Full Body workouts have max 2 sets per exercise
  targetSetsPerWorkout: 15,
  maxRepsPerSet: 15,
  minRestTime: 60, // in seconds
  majorMuscleGroupsPerWeek: 2 // Each major muscle group should be trained 2x per week
};

// Rep ranges by goal and experience
export const repRanges = {
  'Lose weight': {
    'Novice': { min: 8, max: 12 },
    'Experienced': { min: 6, max: 10 },
    'Advanced': { min: 6, max: 10 }
  },
  'Gain muscle': {
    'Novice': { min: 8, max: 12 },
    'Experienced': { min: 6, max: 10 },
    'Advanced': { min: 6, max: 10 }
  },
  'Gain strength': {
    'Novice': { min: 6, max: 8 },
    'Experienced': { min: 4, max: 6 },
    'Advanced': { min: 4, max: 6 }
  },
  'Maintain muscle': {
    'Novice': { min: 8, max: 12 },
    'Experienced': { min: 8, max: 10 },
    'Advanced': { min: 8, max: 10 }
  }
};

// Sets per exercise by goal
export const setsPerExercise = {
  'Lose weight': 2,
  'Gain muscle': 3,
  'Gain strength': 3,
  'Maintain muscle': 2
};

// Rest time (in seconds) by goal
export const restTimeByGoal = {
  'Lose weight': 120, // 2-3 minutes
  'Gain muscle': 120, // 2-3 minutes 
  'Gain strength': 180, // 3 minutes
  'Maintain muscle': 90  // 1-2 minutes
};

// Cardio recommendations by goal
export const cardioRecommendations = {
  'Lose weight': {
    recommended: true,
    frequency: '3-5 times per week',
    note: 'Prioritize diet and cardio sessions for weight loss. Cardio outside of strength training.'
  },
  'Gain muscle': {
    recommended: false,
    frequency: '1-2 times per week',
    note: 'Limited cardio to avoid interference with muscle growth.'
  },
  'Gain strength': {
    recommended: false,
    frequency: '1-2 times per week',
    note: 'Limited cardio to maintain cardiovascular health without impacting strength gains.'
  },
  'Maintain muscle': {
    recommended: true,
    frequency: '2-3 times per week',
    note: 'Moderate cardio for overall health benefits.'
  }
};

// Age-based adaptations
export const ageAdaptations = {
  under30: {
    note: 'Maximum adaptive capacity',
    equipmentRestrictions: []
  },
  age30to49: {
    note: 'Maintain load, focus on recovery and mobility',
    equipmentRestrictions: []
  },
  age50Plus: {
    note: 'Reduce impact, avoid joint stress and explosive movements',
    equipmentRestrictions: ['barbell', 'olympic'] // Avoid these equipment types for 50+ users
  }
};

// Gender-based adaptations
export const genderAdaptations = {
  'Female': {
    emphasis: ['glutes', 'hamstrings', 'core'],
    note: 'Greater emphasis on glutes, hamstrings, core'
  },
  'Male': {
    emphasis: ['chest', 'shoulders', 'back', 'arms'],
    note: 'Greater focus on upper body'
  },
  'Prefer not to say': {
    emphasis: ['full body', 'balanced'],
    note: 'Balanced approach to all muscle groups'
  }
};

// Experience-based adaptations
export const experienceAdaptations = {
  'Novice': {
    note: 'Focus on technique, machines, and basic movements',
    preferredEquipment: ['body weight', 'machine', 'cable', 'dumbbell', 'assisted'],
    repRangeAdjustment: { add: 2 } // Add to min/max reps for novices
  },
  'Experienced': {
    note: 'Progressive overload, varied equipment',
    preferredEquipment: [],
    repRangeAdjustment: { add: 0 }
  },
  'Advanced': {
    note: 'Periodization, advanced techniques, heavy compound movements',
    preferredEquipment: [],
    repRangeAdjustment: { add: 0 }
  }
}; 