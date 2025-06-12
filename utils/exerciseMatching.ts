/**
 * Exercise matching utility to ensure accurate mapping between template exercises
 * and ExerciseDB entries
 */
import { Exercise } from '@/types/exercise';

// Comprehensive mapping between template exercise names and their exact ExerciseDB equivalents
export const EXERCISE_EXACT_MATCHES: Record<string, string> = {
  // Chest exercises
  'Barbell bench press': 'barbell bench press',
  'Dumbbell bench press': 'dumbbell bench press',
  'Incline dumbbell bench press': 'incline dumbbell bench press',
  'Decline bench press': 'decline barbell bench press',
  'Dumbbell fly': 'dumbbell fly',
  'Incline dumbbell fly': 'incline dumbbell fly',
  'Pec deck': 'pec deck fly',
  'Machine chest press': 'chest press machine',
  'Machine fly': 'butterfly machine',
  'Machine incline press': 'incline chest press machine',
  
  // Back exercises
  'Bent-over row': 'barbell bent over row',
  'Barbell bent-over row': 'barbell bent over row',
  'Dumbbell bent-over row': 'dumbbell bent over row',
  'One-arm row': 'dumbbell one arm row',
  'Seated row': 'seated cable row',
  'Front pulldown': 'cable lat pulldown',
  'Wide-grip pulldown': 'cable wide grip lat pulldown',
  'Assisted pull-up': 'assisted pull-up',
  'Face pull': 'cable face pull',
  'Machine row': 'seated row machine',
  'Machine front pulldown': 'lat pulldown machine',
  'Shrug': 'barbell shrug',
  
  // Shoulder exercises
  'Dumbbell shoulder press': 'dumbbell shoulder press',
  'Military press': 'barbell military press',
  'Lateral raise': 'dumbbell lateral raise',
  'Front raise': 'dumbbell front raise',
  'Dumbbell front raise': 'dumbbell front raise',
  'Seated lateral raise': 'seated dumbbell lateral raise',
  'Machine shoulder press': 'shoulder press machine',
  'Seated front raise': 'seated dumbbell front raise',
  
  // Arm exercises
  'Barbell curl': 'barbell curl',
  'Cable triceps pushdown': 'cable triceps pushdown',
  'Rope triceps pushdown': 'cable rope triceps pushdown',
  'Alternating curl': 'dumbbell alternate bicep curl',
  'French press': 'ez barbell lying triceps extension',
  'Hammer curl': 'dumbbell hammer curl',
  'Bench triceps dip': 'bench dip',
  'Dumbbell curl': 'dumbbell bicep curl',
  
  // Leg exercises
  'Free squat': 'barbell squat',
  'Front squat': 'barbell front squat',
  'Leg press': 'sled leg press',
  'Romanian deadlift': 'barbell romanian deadlift',
  'Leg extension': 'leg extensions',
  'Leg curl': 'lying leg curl',
  'Calf raise': 'standing calf raise',
  'Seated calf raise': 'seated calf raise',
  'Lunge': 'dumbbell lunge',
  'Box squat': 'barbell box squat',
  'Light leg press': 'sled leg press',
  'Sumo squat': 'barbell sumo squat',
  'Dumbbell deadlift': 'dumbbell deadlift',
  'Machine glute': 'cable glute kickback',
  'Abductor': 'cable hip abduction',
  
  // Core exercises
  'Plank': 'plank',
  'Modified plank': 'knee plank',
  'Machine crunch': 'cable crunch',
};

