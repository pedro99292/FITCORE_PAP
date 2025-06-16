import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { 
  EXERCISE_DB_API_URL, 
  getExerciseDBHeaders,
  EXERCISE_DB_API_KEY,
  fetchFromExerciseDB,
  fetchBodyPartListFromAPI,
  fetchEquipmentListFromAPI,
  fetchTargetListFromAPI
} from '@/utils/apiConfig';

type FetchExercisesParams = {
  bodyPart?: string;
  equipment?: string;
  target?: string;
  name?: string;
  search?: string;
};

// ExerciseDB response interface
interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
  overview?: string;
  exerciseTips?: string[];
  variations?: string[];
  keywords?: string[];
  exerciseType?: string;
}

export const useExerciseDB = (params?: FetchExercisesParams) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissingApiKey, setIsMissingApiKey] = useState<boolean>(false);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);

    // Check if API key is available
    if (!EXERCISE_DB_API_KEY) {
      setIsMissingApiKey(true);
      setLoading(false);
      return;
    }

    try {
      let results: ExerciseDBExercise[] = [];
      let shouldFetchAll = !params?.bodyPart && !params?.equipment && !params?.target && !params?.name;
      
      // Set a high limit to fetch as many exercises as possible
      const maxLimit = 1000; // The maximum number of exercises to fetch
      
      // If we have filters, use the appropriate endpoints
      if (params?.bodyPart && params?.equipment) {
        // First fetch by bodyPart with maximum limit
        console.log(`Fetching ExerciseDB with bodyPart filter: ${params.bodyPart} and limit: ${maxLimit}`);
        
        try {
          const data = await fetchFromExerciseDB(`/bodyPart/${encodeURIComponent(params.bodyPart)}?limit=${maxLimit}`);
          console.log(`Got ${data.length} exercises for bodyPart: ${params.bodyPart}`);
          
          // Filter the results to match the equipment filter
          results = data.filter((exercise: ExerciseDBExercise) => 
            exercise.equipment.toLowerCase() === params.equipment?.toLowerCase()
          );
          console.log(`After equipment filter (${params.equipment}), ${results.length} exercises remain`);
        } catch (error) {
          console.error(`Error fetching by bodyPart and equipment:`, error);
          throw new Error(`Failed to fetch exercises for ${params.bodyPart} with ${params.equipment}`);
        }
      }
      // Otherwise use the API's built-in filtering by single criterion
      else if (params?.bodyPart) {
        console.log(`Fetching ExerciseDB with bodyPart filter: ${params.bodyPart} and limit: ${maxLimit}`);
        
        try {
          results = await fetchFromExerciseDB(`/bodyPart/${encodeURIComponent(params.bodyPart)}?limit=${maxLimit}`);
          console.log(`Got ${results.length} exercises for bodyPart: ${params.bodyPart}`);
        } catch (error) {
          console.error(`Error fetching by bodyPart:`, error);
          throw new Error(`Failed to fetch exercises for bodyPart: ${params.bodyPart}`);
        }
      } 
      else if (params?.equipment) {
        console.log(`Fetching ExerciseDB with equipment filter: ${params.equipment} and limit: ${maxLimit}`);
        
        try {
          results = await fetchFromExerciseDB(`/equipment/${encodeURIComponent(params.equipment)}?limit=${maxLimit}`);
          console.log(`Got ${results.length} exercises for equipment: ${params.equipment}`);
        } catch (error) {
          console.error(`Error fetching by equipment:`, error);
          throw new Error(`Failed to fetch exercises for equipment: ${params.equipment}`);
        }
      }
      else if (params?.target) {
        console.log(`Fetching ExerciseDB with target filter: ${params.target} and limit: ${maxLimit}`);
        
        try {
          results = await fetchFromExerciseDB(`/target/${encodeURIComponent(params.target)}?limit=${maxLimit}`);
          console.log(`Got ${results.length} exercises for target: ${params.target}`);
        } catch (error) {
          console.error(`Error fetching by target:`, error);
          throw new Error(`Failed to fetch exercises for target: ${params.target}`);
        }
      }
      else if (params?.name) {
        console.log(`Fetching ExerciseDB with name filter: ${params.name} and limit: ${maxLimit}`);
        
        try {
          results = await fetchFromExerciseDB(`/name/${encodeURIComponent(params.name)}?limit=${maxLimit}`);
          console.log(`Got ${results.length} exercises for name: ${params.name}`);
        } catch (error) {
          console.error(`Error fetching by name:`, error);
          throw new Error(`Failed to fetch exercises for name: ${params.name}`);
        }
      }
      else {
        // Fetch all exercises with maximum limit
        console.log(`Fetching all exercises from ExerciseDB with limit: ${maxLimit}`);
        try {
          results = await fetchFromExerciseDB(`?limit=${maxLimit}`, `/all`);
          console.log(`Successfully fetched ${results.length} exercises from ExerciseDB`);
        } catch (error) {
          console.error("Error fetching from ExerciseDB:", error);
          setError("Failed to fetch exercises. Please try again.");
          setExercises([]);
          setLoading(false);
          return;
        }
      }

      // Apply search filter if specified
      if (params?.search) {
        results = results.filter(exercise => 
          exercise.name.toLowerCase().includes(params.search!.toLowerCase())
        );
      }

      console.log(`ExerciseDB returned ${results.length} exercises`);

      // Map ExerciseDB data to our Exercise type
      const transformedExercises = results.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        bodyPart: exercise.bodyPart,
        target: exercise.target,
        equipment: Array.isArray(exercise.equipment) ? exercise.equipment[0] : exercise.equipment,
        gifUrl: exercise.gifUrl,
        imageUrl: exercise.imageUrl,
        videoUrl: exercise.videoUrl,
        instructions: exercise.instructions || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        overview: exercise.overview,
        exerciseTips: exercise.exerciseTips || [],
        variations: exercise.variations || [],
        keywords: exercise.keywords || [],
        exerciseType: exercise.exerciseType,
        source: 'exercisedb' as const
      }));

      setExercises(transformedExercises);
    } catch (err) {
      console.error('Error fetching from ExerciseDB:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch exercises whenever filter params change
  useEffect(() => {
    fetchExercises();
  }, [
    params?.bodyPart,
    params?.equipment,
    params?.target,
    params?.name,
    params?.search
  ]);

  return { 
    exercises, 
    loading, 
    error, 
    isMissingApiKey,
    refetch: fetchExercises 
  };
};

// Get available body parts from ExerciseDB
export const useBodyParts = () => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBodyParts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Skip if no API key
      if (!EXERCISE_DB_API_KEY) {
        setBodyParts([]);
        return;
      }

      const data = await fetchBodyPartListFromAPI();
      setBodyParts(data);
    } catch (err) {
      console.error('Error fetching body parts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBodyParts();
  }, []);

  return { bodyParts, loading, error, refetch: fetchBodyParts };
};

// Get equipment options from ExerciseDB
export const useEquipment = () => {
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Skip if no API key
      if (!EXERCISE_DB_API_KEY) {
        setEquipment([]);
        return;
      }

      const data = await fetchEquipmentListFromAPI();
      setEquipment(data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return { equipment, loading, error, refetch: fetchEquipment };
};

// Get target muscles from ExerciseDB
export const useTargets = () => {
  const [targets, setTargets] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Skip if no API key
      if (!EXERCISE_DB_API_KEY) {
        setTargets([]);
        return;
      }

      const data = await fetchTargetListFromAPI();
      setTargets(data);
    } catch (err) {
      console.error('Error fetching target muscles:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  return { targets, loading, error, refetch: fetchTargets };
}; 