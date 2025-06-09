import { supabase } from './supabase';

// Types for achievement system
export interface UserAchievement {
  id?: number;
  user_id: string;
  achievement_id: number;
  progress: number;
  unlocked_at?: string;
  created_at?: string;
}

export interface AchievementProgress {
  achievement_id: number;
  current_value: number;
  target_value: number;
  progress_percentage: number;
}

// Metrics that we track for achievements
export interface UserMetrics {
  totalWorkouts: number;
  totalVolume: number; // kg lifted
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  uniqueExercises: number;
  personalBests: number;
  workoutTemplates: number;
  earlyWorkouts: number; // before 7 AM
  lateWorkouts: number; // after 9 PM
  weekendWorkouts: number;
  totalSets: number;
  averageWorkoutTime: number;
  consecutiveDays: number;
  socialPosts: number; // number of social posts
  socialComments: number; // comments made by user
  socialStories: number; // stories created by user
  followersCount: number; // number of followers
  followingCount: number; // number of people user follows
  maxLikesOnPost: number; // highest likes on a single post
  totalReactions: number; // total reactions given by user
  emojiComments: number; // comments with emojis made by user
  completedAchievements: number; // number of achievements at 100% progress
  isAdvancedLevel: boolean;
}

// Achievement calculation functions for each achievement
const achievementCalculators: Record<number, (metrics: UserMetrics) => number> = {
  // Workout Mastery
  1: (metrics) => metrics.totalWorkouts >= 1 ? 100 : 0, // First Rep - Complete 1 workout session
  2: (metrics) => Math.min((metrics.currentStreak / 7) * 100, 100), // Consistency Rookie - 7 day streak
  3: (metrics) => Math.min((metrics.totalWorkouts / 50) * 100, 100), // Fitness Enthusiast - 50 completed sessions
  4: (metrics) => Math.min((metrics.totalWorkouts / 100) * 100, 100), // Workout Warrior - 100 completed sessions
  5: (metrics) => Math.min((metrics.workoutTemplates / 10) * 100, 100), // Routine Expert - 10 workout templates
  7: (metrics) => Math.min((metrics.uniqueExercises / 50) * 100, 100), // Exercise Explorer - 50 unique exercises
  10: (metrics) => Math.min((metrics.workoutTemplates / 5) * 100, 100), // Custom Crafter - 5 workout templates

  // Progress
  11: (metrics) => metrics.totalWorkouts >= 1 ? 100 : 0, // Tracker Beginner - Complete 1 workout session
  12: (metrics) => Math.min((metrics.totalVolume / 10000) * 100, 100), // Volume Victor - 10,000 kg total volume
  13: (metrics) => Math.min((metrics.personalBests / 5) * 100, 100), // Strength Seeker - 5 personal bests
  14: (metrics) => Math.min((metrics.totalMinutes / 6000) * 100, 100), // Endurance Ace - 100 hours (6000 minutes)
  16: (metrics) => Math.min((metrics.socialPosts / 10) * 100, 100), // Visual Vanguard - 10 progress photos (using social posts)
  17: (metrics) => Math.min((metrics.personalBests / 20) * 100, 100), // Record Breaker - 20 personal bests
  18: (metrics) => 0, // Workout Historian - placeholder for history views

  // Consistency
  19: (metrics) => Math.min((metrics.currentStreak / 3) * 100, 100), // First Streak - 3 day streak
  20: (metrics) => Math.min((metrics.currentStreak / 7) * 100, 100), // Week Warrior - 7 day streak
  21: (metrics) => Math.min((metrics.currentStreak / 30) * 100, 100), // Month of Motivation - 30 day streak
  22: (metrics) => Math.min((metrics.currentStreak / 60) * 100, 100), // Unstoppable - 60 day streak
  23: (metrics) => Math.min((metrics.currentStreak / 100) * 100, 100), // Habit Hero - 100 day streak
  24: (metrics) => Math.min((metrics.earlyWorkouts / 10) * 100, 100), // Early Bird - 10 workouts before 7 AM
  25: (metrics) => Math.min((metrics.lateWorkouts / 30) * 100, 100), // Night Owl - 30 late workouts
  26: (metrics) => Math.min((metrics.weekendWorkouts / 8) * 100, 100), // Weekend Warrior - 8 weekend workouts (4 weeks * 2 days)
  27: (metrics) => 0, // Routine Ritualist - placeholder for schedule consistency
  28: (metrics) => Math.min((metrics.totalWorkouts / 200) * 100, 100), // Consistency Champion - 200 completed sessions

  // Goals & Milestones
  29: (metrics) => 0, // Goal Setter - placeholder for goals set
  30: (metrics) => 0, // Goal Getter - placeholder for goals achieved
  31: (metrics) => 0, // Lift Legend - placeholder for bodyweight bench
  32: (metrics) => Math.min((metrics.totalMinutes / 6000) * 100, 100), // Endurance Elite - 100 hours
  33: (metrics) => 0, // Weight Wizard - placeholder for weight tracking
  34: (metrics) => metrics.isAdvancedLevel ? 100 : 0, // Fitness Veteran - reach Advanced level
  35: (metrics) => 0, // Elite Athlete - placeholder for muscle area progress

  // Social achievements (36-44) - now implemented with database support
  36: (metrics) => metrics.socialPosts >= 1 ? 100 : 0, // First Post - Share your first Post
  37: (metrics) => Math.min((metrics.socialPosts / 20) * 100, 100), // Community Contributor - Post 20 times
  38: (metrics) => Math.min((metrics.maxLikesOnPost / 100) * 100, 100), // Inspiration Icon - 100 likes on single post
  39: (metrics) => Math.min((metrics.socialComments / 50) * 100, 100), // Engagement Expert - Comment 50 times
  40: (metrics) => Math.min((metrics.socialStories / 10) * 100, 100), // Storyteller - Create 10 stories
  41: (metrics) => Math.min((metrics.followingCount / 50) * 100, 100), // Follower Fanatic - Follow 50 people
  42: (metrics) => Math.min((Math.max(metrics.totalReactions, metrics.emojiComments) / 100) * 100, 100), // Emoji Enthusiast - React/Emoji 100 times
  43: () => 0, // Location Scout - placeholder (would need location data in posts)
  44: (metrics) => Math.min((metrics.followersCount / 500) * 100, 100), // Social Star - Reach 500 followers

  // Special Trophies
  45: (metrics) => Math.min((metrics.totalVolume / 100000) * 100, 100), // Iron Titan - 100,000 kg total volume
  46: (metrics) => Math.min((metrics.totalMinutes / 30000) * 100, 100), // Endurance Emperor - 500 hours
  47: (metrics) => Math.min((metrics.consecutiveDays / 365) * 100, 100), // Consistency Conqueror - 1 year streak
  48: (metrics) => Math.min((metrics.completedAchievements / 50) * 100, 100), // Milestone Marvel - 50 completed achievements
  49: (metrics) => 0, // Ultimate Athlete - placeholder
  50: (metrics) => 0, // Legendary Lifter - placeholder for 2x bodyweight
  51: (metrics) => Math.min((metrics.totalMinutes / 60000) * 100, 100), // Time Keeper - 1000 hours
  52: (metrics) => 0, // Transformation Triumph - placeholder
  53: (metrics) => 0, // Community Leader - placeholder
  54: (metrics) => metrics.completedAchievements >= 53 ? 100 : Math.min((metrics.completedAchievements / 53) * 100, 100), // Fitness Icon - unlock all achievements
};

