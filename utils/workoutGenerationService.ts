import { Exercise } from '@/types/exercise';
import { 
  UserProfile, 
  GoalSettings, 
  GeneratedWorkoutPlan, 
  WorkoutDay, 
  GeneratedExercise,
  SplitTemplate 
} from '@/types/workoutGeneration';
import { supabase } from './supabase';
import { fetchExercisesFromAPI } from './apiConfig';
import { getExercisesWithFallback, preloadExercises } from './exerciseCaching';
import { 
  splitTemplates,
  recommendedSplitsByGoal,
  templateMap
} from '@/constants/workoutSplits';
import {
  workoutRules,
  repRanges,
  setsPerExercise,
  restTimeByGoal,
  cardioRecommendations,
  ageAdaptations,
  genderAdaptations,
  experienceAdaptations
} from '@/constants/workoutRules';
import { findBestExerciseMatch } from './exerciseMatching';

// Utility function to shuffle array
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Helper function to find matching exercises
function findMatchingExercises(allExercises: Exercise[], targetNames: string[]): Exercise[] {
  const normalizedTargetNames = targetNames.map(name => name.toLowerCase());
  
  return allExercises.filter(exercise => {
    const exerciseName = exercise.name.toLowerCase();
    return normalizedTargetNames.some(targetName => 
      exerciseName.includes(targetName) || 
      exerciseName === targetName ||
      // Handle variations like "barbell bench press" matching "bench press"
      targetName.split(' ').length > 1 && 
      targetName.split(' ').slice(1).join(' ') === exerciseName
    );
  });
}

// Helper function to adjust template sets based on goal requirements
function adjustTemplateSets(template: any, goal: string, isFullBodyOrUpperLower: boolean): any {
  const targetSets = setsPerExercise[goal as keyof typeof setsPerExercise] || 2;
  
  // For Upper/Lower/Full Body workouts, we cap at 2 sets regardless of goal
  const effectiveSets = isFullBodyOrUpperLower ? 
    Math.min(targetSets, workoutRules.maxSetsForFullBodyUpperLower) : 
    Math.min(targetSets, workoutRules.maxSetsPerExercise);
  
  // If template already has the right number of sets, return as is
  if (template.exercises.male[0].sets === effectiveSets) {
    return template;
  }
  
  // Create a copy of the template with adjusted sets
  const adjustedTemplate = JSON.parse(JSON.stringify(template));
  
  // Adjust sets for each gender
  ['male', 'female', 'senior'].forEach(gender => {
    if (adjustedTemplate.exercises[gender]) {
      adjustedTemplate.exercises[gender].forEach((exercise: any) => {
        exercise.sets = effectiveSets;
      });
    }
  });
  
  return adjustedTemplate;
}

