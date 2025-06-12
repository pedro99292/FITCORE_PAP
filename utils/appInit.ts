/**
 * App initialization utilities
 * This file contains functions to initialize resources needed by the app
 */
import { preloadExercises } from './exerciseCaching';

/**
 * Initialize app resources
 * Call this as early as possible in the app lifecycle
 */
export async function initializeAppResources() {
  try {
    console.log('Initializing app resources...');
    
    // Preload exercises for workout generation
    await preloadExercises();
    
    console.log('App resources initialized successfully');
  } catch (error) {
    console.error('Error initializing app resources:', error);
  }
} 