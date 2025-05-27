import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  useColorScheme,
  Dimensions,
  Animated,
  Platform,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { subscriptionService } from '../utils/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

interface SurveyModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: SurveyData) => void;
}

export interface SurveyData {
  age: string;
  height: string;
  weight: string;
  experienceLevel: 'novice' | 'experienced' | 'advanced';
  availability: string;
  goals: ('gain muscle' | 'lose fat' | 'gain strength' | 'maintain muscle')[];
  gender: 'male' | 'female' | 'prefer not to say';
}

interface NumberPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue: string;
  options: number[];
  unit: string;
  title: string;
}

const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedValue,
  options,
  unit,
  title,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const itemHeight = 56; // Height of each option item
  const visibleItems = 5; // Number of visible items
  const selectedIndex = options.findIndex(value => String(value) === selectedValue);

  useEffect(() => {
    if (isVisible && scrollViewRef.current) {
      // Calculate the offset to center the selected value
      const centerOffset = Math.max(0, selectedIndex * itemHeight - (visibleItems * itemHeight - itemHeight) / 2);
      
      // Add a small delay to ensure the ScrollView is ready
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: centerOffset,
          animated: false,
        });
      }, 100);
    }
  }, [isVisible, selectedIndex, selectedValue]);

  const handleOptionPress = (value: number) => {
    onSelect(String(value));
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.pickerModalOverlay} onPress={onClose}>
        <Pressable 
          style={[
            styles.pickerModalContent,
            { backgroundColor: isDarkMode ? colors.surface : '#fff' }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.pickerModalHeader}>
            <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <View style={[
              styles.selectionHighlight,
              { borderColor: colors.primary }
            ]} />

            <ScrollView
              ref={scrollViewRef}
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: (itemHeight * visibleItems - itemHeight) / 2,
              }}
            >
              {options.map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.pickerOption,
                    { height: itemHeight },
                    selectedValue === String(value) && {
                      backgroundColor: isDarkMode ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)',
                    }
                  ]}
                  onPress={() => handleOptionPress(value)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: selectedValue === String(value) ? colors.primary : colors.text }
                    ]}
                  >
                    {`${value} ${unit}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

// Generate arrays for height and weight options
const heightOptions = Array.from({ length: 151 }, (_, i) => i + 100); // 100cm to 250cm
const weightOptions = Array.from({ length: 271 }, (_, i) => i + 30); // 30kg to 300kg

const SurveyModal: React.FC<SurveyModalProps> = ({ isVisible, onClose, onSubmit }) => {
  const { isDarkMode, colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  
  const extendedColors = {
    ...colors,
    cardBackground: isDarkMode ? 'rgba(30, 30, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    textLight: colors.textSecondary,
    textMuted: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    cardBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    gradientStart: isDarkMode ? '#2b2b45' : '#f5f5f5',
    gradientEnd: isDarkMode ? '#1a1a2e' : '#e0e0e0',
    inputBorder: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  };
  
  const [formData, setFormData] = useState<SurveyData>({
    age: '',
    height: '170', // Default height
    weight: '70', // Default weight
    experienceLevel: 'novice',
    availability: '3',
    goals: ['gain muscle'],
    gender: 'prefer not to say',
  });

  const { user } = useAuth();

  const pages = [
    {
      title: "Let's Get Started! 💪",
      subtitle: "First, tell us about yourself",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>What's your age?</Text>
            <TextInput
              style={[styles.input, { borderColor: extendedColors.inputBorder, color: colors.text }]}
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(value) => setFormData(prev => ({ ...prev, age: value }))}
              placeholder="Enter your age"
              placeholderTextColor={extendedColors.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>How do you identify?</Text>
            <View style={styles.optionsContainer}>
              {['male', 'female', 'prefer not to say'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    { borderColor: extendedColors.inputBorder },
                    formData.gender === option && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: option as SurveyData['gender'] }))}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: formData.gender === option ? 'white' : colors.text }
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )
    },
    {
      title: "Body Metrics 📏",
      subtitle: "Help us understand your physical profile",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' }
              ]}
              onPress={() => setShowHeightPicker(true)}
            >
              <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                {`${formData.height} cm`}
              </Text>
              <Ionicons name="chevron-down" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' }
              ]}
              onPress={() => setShowWeightPicker(true)}
            >
              <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                {`${formData.weight} kg`}
              </Text>
              <Ionicons name="chevron-down" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <NumberPickerModal
            isVisible={showHeightPicker}
            onClose={() => setShowHeightPicker(false)}
            onSelect={(value) => setFormData(prev => ({ ...prev, height: value }))}
            selectedValue={formData.height}
            options={heightOptions}
            unit="cm"
            title="Select Height"
          />

          <NumberPickerModal
            isVisible={showWeightPicker}
            onClose={() => setShowWeightPicker(false)}
            onSelect={(value) => setFormData(prev => ({ ...prev, weight: value }))}
            selectedValue={formData.weight}
            options={weightOptions}
            unit="kg"
            title="Select Weight"
          />
        </View>
      )
    },
    {
      title: "Experience Level 🎯",
      subtitle: "Tell us about your fitness journey",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>What's your fitness level?</Text>
          <View style={styles.experienceLevels}>
            {[
              { value: 'novice', icon: '🌱', title: 'Novice', description: 'New to fitness' },
              { value: 'experienced', icon: '⚡', title: 'Experienced', description: '1-3 years training' },
              { value: 'advanced', icon: '🏆', title: 'Advanced', description: '3+ years training' }
            ].map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.experienceCard,
                  { borderColor: extendedColors.inputBorder },
                  formData.experienceLevel === level.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, experienceLevel: level.value as SurveyData['experienceLevel'] }))}
              >
                <Text style={styles.experienceIcon}>{level.icon}</Text>
                <Text style={[
                  styles.experienceTitle,
                  { color: formData.experienceLevel === level.value ? 'white' : colors.text }
                ]}>
                  {level.title}
                </Text>
                <Text style={[
                  styles.experienceDescription,
                  { color: formData.experienceLevel === level.value ? 'white' : colors.text }
                ]}>
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    {
      title: "Weekly Schedule 📅",
      subtitle: "Plan your workout frequency",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>How many workouts per week?</Text>
          <View style={styles.weeklySchedule}>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.dayButton,
                  { borderColor: extendedColors.inputBorder },
                  formData.availability === String(num) && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, availability: String(num) }))}
              >
                <Text style={[
                  styles.dayButtonText,
                  { color: formData.availability === String(num) ? 'white' : colors.text }
                ]}>
                  {num}
                </Text>
                <Text style={[
                  styles.dayButtonSubtext,
                  { color: formData.availability === String(num) ? 'white' : colors.text }
                ]}>
                  {num === 1 ? 'day' : 'days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    {
      title: "Fitness Goals 🎯",
      subtitle: "What do you want to achieve?",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>Select your goals (multiple choice)</Text>
          <View style={styles.goalsContainer}>
            {[
              { value: 'gain muscle', icon: '💪', title: 'Gain Muscle' },
              { value: 'lose fat', icon: '🔥', title: 'Lose Fat' },
              { value: 'gain strength', icon: '🏋️‍♂️', title: 'Gain Strength' },
              { value: 'maintain muscle', icon: '⚖️', title: 'Maintain Muscle' }
            ].map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[
                  styles.goalCard,
                  { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' },
                  formData.goals.includes(goal.value as SurveyData['goals'][0]) && 
                  { backgroundColor: '#4A90E2' }
                ]}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    goals: prev.goals.includes(goal.value as SurveyData['goals'][0])
                      ? prev.goals.filter(g => g !== goal.value)
                      : [...prev.goals, goal.value as SurveyData['goals'][0]]
                  }));
                }}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalTitle,
                  { 
                    color: formData.goals.includes(goal.value as SurveyData['goals'][0]) 
                      ? 'white' 
                      : colors.text 
                  }
                ]}>
                  {goal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    }
  ];

  const navigateToPage = (pageIndex: number) => {
    const toValue = -pageIndex * width;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setCurrentPage(pageIndex);
  };

  const validateFormData = (): string | null => {
    if (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 100) {
      return 'Please enter a valid age between 13 and 100';
    }
    if (!formData.height || parseFloat(formData.height) < 100 || parseFloat(formData.height) > 250) {
      return 'Please enter a valid height between 100cm and 250cm';
    }
    if (!formData.weight || parseFloat(formData.weight) < 30 || parseFloat(formData.weight) > 300) {
      return 'Please enter a valid weight between 30kg and 300kg';
    }
    if (formData.goals.length === 0) {
      return 'Please select at least one fitness goal';
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to complete the survey');
      return;
    }

    const validationError = validateFormData();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await subscriptionService.updateUserProfile(user.id, formData);
      if (success) {
    onSubmit(formData);
    onClose();
      } else {
        Alert.alert('Error', 'Failed to save your profile. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      // Validate current page before proceeding
      let error = null;
      switch (currentPage) {
        case 0: // Age & Gender
          if (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 100) {
            error = 'Please enter a valid age between 13 and 100';
          }
          break;
        case 1: // Body Metrics
          if (!formData.height || !formData.weight) {
            error = 'Please enter both height and weight';
          }
          break;
        case 3: // Weekly Schedule
          if (!formData.availability) {
            error = 'Please select your weekly workout frequency';
          }
          break;
      }

      if (error) {
        Alert.alert('Required Fields', error);
        return;
      }

      navigateToPage(currentPage + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      navigateToPage(currentPage - 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[extendedColors.gradientStart, extendedColors.gradientEnd]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons 
              name={currentPage === 0 ? "close" : "arrow-back"} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index === currentPage ? colors.primary : extendedColors.textMuted,
                    width: index === currentPage ? 20 : 8,
                  }
                ]}
              />
            ))}
            </View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.pagesContainer,
            {
              transform: [{ translateX: slideAnim }],
              width: width * pages.length,
            }
          ]}
        >
          {pages.map((page, index) => (
            <View key={index} style={[styles.page, { width }]}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>{page.title}</Text>
              <Text style={[styles.pageSubtitle, { color: extendedColors.textMuted }]}>{page.subtitle}</Text>
              <View style={[styles.pageContent, { backgroundColor: colors.surface }]}>
                {page.content}
              </View>
            </View>
          ))}
        </Animated.View>

        <LinearGradient
          colors={[colors.primary, '#4A90E2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
                    style={[
            styles.nextButton,
            isSubmitting && styles.disabledButton
          ]}
        >
          <TouchableOpacity 
            onPress={handleNext}
            disabled={isSubmitting}
            style={styles.nextButtonContent}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === pages.length - 1 
                ? (isSubmitting ? 'Saving...' : 'Complete')
                : 'Continue'
              }
            </Text>
            {!isSubmitting && (
              <Ionicons name="arrow-forward" size={20} color="white" style={styles.nextButtonIcon} />
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  pagesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  page: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  pageContent: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  experienceLevels: {
    gap: 16,
  },
  experienceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  experienceIcon: {
    fontSize: 24,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  experienceDescription: {
    fontSize: 14,
    marginLeft: 'auto',
  },
  weeklySchedule: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayButton: {
    borderWidth: 1,
    borderRadius: 12,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dayButtonSubtext: {
    fontSize: 12,
  },
  goalsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  goalCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    margin: 20,
    borderRadius: 12,
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    height: 280, // 5 items * 56px height
    position: 'relative',
  },
  pickerScrollView: {
    flex: 1,
  },
  selectionHighlight: {
    position: 'absolute',
    top: '50%',
    left: 12,
    right: 12,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    transform: [{ translateY: -28 }],
    zIndex: 1,
  },
  pickerOption: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderRadius: 12,
  },
  pickerOptionText: {
    fontSize: 20,
    fontWeight: '500',
  },
});

export default SurveyModal; 