// Calculate user metrics from database
export const calculateUserMetrics = async (userId: string): Promise<UserMetrics> => {
  try {
    // Get total completed sessions count and duration
    // Note: totalWorkouts = number of completed workout sessions (rows in sessions table with status='completed')
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('duration, start_time')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalWorkouts = sessionData?.length || 0; // This is completed sessions count
    const totalMinutes = sessionData?.reduce((sum, session) => 
      sum + Math.floor((session.duration || 0) / 60), 0) || 0;

    // Get total volume and sets
    const { data: setData } = await supabase
      .from('session_sets')
      .select(`
        actual_reps,
        actual_weight,
        exercise_name,
        session_id,
        sessions!inner(user_id, start_time)
      `)
      .eq('sessions.user_id', userId);

    const totalVolume = setData?.reduce((sum, set) => 
      sum + ((set.actual_reps || 0) * (set.actual_weight || 0)), 0) || 0;
    const totalSets = setData?.length || 0;

    // Get unique exercises
    const uniqueExercises = new Set(setData?.map(set => set.exercise_name) || []).size;

    // Calculate streak
    const currentStreak = await calculateWorkoutStreak(userId);

    // Get workouts by time of day
    const earlyWorkouts = sessionData?.filter(session => {
      const hour = new Date(session.start_time).getHours();
      return hour < 7;
    }).length || 0;

    const lateWorkouts = sessionData?.filter(session => {
      const hour = new Date(session.start_time).getHours();
      return hour >= 21;
    }).length || 0;

    // Get weekend workouts
    const weekendWorkouts = sessionData?.filter(session => {
      const day = new Date(session.start_time).getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }).length || 0;

    // Get unique workout templates created
    const { data: workoutTemplatesData } = await supabase
      .from('workouts')
      .select('workout_id')
      .eq('user_id', userId);

    const workoutTemplates = workoutTemplatesData?.length || 0;

    // Get personal records count
    const { data: personalRecordsData } = await supabase
      .from('personal_records')
      .select('id')
      .eq('user_id', userId);

    const personalBests = personalRecordsData?.length || 0;

    // Get user's experience level
    const { data: userData } = await supabase
      .from('users_data')
      .select('experience_level')
      .eq('user_id', userId)
      .single();

    // Check if user has reached Advanced level
    const isAdvancedLevel = userData?.experience_level === 'Advanced';

    // Get social posts count
    const { data: socialPostsData } = await supabase
      .from('social_posts')
      .select('post_id')
      .eq('user_id', userId);

    const socialPosts = socialPostsData?.length || 0;

    // Get comments made by user
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('id')
      .eq('user_id', userId);

    const socialComments = commentsData?.length || 0;

    // Get stories created by user
    const { data: storiesData } = await supabase
      .from('user_stories')
      .select('id')
      .eq('user_id', userId);

    const socialStories = storiesData?.length || 0;

    // Get followers count
    const { data: followersData } = await supabase
      .from('user_followers')
      .select('id')
      .eq('followed_id', userId);

    const followersCount = followersData?.length || 0;

    // Get following count
    const { data: followingData } = await supabase
      .from('user_followers')
      .select('id')
      .eq('follower_id', userId);

    const followingCount = followingData?.length || 0;

    // Get reactions given by user
    const { data: reactionsData } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('user_id', userId);

    const totalReactions = reactionsData?.length || 0;

    // Get comments with emojis made by user
    const { data: userCommentsData } = await supabase
      .from('post_comments')
      .select('content')
      .eq('user_id', userId);

    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    const emojiComments = userCommentsData?.filter(comment => 
      emojiRegex.test(comment.content || '')
    ).length || 0;

    // Get max likes on a single post
    const { data: userPostsData } = await supabase
      .from('social_posts')
      .select('post_id')
      .eq('user_id', userId);

    let maxLikesOnPost = 0;
    
    if (userPostsData && userPostsData.length > 0) {
      const postIds = userPostsData.map(post => post.post_id);
      
      const { data: postLikesData } = await supabase
        .from('post_reactions')
        .select('post_id')
        .in('post_id', postIds)
        .eq('reaction_type', 'like');

      // Count likes per post
      const likesPerPost: Record<string, number> = {};
      postLikesData?.forEach(reaction => {
        const postId = reaction.post_id.toString();
        likesPerPost[postId] = (likesPerPost[postId] || 0) + 1;
      });

      // Get the maximum likes across all posts
      const likesCounts = Object.values(likesPerPost);
      maxLikesOnPost = likesCounts.length > 0 ? Math.max(...likesCounts) : 0;
    }

    // Get completed achievements count
    const { data: completedAchievementsData } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('progress', 100);

    const completedAchievements = completedAchievementsData?.length || 0;

    return {
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      totalMinutes,
      currentStreak,
      longestStreak: currentStreak, // Simplified for now
      uniqueExercises,
      personalBests,
      workoutTemplates,
      earlyWorkouts,
      lateWorkouts,
      weekendWorkouts,
      totalSets,
      averageWorkoutTime: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0,
      consecutiveDays: currentStreak,
      socialPosts,
      socialComments,
      socialStories,
      followersCount,
      followingCount,
      maxLikesOnPost,
      totalReactions,
      emojiComments,
      completedAchievements,
      isAdvancedLevel,
    };
  } catch (error) {
    console.error('Error calculating user metrics:', error);
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      uniqueExercises: 0,
      personalBests: 0,
      workoutTemplates: 0,
      earlyWorkouts: 0,
      lateWorkouts: 0,
      weekendWorkouts: 0,
      totalSets: 0,
      averageWorkoutTime: 0,
      consecutiveDays: 0,
      socialPosts: 0,
      socialComments: 0,
      socialStories: 0,
      followersCount: 0,
      followingCount: 0,
      maxLikesOnPost: 0,
      totalReactions: 0,
      emojiComments: 0,
      completedAchievements: 0,
      isAdvancedLevel: false,
    };
  }
};

