import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/utils/supabase';
import { getUserAchievements } from '@/utils/achievementService';
import { ACHIEVEMENTS_DATA } from '@/app/(tabs)/achievements';
import { useAchievements } from '@/contexts/AchievementContext';
import { CoinService } from '@/utils/coinService';

export default function HeaderStats() {
  const [streakCount, setStreakCount] = useState(0);
  const [currencyCount, setCurrencyCount] = useState(0);
  const { isDarkMode, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const { shouldRefreshCoins, clearCoinsRefreshFlag } = useAchievements();

  useEffect(() => {
    calculateStreak();
    calculateTotalCoins();
  }, []);

  // Listen for coins refresh triggers
  useEffect(() => {
    if (shouldRefreshCoins) {
      calculateTotalCoins();
      clearCoinsRefreshFlag();
    }
  }, [shouldRefreshCoins, clearCoinsRefreshFlag]);

  // Calculate total coins earned from completed achievements
  const calculateTotalCoins = async () => {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        return;
      }

      // Use CoinService to get current coins (includes any coins from shop purchases, boosts applied, etc.)
      const currentCoins = await CoinService.getCoins();
      setCurrencyCount(currentCoins);
    } catch (error) {
      console.error('Error calculating total coins:', error);
      setCurrencyCount(0);
    }
  };

  // Calculate workout streak based on consecutive days with workouts
  const calculateStreak = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setIsLoading(false);
        return;
      }
      
      // Get user's workout sessions sorted by start_time in descending order
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('start_time, status')
        .eq('user_id', userData.user.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });
      
      if (error || !sessions || sessions.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Calculate streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Group sessions by day (since a user might have multiple workouts in a day)
      const workoutDays = new Set<string>();
      
      sessions.forEach(session => {
        const sessionDate = new Date(session.start_time);
        const dateString = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        workoutDays.add(dateString);
      });
      
      // Convert to array and sort in descending order (newest first)
      const sortedWorkoutDays = Array.from(workoutDays).sort().reverse();
      
      if (sortedWorkoutDays.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Get the most recent workout date
      const mostRecentWorkoutDate = new Date(sortedWorkoutDays[0]);
      mostRecentWorkoutDate.setHours(0, 0, 0, 0);
      
      // Calculate days since most recent workout
      const daysSinceLastWorkout = Math.floor(
        (today.getTime() - mostRecentWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If more than 3 days since last workout, streak is 0
      if (daysSinceLastWorkout > 3) {
        setStreakCount(0);
        setIsLoading(false);
        return;
      }
      
      // Calculate streak by counting all workout days with gaps <= 3 days
      streak = 0;
      let currentDate = new Date(today);
      currentDate.setHours(0, 0, 0, 0);
      
      // Create a set of workout day strings for easier lookup
      const workoutDaysSet = new Set(sortedWorkoutDays);
      
      // Scan backwards from today, looking for the longest streak
      let previousWorkoutDate: Date | null = null;
      let gapDays = 0;
      
      // Convert sortedWorkoutDays to actual Date objects and sort most recent first
      const workoutDatesArray = sortedWorkoutDays.map(dateStr => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date;
      });
      
      // Traverse the sorted workout dates
      for (let i = 0; i < workoutDatesArray.length; i++) {
        const currentWorkoutDate = workoutDatesArray[i];
        
        if (previousWorkoutDate === null) {
          // First workout in the sequence
          previousWorkoutDate = currentWorkoutDate;
          streak = 1; // Start the streak
          continue;
        }
        
        // Calculate days between previous workout and this one
        const daysBetween = Math.floor(
          (previousWorkoutDate.getTime() - currentWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween <= 3) {
          // Gap is 3 days or less, include in streak
          streak++;
          previousWorkoutDate = currentWorkoutDate;
        } else {
          // Gap is more than 3 days, streak is broken
          break;
        }
      }
      
      setStreakCount(streak);
    } catch (error) {
      console.error('Error calculating streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format value with K suffix if over 1000
  const formatValue = (val: number): string => {
    if (val >= 1000) {
      if (val < 10000) {
        // Format with one decimal place (like 1.2K)
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        // Format without decimal places (like 10K)
        return Math.floor(val / 1000) + 'K';
      }
    }
    return val.toString();
  };

  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { 
        backgroundColor: isDarkMode ? '#2D2B3F' : colors.surface,
      }
    ]} edges={['top', 'left', 'right']}>
      <View style={[
        styles.container, 
        { 
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }
      ]}>
        {/* Streaks Counter on the Left */}
        <View style={styles.counterContainer}>
          <Image 
            source={require('../assets/images/streaks.png')} 
            style={styles.icon} 
            resizeMode="contain"
          />
          <Text style={[styles.counterText, { color: colors.text }]}>{streakCount}</Text>
          <Text style={[styles.labelText, { color: isDarkMode ? '#ccc' : '#666' }]}>Days</Text>
        </View>

        {/* Title in the Center */}
        <Text style={[styles.title, { color: colors.text }]}>FitCore</Text>

        {/* Currency Counter on the Right */}
        <View style={styles.counterContainer}>
          <Image 
            source={require('../assets/images/coin.png')} 
            style={styles.icon} 
            resizeMode="contain"
          />
          <Text style={[styles.counterText, { color: colors.text }]}>{formatValue(currencyCount)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  counterText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 15,
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
}); 