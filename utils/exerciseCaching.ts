/**
 * Exercise caching utility to improve performance and availability
 */
import { Exercise } from '@/types/exercise';
import { fetchExercisesFromAPI } from './apiConfig';

// Global cache for exercises
let cachedExercises: Exercise[] = [];

/**
 * Pre-cache exercises from the API
 * This should be called as early as possible in the app lifecycle
 */
export async function preloadExercises(): Promise<void> {
  try {
    // Only fetch if cache is empty
    if (cachedExercises.length === 0) {
      console.log('Pre-caching exercises from API...');
      const exercises = await fetchExercisesFromAPI();
      
      if (exercises && exercises.length > 0) {
        cachedExercises = exercises;
        console.log(`Successfully cached ${exercises.length} exercises`);
        
        // Also store in global window object for persistence across components
        if (typeof window !== 'undefined') {
          (window as any).cachedExercises = exercises;
          (window as any).getCachedExercises = getCachedExercises;
        }
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
export function getCachedExercises(): Exercise[] {
  // First check our module cache
  if (cachedExercises.length > 0) {
    return cachedExercises;
  }
  
  // Then check if they're stored in the window object
  if (typeof window !== 'undefined' && (window as any).cachedExercises) {
    cachedExercises = (window as any).cachedExercises;
    return cachedExercises;
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
  const cachedExercises = getCachedExercises();
  if (cachedExercises.length > 0) {
    return cachedExercises;
  }
  
  // If no cached exercises, fetch them
  try {
    const exercises = await fetchExercisesFromAPI();
    // Cache them for future use
    if (exercises && exercises.length > 0) {
      if (typeof window !== 'undefined') {
        (window as any).cachedExercises = exercises;
        (window as any).getCachedExercises = getCachedExercises;
      }
    }
    return exercises || [];
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
} 