// Fallback options if exact match not found - use for each template exercise
export const EXERCISE_FALLBACK_OPTIONS: Record<string, string[]> = {
  'Barbell bench press': ['bench press', 'smith machine bench press', 'barbell incline bench press'],
  'Dumbbell bench press': ['bench press (with dumbbells)', 'dumbbell floor press'],
  'Incline dumbbell bench press': ['incline bench press', 'dumbbell incline bench press', 'incline press'],
  'Decline bench press': ['decline bench press', 'smith machine decline bench press', 'decline press'],
  'Dumbbell fly': ['dumbbell flyes', 'cable crossover', 'chest fly'],
  'Pec deck': ['butterfly machine', 'chest fly machine', 'cable crossover'],
  'Machine chest press': ['seated chest press', 'smith machine bench press', 'chest press'],
  
  'Bent-over row': ['bent over row', 'barbell row', 'smith machine row'],
  'Barbell bent-over row': ['bent over row', 'barbell row', 'bent over barbell row'],
  'Dumbbell bent-over row': ['bent over dumbbell row', 'dumbbell row', 'bent over row'],
  'Seated row': ['cable seated row', 'machine row', 'low row'],
  'Front pulldown': ['lat pulldown', 'wide-grip lat pulldown', 'cable pulldown'],
  'Assisted pull-up': ['machine assisted pull-up', 'lat pulldown', 'cable pulldown'],
  
  'Dumbbell shoulder press': ['seated dumbbell shoulder press', 'shoulder press', 'dumbbell press'],
  'Military press': ['barbell shoulder press', 'smith machine overhead press', 'shoulder press'],
  'Lateral raise': ['dumbbell side lateral raise', 'cable lateral raise', 'side raise'],
  
  'Barbell curl': ['standing barbell curl', 'biceps curl (barbell)', 'ez-bar curl'],
  'Cable triceps pushdown': ['triceps pushdown', 'cable pushdown', 'pushdown'],
  'Rope triceps pushdown': ['triceps pushdown', 'cable pushdown', 'rope pushdown'],
  'Alternating curl': ['alternate hammer curl', 'alternating dumbbell curl', 'dumbbell curl'],
  'French press': ['lying triceps extension', 'skull crusher', 'triceps extension'],
  
  'Free squat': ['barbell squat', 'squat', 'smith machine squat'],
  'Front squat': ['front squat', 'smith machine front squat', 'goblet squat'],
  'Leg press': ['leg press', '45 degree leg press', 'horizontal leg press'],
  'Romanian deadlift': ['romanian deadlift', 'stiff leg deadlift', 'straight leg deadlift'],
  'Leg curl': ['seated leg curl', 'machine leg curl', 'hamstring curl'],
  'Machine glute': ['hip thrust', 'glute bridge', 'cable kickback', 'glute kickback'],
  'Abductor': ['hip abduction', 'cable hip abduction', 'abductor machine'],
  'Lunge': ['dumbbell lunge', 'barbell lunge', 'walking lunge'],
  'Sumo squat': ['sumo squat', 'plie squat', 'wide stance squat'],
};

// Common exercise equipment variants to try
const EQUIPMENT_VARIANTS = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'smith machine'];

/**
 * Find the best ExerciseDB exercise match for a template exercise name
 * Uses a multi-tiered approach:
 * 1. Try exact match from dictionary
 * 2. Try finding exercise with exact name
 * 3. Try fallback options
 * 4. Try substring matching
 * 5. Try fuzzy matching with equipment variants
 * 6. Try body part matching
 */