// Main workout generation function
export function generateWorkoutPlan(userProfile: UserProfile, allExercises: Exercise[]): GeneratedWorkoutPlan {
  const { age, gender, goal, experience, daysPerWeek } = userProfile;

  // Determine if user is senior (50+)
  const isSenior = age >= 50;
  
  // Determine which gender-specific workouts to use
  const genderKey = isSenior ? 'senior' : gender === 'Female' ? 'female' : 'male';
  
  // Get recommended split for this goal and days per week
  const splitIndex = recommendedSplitsByGoal[goal as keyof typeof recommendedSplitsByGoal]?.[daysPerWeek] || 0;
  const recommendedSplit = splitTemplates[daysPerWeek]?.[splitIndex] || splitTemplates[3][0];
  
  // Get rest time based on goal
  const restTime = restTimeByGoal[goal as keyof typeof restTimeByGoal] || 120;
  
  // Get rep range based on goal and experience
  const repRange = repRanges[goal as keyof typeof repRanges]?.[experience as keyof typeof experienceAdaptations] || { min: 8, max: 12 };
  
  // Determine if cardio is recommended
  const cardioRecommended = cardioRecommendations[goal as keyof typeof cardioRecommendations]?.recommended || false;
  
  // Generate workout plan
  const dailyPlan: WorkoutDay[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    // Get template name for this day
    const templateName = recommendedSplit[i % recommendedSplit.length];
    let template = templateMap[templateName];
    
    if (!template) {
      console.error(`Template not found for ${templateName}`);
      continue;
    }
    
    // Adjust template sets based on goal and type of workout
    const isFullBodyOrUpperLower = templateName.includes('Upper') || 
                                templateName.includes('Lower') || 
                                templateName.includes('Full Body');
    template = adjustTemplateSets(template, goal, isFullBodyOrUpperLower);
    
    // Get exercises for this template based on gender
    const templateExercises = template.exercises[genderKey];
    
    // Create exercises array
    const exercises: GeneratedExercise[] = [];
    
    // Process each exercise in the template
    for (const templateExercise of templateExercises) {
      // Find matching exercise using our specialized matching utility
      const matchingExercise = findBestExerciseMatch(templateExercise.name, allExercises);
      
      if (!matchingExercise) {
        console.warn(`No matching exercise found for ${templateExercise.name}`);
        // Create placeholder with template data
        exercises.push({
          name: templateExercise.name,
          bodyPart: 'unknown',
          target: 'unknown',
          equipment: 'unknown',
          sets: templateExercise.sets,
          reps: templateExercise.reps,
          rest: templateExercise.rest || restTime,
          exerciseId: `placeholder-${templateExercise.name.toLowerCase().replace(/\s+/g, '-')}`
        });
        continue;
      }
      
      // Set number of sets based on template (already adjusted earlier)
      let sets = templateExercise.sets;
      
      // Adjust sets for seniors if they're still greater than 2
      if (isSenior && sets > 2) {
        sets -= 1;
      }
      
      // Add the exercise to our plan
      exercises.push({
        name: matchingExercise.name,
        bodyPart: matchingExercise.bodyPart,
        target: matchingExercise.target,
        equipment: matchingExercise.equipment,
        sets: sets,
        reps: templateExercise.reps,
        rest: templateExercise.rest || restTime,
        exerciseId: matchingExercise.id
      });
    }
    
    // Add the day to our plan
    dailyPlan.push({
      day: `Day ${i + 1}: ${templateName}`,
      focus: template.focus.join(', '),
      exercises: exercises
    });
  }

  return {
    plan: dailyPlan,
    notes: {
      cardio: cardioRecommended,
      recommendation: generateRecommendation(goal, experience, age, gender)
    }
  };
}

// Helper function to generate personalized recommendations
function generateRecommendation(goal: string, experience: string, age: number, gender: string): string {
  // Get base recommendation from goal
  const cardioInfo = cardioRecommendations[goal as keyof typeof cardioRecommendations] || cardioRecommendations['Maintain muscle'];
  const baseRecommendation = cardioInfo.note;
  
  // Get age adaptation note
  let ageNote = '';
  if (age < 30) {
    ageNote = ageAdaptations.under30.note;
  } else if (age < 50) {
    ageNote = ageAdaptations.age30to49.note;
  } else {
    ageNote = ageAdaptations.age50Plus.note;
  }
  
  // Get gender adaptation note
  const genderKey = gender as keyof typeof genderAdaptations;
  const genderInfo = genderAdaptations[genderKey] || genderAdaptations['Prefer not to say'];
  const genderNote = genderInfo.note;
  
  // Get experience adaptation note
  const experienceKey = experience as keyof typeof experienceAdaptations;
  const experienceInfo = experienceAdaptations[experienceKey] || experienceAdaptations['Novice'];
  const experienceNote = experienceInfo.note;
  
  // Combine recommendations
  return `${baseRecommendation} ${experienceNote}. ${ageNote}. ${genderNote}.`;
}

// Function to fetch user profile data
export async function fetchUserProfileData(userId: string): Promise<UserProfile | null> {
  try {
    // Query users_data table directly instead of using relationship
    const { data, error } = await supabase
      .from('users_data')
      .select('age, gender, goals, experience_level, workouts_per_week')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data) {
      console.error('No user data found');
      return null;
    }

    // Parse goals array (it's stored as an array in the database)
    let goal: UserProfile['goal'] = 'Maintain muscle';
    if (data.goals && Array.isArray(data.goals) && data.goals.length > 0) {
      goal = data.goals[0] as UserProfile['goal'];
    }

    return {
      age: data.age || 25,
      gender: data.gender || 'Prefer not to say',
      goal,
      experience: data.experience_level || 'Novice',
      daysPerWeek: data.workouts_per_week || 3,
    };
  } catch (error) {
    console.error('Error in fetchUserProfileData:', error);
    return null;
  }
}

