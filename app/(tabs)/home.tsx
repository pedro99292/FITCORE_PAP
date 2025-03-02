import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate } from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  // Use theme from context
  const { colors, isDarkMode } = useTheme();
  
  // State to track which silhouette view is currently displayed
  const [showFrontView, setShowFrontView] = useState(true);
  
  // Animation values
  const rotation = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const silhouetteScale = useSharedValue(0.95);
  
  // Animate elements on component mount
  useEffect(() => {
    statsOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    silhouetteScale.value = withTiming(1, { duration: 1000, easing: Easing.elastic(1.2) });
  }, []);

  // Function to toggle between front and back views with animation
  const toggleSilhouetteView = () => {
    // Animate rotation
    rotation.value = withTiming(rotation.value + 180, {
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
    });
    
    // Wait for half of the animation to flip the image
    setTimeout(() => {
      setShowFrontView(!showFrontView);
    }, 400);
  };

  // Animated styles
  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotation.value}deg` }],
    };
  });

  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: statsOpacity.value,
      transform: [
        { translateY: interpolate(statsOpacity.value, [0, 1], [-20, 0]) }
      ]
    };
  });

  const silhouetteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: silhouetteScale.value }
      ]
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>FITCORE</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Stats Box */}
      <Animated.View style={[
        styles.statsContainer,
        statsAnimatedStyle
      ]}>
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.6)', 'rgba(74, 144, 226, 0.2)']}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.statsGradient}
        >
          <View style={styles.statsBox}>
            <View style={styles.statItem}>
              <FontAwesome5 name="dumbbell" size={20} color="#fff" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <FontAwesome5 name="weight" size={20} color="#fff" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Kgs Volume</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Silhouette Image */}
      <Animated.View style={[styles.silhouetteContainer, silhouetteAnimatedStyle]}>
        <Animated.Image
          source={showFrontView 
            ? require('../../assets/images/muscle-silhouette-front.png')
            : require('../../assets/images/muscle-silhouette-back.png')
          }
          style={[styles.silhouette, rotateStyle]}
        />
      </Animated.View>
      
      {/* Bottom Button - Only main button now */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.mainButton}>
          <LinearGradient
            colors={['#4a90e2', '#3570b2']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.mainButtonGradient}
          >
            <Text style={styles.mainButtonText}>INICIAR TREINO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Rotate Button - Now positioned at bottom right of screen */}
      <TouchableOpacity 
        style={styles.rotateButton}
        onPress={toggleSilhouetteView}
      >
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.9)', 'rgba(53, 112, 178, 0.9)']}
          style={styles.rotateButtonGradient}
        >
          <MaterialCommunityIcons name="rotate-3d-variant" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.06,
    paddingTop: screenWidth * 0.04,
    paddingBottom: screenWidth * 0.02,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    padding: 6,
  },
  statsContainer: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: screenWidth * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statsGradient: {
    borderRadius: 16,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: screenWidth * 0.05,
    paddingHorizontal: screenWidth * 0.04,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  silhouetteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 20,
    marginBottom: 20,
  },
  silhouette: {
    width: screenWidth * 0.75,
    height: screenHeight * 0.5,
    resizeMode: 'contain',
  },
  rotateButton: {
    position: 'absolute',
    bottom: screenWidth * 0.06,
    right: screenWidth * 0.06,
    zIndex: 10,
  },
  rotateButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenWidth * 0.06,
    marginBottom: screenWidth * 0.06,
  },
  mainButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 