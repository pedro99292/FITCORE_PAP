import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getGoalStats } from './personalRecordsService';
import { CoinService } from './coinService';

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
  achievedGoals: number;
  goalsSet: number; // total number of goals set (including active and achieved)
  uniqueExercisesWithPRs: number;
  maxPRIncrease: number; // maximum percentage increase achieved on any personal record
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
  socialMessages: number; // number of messages sent in chat
  followersCount: number; // number of followers
  followingCount: number; // number of people user follows
  maxLikesOnPost: number; // highest likes on a single post
  totalReactions: number; // total reactions given by user
  emojiComments: number; // comments with emojis made by user
  completedAchievements: number; // number of achievements at 100% progress
  isAdvancedLevel: boolean;
  muscleGroupsThisWeek: number; // unique muscle groups trained in last 7 days
  currentMonthWeekendCompletion: number; // percentage of weekends completed in current month
  consecutiveWeeksWithWorkout: number; // consecutive weeks with at least one workout
}

// Achievement calculation functions for each achievement
const achievementCalculators: Record<number, (metrics: UserMetrics) => number> = {
  // Workout Mastery
  1: (metrics) => metrics.totalWorkouts >= 1 ? 100 : 0, // First Rep - Complete 1 workout session
  2: (metrics) => Math.round(Math.min((metrics.currentStreak / 7) * 100, 100)), // Consistency Rookie - 7 day streak
  3: (metrics) => Math.round(Math.min((metrics.totalWorkouts / 50) * 100, 100)), // Fitness Enthusiast - 50 completed sessions
  4: (metrics) => Math.round(Math.min((metrics.totalWorkouts / 100) * 100, 100)), // Workout Warrior - 100 completed sessions
  5: (metrics) => Math.round(Math.min((metrics.workoutTemplates / 10) * 100, 100)), // Routine Expert - 10 workout templates
  7: (metrics) => Math.round(Math.min((metrics.uniqueExercises / 50) * 100, 100)), // Exercise Explorer - 50 unique exercises
  10: (metrics) => Math.round(Math.min((metrics.workoutTemplates / 5) * 100, 100)), // Custom Crafter - 5 workout templates

  // Progress
  11: (metrics) => metrics.totalWorkouts >= 1 ? 100 : 0, // Tracker Beginner - Complete 1 workout session
  12: (metrics) => Math.round(Math.min((metrics.totalVolume / 10000) * 100, 100)), // Volume Victor - 10,000 kg total volume
  13: (metrics) => Math.round(Math.min((metrics.personalBests / 5) * 100, 100)), // Strength Seeker - 5 personal bests
  14: (metrics) => Math.round(Math.min((metrics.totalMinutes / 6000) * 100, 100)), // Endurance Ace - 100 hours (6000 minutes)
  16: (metrics) => Math.round(Math.min((metrics.socialPosts / 10) * 100, 100)), // Visual Vanguard - 10 progress photos (using social posts)
  17: (metrics) => Math.round(Math.min((metrics.achievedGoals / 20) * 100, 100)), // Record Breaker - 20 personal goals achieved
  18: (metrics) => 0, // Workout Historian - placeholder for history views

  // Consistency
  19: (metrics) => Math.round(Math.min((metrics.longestStreak / 3) * 100, 100)), // Streak Starter - Progress towards first 3 consecutive workout days
  20: (metrics) => Math.round(Math.min((metrics.currentStreak / 7) * 100, 100)), // Week Warrior - 7 day streak
  21: (metrics) => Math.round(Math.min((metrics.currentStreak / 30) * 100, 100)), // Month of Motivation - 30 day streak
  22: (metrics) => Math.round(Math.min((metrics.currentStreak / 60) * 100, 100)), // Unstoppable - 60 day streak
  23: (metrics) => Math.round(Math.min((metrics.currentStreak / 100) * 100, 100)), // Habit Hero - 100 day streak
  24: (metrics) => Math.round(Math.min((metrics.earlyWorkouts / 10) * 100, 100)), // Early Bird - 10 workouts before 7 AM
  25: (metrics) => Math.round(Math.min((metrics.lateWorkouts / 30) * 100, 100)), // Night Owl - 30 late workouts
  26: (metrics) => metrics.currentMonthWeekendCompletion, // Weekend Warrior - workout every weekend in current month
  27: (metrics) => 0, // Routine Ritualist - placeholder for schedule consistency
  28: (metrics) => Math.round(Math.min((metrics.totalWorkouts / 200) * 100, 100)), // Consistency Champion - 200 completed sessions

  // Goals & Milestones
  29: (metrics) => metrics.goalsSet >= 1 ? 100 : 0, // Goal Setter - Set your first fitness goal
  30: (metrics) => metrics.achievedGoals >= 1 ? 100 : 0, // Goal Getter - Achieve your first set fitness goal
  31: (metrics) => metrics.maxPRIncrease >= 50 ? 100 : 0, // Lift Legend - Achieve 50% increase on any personal record
  32: (metrics) => Math.round(Math.min((metrics.totalMinutes / 6000) * 100, 100)), // Endurance Elite - 100 hours
  33: (metrics) => 0, // Weight Wizard - placeholder for weight tracking
  34: (metrics) => metrics.isAdvancedLevel ? 100 : 0, // Fitness Veteran - reach Advanced level
  35: (metrics) => 0, // Elite Athlete - placeholder for muscle area progress

  // Social achievements (36-44) - now implemented with database support
  36: (metrics) => metrics.socialPosts >= 1 ? 100 : 0, // First Post - Share your first Post
  37: (metrics) => Math.round(Math.min((metrics.socialPosts / 20) * 100, 100)), // Community Contributor - Post 20 times
  38: (metrics) => Math.round(Math.min((metrics.maxLikesOnPost / 100) * 100, 100)), // Inspiration Icon - 100 likes on single post
  39: (metrics) => Math.round(Math.min((metrics.socialComments / 50) * 100, 100)), // Engagement Expert - Comment 50 times
  40: (metrics) => Math.round(Math.min((metrics.socialStories / 10) * 100, 100)), // Storyteller - Create 10 stories
  41: (metrics) => Math.round(Math.min((metrics.followingCount / 50) * 100, 100)), // Follower Fanatic - Follow 50 people

  43: () => 0, // Location Scout - placeholder (would need location data in posts)
  44: (metrics) => Math.round(Math.min((metrics.followersCount / 500) * 100, 100)), // Social Star - Reach 500 followers

  // Special Trophies
  45: (metrics) => Math.round(Math.min((metrics.totalVolume / 100000) * 100, 100)), // Iron Titan - 100,000 kg total volume
  46: (metrics) => Math.round(Math.min((metrics.totalMinutes / 30000) * 100, 100)), // Endurance Emperor - 500 hours
  47: (metrics) => Math.round(Math.min((metrics.consecutiveWeeksWithWorkout / 52) * 100, 100)), // Consistency Conqueror - workout every week for one full year
  49: (metrics) => Math.round(Math.min((metrics.uniqueExercisesWithPRs / 5) * 100, 100)), // PR Machine - Set personal records in 5 different exercises
  51: (metrics) => Math.round(Math.min((metrics.totalMinutes / 60000) * 100, 100)), // Time Keeper - 1000 hours
  42: (metrics) => Math.round(Math.min((metrics.socialMessages / 100) * 100, 100)), // Chat Champion - Send 100 messages
  54: (metrics) => metrics.completedAchievements >= 40 ? 100 : Math.round(Math.min((metrics.completedAchievements / 40) * 100, 100)), // Fitness Icon - unlock all achievements
  55: (metrics) => metrics.muscleGroupsThisWeek >= 13 ? 100 : Math.round(Math.min((metrics.muscleGroupsThisWeek / 13) * 100, 100)), // Muscle Master - Target all major muscle groups in a single week
  56: (metrics) => Math.round(Math.min((metrics.totalVolume / 1000000) * 100, 100)), // Weight Lifting Legend - 1,000,000 kg total volume
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
    const longestStreak = await calculateLongestStreak(userId);

    // Get workouts by time of day
    const earlyWorkouts = sessionData?.filter(session => {
      const hour = new Date(session.start_time).getHours();
      return hour < 7;
    }).length || 0;

    const lateWorkouts = sessionData?.filter(session => {
      const hour = new Date(session.start_time).getHours();
      return hour >= 21;
    }).length || 0;

    // Get weekend workouts (total count for other achievements)
    const weekendWorkouts = sessionData?.filter(session => {
      const day = new Date(session.start_time).getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }).length || 0;

    // Calculate current month weekend completion for Weekend Warrior achievement
    const currentMonthWeekendCompletion = await calculateCurrentMonthWeekendCompletion(userId);
    
    // Calculate consecutive weeks with at least one workout for Consistency Conqueror
    const consecutiveWeeksWithWorkout = await calculateConsecutiveWeeksWithWorkout(userId);

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

    // Get achieved goals count and total goals set
    let achievedGoals = 0;
    let goalsSet = 0;
    try {
      const goalStats = await getGoalStats();
      achievedGoals = goalStats.achieved_goals;
      
      // Get total goals set (both active and achieved)
      const { data: allGoalsData } = await supabase
        .from('personal_records')
        .select('id')
        .eq('user_id', userId)
        .eq('record_category', 'goal');
      
      goalsSet = allGoalsData?.length || 0;
    } catch (error) {
      console.error('Error fetching goal stats:', error);
      achievedGoals = 0;
      goalsSet = 0;
    }

    // Get unique exercises with personal records
    const { data: prExercisesData } = await supabase
      .from('personal_records')
      .select('exercise_name')
      .eq('user_id', userId)
      .neq('record_category', 'goal'); // Exclude goals, only actual records

    const uniqueExercisesWithPRs = new Set(prExercisesData?.map(pr => pr.exercise_name) || []).size;

    // Calculate maximum PR increase percentage
    let maxPRIncrease = 0;
    try {
      // Get all personal records for this user, ordered by date
      const { data: allPRData } = await supabase
        .from('personal_records')
        .select('exercise_name, value, achieved_at')
        .eq('user_id', userId)
        .neq('record_category', 'goal') // Exclude goals, only actual records
        .not('value', 'is', null)
        .order('achieved_at', { ascending: true });

      if (allPRData && allPRData.length > 1) {
        // Group records by exercise
        const exerciseRecords: { [key: string]: Array<{ value: number, date: string }> } = {};
        
        allPRData.forEach(record => {
          if (!exerciseRecords[record.exercise_name]) {
            exerciseRecords[record.exercise_name] = [];
          }
          exerciseRecords[record.exercise_name].push({
            value: record.value,
            date: record.achieved_at
          });
        });

        // Calculate max increase for each exercise
        Object.values(exerciseRecords).forEach(records => {
          if (records.length >= 2) {
            // Sort by date to get chronological order
            records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const firstRecord = records[0].value;
            const maxRecord = Math.max(...records.map(r => r.value));
            
            if (firstRecord > 0) {
              const increase = ((maxRecord - firstRecord) / firstRecord) * 100;
              maxPRIncrease = Math.max(maxPRIncrease, increase);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error calculating max PR increase:', error);
      maxPRIncrease = 0;
    }

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

    // Get messages sent by user
    const { data: messagesData } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', userId);

    const socialMessages = messagesData?.length || 0;

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

    // Get muscle groups trained in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSetsData } = await supabase
      .from('session_sets')
      .select(`
        exercise_target,
        sessions!inner(user_id, start_time)
      `)
      .eq('sessions.user_id', userId)
      .gte('sessions.start_time', sevenDaysAgo.toISOString());

         // Map exercise targets to standardized muscle groups
     const muscleGroupMapping: Record<string, string> = {
       // Core groups
       'abs': 'Abs',
       'abdominals': 'Abs',
       'core': 'Abs',
       'abdominis': 'Abs',
       
       // Legs
       'quads': 'Quads',
       'quadriceps': 'Quads',
       'glutes': 'Glutes',
       'gluteus': 'Glutes',
       'hamstrings': 'Hamstrings',
       'calves': 'Calves',
       'adductors': 'Adductors',
       'hip adductors': 'Adductors',
       
       // Upper body
       'pectorals': 'Pectorals',
       'pecs': 'Pectorals',
       'chest': 'Pectorals',
       'lats': 'Lats',
       'latissimus dorsi': 'Lats',
       'upper back': 'Upper Back',
       'traps': 'Traps',
       'trapezius': 'Traps',
       'delts': 'Upper Back', // Shoulders/delts map to upper back since not separate category
       'deltoids': 'Upper Back',
       'shoulders': 'Upper Back',
       'anterior deltoid': 'Upper Back',
       'posterior deltoid': 'Upper Back',
       'middle deltoid': 'Upper Back',
       
       // Arms
       'biceps': 'Biceps',
       'biceps brachii': 'Biceps',
       'triceps': 'Triceps',
       'triceps brachii': 'Triceps',
       'forearms': 'Forearms',
       'brachialis': 'Biceps', // Map to biceps as it's an arm flexor
       'brachioradialis': 'Forearms',
     };

    // Track unique muscle groups (case-insensitive)
    const trainedMuscles = new Set<string>();
    
    // Debug: Log all exercise targets found
    console.log('Recent sets data found:', recentSetsData?.length || 0);
    const allTargets = new Set<string>();
    recentSetsData?.forEach(set => {
      if (set.exercise_target) {
        allTargets.add(set.exercise_target);
      }
    });
    console.log('All exercise targets found in recent sets:', Array.from(allTargets));
    
    recentSetsData?.forEach(set => {
      if (set.exercise_target) {
        const targetLower = set.exercise_target.toLowerCase();
        // Check direct mapping first
        if (muscleGroupMapping[targetLower]) {
          trainedMuscles.add(muscleGroupMapping[targetLower]);
        }
        // Check if the target contains any of our muscle group keywords
        else {
          Object.entries(muscleGroupMapping).forEach(([key, value]) => {
            if (targetLower.includes(key) || key.includes(targetLower)) {
              trainedMuscles.add(value);
            }
          });
        }
      }
    });

    // The target is to train all 13 major muscle groups
    const targetMuscleGroups = [
      'Abs', 'Adductors', 'Biceps', 'Calves', 'Forearms', 
      'Glutes', 'Hamstrings', 'Lats', 'Pectorals', 'Quads', 
      'Traps', 'Triceps', 'Upper Back'
    ];

    const muscleGroupsThisWeek = trainedMuscles.size;
    console.log('Muscle groups trained this week:', Array.from(trainedMuscles));
    console.log('Target muscle groups needed:', targetMuscleGroups);

    return {
      totalWorkouts,
      totalVolume: Math.round(totalVolume),
      totalMinutes,
      currentStreak,
      longestStreak,
      uniqueExercises,
      personalBests,
      achievedGoals,
      goalsSet,
      uniqueExercisesWithPRs,
      maxPRIncrease,
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
      socialMessages,
      followersCount,
      followingCount,
      maxLikesOnPost,
      totalReactions,
      emojiComments,
      completedAchievements,
      isAdvancedLevel,
      muscleGroupsThisWeek,
      currentMonthWeekendCompletion,
      consecutiveWeeksWithWorkout,
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
      achievedGoals: 0,
      goalsSet: 0,
      uniqueExercisesWithPRs: 0,
      maxPRIncrease: 0,
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
      socialMessages: 0,
      followersCount: 0,
      followingCount: 0,
      maxLikesOnPost: 0,
      totalReactions: 0,
      emojiComments: 0,
      completedAchievements: 0,
      isAdvancedLevel: false,
      muscleGroupsThisWeek: 0,
      currentMonthWeekendCompletion: 0,
      consecutiveWeeksWithWorkout: 0,
    };
  }
};

// Calculate consecutive weeks with at least one workout
const calculateConsecutiveWeeksWithWorkout = async (userId: string): Promise<number> => {
  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    if (!sessions || sessions.length === 0) return 0;

    // Get unique workout days
    const workoutDays = new Set<string>();
    sessions.forEach(session => {
      const dateString = new Date(session.start_time).toISOString().split('T')[0];
      workoutDays.add(dateString);
    });

    const sortedDays = Array.from(workoutDays).sort().reverse(); // Most recent first
    
    // Helper function to get week start (Monday) for a given date
    const getWeekStart = (dateStr: string): string => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      const monday = new Date(date.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    // Group workout days by week
    const weeksWithWorkouts = new Set<string>();
    sortedDays.forEach(day => {
      const weekStart = getWeekStart(day);
      weeksWithWorkouts.add(weekStart);
    });

    const sortedWeeks = Array.from(weeksWithWorkouts).sort().reverse(); // Most recent first
    
    if (sortedWeeks.length === 0) return 0;

    // Count consecutive weeks from most recent
    let consecutiveWeeks = 1; // Count the most recent week
    const currentWeekStart = getWeekStart(new Date().toISOString().split('T')[0]);
    
    // Check if current week has a workout, if not, check last week
    let startWeek = sortedWeeks[0];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekStart = getWeekStart(oneWeekAgo.toISOString().split('T')[0]);
    
    // If the most recent workout week is not current week or last week, streak is broken
    if (startWeek !== currentWeekStart && startWeek !== lastWeekStart) {
      return 0;
    }

    // Count consecutive weeks backwards
    for (let i = 1; i < sortedWeeks.length; i++) {
      const currentWeekDate = new Date(sortedWeeks[i - 1]);
      const previousWeekDate = new Date(sortedWeeks[i]);
      
      // Calculate the difference in weeks
      const diffTime = currentWeekDate.getTime() - previousWeekDate.getTime();
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      if (diffWeeks === 1) {
        // Consecutive week
        consecutiveWeeks++;
      } else {
        // Break in weekly streak
        break;
      }
    }

    return consecutiveWeeks;
  } catch (error) {
    console.error('Error calculating consecutive weeks with workout:', error);
    return 0;
  }
};

// Calculate current month weekend completion percentage
const calculateCurrentMonthWeekendCompletion = async (userId: string): Promise<number> => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get first and last day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Find all weekends in current month
    const weekendsInMonth: string[] = [];
    for (let date = new Date(firstDayOfMonth); date <= lastDayOfMonth; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
        weekendsInMonth.push(date.toISOString().split('T')[0]);
      }
    }
    
    // Group weekends by weekend period (Sat-Sun pairs)
    const weekendPeriods: string[][] = [];
    let currentWeekend: string[] = [];
    
    for (const day of weekendsInMonth) {
      const dayOfWeek = new Date(day).getDay();
      
      if (dayOfWeek === 6) { // Saturday - start new weekend
        if (currentWeekend.length > 0) {
          weekendPeriods.push(currentWeekend);
        }
        currentWeekend = [day];
      } else if (dayOfWeek === 0) { // Sunday - complete weekend
        currentWeekend.push(day);
      }
    }
    
    // Don't forget the last weekend if it exists
    if (currentWeekend.length > 0) {
      weekendPeriods.push(currentWeekend);
    }
    
    if (weekendPeriods.length === 0) return 100; // No weekends in month = 100%
    
    // Get user's workout sessions for current month
    const { data: sessions } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('start_time', firstDayOfMonth.toISOString())
      .lte('start_time', lastDayOfMonth.toISOString());

    if (!sessions || sessions.length === 0) return 0;
    
    // Create set of workout days
    const workoutDays = new Set<string>();
    sessions.forEach(session => {
      const dateString = new Date(session.start_time).toISOString().split('T')[0];
      workoutDays.add(dateString);
    });
    
    // Check how many weekends have at least one workout
    let completedWeekends = 0;
    for (const weekend of weekendPeriods) {
      // Check if user worked out on Saturday OR Sunday of this weekend
      const hasWeekendWorkout = weekend.some(day => workoutDays.has(day));
      if (hasWeekendWorkout) {
        completedWeekends++;
      }
    }
    
    return Math.round((completedWeekends / weekendPeriods.length) * 100);
  } catch (error) {
    console.error('Error calculating current month weekend completion:', error);
    return 0;
  }
};

// Calculate longest workout streak ever achieved
const calculateLongestStreak = async (userId: string): Promise<number> => {
  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('start_time')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('start_time', { ascending: true });

    if (!sessions || sessions.length === 0) return 0;

    // Group sessions by day and convert to Date objects for proper comparison
    const workoutDays = new Set<string>();
    sessions.forEach(session => {
      const dateString = new Date(session.start_time).toISOString().split('T')[0];
      workoutDays.add(dateString);
    });

    const sortedDays = Array.from(workoutDays).sort();
    
    if (sortedDays.length === 0) return 0;
    
    let maxStreak = 1; // At least 1 day if there are any workouts
    let currentStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const previousDate = new Date(sortedDays[i - 1]);
      const currentDate = new Date(sortedDays[i]);
      
      // Calculate the difference in days
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day - extend the streak
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        // Break in streak - reset to 1
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  } catch (error) {
    console.error('Error calculating longest streak:', error);
    return 0;
  }
};

