import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import InteractiveMuscleSilhouette, { MuscleState } from './InteractiveMuscleSilhouette';

interface MuscleSilhouetteContainerProps {
  muscleStates?: Record<string, MuscleState>;
  onMusclePress?: (muscleId: string) => void;
  showIntensityColors?: boolean;
  interactive?: boolean;
  style?: any;
}

const MuscleSilhouetteContainer: React.FC<MuscleSilhouetteContainerProps> = ({
  muscleStates,
  onMusclePress,
  showIntensityColors = false,
  interactive = true,
  style,
}) => {
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [isFlipCooldown, setIsFlipCooldown] = useState(false);
  
  // Animation values
  const rotation = useSharedValue(0);
  const silhouetteScale = useSharedValue(1);

  // Function to toggle between front and back views with animation
  const toggleSilhouetteView = useCallback(() => {
    // Prevent rotation if cooldown is active
    if (isFlipCooldown) return;
    
    // Set cooldown
    setIsFlipCooldown(true);
    
    // Update view state
    setCurrentView(prev => prev === 'front' ? 'back' : 'front');
    
    // Animate rotation
    rotation.value = withTiming(rotation.value + 180, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    
    // Reset cooldown after animation completes
    setTimeout(() => {
      setIsFlipCooldown(false);
    }, 1000);
  }, [isFlipCooldown, rotation]);

  // Handle muscle press with feedback
  const handleMusclePress = useCallback((muscleId: string) => {
    console.log(`Muscle pressed: ${muscleId}`);
    
    // Provide haptic feedback (optional)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call the parent handler
    onMusclePress?.(muscleId);
    
    // For demo purposes, show an alert
    Alert.alert(
      'Muscle Selected', 
      `You selected: ${muscleId}`,
      [{ text: 'OK' }]
    );
  }, [onMusclePress]);

  // Animated styles for the container
  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${rotation.value}deg` },
        { scale: silhouetteScale.value }
      ],
    };
  });

  const silhouetteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: silhouetteScale.value }]
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Animated Silhouette Container */}
      <Animated.View style={[styles.silhouetteContainer, silhouetteAnimatedStyle]}>
        <Animated.View style={[styles.silhouetteWrapper, rotateStyle]}>
          <InteractiveMuscleSilhouette
            view={currentView}
            muscleStates={muscleStates}
            onMusclePress={handleMusclePress}
            showIntensityColors={showIntensityColors}
            interactive={interactive}
          />
        </Animated.View>
      </Animated.View>

      {/* Rotate Button */}
      <TouchableOpacity 
        style={[
          styles.rotateButton,
          isFlipCooldown && styles.disabledRotateButton
        ]}
        onPress={toggleSilhouetteView}
        disabled={isFlipCooldown}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isFlipCooldown 
            ? ['rgba(150, 150, 150, 0.9)', 'rgba(120, 120, 120, 0.9)'] 
            : ['rgba(74, 144, 226, 0.9)', 'rgba(53, 112, 178, 0.9)']}
          style={styles.rotateButtonGradient}
        >
          <MaterialCommunityIcons 
            name="rotate-3d-variant" 
            size={26} 
            color="#fff" 
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  silhouetteWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    // Enable 3D transformations
    perspective: '1000px',
  },
  rotateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledRotateButton: {
    opacity: 0.5,
  },
  rotateButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MuscleSilhouetteContainer; 