import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { 
  EXERCISE_DB_API_URL, 
  getExerciseDBHeaders,
  EXERCISE_DB_API_KEY
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
  gifUrl: string;
  instructions?: string[];
  secondaryMuscles?: string[];
}

export const useCombinedExercises = (params?: FetchExercisesParams) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissingApiKey, setIsMissingApiKey] = useState<boolean>(false);

  const fetchExerciseDB = async (): Promise<Exercise[]> => {
    // Check if API key is available
    if (!EXERCISE_DB_API_KEY) {
      setIsMissingApiKey(true);
      return [];
    }

    try {
      let results: ExerciseDBExercise[] = [];
      
      // If we have filters, use the appropriate endpoints
      if (params?.bodyPart && params?.equipment) {
        // First fetch by bodyPart (usually fewer results than equipment)
        const endpoint = `${EXERCISE_DB_API_URL}/bodyPart/${params.bodyPart}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        const data: ExerciseDBExercise[] = await response.json();
        
        // Filter the results to match the equipment filter
        results = data.filter(exercise => 
          exercise.equipment.toLowerCase() === params.equipment?.toLowerCase()
        );
      }
      // Otherwise use the API's built-in filtering by single criterion
      else if (params?.bodyPart) {
        const endpoint = `${EXERCISE_DB_API_URL}/bodyPart/${params.bodyPart}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
      } 
      else if (params?.equipment) {
        const endpoint = `${EXERCISE_DB_API_URL}/equipment/${params.equipment}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
      }
      else if (params?.target) {
        const endpoint = `${EXERCISE_DB_API_URL}/target/${params.target}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
      }
      else if (params?.name) {
        const endpoint = `${EXERCISE_DB_API_URL}/name/${params.name}`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
      }
      else {
        // Fetch all exercises - explicitly use the /all endpoint
        const endpoint = `${EXERCISE_DB_API_URL}/all`;
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getExerciseDBHeaders()
          });

          if (!response.ok) {
            throw new Error(`ExerciseDB API error: ${response.status}`);
          }

          results = await response.json();
        } catch (error) {
          console.error("Error fetching from ExerciseDB /all endpoint:", error);
          // Fall back to regular endpoint if /all fails
          const fallbackResponse = await fetch(EXERCISE_DB_API_URL, {
            method: 'GET',
            headers: getExerciseDBHeaders()
          });

          if (!fallbackResponse.ok) {
            throw new Error(`ExerciseDB fallback API error: ${fallbackResponse.status}`);
          }

          results = await fallbackResponse.json();
        }
      }

      // Apply search filter if specified
      if (params?.name && (params?.bodyPart || params?.equipment || params?.target)) {
        results = results.filter(exercise => 
          exercise.name.toLowerCase().includes(params.name!.toLowerCase())
        );
      }

      // Map ExerciseDB data to our Exercise type
      return results.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        bodyPart: exercise.bodyPart,
        target: exercise.target,
        equipment: exercise.equipment,
        gifUrl: exercise.gifUrl,
        instructions: exercise.instructions || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        source: 'exercisedb'
      } as Exercise));
    } catch (err) {
      console.error('Error fetching from ExerciseDB:', err);
      return [];
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);

    try {
      const exerciseDBResults = await fetchExerciseDB();
      setExercises(exerciseDBResults);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    params?.name
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
export const useCombinedBodyParts = () => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBodyParts = async () => {
    setLoading(true);
    setError(null);

    try {
      const exerciseDBBodyParts = await fetchExerciseDBBodyParts();
      setBodyParts(exerciseDBBodyParts.sort());
    } catch (err) {
      console.error('Error fetching body parts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseDBBodyParts = async (): Promise<string[]> => {
    try {
      // Skip if no API key
      if (!EXERCISE_DB_API_KEY) {
        return [];
      }

      const response = await fetch(`${EXERCISE_DB_API_URL}/bodyPartList`, {
        method: 'GET',
        headers: getExerciseDBHeaders()
      });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching ExerciseDB body parts:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchBodyParts();
  }, []);

  return { bodyParts, loading, error, refetch: fetchBodyParts };
};

// Get equipment options from ExerciseDB
export const useCombinedEquipment = () => {
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const exerciseDBEquipment = await fetchExerciseDBEquipment();
      setEquipment(exerciseDBEquipment.sort());
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseDBEquipment = async (): Promise<string[]> => {
    try {
      // Skip if no API key
      if (!EXERCISE_DB_API_KEY) {
        return [];
      }

      const response = await fetch(`${EXERCISE_DB_API_URL}/equipmentList`, {
        method: 'GET',
        headers: getExerciseDBHeaders()
      });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching ExerciseDB equipment:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return { equipment, loading, error, refetch: fetchEquipment };
}; 