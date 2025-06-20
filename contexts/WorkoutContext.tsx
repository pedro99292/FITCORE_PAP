import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  totalMinutes: number;
  isLoading: boolean;
}

interface WorkoutContextType {
  stats: WorkoutStats;
  isRefreshing: boolean;
  refreshStats: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const useWorkoutStats = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkoutStats must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalVolume: 0,
    totalMinutes: 0,
    isLoading: true
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats({
        totalWorkouts: 0,
        totalVolume: 0,
        totalMinutes: 0,
        isLoading: false
      });
      return;
    }

    try {
      setIsRefreshing(true);

      // Get total sessions count
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('session_id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (sessionError) throw sessionError;
      const totalWorkouts = sessionData?.length || 0;

      // Get total duration
      const { data: durationData, error: durationError } = await supabase
        .from('sessions')
        .select('duration')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (durationError) throw durationError;
      const totalMinutes = durationData?.reduce((sum, session) => 
        sum + Math.floor((session.duration || 0) / 60), 0) || 0;

      // Get total volume (reps × weight)
      const { data: setData, error: setError } = await supabase
        .from('session_sets')
        .select(`
          actual_reps,
          actual_weight,
          session_id,
          sessions!inner(user_id)
        `)
        .eq('sessions.user_id', user.id);

      if (setError) throw setError;
      const totalVolume = setData?.reduce((sum, set) => 
        sum + ((set.actual_reps || 0) * (set.actual_weight || 0)), 0) || 0;

      setStats({
        totalWorkouts,
        totalVolume: Math.round(totalVolume), // Round to nearest kg
        totalMinutes,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Initial fetch when user changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const value = {
    stats,
    isRefreshing,
    refreshStats
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}; 