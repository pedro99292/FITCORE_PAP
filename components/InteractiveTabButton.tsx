import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  LayoutAnimation,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

interface InteractiveTabButtonProps {
  isFocused: boolean;
  onPress?: (e?: any) => void;
  iconName: string;
  label: string;
  color: string;
  size?: number;
}

const InteractiveTabButton: React.FC<InteractiveTabButtonProps> = ({
  isFocused,
  onPress,
  iconName,
  label,
  color,
  size = 26,
}) => {
  const { colors, isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const labelOpacityAnim = useRef(new Animated.Value(0)).current;
  const labelScaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showLabel, setShowLabel] = useState(false);
  
  // Remove the conflicting background animation - we'll use a simple state-based background
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Use LayoutAnimation for smoother overall UI updates
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (isFocused) {
      setIsActive(true);
      // Animate to focused state
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15, // Slightly reduced scale for subtlety
          useNativeDriver: true,
          tension: 300, // Higher tension for faster response
          friction: 10,
        }),
        Animated.spring(translateYAnim, {
          toValue: -10, // Lift slightly higher
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();

      // Show label immediately
      setShowLabel(true);
      Animated.parallel([
        Animated.spring(labelOpacityAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.spring(labelScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    } else {
      setIsActive(false);
      // Animate to unfocused state
      setShowLabel(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.timing(labelOpacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(labelScaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  const handlePress = () => {
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Trigger focus animations immediately when pressed
    if (!isFocused) {
      setIsActive(true);
      // Start the lifting animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.spring(translateYAnim, {
          toValue: -10,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();

      // Show label
      setShowLabel(true);
      Animated.parallel([
        Animated.spring(labelOpacityAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.spring(labelScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    }

    onPress?.();
  };

  // Simple background color based on state - no animation conflict
  const backgroundColor = isActive 
    ? (isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)')
    : 'transparent';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.tabContent}>
        {/* Icon container with subtle background */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
        >
          <FontAwesome
            name={iconName as any}
            size={size}
            color={color}
            style={styles.icon}
          />
        </Animated.View>

        {/* Label that appears when tab is active */}
        {showLabel && (
          <Animated.View
            style={[
              styles.labelContainer,
              {
                opacity: labelOpacityAnim,
                transform: [{ scale: labelScaleAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: colors.primary,
                  textShadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
                },
              ]}
            >
              {label}
            </Text>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
    overflow: 'visible',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 60,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: 46,
    height: 46,
    borderRadius: 23,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    backdropFilter: 'blur(12px)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

});

export default InteractiveTabButton; 