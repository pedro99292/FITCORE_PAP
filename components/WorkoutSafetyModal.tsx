import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WorkoutSafetyModalProps {
  visible: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  onNeverShowAgain?: () => void;
  isFirstTime?: boolean;
  workoutType?: 'beginner' | 'intermediate' | 'advanced' | 'senior';
}

interface SafetyTip {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const WorkoutSafetyModal: React.FC<WorkoutSafetyModalProps> = ({
  visible,
  onClose,
  onAcknowledge,
  onNeverShowAgain,
  isFirstTime = false,
  workoutType = 'beginner'
}) => {
  const { colors } = useTheme();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const getBeginnerTips = (): SafetyTip[] => [
    {
      icon: 'warning',
      title: 'Form Over Weight',
      description: 'Always prioritize proper technique over lifting heavy weights. Poor form leads to injuries and reduces exercise effectiveness.',
      priority: 'high'
    },
    {
      icon: 'fitness',
      title: 'Start Light & Progress Slowly',
      description: 'Begin with lighter weights that allow 12-15 comfortable reps. Gradually increase by 5-10% only when you can complete all sets with perfect form.',
      priority: 'high'
    },
    {
      icon: 'body',
      title: 'Listen to Your Body',
      description: 'Learn to distinguish between muscle fatigue (normal) and sharp pain (stop immediately). Never push through joint pain or sharp, shooting pains.',
      priority: 'high'
    },
    {
      icon: 'time',
      title: 'Warm Up is Essential',
      description: 'Always start with 5-10 minutes of light cardio and dynamic stretching. Cold muscles are more prone to injury.',
      priority: 'high'
    },
    {
      icon: 'water',
      title: 'Stay Hydrated',
      description: 'Drink water before, during, and after your workout. Dehydration affects performance and recovery.',
      priority: 'medium'
    },
    {
      icon: 'bed',
      title: 'Rest Days Are Required',
      description: 'Your muscles grow during rest, not during workouts. Take at least one full rest day between training the same muscle groups.',
      priority: 'medium'
    }
  ];

  const getGeneralTips = (): SafetyTip[] => [
    {
      icon: 'checkmark-circle',
      title: 'Equipment Safety Check',
      description: 'Always inspect equipment before use. Check for loose bolts, worn cables, or damaged weights. Report any issues immediately.',
      priority: 'high'
    },
    {
      icon: 'people',
      title: 'Use a Spotter When Needed',
      description: 'For exercises like bench press, squats with heavy weight, or when attempting new max lifts, always have a qualified spotter.',
      priority: 'high'
    },
    {
      icon: 'medical',
      title: 'Know Your Limits',  
      description: 'If you have any medical conditions, injuries, or take medications, consult your healthcare provider before starting any exercise program.',
      priority: 'high'
    },
    {
      icon: 'alert-circle',
      title: 'Emergency Protocols',
      description: 'Know where emergency equipment is located. If you feel dizzy, nauseous, or experience chest pain, stop immediately and seek help.',
      priority: 'high'
    }
  ];

  const getSeniorTips = (): SafetyTip[] => [
    {
      icon: 'heart',
      title: 'Monitor Your Heart Rate',
      description: 'Stay within your target heart rate zone. If you can\'t hold a conversation during exercise, you may be working too hard.',
      priority: 'high'
    },
    {
      icon: 'accessibility',
      title: 'Focus on Balance & Stability',
      description: 'Use machines with back support when possible. Always have something to hold onto when doing standing exercises.',
      priority: 'high'
    }
  ];

  const getCurrentTips = (): SafetyTip[] => {
    switch (workoutType) {
      case 'beginner':
        return getBeginnerTips();
      case 'senior':
        return [...getBeginnerTips(), ...getSeniorTips()];
      default:
        return [...getBeginnerTips().slice(0, 3), ...getGeneralTips()];
    }
  };

  const tips = getCurrentTips();
  const currentTip = tips[currentTipIndex];

  const handleNext = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      onAcknowledge();
    }
  };

  const handlePrevious = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
    }
  };



  // Use absolute positioned View instead of Modal for Android
  if (Platform.OS === 'android' && visible) {
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 1000,
      }}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[
              currentTip.priority === 'high' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(74, 144, 226, 0.1)',
              'transparent'
            ]}
            style={styles.headerGradient}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(currentTip.priority) }]} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isFirstTime ? 'Welcome! Safety First' : 'Safety Reminders'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tipContainer}>
              <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(currentTip.priority) + '20' }]}>
                <Ionicons 
                  name={currentTip.icon as any} 
                  size={32} 
                  color={getPriorityColor(currentTip.priority)} 
                />
              </View>
              
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                {currentTip.title}
              </Text>
              
              <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                {currentTip.description}
              </Text>

              {currentTip.priority === 'high' && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="alert-circle" size={16} color="#fff" />
                  <Text style={styles.urgentText}>Critical Safety Tip</Text>
                </View>
              )}
            </View>

            {isFirstTime && (
              <View style={[styles.disclaimerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  By using this app, you acknowledge that you exercise at your own risk. 
                  Consult a healthcare provider before starting any exercise program.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.progressIndicator}>
              {tips.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index === currentTipIndex 
                        ? getPriorityColor(currentTip.priority)
                        : colors.border
                    }
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentTipIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handlePrevious}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  styles.primaryButton,
                  { backgroundColor: getPriorityColor(currentTip.priority) }
                ]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  {currentTipIndex === tips.length - 1 ? 'Start Workout Safely' : 'Next Tip'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Never show again option - only on last tip */}
            {currentTipIndex === tips.length - 1 && onNeverShowAgain && (
              <View style={styles.neverShowContainer}>
                <TouchableOpacity
                  style={[styles.neverShowButton, { borderColor: colors.border }]}
                  onPress={onNeverShowAgain}
                >
                  <Ionicons name="eye-off-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.neverShowText, { color: colors.textSecondary }]}>
                    Never show safety warnings again
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.neverShowSubtext, { color: colors.textSecondary }]}>
                  Warning: You'll no longer receive important safety reminders
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Original iOS implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[
              currentTip.priority === 'high' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(74, 144, 226, 0.1)',
              'transparent'
            ]}
            style={styles.headerGradient}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(currentTip.priority) }]} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isFirstTime ? 'Welcome! Safety First' : 'Safety Reminders'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tipContainer}>
              <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(currentTip.priority) + '20' }]}>
                <Ionicons 
                  name={currentTip.icon as any} 
                  size={32} 
                  color={getPriorityColor(currentTip.priority)} 
                />
              </View>
              
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                {currentTip.title}
              </Text>
              
              <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                {currentTip.description}
              </Text>

              {currentTip.priority === 'high' && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="alert-circle" size={16} color="#fff" />
                  <Text style={styles.urgentText}>Critical Safety Tip</Text>
                </View>
              )}
            </View>

            {isFirstTime && (
              <View style={[styles.disclaimerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                  By using this app, you acknowledge that you exercise at your own risk. 
                  Consult a healthcare provider before starting any exercise program.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.progressIndicator}>
              {tips.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index === currentTipIndex 
                        ? getPriorityColor(currentTip.priority)
                        : colors.border
                    }
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentTipIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handlePrevious}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Previous</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  styles.primaryButton,
                  { backgroundColor: getPriorityColor(currentTip.priority) }
                ]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  {currentTipIndex === tips.length - 1 ? 'Start Workout Safely' : 'Next Tip'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Never show again option - only on last tip */}
            {currentTipIndex === tips.length - 1 && onNeverShowAgain && (
              <View style={styles.neverShowContainer}>
                <TouchableOpacity
                  style={[styles.neverShowButton, { borderColor: colors.border }]}
                  onPress={onNeverShowAgain}
                >
                  <Ionicons name="eye-off-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.neverShowText, { color: colors.textSecondary }]}>
                    Never show safety warnings again
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.neverShowSubtext, { color: colors.textSecondary }]}>
                  Warning: You'll no longer receive important safety reminders
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: screenWidth * 0.92,
    maxHeight: Platform.OS === 'android' ? screenHeight * 0.75 : screenHeight * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
        backgroundColor: '#ffffff', // Ensure solid background for Android
      },
    }),
  },
  headerGradient: {
    paddingTop: 20,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tipContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  tipDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
  },
  urgentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 10,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 10,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navigationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  neverShowContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  neverShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  neverShowText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  neverShowSubtext: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default WorkoutSafetyModal; 