import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AchievementContextType {
  shouldRefresh: boolean;
  triggerRefresh: () => void;
  clearRefreshFlag: () => void;
  invalidateCache: () => Promise<void>;
  triggerCoinsRefresh: () => void;
  shouldRefreshCoins: boolean;
  clearCoinsRefreshFlag: () => void;
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

  const value = {
    shouldRefresh,
    triggerRefresh,
    clearRefreshFlag,
    invalidateCache,
    triggerCoinsRefresh,
    shouldRefreshCoins,
    clearCoinsRefreshFlag,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}; 