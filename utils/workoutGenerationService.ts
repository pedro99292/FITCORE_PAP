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
import { EXERCISE_DB_API_URL, getExerciseDBHeaders } from './apiConfig';

// Utility function to shuffle array
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Main workout generation function
export function generateWorkoutPlan(userProfile: UserProfile, allExercises: Exercise[]): GeneratedWorkoutPlan {
  const { age, gender, goal, experience, daysPerWeek } = userProfile;

  // Define volume, rest and rep ranges based on the strategy
  const goalSettings: Record<string, GoalSettings> = {
    "Lose weight": { sets: 2, reps: 12, rest: 60, focus: ["full body", "core", "legs"], cardio: true },
    "Gain muscle": { sets: 3, reps: 10, rest: 90, focus: ["chest", "back", "legs", "arms", "shoulders"] },
    "Gain strength": { sets: 3, reps: 5, rest: 150, focus: ["compound", "legs", "back", "chest"] },
    "Maintain muscle": { sets: 2, reps: 10, rest: 75, focus: ["full body", "core", "chest", "back"] },
  };

  // Define workout splits based on days per week
  const splitTemplates: Record<number, string[]> = {
    3: ["push", "pull", "legs"],
    4: ["upper", "lower", "upper", "lower"],
    5: ["push", "pull", "legs", "core", "full body"],
    6: ["chest", "back", "legs", "shoulders", "arms", "core"],
  };

  const settings = goalSettings[goal];
  const split = splitTemplates[daysPerWeek] || splitTemplates[3];

  // Gender prioritization
  const genderFocus = gender === "Female"
    ? ["glutes", "hamstrings", "core"]
    : ["chest", "arms", "shoulders"];

  // Age and experience adjustments
  const reduceVolume = age >= 50;
  const maxSetsPerExercise = 3; // As per strategy

  const dailyPlan: WorkoutDay[] = [];

  for (let i = 0; i < daysPerWeek; i++) {
    const dayFocus = split[i % split.length];
    
    // Create focus areas based on day and user preferences
    let focusAreas: string[] = [];
    
    // Map split days to body parts
    switch (dayFocus) {
      case "push":
        focusAreas = ["chest", "shoulders", "triceps"];
        break;
      case "pull":
        focusAreas = ["back", "biceps"];
        break;
      case "legs":
        focusAreas = ["legs", "quads", "hamstrings", "glutes", "calves"];
        break;
      case "upper":
        focusAreas = ["chest", "back", "shoulders", "arms", "biceps", "triceps"];
        break;
      case "lower":
        focusAreas = ["legs", "quads", "hamstrings", "glutes", "calves"];
        break;
      case "core":
        focusAreas = ["abs", "core", "waist"];
        break;
      case "full body":
        focusAreas = ["chest", "back", "legs", "shoulders", "arms"];
        break;
      default:
        focusAreas = [dayFocus];
    }

    // Add gender-specific focus if relevant
    if (gender === "Female" && (dayFocus === "legs" || dayFocus === "lower")) {
      focusAreas.push("glutes", "hamstrings");
    }

    // Filter exercises matching current day's focus
    const dayExercises = allExercises
      .filter(ex => {
        const bodyPartMatch = focusAreas.some(focus => 
          ex.bodyPart.toLowerCase().includes(focus.toLowerCase()) ||
          ex.target.toLowerCase().includes(focus.toLowerCase())
        );
        return bodyPartMatch;
      })
      .filter(ex => {
        // Experience-based filtering
        if (experience === "Novice") {
          // For novices, prefer bodyweight, machine, and cable exercises
          const equipment = ex.equipment.toLowerCase();
          return ["body weight", "machine", "cable", "dumbbell"].includes(equipment) || 
                 equipment.includes("assisted");
        }
        
        // Age-based filtering
        if (age >= 50) {
          const equipment = ex.equipment.toLowerCase();
          // Avoid high-impact or complex equipment for older users
          return !["barbell", "olympic"].includes(equipment);
        }
        
        return true;
      });

    // Shuffle and pick unique exercises (max 5 per day)
    const selected = shuffleArray(dayExercises).slice(0, 5);

    const exercises: GeneratedExercise[] = selected.map(ex => {
      // Adjust sets based on experience and age
      let sets = settings.sets;
      if (reduceVolume) {
        sets = Math.max(1, sets - 1);
      }
      sets = Math.min(sets, maxSetsPerExercise); // Cap at 3 sets as per strategy

      // Adjust reps based on goal and experience
      let reps = settings.reps;
      if (experience === "Novice" && goal === "Gain strength") {
        reps = Math.min(reps + 3, 8); // Novices do slightly higher reps even for strength
      }
      
      return {
        name: ex.name,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        sets,
        reps,
        rest: settings.rest,
        exerciseId: ex.id,
      };
    });

    dailyPlan.push({
      day: `Day ${i + 1}`,
      focus: dayFocus,
      exercises,
    });
  }

  return {
    plan: dailyPlan,
    notes: {
      cardio: settings.cardio || false,
      recommendation: generateRecommendation(goal, experience, age, gender),
    },
  };
}