export function findBestExerciseMatch(templateName: string, availableExercises: Exercise[]): Exercise | null {
  // Normalize available exercises for case-insensitive comparison
  const normalizedExercises = availableExercises.map(ex => ({
    ...ex,
    normalizedName: ex.name.toLowerCase().trim()
  }));
  
  // 1. Try exact match from our dictionary
  if (EXERCISE_EXACT_MATCHES[templateName]) {
    const exactName = EXERCISE_EXACT_MATCHES[templateName].toLowerCase();
    const exactMatch = normalizedExercises.find(ex => ex.normalizedName === exactName);
    if (exactMatch) {
      console.log(`[EXACT DICTIONARY] "${templateName}" → "${exactMatch.name}"`);
      return exactMatch;
    }
  }
  
  // 2. Try exact match with template name
  const templateNameLower = templateName.toLowerCase().trim();
  const directMatch = normalizedExercises.find(ex => ex.normalizedName === templateNameLower);
  if (directMatch) {
    console.log(`[DIRECT MATCH] "${templateName}" → "${directMatch.name}"`);
    return directMatch;
  }
  
  // 3. Try fallback options
  if (EXERCISE_FALLBACK_OPTIONS[templateName]) {
    for (const fallbackName of EXERCISE_FALLBACK_OPTIONS[templateName]) {
      const fallbackMatch = normalizedExercises.find(
        ex => ex.normalizedName === fallbackName.toLowerCase().trim()
      );
      if (fallbackMatch) {
        console.log(`[FALLBACK] "${templateName}" → "${fallbackMatch.name}"`);
        return fallbackMatch;
      }
    }
  }
  
  // 4. Try substring matching (both ways)
  // First try if any exercise contains the template name
  const containsMatches = normalizedExercises.filter(
    ex => ex.normalizedName.includes(templateNameLower)
  );
  
  if (containsMatches.length > 0) {
    // Find the shortest match (likely the most specific)
    const bestMatch = containsMatches.sort((a, b) => 
      a.normalizedName.length - b.normalizedName.length
    )[0];
    console.log(`[CONTAINS] "${templateName}" → "${bestMatch.name}"`);
    return bestMatch;
  }
  
  // 5. Try equipment variants with core exercise name
  // Extract the core name without equipment
  const words = templateNameLower.split(' ');
  const possibleEquipment = ['barbell', 'dumbbell', 'machine', 'cable', 'assisted', 'smith'];
  let coreName = templateNameLower;
  
  // Remove equipment term if present
  if (possibleEquipment.some(eq => words[0] === eq)) {
    coreName = words.slice(1).join(' ');
  }
  
  // Try each equipment variant with the core name
  for (const equipment of EQUIPMENT_VARIANTS) {
    const variantMatches = normalizedExercises.filter(ex => 
      ex.normalizedName.includes(coreName) && 
      ex.equipment.toLowerCase().includes(equipment)
    );
    
    if (variantMatches.length > 0) {
      const bestMatch = variantMatches[0];
      console.log(`[EQUIPMENT VARIANT] "${templateName}" → "${bestMatch.name}"`);
      return bestMatch;
    }
  }
  
  // 6. Try reverse matching (template name contains exercise name)
  if (words.length > 1) {
    // Try with the last two words (often the core exercise name)
    const shortName = words.slice(-2).join(' ');
    const reverseMatches = normalizedExercises.filter(
      ex => shortName.includes(ex.normalizedName)
    );
    
    if (reverseMatches.length > 0) {
      const bestMatch = reverseMatches.sort((a, b) => 
        b.normalizedName.length - a.normalizedName.length // Longest match is likely best
      )[0];
      console.log(`[REVERSE MATCH] "${templateName}" → "${bestMatch.name}"`);
      return bestMatch;
    }
  }
  
  // 7. Match by body part and target muscle as last resort
  const bodyPartKeywords = extractBodyPartKeywords(templateName);
  if (bodyPartKeywords.length > 0) {
    const bodyPartMatches = normalizedExercises.filter(ex => 
      bodyPartKeywords.some(keyword => 
        ex.bodyPart.toLowerCase().includes(keyword) || 
        ex.target.toLowerCase().includes(keyword)
      )
    );
    
    if (bodyPartMatches.length > 0) {
      // Get exercises that match the most specific keyword
      const bestKeyword = bodyPartKeywords.sort((a, b) => b.length - a.length)[0];
      const bestMatches = bodyPartMatches.filter(ex => 
        ex.target.toLowerCase().includes(bestKeyword) ||
        ex.bodyPart.toLowerCase().includes(bestKeyword)
      );
      
      const bestMatch = bestMatches.length > 0 ? bestMatches[0] : bodyPartMatches[0];
      console.log(`[BODY PART] "${templateName}" → "${bestMatch.name}"`);
      return bestMatch;
    }
  }
  
  // 8. Last ditch effort - try to find ANY exercise for the same body part
  // Extract primary body part from template name
  const primaryBodyPart = getPrimaryBodyPart(templateName);
  if (primaryBodyPart) {
    const bodyPartMatches = normalizedExercises.filter(ex => 
      ex.bodyPart.toLowerCase().includes(primaryBodyPart) ||
      ex.target.toLowerCase().includes(primaryBodyPart)
    );
    
    if (bodyPartMatches.length > 0) {
      // Sort by simplicity of name
      const bestMatch = bodyPartMatches.sort((a, b) => 
        a.name.length - b.name.length
      )[0];
      console.log(`[LAST RESORT] "${templateName}" → "${bestMatch.name}" (by body part)`);
      return bestMatch;
    }
  }
  
  // No match found
  console.warn(`[NO MATCH] Could not find match for "${templateName}"`);
  return null;
}

/**
 * Extract likely body part keywords from an exercise name
 */
function extractBodyPartKeywords(exerciseName: string): string[] {
  const keywords: string[] = [];
  const name = exerciseName.toLowerCase();
  
  // Common muscle groups and body parts
  const bodyParts = [
    'chest', 'pec', 'back', 'lat', 'shoulder', 'delt', 
    'bicep', 'tricep', 'arm', 'leg', 'quad', 'hamstring', 
    'glute', 'calf', 'abs', 'core', 'oblique'
  ];
  
  for (const part of bodyParts) {
    if (name.includes(part)) {
      keywords.push(part);
    }
  }
  
  return keywords;
}

/**
 * Determine the primary body part targeted by an exercise based on its name
 */
function getPrimaryBodyPart(exerciseName: string): string | null {
  const name = exerciseName.toLowerCase();
  
  // Map exercise types to body parts
  const exerciseToBodyPart: Record<string, string> = {
    'bench press': 'chest',
    'fly': 'chest',
    'press': 'chest',
    'row': 'back',
    'pulldown': 'back',
    'pull-up': 'back',
    'shoulder': 'shoulders',
    'lateral': 'shoulders',
    'front raise': 'shoulders',
    'bicep': 'upper arms',
    'triceps': 'upper arms',
    'squat': 'upper legs',
    'leg press': 'upper legs',
    'deadlift': 'upper legs',
    'lunge': 'upper legs',
    'extension': 'upper legs',
    'hamstring': 'upper legs',
    'calf': 'lower legs',
    'abductor': 'upper legs',
    'glute': 'upper legs',
    'crunch': 'waist',
    'plank': 'waist'
  };
  
  for (const [exercise, bodyPart] of Object.entries(exerciseToBodyPart)) {
    if (name.includes(exercise)) {
      return bodyPart;
    }
  }
  
  return null;
} 