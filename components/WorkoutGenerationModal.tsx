import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { generateAndSaveWorkout } from '@/utils/workoutGenerationService';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface WorkoutGenerationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onWorkoutGenerated?: () => void;
}

export default function WorkoutGenerationModal({ 
  isVisible, 
  onClose, 
  onWorkoutGenerated 
}: WorkoutGenerationModalProps) {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWorkout = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const workoutId = await generateAndSaveWorkout(user.id);
      
      if (workoutId) {
        onWorkoutGenerated?.();
        onClose();
        
        // Show success message
        Alert.alert(
          'Workout Plan Generated! 🎉',
          'Your personalized workout plan has been created successfully. You can find it in your workouts section.',
          [
            { 
              text: 'View Workouts', 
              onPress: () => {
                // Could navigate to workouts screen here if needed
                console.log('Navigate to workouts');
              }
            },
            { text: 'Got it!', style: 'default' }
          ]
        );
      } else {
        Alert.alert(
          'Generation Failed',
          'We couldn\'t generate your workout plan right now. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      Alert.alert(
        'Generation Failed',
        'We couldn\'t generate your workout plan right now. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                disabled={isGenerating}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.primary + '20', colors.primary + '10']}
                  style={styles.iconBackground}
                >
                  <Ionicons name="fitness" size={48} color={colors.primary} />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>
                Generate Your Workout Plan
              </Text>
              
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Create a personalized workout plan based on your preferences and goals
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Personalized for your fitness level
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Matches your weekly schedule
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="trending-up" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Optimized for your goals
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Updated as you progress
                </Text>
              </View>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.generateButtonWrapper}
                onPress={handleGenerateWorkout}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'CC']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.generateButton}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons name="add-circle" size={24} color="white" />
                  )}
                  <Text style={styles.generateButtonText}>
                    {isGenerating ? 'Generating...' : 'Generate My Workout Plan'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.skipButton, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.note, { color: colors.textSecondary }]}>
              You can always generate a workout plan later from the workout preferences screen.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.9,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    padding: 24,
    paddingTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  actionContainer: {
    padding: 24,
    paddingTop: 8,
  },
  generateButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  skipButton: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    lineHeight: 20,
  },
}); 