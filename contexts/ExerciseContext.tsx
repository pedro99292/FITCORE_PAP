import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { Exercise } from '@/types/exercise';
import { getExercisesWithFallback, preloadExercises } from '@/utils/exerciseCaching';
import { 
  fetchBodyPartListFromAPI, 
  fetchEquipmentListFromAPI, 
  fetchTargetListFromAPI,
  EXERCISE_DB_API_KEY 
} from '@/utils/apiConfig';

interface ExerciseContextType {
  // Exercise data
  exercises: Exercise[];
  bodyParts: string[];
  equipment: string[];
  targets: string[];
  
  // Loading states
  exercisesLoading: boolean;
  metadataLoading: boolean;
  
  // Error states
  exercisesError: string | null;
  metadataError: string | null;
  isMissingApiKey: boolean;
  
  // Methods
  refetchExercises: () => Promise<void>;
  refetchMetadata: () => Promise<void>;
  
  // Filtered exercise methods (client-side filtering)
  getFilteredExercises: (filters: {
    bodyPart?: string;
    equipment?: string;
    target?: string;
    search?: string;
  }) => Exercise[];
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const useExerciseContext = () => {
  const context = useContext(ExerciseContext);
  if (context === undefined) {
    throw new Error('useExerciseContext must be used within an ExerciseProvider');
  }
  return context;
};

interface ExerciseProviderProps {
  children: ReactNode;
}

export const ExerciseProvider: React.FC<ExerciseProviderProps> = ({ children }) => {
  // Exercise data state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  
  // Loading states
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  // Error states
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [isMissingApiKey, setIsMissingApiKey] = useState(false);

  // Fetch exercises using cached approach
  const fetchExercises = async () => {
    try {
      setExercisesLoading(true);
      setExercisesError(null);
      
      if (!EXERCISE_DB_API_KEY) {
        setIsMissingApiKey(true);
        setExercises([]);
        return;
      }
      
      const exerciseData = await getExercisesWithFallback();
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercisesError(error instanceof Error ? error.message : 'Failed to fetch exercises');
    } finally {
      setExercisesLoading(false);
    }
  };

  // Fetch metadata (body parts, equipment, targets) once
  const fetchMetadata = async () => {
    try {
      setMetadataLoading(true);
      setMetadataError(null);
      
      if (!EXERCISE_DB_API_KEY) {
        setIsMissingApiKey(true);
        return;
      }

      // Check if metadata is cached in AsyncStorage
      const cachedBodyParts = await AsyncStorage.getItem('cached_body_parts');
      const cachedEquipment = await AsyncStorage.getItem('cached_equipment');
      const cachedTargets = await AsyncStorage.getItem('cached_targets');
      
      if (cachedBodyParts && cachedEquipment && cachedTargets) {
        setBodyParts(JSON.parse(cachedBodyParts));
        setEquipment(JSON.parse(cachedEquipment));
        setTargets(JSON.parse(cachedTargets));
        return;
      }

      // Fetch metadata from Supabase if not cached
      const [bodyPartsResponse, equipmentResponse, targetsResponse] = await Promise.all([
        supabase.from('exercises').select('bodypart').neq('bodypart', null),
        supabase.from('exercises').select('equipment').neq('equipment', null),
        supabase.from('exercises').select('target').neq('target', null),
      ]);

      const bodyPartsData = [...new Set(bodyPartsResponse.data?.map(item => item.bodypart) || [])].sort();
      const equipmentData = [...new Set(equipmentResponse.data?.map(item => item.equipment) || [])].sort();
      const targetsData = [...new Set(targetsResponse.data?.map(item => item.target) || [])].sort();

      setBodyParts(bodyPartsData);
      setEquipment(equipmentData);
      setTargets(targetsData);
      
      // Cache metadata for future use
      await AsyncStorage.setItem('cached_body_parts', JSON.stringify(bodyPartsData));
      await AsyncStorage.setItem('cached_equipment', JSON.stringify(equipmentData));
      await AsyncStorage.setItem('cached_targets', JSON.stringify(targetsData));
      
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setMetadataError(error instanceof Error ? error.message : 'Failed to fetch metadata');
    } finally {
      setMetadataLoading(false);
    }
  };

  // Client-side filtering function
  const getFilteredExercises = (filters: {
    bodyPart?: string;
    equipment?: string;
    target?: string;
    search?: string;
  }) => {
    let filtered = exercises;

    if (filters.bodyPart) {
      filtered = filtered.filter(ex => 
        ex.bodyPart.toLowerCase().includes(filters.bodyPart!.toLowerCase())
      );
    }

    if (filters.equipment) {
      filtered = filtered.filter(ex => 
        ex.equipment.toLowerCase().includes(filters.equipment!.toLowerCase())
      );
    }

    if (filters.target) {
      filtered = filtered.filter(ex => 
        ex.target.toLowerCase().includes(filters.target!.toLowerCase())
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm) ||
        ex.target.toLowerCase().includes(searchTerm) ||
        ex.bodyPart.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  // Initialize data on mount
  useEffect(() => {
    fetchExercises();
    fetchMetadata();
  }, []);

  const contextValue: ExerciseContextType = {
    exercises,
    bodyParts,
    equipment,
    targets,
    exercisesLoading,
    metadataLoading,
    exercisesError,
    metadataError,
    isMissingApiKey,
    refetchExercises: fetchExercises,
    refetchMetadata: fetchMetadata,
    getFilteredExercises
  };

  return (
    <ExerciseContext.Provider value={contextValue}>
      {children}
    </ExerciseContext.Provider>
  );
}; 