// Helper function to generate personalized recommendations
function generateRecommendation(goal: string, experience: string, age: number, gender: string): string {
  const baseRecommendations: Record<string, string> = {
    "Lose weight": "Prioritize diet and cardio sessions 3–5x/week. Focus on progressive overload with moderate weights.",
    "Gain muscle": "Progressively increase weights over time. Aim for 8-12 reps with challenging weights.",
    "Gain strength": "Focus on compound movements with heavy weights. Rest 2-3 minutes between sets.",
    "Maintain muscle": "Keep consistent with your routine. Focus on movement quality and mind-muscle connection."
  };

  let recommendation = baseRecommendations[goal] || "Stay consistent with your training.";

  // Add experience-specific advice
  if (experience === "Novice") {
    recommendation += " Focus on learning proper form before increasing weights.";
  } else if (experience === "Advanced") {
    recommendation += " Consider periodization and advanced techniques like supersets.";
  }

  // Add age-specific advice
  if (age >= 50) {
    recommendation += " Prioritize warm-up and mobility work. Listen to your body and allow adequate recovery.";
  }

  // Add gender-specific advice
  if (gender === "Female") {
    recommendation += " Don't neglect upper body training alongside lower body focus.";
  }

  return recommendation;
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
      
      // Create individual workout for this day
      const dayTitle = `${title} - ${day.focus.charAt(0).toUpperCase() + day.focus.slice(1)} (Day ${dayIndex + 1})`;
      
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
            planned_reps: exercise.reps,
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
    console.log('Starting workout generation for user:', userId);
    
    // Get user profile
    const userProfile = await fetchUserProfileData(userId);
    if (!userProfile) {
      console.error('Unable to fetch user profile data for user:', userId);
      throw new Error('Unable to fetch user profile data. Please make sure your profile is complete.');
    }

    console.log('User profile fetched successfully:', userProfile);

    // Fetch exercises from the API using existing configuration
    console.log('Fetching exercises from API...');
    const exerciseResponse = await fetch(`${EXERCISE_DB_API_URL}?limit=1000`, {
      headers: getExerciseDBHeaders()
    });

    if (!exerciseResponse.ok) {
      console.error('Exercise API response not ok:', exerciseResponse.status, exerciseResponse.statusText);
      throw new Error(`Failed to fetch exercises: ${exerciseResponse.status}`);
    }

    const exercisesData = await exerciseResponse.json();
    console.log(`Fetched ${exercisesData.length} exercises from API`);
    
    // Transform to our Exercise type
    const exercises: Exercise[] = exercisesData.map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      bodyPart: ex.bodyPart,
      target: ex.target,
      equipment: ex.equipment,
      gifUrl: ex.gifUrl,
      instructions: ex.instructions || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      source: 'exercisedb' as const
    }));

    console.log(`Transformed ${exercises.length} exercises`);

    // Generate workout plan
    console.log('Generating workout plan...');
    const workoutPlan = generateWorkoutPlan(userProfile, exercises);
    console.log(`Generated workout plan with ${workoutPlan.plan.length} days`);

    // Save to database
    console.log('Saving workout to database...');
    const workoutId = await saveGeneratedWorkout(
      userId, 
      workoutPlan, 
      `AI Generated ${userProfile.goal} Plan`
    );

    if (workoutId) {
      console.log('Workout saved successfully with ID:', workoutId);
    } else {
      console.error('Failed to save workout to database');
    }

    return workoutId;
  } catch (error) {
    console.error('Error in generateAndSaveWorkout:', error);
    throw error; // Re-throw to let the calling function handle the user-facing message
  }
} 