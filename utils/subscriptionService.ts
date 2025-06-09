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
}; 