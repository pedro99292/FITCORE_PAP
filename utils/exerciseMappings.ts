/**
 * This file provides mapping utilities to ensure template exercise names 
 * match exercises from ExerciseDB.
 */

// Common variations of exercise names and their ExerciseDB equivalents
export const exerciseNameMappings: Record<string, string[]> = {
  // Chest exercises
  'Barbell bench press': ['barbell bench press', 'bench press'],
  'Dumbbell bench press': ['dumbbell bench press'],
  'Incline dumbbell bench press': ['incline dumbbell bench press', 'incline bench press dumbbell'],
  'Decline bench press': ['decline barbell bench press', 'decline bench press'],
  'Dumbbell fly': ['dumbbell fly', 'dumbbell flyes'],
  'Incline dumbbell fly': ['incline dumbbell fly', 'incline dumbbell flyes'],
  'Pec deck': ['pec deck fly', 'butterfly machine', 'chest fly machine'],
  'Machine chest press': ['chest press machine', 'machine chest press', 'seated chest press machine'],
  'Machine fly': ['machine fly', 'pec deck fly'],
  'Machine incline press': ['incline chest press machine', 'incline machine chest press'],
  
  // Back exercises
  'Bent-over row': ['barbell bent over row', 'bent over barbell row'],
  'One-arm row': ['dumbbell one arm row', 'single arm dumbbell row', 'one arm dumbbell row'],
  'Seated row': ['seated cable row', 'cable seated row'],
  'Front pulldown': ['lat pulldown', 'cable lat pulldown'],
  'Wide-grip pulldown': ['wide grip lat pulldown', 'cable wide grip lat pulldown'],
  'Assisted pull-up': ['assisted pull-up', 'machine assisted pull-up'],
  'Face pull': ['cable face pull', 'face pull'],
  'Machine row': ['seated row machine', 'machine row'],
  'Machine front pulldown': ['lat pulldown machine', 'machine lat pulldown'],
  'Shrug': ['barbell shrug', 'dumbbell shrug'],
  
  // Shoulder exercises
  'Dumbbell shoulder press': ['dumbbell shoulder press', 'seated dumbbell shoulder press'],
  'Military press': ['barbell military press', 'standing military press'],
  'Lateral raise': ['dumbbell lateral raise', 'standing dumbbell lateral raise'],
  'Front raise': ['dumbbell front raise', 'barbell front raise'],
  'Dumbbell front raise': ['dumbbell front raise'],
  'Seated lateral raise': ['seated dumbbell lateral raise'],
  'Machine shoulder press': ['shoulder press machine', 'machine shoulder press'],
  'Seated front raise': ['seated dumbbell front raise'],
  
  // Arm exercises
  'Barbell curl': ['barbell curl', 'standing barbell curl'],
  'Cable triceps pushdown': ['cable triceps pushdown', 'triceps pushdown'],
  'Rope triceps pushdown': ['rope triceps pushdown', 'cable rope triceps pushdown'],
  'Alternating curl': ['dumbbell alternate bicep curl', 'alternate dumbbell curl'],
  'French press': ['lying triceps extension', 'skull crusher', 'ez bar lying triceps extension'],
  'Hammer curl': ['dumbbell hammer curl', 'standing hammer curl'],
  'Bench triceps dip': ['bench dip', 'triceps bench dip'],
  'Dumbbell curl': ['dumbbell bicep curl', 'dumbbell curl'],
  
  // Leg exercises
  'Free squat': ['barbell squat', 'barbell back squat'],
  'Front squat': ['barbell front squat', 'front squat'],
  'Leg press': ['leg press', 'sled leg press'],
  'Romanian deadlift': ['barbell romanian deadlift', 'romanian deadlift'],
  'Leg extension': ['leg extensions', 'machine leg extension'],
  'Leg curl': ['lying leg curl', 'seated leg curl', 'machine leg curl'],
  'Calf raise': ['standing calf raise', 'machine standing calf raise'],
  'Seated calf raise': ['seated calf raise', 'machine seated calf raise'],
  'Lunge': ['dumbbell lunge', 'barbell lunge', 'walking lunge'],
  'Box squat': ['barbell box squat', 'box squat'],
  'Light leg press': ['leg press', 'sled leg press'],
  'Sumo squat': ['barbell sumo squat', 'dumbbell sumo squat', 'sumo squat'],
  'Dumbbell deadlift': ['dumbbell deadlift'],
  'Machine glute': ['cable glute kickback', 'glute kickback machine', 'hip thrust'],
  'Abductor': ['cable hip abduction', 'hip abduction machine'],
  
  // Core exercises
  'Plank': ['plank', 'body plank'],
  'Modified plank': ['knee plank', 'modified plank'],
  'Machine crunch': ['cable crunch', 'machine crunch', 'crunch machine'],
};

/**
 * Get all possible variation names for an exercise to improve matching with ExerciseDB
 */
export function getExerciseVariationNames(exerciseName: string): string[] {
  // First, check if we have a specific mapping
  if (exerciseNameMappings[exerciseName]) {
    return exerciseNameMappings[exerciseName];
  }

  // If no mapping found, return the original name as a fallback
  return [exerciseName.toLowerCase()];
}

/**
 * Normalize exercise names for comparison
 */
export function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, ' ')          // Replace multiple spaces with a single space
    .replace(/-/g, ' ')            // Replace hyphens with spaces
    .replace(/\(.*?\)/g, '')       // Remove content in parentheses
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 and 1, where 1 means perfect match
 */
export function calculateStringSimilarity(a: string, b: string): number {
  const normA = normalizeExerciseName(a);
  const normB = normalizeExerciseName(b);
  
  if (normA === normB) return 1;
  if (normA.length === 0) return 0;
  if (normB.length === 0) return 0;
  
  // Simple implementation of Levenshtein distance
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= normA.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= normB.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= normA.length; i++) {
    for (let j = 1; j <= normB.length; j++) {
      const cost = normA[i-1] === normB[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,      // deletion
        matrix[i][j-1] + 1,      // insertion
        matrix[i-1][j-1] + cost  // substitution
      );
    }
  }
  
  // Calculate similarity from distance
  const distance = matrix[normA.length][normB.length];
  const maxLength = Math.max(normA.length, normB.length);
  
  return 1 - (distance / maxLength);
} 