// Calculate workout streak
const calculateWorkoutStreak = async (userId: string): Promise<number> => {
  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    if (!sessions || sessions.length === 0) return 0;

    // Group sessions by day
    const workoutDays = new Set<string>();
    sessions.forEach(session => {
      const dateString = new Date(session.start_time).toISOString().split('T')[0];
      workoutDays.add(dateString);
    });

    const sortedDays = Array.from(workoutDays).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    
    let streak = 0;
    let currentDate = new Date();

    // Check if there's a workout today or yesterday
    for (const day of sortedDays) {
      const dayDate = new Date(day);
      const diffTime = currentDate.getTime() - dayDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak++;
        currentDate = new Date(dayDate.getTime() - 24 * 60 * 60 * 1000); // Move to previous day
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

// Get user's achievement progress
export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
};

// Update achievement progress
export const updateAchievementProgress = async (userId: string, achievementId: number, progress: number) => {
  try {
    // Check if the achievement record exists
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    const isUnlocked = progress >= 100;
    const updateData = {
      user_id: userId,
      achievement_id: achievementId,
      progress: Math.min(progress, 100),
      ...(isUnlocked && !existing?.unlocked_at ? { unlocked_at: new Date().toISOString() } : {})
    };

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('user_achievements')
        .update(updateData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_achievements')
        .insert(updateData);

      if (error) throw error;
    }

    // Return whether this was a new unlock
    return isUnlocked && !existing?.unlocked_at;
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    return false;
  }
};

// Update all achievements for a user
export const updateAllAchievements = async (userId: string) => {
  try {
    const metrics = await calculateUserMetrics(userId);
    const newUnlocks: number[] = [];

    // Update each achievement
    for (const [achievementIdStr, calculator] of Object.entries(achievementCalculators)) {
      const achievementId = parseInt(achievementIdStr);
      const progress = calculator(metrics);
      
      const wasNewUnlock = await updateAchievementProgress(userId, achievementId, progress);
      if (wasNewUnlock) {
        newUnlocks.push(achievementId);
      }
    }

    return newUnlocks;
  } catch (error) {
    console.error('Error updating all achievements:', error);
    return [];
  }
};

// Initialize user achievements (call when user first registers)
export const initializeUserAchievements = async (userId: string) => {
  try {
    // Create initial records for all achievements with 0 progress
    const achievementIds = Object.keys(achievementCalculators).map(id => parseInt(id));
    
    const initialAchievements = achievementIds.map(id => ({
      user_id: userId,
      achievement_id: id,
      progress: 0
    }));

    const { error } = await supabase
      .from('user_achievements')
      .insert(initialAchievements);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing user achievements:', error);
    return false;
  }
};

// Get achievement statistics
export const getAchievementStats = async (userId: string) => {
  try {
    const userAchievements = await getUserAchievements(userId);
    
    const total = userAchievements.length;
    const completed = userAchievements.filter(a => a.progress >= 100).length;
    const inProgress = userAchievements.filter(a => a.progress > 0 && a.progress < 100).length;

    return {
      total,
      completed,
      inProgress,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    return { total: 0, completed: 0, inProgress: 0, completionPercentage: 0 };
  }
}; 