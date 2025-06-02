import { supabase } from './supabase';
import { updateAllAchievements } from './achievementService';
import { debugEarlyBirdAchievement } from './debugEarlyBird';

// Export the debug function for easy access
export { debugEarlyBirdAchievement };

// Manual function to update achievements for current user
export const manuallyUpdateMyAchievements = async () => {
  try {
    console.log('🏆 Manually updating achievements...');
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      console.error('No user logged in');
      return;
    }

    const userId = userData.user.id;
    console.log('User ID:', userId);

    // Update all achievements
    const newUnlocks = await updateAllAchievements(userId);
    
    if (newUnlocks.length > 0) {
      console.log('🎉 New achievements unlocked:', newUnlocks);
    } else {
      console.log('✅ No new achievements unlocked, but progress updated');
    }

    // Fetch and display current achievement status
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achievement_id');

    console.log('📊 Current achievement status:');
    achievements?.forEach(achievement => {
      const status = achievement.progress >= 100 ? '✅ UNLOCKED' : `📈 ${achievement.progress}%`;
      console.log(`Achievement ${achievement.achievement_id}: ${status}`);
    });

    return { success: true, newUnlocks, totalAchievements: achievements?.length || 0 };
  } catch (error) {
    console.error('Error updating achievements:', error);
    return { success: false, error };
  }
};

// Debug function to check user metrics
export const debugUserMetrics = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      console.error('No user logged in');
      return;
    }

    const userId = userData.user.id;

    // Get workout templates count (workouts table)
    const { data: workouts } = await supabase
      .from('workouts')
      .select('workout_id')
      .eq('user_id', userId);

    // Get completed sessions count (sessions table with status='completed')
    const { data: sessions } = await supabase
      .from('sessions')
      .select('session_id, start_time')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Count early workouts (before 7 AM)
    const earlyWorkouts = sessions?.filter(session => {
      const hour = new Date(session.start_time).getHours();
      return hour < 7;
    }).length || 0;

    console.log('📊 User Metrics Debug:');
    console.log('- Workout templates created (workouts table):', workouts?.length || 0);
    console.log('- Completed workout sessions (sessions table):', sessions?.length || 0);
    console.log('- Early workouts (before 7 AM):', earlyWorkouts);

    // Expected achievement progress
    const workoutTemplates = workouts?.length || 0;
    const completedSessions = sessions?.length || 0;
    
    const routineExpertProgress = Math.min((workoutTemplates / 10) * 100, 100);
    const fitnessEnthusiastProgress = Math.min((completedSessions / 50) * 100, 100);
    const workoutWarriorProgress = Math.min((completedSessions / 100) * 100, 100);
    const earlyBirdProgress = Math.min((earlyWorkouts / 10) * 100, 100);
    
    console.log('- Routine Expert progress (10 templates needed):', routineExpertProgress + '%');
    console.log('- Fitness Enthusiast progress (50 sessions needed):', fitnessEnthusiastProgress + '%');
    console.log('- Workout Warrior progress (100 sessions needed):', workoutWarriorProgress + '%');
    console.log('- Early Bird progress (10 early workouts needed):', earlyBirdProgress + '%');

    return {
      workoutTemplates,
      completedSessions,
      earlyWorkouts,
      routineExpertProgress,
      fitnessEnthusiastProgress,
      workoutWarriorProgress,
      earlyBirdProgress
    };
  } catch (error) {
    console.error('Error debugging metrics:', error);
    return null;
  }
};

// Function to reset all achievements (for testing)
export const resetAllAchievements = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      console.error('No user logged in');
      return;
    }

    const userId = userData.user.id;
    
    // Delete all user achievements
    const { error } = await supabase
      .from('user_achievements')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    console.log('🗑️ All achievements reset for user');
    return { success: true };
  } catch (error) {
    console.error('Error resetting achievements:', error);
    return { success: false, error };
  }
}; 