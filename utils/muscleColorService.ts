import { supabase } from './supabase';

// Muscle group mappings from exercise targets to muscle IDs
const muscleGroupMappings: Record<string, string[]> = {
  // Chest
  'pectorals': ['chest'],
  'pecs': ['chest'],
  'chest': ['chest'],
  'pectoral': ['chest'],
  
  // Shoulders
  'delts': ['shoulders', 'back_shoulders'],
  'deltoids': ['shoulders', 'back_shoulders'],
  'shoulders': ['shoulders', 'back_shoulders'],
  'shoulder': ['shoulders', 'back_shoulders'],
  'anterior deltoid': ['shoulders'],
  'posterior deltoid': ['back_shoulders'],
  'middle deltoid': ['shoulders', 'back_shoulders'],
  'lateral deltoid': ['shoulders', 'back_shoulders'],
  'front delt': ['shoulders'],
  'rear delt': ['back_shoulders'],
  'side delt': ['shoulders', 'back_shoulders'],
  
  // Traps
  'traps': ['traps', 'back_traps'],
  'trapezius': ['traps', 'back_traps'],
  'trap': ['traps', 'back_traps'],
  
  // Biceps
  'biceps': ['biceps'],
  'biceps brachii': ['biceps'],
  'brachialis': ['biceps'],
  'bicep': ['biceps'],
  
  // Triceps - now properly mapped to back triceps
  'triceps': ['back_triceps'],
  'triceps brachii': ['back_triceps'],
  'tricep': ['back_triceps'],
  
  // Forearms
  'forearms': ['left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer'],
  'forearm': ['left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer'],
  'brachioradialis': ['left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer'],
  'wrist': ['left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer'],
  'grip': ['left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer'],
  
  // Core/Abs - include ab_outline in all ab mappings
  'abs': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  'abdominals': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  'core': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  'abdominis': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  'rectus abdominis': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  'stomach': ['abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 'abs_lower_left', 'abs_lower_right', 'ab_outline'],
  
  // Obliques
  'obliques': ['obliques_left', 'obliques_right', 'obliques_lower'],
  'oblique': ['obliques_left', 'obliques_right', 'obliques_lower'],
  'side abs': ['obliques_left', 'obliques_right', 'obliques_lower'],
  
  // Quads
  'quads': ['quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner', 'back_quads'],
  'quadriceps': ['quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner', 'back_quads'],
  'quad': ['quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner', 'back_quads'],
  'thigh': ['quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner', 'back_quads', 'back_hamstrings'],
  'front thigh': ['quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner'],
  
  // Glutes - now properly mapped to back glutes
  'glutes': ['back_glutes'],
  'gluteus': ['back_glutes'],
  'glute': ['back_glutes'],
  'butt': ['back_glutes'],
  'buttocks': ['back_glutes'],
  
  // Hamstrings - now properly mapped to back hamstrings
  'hamstrings': ['back_hamstrings'],
  'hamstring': ['back_hamstrings'],
  'back thigh': ['back_hamstrings'],
  
  // Calves/Shins
  'calves': ['back_calves', 'back_calves'],
  'calf': ['right_shin', 'left_shin'],
  'shins': ['right_shin', 'left_shin'],
  'shin': ['right_shin', 'left_shin'],
  'lower leg': ['right_shin', 'left_shin'],
  'gastrocnemius': ['right_shin', 'left_shin'],
  'soleus': ['right_shin', 'left_shin'],
  
  // Adductors
  'adductors': ['adductors'],
  'adductor': ['adductors'],
  'hip adductors': ['adductors'],
  'inner thigh': ['adductors'],
  
  // Back muscles - now properly mapped to back muscle IDs
  'lats': ['back_lats'],
  'latissimus': ['back_lats'],
  'latissimus dorsi': ['back_lats'],
  'rhomboids': ['upper_back_right', 'upper_back_left'],
  'rhomboid': ['upper_back_right', 'upper_back_left'],
  'middle trap': ['back_traps'],
  'lower trap': ['back_traps'],
  'teres': ['back_shoulders'],
  'infraspinatus': ['back_shoulders'],
  'erector spinae': ['lower_back'],
  'lower back': ['lower_back'],
  'spine': ['lower_back'],
  'spinal': ['lower_back'],
  'upper back': ['upper_back_right', 'upper_back_left', 'upper_back_right_side', 'upper_back_left_side'],
  'mid back': ['upper_back_right', 'upper_back_left', 'upper_back_right_side', 'upper_back_left_side'],
  
  // Full body/compound movements - map to multiple muscle groups
  'full body': ['chest', 'shoulders', 'abs_upper_left', 'abs_upper_right', 'quads_right_outer', 'quads_left_outer'],
  'compound': ['chest', 'shoulders', 'abs_upper_left', 'abs_upper_right', 'quads_right_outer', 'quads_left_outer'],
  
  // Hands/Arms
  'hands': ['left_hand', 'right_hand'],
  'hand': ['left_hand', 'right_hand'],
  'arms': ['biceps', 'forearm'],
  'arm': ['biceps', 'forearm'],
  'upper arm': ['biceps'],
};

// Helper function to normalize exercise target strings
const normalizeTarget = (target: string): string => {
  return target.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric chars with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

// Improved mapping function with exact word matching
const mapExerciseTargetToMuscles = (exerciseTarget: string): string[] => {
  const normalizedTarget = normalizeTarget(exerciseTarget);
  const matchedMuscles = new Set<string>();
  
  // Split target into individual words for better matching
  const targetWords = normalizedTarget.split(' ');
  
  // Check each mapping
  Object.entries(muscleGroupMappings).forEach(([keyword, muscleIds]) => {
    const normalizedKeyword = normalizeTarget(keyword);
    
    // Exact match
    if (normalizedTarget === normalizedKeyword) {
      muscleIds.forEach(m => matchedMuscles.add(m));
      return;
    }
    
    // Check if target contains the exact keyword as a whole word
    const keywordWords = normalizedKeyword.split(' ');
    
    // For single word keywords, check if it's in the target words
    if (keywordWords.length === 1) {
      if (targetWords.includes(keywordWords[0])) {
        muscleIds.forEach(m => matchedMuscles.add(m));
      }
    } else {
      // For multi-word keywords, check if all words are present in sequence or separately
      const allKeywordsPresent = keywordWords.every(word => targetWords.includes(word));
      if (allKeywordsPresent || normalizedTarget.includes(normalizedKeyword)) {
        muscleIds.forEach(m => matchedMuscles.add(m));
      }
    }
  });
  
  return Array.from(matchedMuscles);
};

// Color intensities based on workout frequency - darker red = more training days
const getIntensityColor = (frequency: number): string => {
  if (frequency === 0) {
    return '#ffffff'; // Default white for no training
  } else if (frequency === 1) {
    return '#ff8080'; // Light red - 1 day training
  } else if (frequency === 2) {
    return '#ff4444'; // Medium red - 2 days training  
  } else {
    return '#990000'; // Very dark red - 3+ days training
  }
};

// Get the start of the current week (Monday)
const getCurrentWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Get the end of the current week (Sunday)
const getCurrentWeekEnd = (): Date => {
  const weekStart = getCurrentWeekStart();
  const sunday = new Date(weekStart);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

// Calculate muscle training frequency for the current week
export const calculateWeeklyMuscleActivity = async (userId: string): Promise<Record<string, number>> => {
  try {
    const weekStart = getCurrentWeekStart();
    const weekEnd = getCurrentWeekEnd();

    // Get workout sessions from this week
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('session_id, start_time')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return {};
    }

    if (!sessions || sessions.length === 0) {
      return {};
    }

    const sessionIds = sessions.map(s => s.session_id);

    // Get exercise targets from session sets
    const { data: sessionSets, error: setsError } = await supabase
      .from('session_sets')
      .select('exercise_target, session_id')
      .in('session_id', sessionIds)
      .not('exercise_target', 'is', null)
      .not('exercise_target', 'eq', '');

    if (setsError) {
      console.error('Error fetching session sets:', setsError);
      return {};
    }

    // Count frequency per muscle group per day
    const muscleFrequency: Record<string, Set<string>> = {}; // muscle -> set of dates trained


    
    sessionSets?.forEach(set => {
      if (!set.exercise_target) return;

      // Find the session date for this set
      const session = sessions.find(s => s.session_id === set.session_id);
      if (!session) return;

      const sessionDate = new Date(session.start_time).toDateString();
      
      // Use improved mapping function
      const mappedMuscles = mapExerciseTargetToMuscles(set.exercise_target);
      
      if (mappedMuscles.length > 0) {
        mappedMuscles.forEach(muscleId => {
          if (!muscleFrequency[muscleId]) {
            muscleFrequency[muscleId] = new Set();
          }
          muscleFrequency[muscleId].add(sessionDate);
        });
      }
    });

    // Convert to frequency counts
    const result: Record<string, number> = {};
    Object.entries(muscleFrequency).forEach(([muscleId, dates]) => {
      result[muscleId] = dates.size; // Number of different days this muscle was trained
    });

    return result;
  } catch (error) {
    console.error('Error calculating weekly muscle activity:', error);
    return {};
  }
};

// Generate muscle states with weekly activity colors
export const generateMuscleStatesWithWeeklyActivity = async (userId: string): Promise<Record<string, any>> => {
  const weeklyActivity = await calculateWeeklyMuscleActivity(userId);
  
  // Default muscle states with all muscles (matching InteractiveMuscleSilhouette component)
  const allMuscleIds = [
    // Front view muscles
    'head', 'shoulders', 'chest', 'traps', 'biceps',
    'obliques_left', 'obliques_right', 'obliques_lower', 'ab_outline',
    'abs_upper_left', 'abs_upper_right', 'abs_middle_left', 'abs_middle_right', 
    'abs_lower_left', 'abs_lower_right', 'left_forearm', 'left_forearm_outer', 'right_forearm', 'right_forearm_outer',
    'quads_right_outer', 'quads_left_outer', 'quads_right_inner', 'quads_left_inner',
    'adductors', 'left_hand', 'right_hand', 'left_shin', 'right_shin', 
    'left_heel', 'right_heel',
    
    // Back view muscles - now complete list
    'back_head', 'back_traps', 'back_shoulders', 'upper_back_right', 'upper_back_right_side',
    'upper_back_left', 'upper_back_left_side', 'back_triceps', 'back_lats', 'back_elbows',
    'lower_back', 'back_forearm', 'back_hands', 'back_glutes', 'back_quads', 
    'back_hamstrings', 'back_calves', 'back_feet'
  ];

  const muscleStates: Record<string, any> = {};

  allMuscleIds.forEach(muscleId => {
    // Use individual frequency for each muscle instead of max ab frequency
    const frequency = weeklyActivity[muscleId] || 0;
    const intensity = Math.min(frequency / 3, 1);
    
    muscleStates[muscleId] = {
      id: muscleId,
      name: muscleId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: getIntensityColor(frequency),
      intensity: intensity,
      isHighlighted: false,
      isSelected: false,
    };
  });

  return muscleStates;
}; 