// Calculate current workout streak
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

    const sortedDays = Array.from(workoutDays).sort().reverse(); // Most recent first
    const today = new Date().toISOString().split('T')[0];
    
    if (sortedDays.length === 0) return 0;
    
    // Check if the most recent workout was today or yesterday
    const mostRecentWorkout = sortedDays[0];
    const mostRecentDate = new Date(mostRecentWorkout);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - mostRecentDate.getTime();
    const daysSinceLastWorkout = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if streak protection is active
    const isProtectionActive = await CoinService.isStreakProtectionActive();
    
    // If streak protection is active, allow up to 4 days (1 regular + 3 from saver)
    // Otherwise, allow only 1 day as before
    const maxAllowedDays = isProtectionActive ? 4 : 1;
    
    // If last workout was more than the allowed days ago, check if we should auto-activate streak saver
    if (daysSinceLastWorkout > 1 && daysSinceLastWorkout <= 4 && !isProtectionActive) {
      // User is at risk of losing streak - try to auto-activate a streak saver
      const hasUnusedSavers = (await CoinService.getUnusedStreakSaverCount()) > 0;
      if (hasUnusedSavers) {
        const activated = await CoinService.activateStreakSaver();
        if (activated) {
          // Streak saver activated! Streak is now protected
          console.log('Streak Saver auto-activated to protect streak!');
          
          // Show notification (you can customize this based on your notification system)
          if (typeof window !== 'undefined' && window.alert) {
            setTimeout(() => {
              window.alert('🛡️ Streak Saver Activated!\n\nYour workout streak has been automatically protected for 3 extra days. Keep up the great work!');
            }, 100);
          }
        }
      }
    }
    
    // Re-check protection status after potential auto-activation
    const finalProtectionStatus = await CoinService.isStreakProtectionActive();
    const finalMaxAllowedDays = finalProtectionStatus ? 4 : 1;
    
    // If last workout was more than allowed days ago, streak is broken
    if (daysSinceLastWorkout > finalMaxAllowedDays) {
      return 0;
    }
    
    // Count consecutive days working backwards from the most recent workout
    let streak = 1; // Count the most recent workout day
    
    for (let i = 1; i < sortedDays.length; i++) {
      const currentDay = new Date(sortedDays[i - 1]);
      const previousDay = new Date(sortedDays[i]);
      
      const diffTime = currentDay.getTime() - previousDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        streak++;
      } else {
        // Break in streak
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating current streak:', error);
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