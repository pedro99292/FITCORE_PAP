import { useMemo } from 'react';
import { useExerciseContext } from '@/contexts/ExerciseContext';
import { Exercise } from '@/types/exercise';

export interface ExerciseFilters {
  bodyPart?: string;
  equipment?: string;
  target?: string;
  search?: string;
}

/**
 * Optimized hook for getting exercises with client-side filtering
 * Replaces useExerciseDB, useExercises, and useCombinedExercises
 */
export const useOptimizedExercises = (filters: ExerciseFilters = {}) => {
  const {
    exercises,
    exercisesLoading,
    exercisesError,
    isMissingApiKey,
    refetchExercises,
    getFilteredExercises
  } = useExerciseContext();

  // Memoize filtered results to avoid recomputation on every render
  const filteredExercises = useMemo(() => {
    return getFilteredExercises(filters);
  }, [exercises, filters.bodyPart, filters.equipment, filters.target, filters.search]);

  return {
    exercises: filteredExercises,
    loading: exercisesLoading,
    error: exercisesError,
    isMissingApiKey,
    refetch: refetchExercises
  };
};

/**
 * Optimized hook for getting body parts (no API calls)
 */
export const useOptimizedBodyParts = () => {
  const {
    bodyParts,
    metadataLoading,
    metadataError,
    refetchMetadata
  } = useExerciseContext();

  return {
    bodyParts,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata
  };
};

/**
 * Optimized hook for getting equipment (no API calls)
 */
export const useOptimizedEquipment = () => {
  const {
    equipment,
    metadataLoading,
    metadataError,
    refetchMetadata
  } = useExerciseContext();

  return {
    equipment,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata
  };
};

/**
 * Optimized hook for getting target muscles (no API calls)
 */
export const useOptimizedTargets = () => {
  const {
    targets,
    metadataLoading,
    metadataError,
    refetchMetadata
  } = useExerciseContext();

  return {
    targets,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata
  };
};

/**
 * Hook for searching exercises with advanced filtering
 */
export const useExerciseSearch = (searchQuery: string, additionalFilters: Omit<ExerciseFilters, 'search'> = {}) => {
  const { exercises, exercisesLoading, exercisesError, getFilteredExercises } = useExerciseContext();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return getFilteredExercises(additionalFilters);
    }

    const filters = {
      ...additionalFilters,
      search: searchQuery
    };

    return getFilteredExercises(filters);
  }, [exercises, searchQuery, additionalFilters.bodyPart, additionalFilters.equipment, additionalFilters.target]);

  return {
    exercises: searchResults,
    loading: exercisesLoading,
    error: exercisesError
  };
};

/**
 * Hook for getting a single exercise by ID (no API calls)
 */
export const useExerciseById = (exerciseId: string) => {
  const { exercises, exercisesLoading, exercisesError } = useExerciseContext();

  const exercise = useMemo(() => {
    return exercises.find(ex => ex.id === exerciseId) || null;
  }, [exercises, exerciseId]);

  return {
    exercise,
    loading: exercisesLoading,
    error: exercisesError
  };
}; 