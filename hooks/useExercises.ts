import { useState, useEffect } from 'react';
import { Exercise } from '@/types/exercise';

// wger API base URL
const WGER_API_BASE_URL = 'https://wger.de/api/v2';

type FetchExercisesParams = {
  bodyPart?: string;
  equipment?: string;
  target?: string;
  name?: string;
};

// Interface for wger API response
interface WgerExerciseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WgerExercise[];
}

// Interface for wger Exercise structure
interface WgerExercise {
  id: number;
  uuid: string;
  name?: string; // Will be fetched from translation
  category: number;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
  variations: number | null;
  license_author: string;
  created?: string;
  last_update?: string;
  images?: any[]; // Assuming the images property is optional
}

// Translation interface from wger API
interface WgerTranslation {
  id: number;
  name: string;
  exercise: number;
  description: string;
  language: number;
}

export const useExercises = (params?: FetchExercisesParams) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the exerciseinfo endpoint instead of exercise endpoint
      // This includes translations and more complete data
      let endpoint = `${WGER_API_BASE_URL}/exerciseinfo/?language=2&limit=100`; // Language 2 is English, increased limit to 100
      
      // Build filtering based on params
      if (params) {
        if (params.name) {
          endpoint += `&term=${encodeURIComponent(params.name)}`;
        }
        
        // Map equipment and bodyPart to the appropriate filter if possible
        // This would require mapping the user-facing terms to wger's numerical IDs
        // For now, we'll handle filtering on the client side
      }
      
      console.log('Fetching exercises from:', endpoint);
      
      let allExercises: any[] = [];
      let nextPage = endpoint;
      
      // Fetch all pages of results
      while (nextPage) {
        const response = await fetch(nextPage);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        allExercises = [...allExercises, ...data.results];
        nextPage = data.next || '';
      }
      
      console.log(`Received ${allExercises.length} exercises from API`);
      
      // Transform wger exercises to our Exercise type
      const transformedExercises: Exercise[] = allExercises.map(wgerExercise => {
        // Get the English translation (language=2)
        const translation = wgerExercise.translations.find((t: any) => t.language === 2);
        
        // Get category name
        const categoryName = wgerExercise.category ? wgerExercise.category.name : 'Unknown';
        
        // Get primary muscle (target)
        const primaryMuscle = wgerExercise.muscles.length > 0 
          ? wgerExercise.muscles[0].name_en || wgerExercise.muscles[0].name 
          : categoryName;
        
        // Get equipment name
        const equipmentName = wgerExercise.equipment.length > 0
          ? wgerExercise.equipment[0].name.toLowerCase()
          : 'bodyweight';
        
        // Get exercise image if available
        let exerciseImageUrl = null;
        if (wgerExercise.images && wgerExercise.images.length > 0) {
          // Find the main image
          const mainImage = wgerExercise.images.find((img: any) => img.is_main);
          if (mainImage) {
            exerciseImageUrl = mainImage.image;
          } else if (wgerExercise.images[0]) {
            // Use the first image if no main image is marked
            exerciseImageUrl = wgerExercise.images[0].image;
          }
        }

        // Get muscle image URL as fallback
        const muscleImageUrl = wgerExercise.muscles.length > 0 
          ? `https://wger.de${wgerExercise.muscles[0].image_url_main}` 
          : 'https://wger.de/static/images/muscles/main/muscle-1.svg';
        
        return {
          id: wgerExercise.uuid,
          name: translation ? translation.name : `Exercise ${wgerExercise.id}`,
          bodyPart: categoryName.toLowerCase(),
          target: primaryMuscle.toLowerCase(),
          equipment: equipmentName.toLowerCase(),
          gifUrl: exerciseImageUrl || muscleImageUrl,
          instructions: translation && translation.description ? [translation.description] : []
        };
      });
      
      // Apply client-side filtering if needed
      let filteredExercises = transformedExercises;
      
      if (params) {
        if (params.bodyPart) {
          const bodyPartLower = params.bodyPart.toLowerCase();
          filteredExercises = filteredExercises.filter(ex => 
            ex.bodyPart.includes(bodyPartLower)
          );
        }
        
        if (params.target) {
          const targetLower = params.target.toLowerCase();
          filteredExercises = filteredExercises.filter(ex => 
            ex.target.includes(targetLower)
          );
        }
        
        if (params.equipment) {
          const equipmentLower = params.equipment.toLowerCase();
          filteredExercises = filteredExercises.filter(ex => 
            ex.equipment.includes(equipmentLower)
          );
        }
      }
      
      console.log(`Filtered to ${filteredExercises.length} exercises`);
      setExercises(filteredExercises);
      
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setExercises([]); // Reset exercises on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch exercises whenever filter params change
  useEffect(() => {
    console.log('Filter params changed, fetching exercises...');
    fetchExercises();
  }, [
    params?.bodyPart,
    params?.equipment,
    params?.target,
    params?.name
  ]);

  return { exercises, loading, error, refetch: fetchExercises };
};

