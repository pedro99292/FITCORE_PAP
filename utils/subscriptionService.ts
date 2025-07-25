import { supabase } from '../utils/supabase';
import { SurveyData } from '../components/SurveyModal';

export type SubscriptionType = 'free' | 'monthly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'active' | 'inactive' | 'trial';

interface SubscriptionDetails {
  type: SubscriptionType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
}

export const subscriptionService = {
  async subscribe(userId: string, subscriptionType: SubscriptionType): Promise<boolean> {
    try {
      console.log('Subscribing user with type:', subscriptionType);
      const startDate = new Date();
      let endDate: Date | null = null;
      
      // Calculate end date based on subscription type
      if (subscriptionType === 'monthly') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscriptionType === 'annual') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // lifetime subscription has no end date

      const { data, error } = await supabase
        .from('users')
        .update({
          subscription_type: subscriptionType,
          subscription_status: 'active',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate?.toISOString() || null,
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Subscription updated:', data);
      return true;
    } catch (error) {
      console.error('Error subscribing user:', error);
      return false;
    }
  },

  async deleteAutoGeneratedWorkouts(userId: string): Promise<boolean> {
    try {
      // Get all auto-generated workouts for the user
      const { data: autoWorkouts, error: fetchError } = await supabase
        .from('workouts')
        .select('workout_id')
        .eq('user_id', userId)
        .eq('workout_type', 'auto_generated');

      if (fetchError) {
        console.error('Error fetching auto-generated workouts:', fetchError);
        throw fetchError;
      }

      if (!autoWorkouts || autoWorkouts.length === 0) {
        console.log('No auto-generated workouts found for user');
        return true; // Nothing to delete is success
      }

      const workoutIds = autoWorkouts.map(w => w.workout_id);
      console.log(`Found ${workoutIds.length} auto-generated workouts to delete:`, workoutIds);

      // Try using the RPC function first (if it exists) for each workout
      for (const workoutId of workoutIds) {
        try {
          const { error: rpcError } = await supabase.rpc('delete_workout_with_dependencies', {
            workout_id_param: workoutId
          });

          if (rpcError) {
            console.warn(`RPC delete failed for workout ${workoutId}, using manual deletion:`, rpcError);
            
            // Manual deletion process
            // Step 1: Get all sessions for this workout
            const { data: sessionsData, error: sessionsQueryError } = await supabase
              .from('sessions')
              .select('session_id')
              .eq('workout_id', workoutId);

            if (sessionsQueryError) {
              console.error('Error querying sessions:', sessionsQueryError);
              throw sessionsQueryError;
            }

            // Step 2: Delete session_sets for these sessions
            if (sessionsData && sessionsData.length > 0) {
              const sessionIds = sessionsData.map(session => session.session_id);
              
              const { error: sessionSetsError } = await supabase
                .from('session_sets')
                .delete()
                .in('session_id', sessionIds);

              if (sessionSetsError) {
                console.error('Error deleting session sets:', sessionSetsError);
                throw sessionSetsError;
              }
            }

            // Step 3: Delete sessions
            const { error: sessionsError } = await supabase
              .from('sessions')
              .delete()
              .eq('workout_id', workoutId);

            if (sessionsError) {
              console.error('Error deleting sessions:', sessionsError);
              throw sessionsError;
            }

            // Step 4: Delete workout_sets
            const { error: workoutSetsError } = await supabase
              .from('workout_sets')
              .delete()
              .eq('workout_id', workoutId);

            if (workoutSetsError) {
              console.error('Error deleting workout sets:', workoutSetsError);
              throw workoutSetsError;
            }

            // Step 5: Delete the workout
            const { error: workoutError } = await supabase
              .from('workouts')
              .delete()
              .eq('workout_id', workoutId);

            if (workoutError) {
              console.error('Error deleting workout:', workoutError);
              throw workoutError;
            }
          }

          console.log(`Successfully deleted auto-generated workout: ${workoutId}`);
        } catch (error) {
          console.error(`Failed to delete workout ${workoutId}:`, error);
          // Continue with other workouts even if one fails
        }
      }

      console.log(`Completed deletion of auto-generated workouts for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting auto-generated workouts:', error);
      return false;
    }
  },

  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      // First, delete all auto-generated workouts
      const workoutDeletionSuccess = await this.deleteAutoGeneratedWorkouts(userId);
      if (!workoutDeletionSuccess) {
        console.warn('Some auto-generated workouts may not have been deleted, but continuing with subscription cancellation');
      }

      // Then, cancel the subscription
      const { error } = await supabase
        .from('users')
        .update({
          subscription_type: 'free',
          subscription_status: 'inactive',
          subscription_end_date: new Date().toISOString(), // Set end date to now
        })
        .eq('id', userId);

      if (error) throw error;
      
      console.log(`Successfully canceled subscription and deleted auto-generated workouts for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  },

  async getUserCreatedWorkouts(userId: string): Promise<any[]> {
    try {
      // Get all workouts created by the user (not auto-generated)
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          workout_id,
          title,
          description,
          created_at,
          user_id,
          workout_type
        `)
        .eq('user_id', userId)
        .eq('workout_type', 'user_created')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user created workouts:', error);
      return [];
    }
  },

  async hasAutoGeneratedWorkouts(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('workout_id')
        .eq('user_id', userId)
        .eq('workout_type', 'auto_generated')
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking auto-generated workouts:', error);
      return false;
    }
  },

  async startTrial(userId: string): Promise<boolean> {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // 14-day trial

      const { error } = await supabase
        .from('users')
        .update({
          subscription_type: 'free',
          subscription_status: 'trial',
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  },

  async updateUserProfile(userId: string, surveyData: SurveyData): Promise<boolean> {
    try {
      // Input validation
      const age = parseInt(surveyData.age);
      const height = parseFloat(surveyData.height);
      const weight = parseFloat(surveyData.weight);
      
      if (isNaN(age) || isNaN(height) || isNaN(weight)) {
        throw new Error('Invalid numeric values provided');
      }

      // Normalize experience_level to match constraint (capitalize first letter)
      const normalizeExperienceLevel = (level: string): string => {
        switch (level.toLowerCase()) {
          case 'novice': return 'Novice';
          case 'experienced': return 'Experienced';
          case 'advanced': return 'Advanced';
          default: return level; // fallback to original value
        }
      };

      // Normalize gender to match constraint
      const normalizeGender = (gender: string): string => {
        switch (gender.toLowerCase()) {
          case 'male': return 'Male';
          case 'female': return 'Female';
          case 'prefer not to say': return 'Prefer not to say';
          default: return gender; // fallback to original value
        }
      };

      // Convert sets per exercise to integer if it exists
      const setsPerExercise = surveyData.setsPerExercise ? parseInt(surveyData.setsPerExercise) : null;

      // Use upsert to insert or update users_data record
      const { error } = await supabase
        .from('users_data')
        .upsert({
          user_id: userId,
          age: age,
          height: height,
          weight: weight,
          experience_level: normalizeExperienceLevel(surveyData.experienceLevel),
          workouts_per_week: parseInt(surveyData.availability),
          goals: [surveyData.goals], // Convert single goal to array format for database
          gender: normalizeGender(surveyData.gender),
          workout_split: surveyData.workoutSplit || null,
          sets_per_exercise: setsPerExercise,
          rest_time: surveyData.restTime || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id' // Handle conflict on user_id (unique constraint)
        });

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      console.log('User profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  },

  async getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_type, subscription_status, subscription_start_date, subscription_end_date')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        type: data.subscription_type as SubscriptionType,
        status: data.subscription_status as SubscriptionStatus,
        startDate: new Date(data.subscription_start_date),
        endDate: data.subscription_end_date ? new Date(data.subscription_end_date) : null,
      };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      return null;
    }
  },

  async checkSubscriptionStatus(userId: string): Promise<boolean> {
    try {
      const details = await this.getSubscriptionDetails(userId);
      if (!details) return false;

      // If lifetime subscription, always return true
      if (details.type === 'lifetime') return true;

      // If trial or regular subscription, check if it's still valid
      if (details.status === 'active' || details.status === 'trial') {
        if (!details.endDate) return true;
        return new Date() < details.endDate;
      }

      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  },

  async hasUserCompletedSurvey(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users_data')
        .select(`
          age,
          height,
          weight,
          gender,
          goals,
          experience_level,
          workouts_per_week,
          workout_split,
          sets_per_exercise,
          rest_time
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found - user hasn't completed survey
          console.log('No users_data record found for user:', userId);
          return false;
        }
        console.error('Error checking user survey completion:', error);
        return false;
      }

      if (!data) {
        console.log('No user data found');
        return false;
      }

      // Check if all required fields are filled
      const isComplete = (
        data.age !== null &&
        data.height !== null &&
        data.weight !== null &&
        data.gender !== null &&
        data.goals !== null && Array.isArray(data.goals) && data.goals.length > 0 &&
        data.experience_level !== null &&
        data.workouts_per_week !== null &&
        data.workout_split !== null &&
        data.sets_per_exercise !== null &&
        data.rest_time !== null
      );

      console.log(`User ${userId} survey completion status:`, isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error in hasUserCompletedSurvey:', error);
      return false;
    }
  },
}; 