import { useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { EXERCISE_DB_API_URL, getExerciseDBHeaders, fetchExercisesFromAPI } from '@/utils/apiConfig';

// Global store for exercises
let cachedExercises: Exercise[] = [];

// App component
function MyApp({ Component, pageProps }: any) {
  // Pre-cache exercises on app load
  useEffect(() => {
    async function fetchAndCacheExercises() {
      if (cachedExercises.length > 0) return; // Already cached
      
      try {
        // Try to fetch from local storage first
        const storedExercises = localStorage.getItem('cachedExercises');
        if (storedExercises) {
          cachedExercises = JSON.parse(storedExercises);
          console.log(`[Exercises] Loaded ${cachedExercises.length} exercises from local storage`);
          return;
        }
        
        // If not in local storage, fetch from API using our helper function
        console.log('[Exercises] Fetching exercises from API...');
        try {
          const exercises = await fetchExercisesFromAPI();
          cachedExercises = exercises;
          
          // Store in local storage for future app loads
          localStorage.setItem('cachedExercises', JSON.stringify(exercises));
          console.log(`[Exercises] Cached ${exercises.length} exercises`);
        } catch (error) {
          console.error('[Exercises] Failed to fetch from API:', error);
        }
      } catch (error) {
        console.error('[Exercises] Failed to cache exercises:', error);
      }
    }
    
    fetchAndCacheExercises();
  }, []);
  
  // Expose cached exercises to window for easy access in any component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getCachedExercises = () => cachedExercises;
    }
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp; 