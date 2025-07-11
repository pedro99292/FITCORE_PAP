import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getUserAchievements } from './achievementService';
import { ACHIEVEMENTS_DATA } from '../app/(tabs)/achievements';

export interface CoinBoost {
  type: 'double_coins';
  startTime: number;
  endTime: number;
  multiplier: number;
}

export interface StreakSaver {
  type: 'streak_saver';
  activatedAt: number;
  extraDays: number; // Number of extra days protection (3)
  used: boolean;
}

// Note: COINS_STORAGE_KEY is kept for migration purposes only
const COINS_STORAGE_KEY = 'userCoins';
const BOOSTS_STORAGE_KEY = 'activeBoosts';
const STREAK_SAVERS_STORAGE_KEY = 'streakSavers';

export class CoinService {
  // Get current coins from database
  static async getCoins(userId?: string): Promise<number> {
    try {
      // Get user ID if not provided
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          console.log('No authenticated user found');
          return 0;
        }
        userId = userData.user.id;
      }

      // Get coins from users_data table
      const { data, error } = await supabase
        .from('users_data')
        .select('coins')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found - create one with 0 coins
          await this.initializeUserCoins(userId);
          return 0;
        }
        console.error('Error getting coins from database:', error);
        return 0;
      }

      return data?.coins || 0;
    } catch (error) {
      console.error('Error getting coins:', error);
      return 0;
    }
  }

  // Set coins in database
  static async setCoins(amount: number, userId?: string): Promise<void> {
    try {
      // Get user ID if not provided
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          console.error('No authenticated user found');
          return;
        }
        userId = userData.user.id;
      }

      // Update coins in users_data table using upsert
      const { error } = await supabase
        .from('users_data')
        .upsert({
          user_id: userId,
          coins: Math.max(0, amount), // Ensure coins never go negative
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error setting coins in database:', error);
      }
    } catch (error) {
      console.error('Error setting coins:', error);
    }
  }

  // Initialize user coins record if it doesn't exist
  static async initializeUserCoins(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users_data')
        .upsert({
          user_id: userId,
          coins: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error initializing user coins:', error);
      }
    } catch (error) {
      console.error('Error initializing user coins:', error);
    }
  }

  // Migrate coins from AsyncStorage to database (run once during app upgrade)
  static async migrateCoinsToDatabase(userId?: string): Promise<boolean> {
    try {
      // Get user ID if not provided
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          console.log('No authenticated user found for migration');
          return false;
        }
        userId = userData.user.id;
      }

      // Check if user already has coins in database
      const currentDbCoins = await this.getCoins(userId);
      
      // Get coins from AsyncStorage
      const asyncStorageCoins = await AsyncStorage.getItem(COINS_STORAGE_KEY);
      const localCoins = asyncStorageCoins ? parseInt(asyncStorageCoins) : 0;
      
      // If user has coins in AsyncStorage but not in database, migrate them
      if (localCoins > 0 && currentDbCoins === 0) {
        console.log(`🪙 Migrating ${localCoins} coins from local storage to database`);
        await this.setCoins(localCoins, userId);
        
        // Clear AsyncStorage after successful migration
        await AsyncStorage.removeItem(COINS_STORAGE_KEY);
        console.log('✅ Coins migrated successfully');
        return true;
      }
      
      // If user has no coins in either place, initialize to 0
      if (localCoins === 0 && currentDbCoins === 0) {
        await this.initializeUserCoins(userId);
      }
      
      // Clean up AsyncStorage if database has coins
      if (currentDbCoins > 0 && localCoins > 0) {
        console.log('🧹 Cleaning up AsyncStorage coins (database already has coins)');
        await AsyncStorage.removeItem(COINS_STORAGE_KEY);
      }
      
      return false; // No migration needed
    } catch (error) {
      console.error('Error migrating coins to database:', error);
      return false;
    }
  }

  // Add coins with boost calculation
  static async addCoins(amount: number, userId?: string): Promise<number> {
    try {
      const currentCoins = await this.getCoins(userId);
      const boostedAmount = await this.applyBoosts(amount);
      const newTotal = currentCoins + boostedAmount;
      await this.setCoins(newTotal, userId);
      return boostedAmount; // Return the actual amount added (with boosts)
    } catch (error) {
      console.error('Error adding coins:', error);
      return amount;
    }
  }

  // Subtract coins
  static async subtractCoins(amount: number, userId?: string): Promise<boolean> {
    try {
      const currentCoins = await this.getCoins(userId);
      if (currentCoins >= amount) {
        await this.setCoins(currentCoins - amount, userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error subtracting coins:', error);
      return false;
    }
  }

  // Get active boosts
  static async getActiveBoosts(): Promise<CoinBoost[]> {
    try {
      const boosts = await AsyncStorage.getItem(BOOSTS_STORAGE_KEY);
      if (!boosts) return [];
      
      const parsedBoosts: CoinBoost[] = JSON.parse(boosts);
      const now = Date.now();
      
      // Filter out expired boosts
      const activeBoosts = parsedBoosts.filter(boost => boost.endTime > now);
      
      // Update storage to remove expired boosts
      if (activeBoosts.length !== parsedBoosts.length) {
        await AsyncStorage.setItem(BOOSTS_STORAGE_KEY, JSON.stringify(activeBoosts));
      }
      
      return activeBoosts;
    } catch (error) {
      console.error('Error getting active boosts:', error);
      return [];
    }
  }

  // Add a boost
  static async addBoost(boost: CoinBoost): Promise<void> {
    try {
      const currentBoosts = await this.getActiveBoosts();
      currentBoosts.push(boost);
      await AsyncStorage.setItem(BOOSTS_STORAGE_KEY, JSON.stringify(currentBoosts));
    } catch (error) {
      console.error('Error adding boost:', error);
    }
  }

  // Apply boosts to coin amount
  static async applyBoosts(amount: number): Promise<number> {
    try {
      const activeBoosts = await this.getActiveBoosts();
      let multiplier = 1;
      
      // Apply all active boosts
      activeBoosts.forEach(boost => {
        if (boost.type === 'double_coins') {
          multiplier *= boost.multiplier;
        }
      });
      
      return Math.floor(amount * multiplier);
    } catch (error) {
      console.error('Error applying boosts:', error);
      return amount;
    }
  }

  // Get current boost multiplier
  static async getCurrentMultiplier(): Promise<number> {
    try {
      const activeBoosts = await this.getActiveBoosts();
      let multiplier = 1;
      
      activeBoosts.forEach(boost => {
        if (boost.type === 'double_coins') {
          multiplier *= boost.multiplier;
        }
      });
      
      return multiplier;
    } catch (error) {
      console.error('Error getting current multiplier:', error);
      return 1;
    }
  }

  // Check if double coin boost is active
  static async isDoubleCoinBoostActive(): Promise<boolean> {
    const activeBoosts = await this.getActiveBoosts();
    return activeBoosts.some(boost => boost.type === 'double_coins');
  }

  // Get remaining time for double coin boost (in milliseconds)
  static async getDoubleCoinBoostTimeRemaining(): Promise<number> {
    const activeBoosts = await this.getActiveBoosts();
    const doubleCoinBoost = activeBoosts.find(boost => boost.type === 'double_coins');
    
    if (!doubleCoinBoost) return 0;
    
    const now = Date.now();
    return Math.max(0, doubleCoinBoost.endTime - now);
  }

  // Activate double coin boost for 24 hours
  static async activateDoubleCoinBoost(): Promise<void> {
    const now = Date.now();
    const boost: CoinBoost = {
      type: 'double_coins',
      startTime: now,
      endTime: now + (24 * 60 * 60 * 1000), // 24 hours in milliseconds
      multiplier: 2
    };
    
    // Remove any existing double coin boosts first
    const currentBoosts = await this.getActiveBoosts();
    const otherBoosts = currentBoosts.filter(b => b.type !== 'double_coins');
    otherBoosts.push(boost);
    
    await AsyncStorage.setItem(BOOSTS_STORAGE_KEY, JSON.stringify(otherBoosts));
  }

  // Calculate total coins from achievements (with current system compatibility)
  static async calculateTotalCoinsFromAchievements(userId: string): Promise<number> {
    try {
      const userAchievements = await getUserAchievements(userId);
      let totalCoins = 0;
      
      userAchievements.forEach(userAchievement => {
        if (userAchievement.progress === 100) {
          const achievementData = ACHIEVEMENTS_DATA.find(
            achievement => achievement.id === userAchievement.achievement_id
          );
          
          if (achievementData) {
            totalCoins += achievementData.coins;
          }
        }
      });
      
      return totalCoins;
    } catch (error) {
      console.error('Error calculating total coins from achievements:', error);
      return 0;
    }
  }

  // Update coins based on new achievement unlocks (with boost)
  static async updateCoinsFromNewAchievements(unlockedAchievements: any[], userId?: string): Promise<number> {
    const totalNewCoins = unlockedAchievements.reduce((sum, achievement) => sum + achievement.coins, 0);
    const boostedCoins = await this.applyBoosts(totalNewCoins);
    
    const currentCoins = await this.getCoins(userId);
    await this.setCoins(currentCoins + boostedCoins, userId);
    
    return boostedCoins;
  }

  // === STREAK SAVER METHODS ===
  
  // Get user's streak savers
  static async getStreakSavers(): Promise<StreakSaver[]> {
    try {
      const savers = await AsyncStorage.getItem(STREAK_SAVERS_STORAGE_KEY);
      return savers ? JSON.parse(savers) : [];
    } catch (error) {
      console.error('Error getting streak savers:', error);
      return [];
    }
  }

  // Add a streak saver (when purchased)
  static async addStreakSaver(): Promise<void> {
    try {
      const currentSavers = await this.getStreakSavers();
      const newSaver: StreakSaver = {
        type: 'streak_saver',
        activatedAt: 0, // Not activated yet
        extraDays: 3,
        used: false
      };
      
      currentSavers.push(newSaver);
      await AsyncStorage.setItem(STREAK_SAVERS_STORAGE_KEY, JSON.stringify(currentSavers));
    } catch (error) {
      console.error('Error adding streak saver:', error);
    }
  }

  // Check how many unused streak savers the user has
  static async getUnusedStreakSaverCount(): Promise<number> {
    try {
      const savers = await this.getStreakSavers();
      return savers.filter(saver => !saver.used).length;
    } catch (error) {
      console.error('Error getting unused streak saver count:', error);
      return 0;
    }
  }

  // Activate a streak saver (use one to protect streak)
  static async activateStreakSaver(): Promise<boolean> {
    try {
      const savers = await this.getStreakSavers();
      const unusedSaver = savers.find(saver => !saver.used);
      
      if (!unusedSaver) {
        return false; // No unused streak savers available
      }
      
      // Mark this saver as used and set activation time
      unusedSaver.used = true;
      unusedSaver.activatedAt = Date.now();
      
      await AsyncStorage.setItem(STREAK_SAVERS_STORAGE_KEY, JSON.stringify(savers));
      return true;
    } catch (error) {
      console.error('Error activating streak saver:', error);
      return false;
    }
  }

  // Check if streak protection is currently active
  static async isStreakProtectionActive(): Promise<boolean> {
    try {
      const savers = await this.getStreakSavers();
      const now = Date.now();
      
      return savers.some(saver => 
        saver.used && 
        saver.activatedAt > 0 && 
        (now - saver.activatedAt) < (saver.extraDays * 24 * 60 * 60 * 1000)
      );
    } catch (error) {
      console.error('Error checking streak protection:', error);
      return false;
    }
  }

  // Get remaining streak protection days
  static async getStreakProtectionTimeRemaining(): Promise<number> {
    try {
      const savers = await this.getStreakSavers();
      const now = Date.now();
      
      let maxTimeRemaining = 0;
      
      savers.forEach(saver => {
        if (saver.used && saver.activatedAt > 0) {
          const elapsed = now - saver.activatedAt;
          const totalProtection = saver.extraDays * 24 * 60 * 60 * 1000;
          const remaining = Math.max(0, totalProtection - elapsed);
          maxTimeRemaining = Math.max(maxTimeRemaining, remaining);
        }
      });
      
      return maxTimeRemaining;
    } catch (error) {
      console.error('Error getting streak protection time remaining:', error);
      return 0;
    }
  }

  // Clean up expired streak savers
  static async cleanupExpiredStreakSavers(): Promise<void> {
    try {
      const savers = await this.getStreakSavers();
      const now = Date.now();
      
      const activeSavers = savers.filter(saver => {
        if (!saver.used) return true; // Keep unused savers
        if (saver.activatedAt === 0) return true; // Keep unactivated savers
        
        const elapsed = now - saver.activatedAt;
        const totalProtection = saver.extraDays * 24 * 60 * 60 * 1000;
        return elapsed < totalProtection; // Keep if still protecting
      });
      
      if (activeSavers.length !== savers.length) {
        await AsyncStorage.setItem(STREAK_SAVERS_STORAGE_KEY, JSON.stringify(activeSavers));
      }
    } catch (error) {
      console.error('Error cleaning up expired streak savers:', error);
    }
  }
} 