// Get available body parts from wger API
export const useBodyParts = () => {
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBodyParts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${WGER_API_BASE_URL}/exercisecategory/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch body parts: ${response.status}`);
      }

      const data = await response.json();
      const categories = data.results.map((category: any) => category.name.toLowerCase());
      setBodyParts(categories);
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

// Get available equipment from wger API
export const useEquipment = () => {
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${WGER_API_BASE_URL}/equipment/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch equipment: ${response.status}`);
      }

      const data = await response.json();
      const equipmentList = data.results.map((item: any) => item.name.toLowerCase());
      // Add bodyweight as an option
      if (!equipmentList.includes('bodyweight')) {
        equipmentList.push('bodyweight');
      }
      setEquipment(equipmentList);
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

// Get a single exercise by ID from wger API
export const useExercise = (id: string) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercise = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get detailed exercise info including translations
      const response = await fetch(`${WGER_API_BASE_URL}/exerciseinfo/${id}/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercise: ${response.status}`);
      }

      const wgerExercise = await response.json();
      
      // Get the English translation (language=2)
      const translation = wgerExercise.translations.find((t: any) => t.language === 2);
      
      // Get category name
      const categoryName = wgerExercise.category ? wgerExercise.category.name : 'Unknown';
      
      // Get primary muscle (target)
      const primaryMuscle = wgerExercise.muscles.length > 0 
        ? wgerExercise.muscles[0].name_en || wgerExercise.muscles[0].name 
        : categoryName;
      
      // Get equipment name
      const equipmentName = wgerExercise.equipment.length > 0
        ? wgerExercise.equipment[0].name.toLowerCase()
        : 'bodyweight';
      
      // Get exercise image if available
      let exerciseImageUrl = null;
      if (wgerExercise.images && wgerExercise.images.length > 0) {
        // Find the main image
        const mainImage = wgerExercise.images.find((img: any) => img.is_main);
        if (mainImage) {
          exerciseImageUrl = mainImage.image;
        } else if (wgerExercise.images[0]) {
          // Use the first image if no main image is marked
          exerciseImageUrl = wgerExercise.images[0].image;
        }
      }

      // Get muscle image URL as fallback
      const muscleImageUrl = wgerExercise.muscles.length > 0 
        ? `https://wger.de${wgerExercise.muscles[0].image_url_main}` 
        : 'https://wger.de/static/images/muscles/main/muscle-1.svg';
      
      const transformedExercise: Exercise = {
        id: wgerExercise.uuid,
        name: translation ? translation.name : `Exercise ${wgerExercise.id}`,
        bodyPart: categoryName.toLowerCase(),
        target: primaryMuscle.toLowerCase(),
        equipment: equipmentName.toLowerCase(),
        gifUrl: exerciseImageUrl || muscleImageUrl,
        instructions: translation && translation.description ? [translation.description] : []
      };
      
      setExercise(transformedExercise);
    } catch (err) {
      console.error(`Error fetching exercise with ID ${id}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExercise();
    }
  }, [id]);

  return { exercise, loading, error, refetch: fetchExercise };
}; 