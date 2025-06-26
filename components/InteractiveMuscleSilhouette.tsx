import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define muscle groups and their default states
export interface MuscleState {
  id: string;
  name: string;
  color: string;
  intensity: number; // 0-1 scale for workout intensity/fatigue
  isHighlighted: boolean;
  isSelected: boolean;
}

export interface MuscleGroup {
  id: string;
  name: string;
  pathData: string; // SVG path data - you'll replace these with your actual converted paths
  region: 'upper' | 'lower' | 'core';
}

// Default muscle states
const defaultMuscleStates: Record<string, MuscleState> = {
  chest: { id: 'chest', name: 'Chest', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  shoulders: { id: 'shoulders', name: 'Shoulders', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  biceps: { id: 'biceps', name: 'Biceps', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  triceps: { id: 'triceps', name: 'Triceps', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  forearms: { id: 'forearms', name: 'Forearms', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  abs: { id: 'abs', name: 'Abs', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  obliques: { id: 'obliques', name: 'Obliques', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  lats: { id: 'lats', name: 'Lats', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  traps: { id: 'traps', name: 'Traps', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  quads: { id: 'quads', name: 'Quads', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  hamstrings: { id: 'hamstrings', name: 'Hamstrings', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  glutes: { id: 'glutes', name: 'Glutes', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
  calves: { id: 'calves', name: 'Calves', color: '#e0e0e0', intensity: 0, isHighlighted: false, isSelected: false },
};

// Placeholder SVG paths - you'll replace these with your actual converted muscle paths
const frontMuscleGroups: MuscleGroup[] = [
  {
    id: 'chest',
    name: 'Chest',
    pathData: 'M150,200 C160,180 180,185 190,200 L190,240 C180,250 160,245 150,240 Z', // Placeholder
    region: 'upper'
  },
  {
    id: 'abs',
    name: 'Abs',
    pathData: 'M160,250 L180,250 L180,320 L160,320 Z', // Placeholder
    region: 'core'
  },
  // Add more muscle groups here after conversion
];

const backMuscleGroups: MuscleGroup[] = [
  {
    id: 'lats',
    name: 'Lats',
    pathData: 'M140,200 C130,180 110,185 100,200 L100,280 C110,290 130,285 140,280 Z', // Placeholder
    region: 'upper'
  },
  {
    id: 'traps',
    name: 'Traps',
    pathData: 'M150,120 L190,120 L180,160 L160,160 Z', // Placeholder
    region: 'upper'
  },
  // Add more muscle groups here after conversion
];

interface InteractiveMuscleSilhouetteProps {
  view: 'front' | 'back';
  muscleStates?: Record<string, MuscleState>;
  onMusclePress?: (muscleId: string) => void;
  onMuscleHover?: (muscleId: string | null) => void;
  showIntensityColors?: boolean;
  interactive?: boolean;
}

const InteractiveMuscleSilhouette: React.FC<InteractiveMuscleSilhouetteProps> = ({
  view = 'front',
  muscleStates = defaultMuscleStates,
  onMusclePress,
  onMuscleHover,
  showIntensityColors = false,
  interactive = true,
}) => {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  
  // Get muscle groups based on view
  const muscleGroups = view === 'front' ? frontMuscleGroups : backMuscleGroups;

  // Generate color based on muscle state
  const getMuscleColor = useCallback((muscle: MuscleGroup): string => {
    const state = muscleStates[muscle.id];
    if (!state) return '#e0e0e0';

    if (state.isSelected) return '#4a90e2';
    if (state.isHighlighted) return '#60a5fa';
    if (hoveredMuscle === muscle.id) return '#93c5fd';
    
    if (showIntensityColors && state.intensity > 0) {
      // Color intensity based on workout intensity
      const intensity = Math.min(state.intensity, 1);
      const red = Math.floor(255 * intensity);
      const green = Math.floor(255 * (1 - intensity));
      return `rgb(${red}, ${green}, 100)`;
    }

    return state.color;
  }, [muscleStates, hoveredMuscle, showIntensityColors]);

  // Handle muscle interaction
  const handleMusclePress = useCallback((muscleId: string) => {
    if (!interactive) return;
    onMusclePress?.(muscleId);
  }, [interactive, onMusclePress]);

  const handleMuscleHover = useCallback((muscleId: string | null) => {
    if (!interactive) return;
    setHoveredMuscle(muscleId);
    onMuscleHover?.(muscleId);
  }, [interactive, onMuscleHover]);

  return (
    <View style={styles.container}>
      <Svg
        width={screenWidth * 0.76}
        height={screenHeight * 0.49}
        viewBox="0 0 300 400"
        style={styles.svg}
      >
        <Defs>
          {/* Gradient for muscle highlighting */}
          <LinearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4a90e2" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        <G id={`${view}-silhouette`}>
          {muscleGroups.map((muscle) => {
            const state = muscleStates[muscle.id];
            const fillColor = getMuscleColor(muscle);
            const isActive = state?.isHighlighted || state?.isSelected || hoveredMuscle === muscle.id;

            return (
              <Path
                key={muscle.id}
                d={muscle.pathData}
                fill={fillColor}
                stroke={isActive ? "#4a90e2" : "#666"}
                strokeWidth={isActive ? 2 : 1}
                opacity={state?.intensity && showIntensityColors ? 0.7 + (state.intensity * 0.3) : 1}
                onPress={() => handleMusclePress(muscle.id)}
                onPressIn={() => handleMuscleHover(muscle.id)}
                onPressOut={() => handleMuscleHover(null)}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    backgroundColor: 'transparent',
  },
});

export default InteractiveMuscleSilhouette; 