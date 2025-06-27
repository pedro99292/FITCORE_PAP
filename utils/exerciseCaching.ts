/**
 * Exercise caching utility to improve performance and availability
 */
import { Exercise } from '@/types/exercise';
import { fetchExercisesFromAPI } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global cache for exercises
let cachedExercises: Exercise[] = [];

// Cache duration: 7 days (exercises don't change frequently)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const CACHE_KEY = 'fitcore_exercises_cache';
const CACHE_TIMESTAMP_KEY = 'fitcore_exercises_cache_timestamp';

/**
 * Manually clear all exercise cache data
 * Call this when changing API keys or when you need fresh data
 */
export async function clearExerciseCache(): Promise<void> {
  try {
    cachedExercises.length = 0; // Clear memory cache
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('Exercise cache cleared successfully');
  } catch (error) {
    console.error('Error clearing exercise cache:', error);
  }
}

/**
 * Check if cached data is still valid
 */
async function isCacheValid(): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    return (now - cacheTime) < CACHE_DURATION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Pre-cache exercises from the API
 * This should be called as early as possible in the app lifecycle
 */
export async function preloadExercises(): Promise<void> {
  try {
    // Check if we have valid cached data first
    const cacheValid = await isCacheValid();
    if (cacheValid) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        cachedExercises = JSON.parse(cached);
        console.log(`Loaded ${cachedExercises.length} exercises from persistent cache`);
        return;
      }
    }
    
    // Only fetch if cache is empty or invalid
    if (cachedExercises.length === 0 || !cacheValid) {
      console.log('Pre-caching exercises from API...');
      const exercises = await fetchExercisesFromAPI();
      
      if (exercises && exercises.length > 0) {
        cachedExercises = exercises;
        console.log(`Successfully cached ${exercises.length} exercises`);
        
        // Store in persistent storage with timestamp
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(exercises));
        await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        console.error('Failed to preload exercises: No exercises returned from API');
      }
    } else {
      console.log('Exercises already cached');
    }
  } catch (error) {
    console.error('Error preloading exercises:', error);
  }
}

/**
 * Get cached exercises
 * @returns Array of cached exercises or empty array if none are cached
 */
export async function getCachedExercises(): Promise<Exercise[]> {
  // First check our module cache
  if (cachedExercises.length > 0) {
    return cachedExercises;
  }
  
  // Then check persistent storage if cache is valid
  try {
    const cacheValid = await isCacheValid();
    if (cacheValid) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          cachedExercises = JSON.parse(cached);
          return cachedExercises;
        } catch (error) {
          console.error('Error parsing cached exercises:', error);
          // Clear invalid cache
          await AsyncStorage.removeItem(CACHE_KEY);
          await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
      }
    }
  } catch (error) {
    console.error('Error getting cached exercises:', error);
  }
  
  // No cached exercises available
  return [];
}

/**
 * Get exercises with auto-caching fallback
 * This will try to get cached exercises first, and if none are available,
 * it will fetch them from the API and cache them
 */
export async function getExercisesWithFallback(): Promise<Exercise[]> {
  // Try to get from cache first
  const cachedExercises = await getCachedExercises();
  if (cachedExercises.length > 0) {
    return cachedExercises;
  }
  
  // If no cached exercises, fetch them
  try {
    const exercises = await fetchExercisesFromAPI();
    // Cache them for future use
    if (exercises && exercises.length > 0) {
      // Update the module cache
      cachedExercises.length = 0;
      cachedExercises.push(...exercises);
    }
    return exercises || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
} 