import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const backgroundScale = useSharedValue(1.2);
  const backgroundOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    backgroundOpacity.value = withTiming(1, { duration: 800 });
    backgroundScale.value = withTiming(1, { 
      duration: 2000, 
      easing: Easing.out(Easing.quad) 
    });

    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(300, 
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      )
    );
    logoRotation.value = withDelay(300, 
      withSpring(360, { 
        damping: 15, 
        stiffness: 80,
        mass: 1 
      })
    );

    glowOpacity.value = withDelay(800, 
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      )
    );

    pulseScale.value = withDelay(1000, 
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      )
    );

    titleOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(1200, 
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    subtitleOpacity.value = withDelay(1600, withTiming(1, { duration: 800 }));
    subtitleTranslateY.value = withDelay(1600, 
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // Progress bar animation
    progressWidth.value = withDelay(1800, withTiming(100, { duration: 1000 }));

    setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 500 });
      titleOpacity.value = withTiming(0, { duration: 500 });
      subtitleOpacity.value = withTiming(0, { duration: 500 });
      backgroundOpacity.value = withTiming(0, { 
        duration: 800 
      }, () => {
        runOnJS(onFinish)();
      });
    }, 3000);
  };

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    transform: [{ scale: backgroundScale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.2 }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={isDarkMode 
            ? ['#0a0a0a', '#1a1a2e', '#16213e', '#0f4c75']
            : ['#667eea', '#764ba2', '#f093fb', '#f5576c']
          }
          style={styles.gradient}
          start={[0, 0]}
          end={[1, 1]}
        />
      </Animated.View>

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0)',
              ]}
              style={styles.glow}
            />
          </Animated.View>

          <Animated.View style={[styles.logo, logoAnimatedStyle]}>
            <Image
              source={require('../assets/images/logo2.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={[styles.title, { color: '#fff' }]}>
            FITCORE
          </Text>
          <View style={styles.titleUnderline} />
        </Animated.View>

        <Animated.View style={[styles.subtitleContainer, subtitleAnimatedStyle]}>
          <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
            Transform Your Fitness Journey
          </Text>
        </Animated.View>

        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => {
            const dotScale = useSharedValue(1);
            const dotOpacity = useSharedValue(0.6);
            
            // Animate each dot with a delay
            React.useEffect(() => {
              const animateDot = () => {
                dotScale.value = withDelay(index * 200,
                  withSequence(
                    withTiming(1.5, { duration: 600 }),
                    withTiming(1, { duration: 600 })
                  )
                );
                dotOpacity.value = withDelay(index * 200,
                  withSequence(
                    withTiming(1, { duration: 600 }),
                    withTiming(0.6, { duration: 600 })
                  )
                );
              };
              
              animateDot();
              const interval = setInterval(animateDot, 1800);
              return () => clearInterval(interval);
            }, []);

            const dotAnimatedStyle = useAnimatedStyle(() => ({
              transform: [{ scale: dotScale.value }],
              opacity: dotOpacity.value,
            }));

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  },
                  dotAnimatedStyle,
                ]}
              />
            );
          })}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>
        </View>
      </View>

      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, index) => {
          const particleTranslateY = useSharedValue(0);
          const particleOpacity = useSharedValue(Math.random() * 0.5 + 0.2);
          
          React.useEffect(() => {
            const animateParticle = () => {
              particleTranslateY.value = withSequence(
                withTiming(20, { duration: 3000 }),
                withTiming(-20, { duration: 3000 })
              );
              particleOpacity.value = withSequence(
                withTiming(0.8, { duration: 1500 }),
                withTiming(0.2, { duration: 1500 })
              );
            };
            
            animateParticle();
            const interval = setInterval(animateParticle, 6000);
            return () => clearInterval(interval);
          }, []);

          const particleAnimatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: particleTranslateY.value }],
            opacity: particleOpacity.value,
          }));

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: Math.random() * screenWidth,
                  top: Math.random() * screenHeight,
                },
                particleAnimatedStyle,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 60,
  },
  glowContainer: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  logo: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    borderRadius: 2,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: '300',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    bottom: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 50,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
});