// Function to save generated workout to database
export async function saveGeneratedWorkout(
  userId: string, 
  workoutPlan: GeneratedWorkoutPlan,
  title: string = 'Generated Workout Plan'
): Promise<string | null> {
  try {
    const createdWorkoutIds: string[] = [];

    // Create a separate workout for each day
    for (let dayIndex = 0; dayIndex < workoutPlan.plan.length; dayIndex++) {
      const day = workoutPlan.plan[dayIndex];
      
      // Extract the template name from the day information
      let templateName = day.day.split(': ')[1];
      
      // Remove A/B suffix if there's only one workout of this type in the plan
      const baseType = templateName.replace(/\s[AB]$/, ''); // Remove A or B suffix
      const hasDuplicateTypes = workoutPlan.plan
        .map(d => d.day.split(': ')[1].replace(/\s[AB]$/, ''))
        .filter(name => name === baseType)
        .length > 1;
        
      // If there's only one workout of this type, use the base name without A/B
      if (!hasDuplicateTypes) {
        templateName = baseType;
      }
      
      // Use simple workout name (e.g., "Pull", "Push", "Lower", "Full Body")
      const dayTitle = templateName;
      
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          title: dayTitle,
          description: `Auto-generated ${day.focus} workout. ${workoutPlan.notes.recommendation}`,
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating workout for day', dayIndex + 1, ':', workoutError);
        // Clean up any previously created workouts if one fails
        if (createdWorkoutIds.length > 0) {
          await supabase
            .from('workouts')
            .delete()
            .in('workout_id', createdWorkoutIds);
        }
        return null;
      }

      const workoutId = workout.workout_id;
      createdWorkoutIds.push(workoutId);

      // Create workout sets for this day's exercises
      const daySets = [];
      let setOrder = 0;

      for (const exercise of day.exercises) {
        for (let setNum = 0; setNum < exercise.sets; setNum++) {
          daySets.push({
            workout_id: workoutId,
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.name,
            exercise_bodypart: exercise.bodyPart,
            exercise_target: exercise.target,
            exercise_equipment: exercise.equipment,
            planned_reps: exercise.reps.max,
            rest_time: exercise.rest,
            set_order: setOrder++,
          });
        }
      }

      // Insert sets for this day
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(daySets);

      if (setsError) {
        console.error('Error creating workout sets for day', dayIndex + 1, ':', setsError);
        // Clean up all created workouts if sets fail
        await supabase
          .from('workouts')
          .delete()
          .in('workout_id', createdWorkoutIds);
        return null;
      }

      console.log(`Successfully created workout for ${day.focus} (Day ${dayIndex + 1}) with ID: ${workoutId}`);
    }

    console.log(`Successfully created ${createdWorkoutIds.length} workouts:`, createdWorkoutIds);
    return createdWorkoutIds[0]; // Return the first workout ID for success indication
  } catch (error) {
    console.error('Error in saveGeneratedWorkout:', error);
    return null;
  }
}

// Main function to generate and save workout for a user
export async function generateAndSaveWorkout(userId: string): Promise<string | null> {
  try {
    // Fetch user profile data
    const userProfile = await fetchUserProfileData(userId);
    if (!userProfile) {
      console.error('Failed to fetch user profile data');
      return null;
    }
    
    // Get exercises from cache or API with our improved utility
    let exercises: Exercise[] = [];
    
    try {
      // Try to preload exercises first (this is a no-op if already loaded)
      await preloadExercises();
      
      // Get exercises with fallback mechanism
      exercises = await getExercisesWithFallback();
      console.log(`Using ${exercises.length} exercises for workout generation`);
      
      // If no exercises available, something is wrong
      if (exercises.length === 0) {
        throw new Error('No exercises available');
      }
    } catch (error) {
      console.error('Error getting exercises:', error);
      throw new Error('Failed to get exercises. Please try again later.');
    }
    
    // Generate workout plan
    const workoutPlan = generateWorkoutPlan(userProfile, exercises);
    
    // Save workout plan to database
    const workoutId = await saveGeneratedWorkout(userId, workoutPlan);
    return workoutId;
  } catch (error) {
    console.error('Error generating and saving workout:', error);
    return null;
  }
} 