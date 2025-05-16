import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';
import { 
  EXERCISE_DB_API_URL, 
  WGER_API_BASE_URL, 
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

// wger Exercise structure interface
interface WgerExercise {
  id: number;
  uuid: string;
  name?: string;
  category: number | { id: number; name: string };
  muscles: Array<number | { id: number; name: string; name_en: string; image_url_main: string }>;
  muscles_secondary: Array<number | { id: number; name: string; name_en: string }>;
  equipment: Array<number | { id: number; name: string }>;
  variations: number | null;
  images?: any[];
  translations?: any[];
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
      let shouldFetchAll = !params?.bodyPart && !params?.equipment && !params?.target && !params?.name;
      
      // If we have filters, use the appropriate endpoints
      if (params?.bodyPart && params?.equipment) {
        // First fetch by bodyPart (usually fewer results than equipment)
        const endpoint = `${EXERCISE_DB_API_URL}/bodyPart/${params.bodyPart}`;
        console.log(`Fetching ExerciseDB with bodyPart filter: ${params.bodyPart}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        const data: ExerciseDBExercise[] = await response.json();
        console.log(`Got ${data.length} exercises for bodyPart: ${params.bodyPart}`);
        
        // Filter the results to match the equipment filter
        results = data.filter(exercise => 
          exercise.equipment.toLowerCase() === params.equipment?.toLowerCase()
        );
        console.log(`After equipment filter (${params.equipment}), ${results.length} exercises remain`);
      }
      // Otherwise use the API's built-in filtering by single criterion
      else if (params?.bodyPart) {
        const endpoint = `${EXERCISE_DB_API_URL}/bodyPart/${params.bodyPart}`;
        console.log(`Fetching ExerciseDB with bodyPart filter: ${params.bodyPart}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
        console.log(`Got ${results.length} exercises for bodyPart: ${params.bodyPart}`);
      } 
      else if (params?.equipment) {
        const endpoint = `${EXERCISE_DB_API_URL}/equipment/${params.equipment}`;
        console.log(`Fetching ExerciseDB with equipment filter: ${params.equipment}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
        console.log(`Got ${results.length} exercises for equipment: ${params.equipment}`);
      }
      else if (params?.target) {
        const endpoint = `${EXERCISE_DB_API_URL}/target/${params.target}`;
        console.log(`Fetching ExerciseDB with target filter: ${params.target}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
        console.log(`Got ${results.length} exercises for target: ${params.target}`);
      }
      else if (params?.name) {
        const endpoint = `${EXERCISE_DB_API_URL}/name/${params.name}`;
        console.log(`Fetching ExerciseDB with name filter: ${params.name}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getExerciseDBHeaders()
        });

        if (!response.ok) {
          throw new Error(`ExerciseDB API error: ${response.status}`);
        }

        results = await response.json();
        console.log(`Got ${results.length} exercises for name: ${params.name}`);
      }
      else {
        // Fetch all exercises - explicitly use the /all endpoint
        console.log("Fetching all exercises from ExerciseDB using /all endpoint");
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
          console.log(`Successfully fetched ${results.length} exercises from ExerciseDB`);
        } catch (error) {
          console.error("Error fetching from ExerciseDB /all endpoint:", error);
          // Fall back to regular endpoint if /all fails
          console.log("Falling back to regular endpoint");
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

      console.log(`ExerciseDB returned ${results.length} exercises`);

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
        source: 'exercisedb' // Tag the source
      } as Exercise));
    } catch (err) {
      console.error('Error fetching from ExerciseDB:', err);
      return [];
    }
  };

  const fetchWgerExercises = async (): Promise<Exercise[]> => {
    try {
      let allExercises: any[] = [];
      let nextUrl = `${WGER_API_BASE_URL}/exerciseinfo/?language=2&limit=100`;
      
      // Fetch all pages using pagination
      while (nextUrl) {
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Wger exercises: ${response.status}`);
        }
        
        const data = await response.json();
        allExercises = [...allExercises, ...data.results];
        
        // Get the next page URL, if any
        nextUrl = data.next;
      }
      
      console.log(`Fetched ${allExercises.length} total exercises from Wger before filtering`);
      
      // Transform wger exercises to our Exercise type
      let transformedExercises: Exercise[] = allExercises.map(wgerExercise => {
        // Get the English translation
        const translation = wgerExercise.translations?.find((t: any) => t.language === 2);
        
        // Get category name
        let categoryName = 'Unknown';
        if (typeof wgerExercise.category === 'object' && wgerExercise.category?.name) {
          categoryName = wgerExercise.category.name;
        }
        
        // Get primary muscle (target)
        let primaryMuscle = categoryName;
        if (wgerExercise.muscles && wgerExercise.muscles.length > 0) {
          const muscle = wgerExercise.muscles[0];
          if (typeof muscle === 'object') {
            primaryMuscle = muscle.name_en || muscle.name || categoryName;
          }
        }
        
        // Get equipment name
        let equipmentName = 'bodyweight';
        if (wgerExercise.equipment && wgerExercise.equipment.length > 0) {
          const equipment = wgerExercise.equipment[0];
          if (typeof equipment === 'object') {
            equipmentName = equipment.name.toLowerCase();
          }
        }
        
        // Get exercise image if available
        let exerciseImageUrl = null;
        if (wgerExercise.images && wgerExercise.images.length > 0) {
          // Find the main image
          const mainImage = wgerExercise.images.find((img: any) => img.is_main);
          if (mainImage) {
            exerciseImageUrl = mainImage.image;
          } else if (wgerExercise.images[0]) {
            exerciseImageUrl = wgerExercise.images[0].image;
          }
        }

        // Get muscle image URL as fallback
        let muscleImageUrl = 'https://wger.de/static/images/muscles/main/muscle-1.svg';
        if (wgerExercise.muscles && wgerExercise.muscles.length > 0) {
          const muscle = wgerExercise.muscles[0];
          if (typeof muscle === 'object' && muscle.image_url_main) {
            muscleImageUrl = `https://wger.de${muscle.image_url_main}`;
          }
        }
        
        return {
          id: wgerExercise.uuid,
          name: translation ? translation.name : `Exercise ${wgerExercise.id}`,
          bodyPart: categoryName.toLowerCase(),
          target: primaryMuscle.toLowerCase(),
          equipment: equipmentName.toLowerCase(),
          gifUrl: exerciseImageUrl || muscleImageUrl,
          instructions: translation && translation.description ? [translation.description] : [],
          source: 'wger' // Tag the source
        } as Exercise;
      });
      
      console.log(`Transformed ${transformedExercises.length} Wger exercises`);
      
      // Apply combined filters with proper AND logic
      if (params) {
        let originalCount = transformedExercises.length;
        
        if (params.bodyPart && params.equipment) {
          // Both filters must match (AND condition)
          console.log(`Applying combined filter - bodyPart: ${params.bodyPart}, equipment: ${params.equipment}`);
          transformedExercises = transformedExercises.filter(ex => 
            ex.bodyPart.includes(params.bodyPart!.toLowerCase()) &&
            ex.equipment.includes(params.equipment!.toLowerCase())
          );
        } else {
          // Apply individual filters if specified
          if (params.bodyPart) {
            const bodyPartLower = params.bodyPart.toLowerCase();
            console.log(`Filtering Wger exercises by bodyPart: ${bodyPartLower}`);
            transformedExercises = transformedExercises.filter(ex => 
              ex.bodyPart.includes(bodyPartLower)
            );
            console.log(`After bodyPart filter: ${transformedExercises.length} exercises (from ${originalCount})`);
          }
          
          if (params.equipment) {
            const equipmentLower = params.equipment.toLowerCase();
            console.log(`Filtering Wger exercises by equipment: ${equipmentLower}`);
            const beforeCount = transformedExercises.length;
            transformedExercises = transformedExercises.filter(ex => 
              ex.equipment.includes(equipmentLower)
            );
            console.log(`After equipment filter: ${transformedExercises.length} exercises (from ${beforeCount})`);
          }
          
          if (params.target) {
            const targetLower = params.target.toLowerCase();
            console.log(`Filtering Wger exercises by target: ${targetLower}`);
            const beforeCount = transformedExercises.length;
            transformedExercises = transformedExercises.filter(ex => 
              ex.target.includes(targetLower)
            );
            console.log(`After target filter: ${transformedExercises.length} exercises (from ${beforeCount})`);
          }
        }
        
        // Apply search filter if specified
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          console.log(`Filtering Wger exercises by search: ${searchLower}`);
          const beforeCount = transformedExercises.length;
          transformedExercises = transformedExercises.filter(ex => 
            ex.name.toLowerCase().includes(searchLower)
          );
          console.log(`After search filter: ${transformedExercises.length} exercises (from ${beforeCount})`);
        }
        // Also support name parameter as search
        else if (params.name) {
          const searchLower = params.name.toLowerCase();
          console.log(`Filtering Wger exercises by name: ${searchLower}`);
          const beforeCount = transformedExercises.length;
          transformedExercises = transformedExercises.filter(ex => 
            ex.name.toLowerCase().includes(searchLower)
          );
          console.log(`After name filter: ${transformedExercises.length} exercises (from ${beforeCount})`);
        }
      }
      
      console.log(`Returning ${transformedExercises.length} filtered Wger exercises`);
      return transformedExercises;
    } catch (err) {
      console.error('Error fetching from Wger:', err);
      return [];
    }
  };

  const fetchCombinedExercises = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from both sources in parallel
      console.log("Starting to fetch exercises from both sources...");
      const [exerciseDBResults, wgerResults] = await Promise.all([
        fetchExerciseDB(),
        fetchWgerExercises()
      ]);

      console.log(`Fetched ${exerciseDBResults.length} exercises from ExerciseDB`);
      console.log(`Fetched ${wgerResults.length} exercises from Wger`);

      // Combine both datasets, prioritizing ExerciseDB
      // Create a Map to avoid duplicates (by exercise name)
      const exerciseMap = new Map<string, Exercise>();
      
      // Add ExerciseDB exercises first (priority)
      exerciseDBResults.forEach(exercise => {
        const key = exercise.name.toLowerCase();
        exerciseMap.set(key, exercise);
      });
      
      // Only add Wger exercises if they have unique names
      let wgerAdded = 0;
      wgerResults.forEach(exercise => {
        const key = exercise.name.toLowerCase();
        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, exercise);
          wgerAdded++;
        }
      });
      
      // Convert map to array
      const combinedExercises = Array.from(exerciseMap.values());
      
      console.log(`Added ${exerciseDBResults.length} ExerciseDB exercises`);
      console.log(`Added ${wgerAdded} unique Wger exercises (out of ${wgerResults.length} total)`);
      console.log(`Combined into ${combinedExercises.length} total unique exercises`);
      
      setExercises(combinedExercises);
    } catch (err) {
      console.error('Error fetching combined exercises:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch exercises whenever filter params change
  useEffect(() => {
    fetchCombinedExercises();
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
    refetch: fetchCombinedExercises 
  };
};

// Get available body parts from both APIs
export const useCombinedBodyParts = () => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBodyParts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from both APIs in parallel
      const [exerciseDBBodyParts, wgerBodyParts] = await Promise.all([
        fetchExerciseDBBodyParts(),
        fetchWgerBodyParts()
      ]);

      // Combine and deduplicate
      const combinedBodyParts = [...new Set([...exerciseDBBodyParts, ...wgerBodyParts])].sort();
      setBodyParts(combinedBodyParts);
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

  const fetchWgerBodyParts = async (): Promise<string[]> => {
    try {
      let allCategories: any[] = [];
      let nextUrl = `${WGER_API_BASE_URL}/exercisecategory/`;
      
      // Fetch all pages using pagination
      while (nextUrl) {
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          return [];
        }
        
        const data = await response.json();
        allCategories = [...allCategories, ...data.results];
        
        // Get next page URL, if any
        nextUrl = data.next;
      }
      
      return allCategories.map((category: any) => category.name.toLowerCase());
    } catch (err) {
      console.error('Error fetching Wger body parts:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchBodyParts();
  }, []);

  return { bodyParts, loading, error, refetch: fetchBodyParts };
};

// Get equipment options from both APIs
export const useCombinedEquipment = () => {
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from both APIs in parallel
      const [exerciseDBEquipment, wgerEquipment] = await Promise.all([
        fetchExerciseDBEquipment(),
        fetchWgerEquipment()
      ]);

      // Combine and deduplicate
      const combinedEquipment = [...new Set([...exerciseDBEquipment, ...wgerEquipment])].sort();
      setEquipment(combinedEquipment);
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

  const fetchWgerEquipment = async (): Promise<string[]> => {
    try {
      let allEquipment: any[] = [];
      let nextUrl = `${WGER_API_BASE_URL}/equipment/`;
      
      // Fetch all pages using pagination
      while (nextUrl) {
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          return [];
        }
        
        const data = await response.json();
        allEquipment = [...allEquipment, ...data.results];
        
        // Get next page URL, if any
        nextUrl = data.next;
      }
      
      const equipmentList = allEquipment.map((item: any) => item.name.toLowerCase());
      
      // Add bodyweight as an option if not already included
      if (!equipmentList.includes('bodyweight')) {
        equipmentList.push('bodyweight');
      }
      
      return equipmentList;
    } catch (err) {
      console.error('Error fetching Wger equipment:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  return { equipment, loading, error, refetch: fetchEquipment };
}; 