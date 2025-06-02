import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementNotificationProps {
  visible: boolean;
  title: string;
  description: string;
  onHide: () => void;
  duration?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  visible,
  title,
  description,
  onHide,
  duration = 4000
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      translateY.value = withTiming(50, {
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    translateY.value = withTiming(-100, {
      duration: 300,
      easing: Easing.in(Easing.cubic)
    });
    opacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.cubic)
    }, () => {
      runOnJS(onHide)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.notification}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="trophy" size={32} color="#FFF" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Conquista Desbloqueada!</Text>
          <Text style={styles.achievementTitle}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        <View style={styles.sparkles}>
          <Ionicons name="sparkles" size={16} color="#FFF" style={styles.sparkle1} />
          <Ionicons name="sparkles" size={12} color="#FFF" style={styles.sparkle2} />
          <Ionicons name="sparkles" size={14} color="#FFF" style={styles.sparkle3} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  sparkles: {
    position: 'relative',
    width: 30,
    height: 30,
  },
  sparkle1: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 0,
    left: 5,
  },
  sparkle3: {
    position: 'absolute',
    top: 10,
    left: 0,
  },
});

export default AchievementNotification; 