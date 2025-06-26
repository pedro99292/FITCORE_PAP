import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { ACHIEVEMENTS_DATA } from '../app/(tabs)/achievements';
import { CoinService } from '../utils/coinService';

interface AchievementContextType {
  shouldRefresh: boolean;
  triggerRefresh: () => void;
  clearRefreshFlag: () => void;
  invalidateCache: () => Promise<void>;
  triggerCoinsRefresh: () => void;
  shouldRefreshCoins: boolean;
  clearCoinsRefreshFlag: () => void;
  checkAndShowAchievementNotifications: (userId: string) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [shouldRefreshCoins, setShouldRefreshCoins] = useState(false);

  const triggerRefresh = useCallback(() => {
    setShouldRefresh(true);
  }, []);

  const clearRefreshFlag = useCallback(() => {
    setShouldRefresh(false);
  }, []);

  const triggerCoinsRefresh = useCallback(() => {
    setShouldRefreshCoins(true);
  }, []);

  const clearCoinsRefreshFlag = useCallback(() => {
    setShouldRefreshCoins(false);
  }, []);

  const invalidateCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user_achievements_cache');
      triggerRefresh();
      triggerCoinsRefresh(); // Also refresh coins when cache is invalidated
    } catch (error) {
      console.warn('Error invalidating achievements cache:', error);
    }
  }, [triggerRefresh, triggerCoinsRefresh]);

  // Check for new achievement unlocks and show notifications
  const checkAndShowAchievementNotifications = useCallback(async (userId: string) => {
    try {
      // Import updateAllAchievements dynamically to avoid circular dependencies
      const { updateAllAchievements } = await import('../utils/achievementService');
      
      // Update achievements and get any new unlocks
      const newUnlocks = await updateAllAchievements(userId);
      
      if (newUnlocks.length > 0) {
        // Get achievement details for the newly unlocked achievements
        const unlockedAchievements = newUnlocks.map(achievementId => {
          return ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
        }).filter(achievement => achievement !== undefined);
        
        // Calculate total coins earned (with boost if active)
        const totalBaseCoins = unlockedAchievements.reduce((sum, achievement) => sum + achievement.coins, 0);
        const boostedCoins = await CoinService.updateCoinsFromNewAchievements(unlockedAchievements);
        const currentMultiplier = await CoinService.getCurrentMultiplier();
        
        const achievementTitles = unlockedAchievements.map(a => a.title);
        const achievementList = achievementTitles.length <= 3 
          ? achievementTitles.join(', ')
          : `${achievementTitles.slice(0, 3).join(', ')} and ${achievementTitles.length - 3} more`;
        
        // Check if boost was applied
        const boostActive = currentMultiplier > 1;
        const coinMessage = boostActive 
          ? `💎 You earned ${boostedCoins} coins (${totalBaseCoins} base + ${boostedCoins - totalBaseCoins} bonus from ${currentMultiplier}x boost)!`
          : `💎 You earned ${boostedCoins} coins!`;
        
        // Show notification for new unlocks with coins
        if (Platform.OS === 'web') {
          alert(`🏆 Achievement Unlocked!\n\n${achievementList}\n\n${coinMessage}`);
        } else {
          Alert.alert(
            '🏆 Achievement Unlocked!',
            `Congratulations! You unlocked:\n\n${achievementList}\n\n${coinMessage}`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        }
        
        // Trigger refresh of achievements page and coins
        triggerRefresh();
        triggerCoinsRefresh();
      }
    } catch (error) {
      console.error('Error checking achievement notifications:', error);
    }
  }, [triggerRefresh, triggerCoinsRefresh]);

  const value = {
    shouldRefresh,
    triggerRefresh,
    clearRefreshFlag,
    invalidateCache,
    triggerCoinsRefresh,
    shouldRefreshCoins,
    clearCoinsRefreshFlag,
    checkAndShowAchievementNotifications,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}; 