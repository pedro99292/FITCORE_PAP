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
import HorizontalPicker from 'react-native-picker-horizontal';

interface SurveyModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: SurveyData) => void;
}

export interface SurveyData {
  age: string;
  height: string;
  weight: string;
  experienceLevel: 'Novice' | 'Experienced' | 'Advanced';
  availability: string;
  goals: 'Gain muscle' | 'Lose fat' | 'Gain strength' | 'Maintain muscle';
  gender: 'Male' | 'Female' | 'Prefer not to say';
  workoutSplit?: string;
  setsPerExercise?: string;
  restTime?: string;
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
  const selectedIndex = options.findIndex(value => String(value) === selectedValue);

  const handleValueChange = (index: number) => {
    onSelect(String(options[index]));
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

          <View style={styles.horizontalPickerContainer}>
            <HorizontalPicker
              data={options}
              renderItem={(item: number, index: number) => (
                <View style={styles.horizontalPickerItem}>
                  <Text 
                    style={[
                      styles.horizontalPickerText,
                      { color: selectedValue === String(item) ? colors.primary : colors.text }
                    ]}
                  >
                    {`${item} ${unit}`}
                  </Text>
                </View>
              )}
              itemWidth={80}
              defaultIndex={selectedIndex}
              onChange={handleValueChange}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const ITEM_WIDTH = 100;

// Generate arrays for height and weight options
const heightOptions = Array.from({ length: 151 }, (_, i) => i + 100); // 100cm to 250cm
const weightOptions = Array.from({ length: 271 }, (_, i) => i + 30); // 30kg to 300kg

const SurveyModal: React.FC<SurveyModalProps> = ({ isVisible, onClose, onSubmit }) => {
  const { isDarkMode, colors } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [slideAnim] = useState(new Animated.Value(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heightScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);
  const windowWidth = Dimensions.get('window').width;
  const paddingHorizontal = (windowWidth - ITEM_WIDTH) / 2;
  
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
    height: '170',
    weight: '70',
    experienceLevel: 'Novice',
    availability: '3',
    goals: 'Gain muscle',
    gender: 'Prefer not to say',
    workoutSplit: '',
    setsPerExercise: '2',
    restTime: '2-3',
  });

  const [selectedHeight, setSelectedHeight] = useState(formData.height);
  const [selectedWeight, setSelectedWeight] = useState(formData.weight);
  const [isScrolling, setIsScrolling] = useState(false);

  const { user } = useAuth();

  // Calculate initial padding to center the first item
  const initialPadding = (windowWidth - ITEM_WIDTH) / 2;

  useEffect(() => {
    if (!isVisible) return;

    const initializeScrollPosition = () => {
      if (heightScrollRef.current && weightScrollRef.current) {
        const heightIndex = heightOptions.findIndex(h => String(h) === formData.height);
        const weightIndex = weightOptions.findIndex(w => String(w) === formData.weight);

        // Calculate exact positions
        const heightOffset = heightIndex * ITEM_WIDTH;
        const weightOffset = weightIndex * ITEM_WIDTH;

        // Use requestAnimationFrame for smooth initial positioning
        requestAnimationFrame(() => {
          heightScrollRef.current?.scrollTo({
            x: heightOffset,
            animated: false
          });
          weightScrollRef.current?.scrollTo({
            x: weightOffset,
            animated: false
          });
        });
      }
    };

    // Initial positioning
    initializeScrollPosition();

    // Backup positioning after a short delay
    const timer = setTimeout(initializeScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [isVisible, formData.height, formData.weight]);

  const handleScroll = (event: any, type: 'height' | 'weight') => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const options = type === 'height' ? heightOptions : weightOptions;
    
    if (index >= 0 && index < options.length) {
      const value = String(options[index]);
      if (type === 'height') {
        setSelectedHeight(value);
        setFormData(prev => ({ ...prev, height: value }));
      } else {
        setSelectedWeight(value);
        setFormData(prev => ({ ...prev, weight: value }));
      }
    }
  };

  const handleMomentumScrollEnd = (event: any, type: 'height' | 'weight') => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const scrollRef = type === 'height' ? heightScrollRef : weightScrollRef;
    
    // Ensure perfect alignment
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: index * ITEM_WIDTH,
        animated: true
      });
    });
  };

  const renderPickerItem = (value: number, isSelected: boolean, unit: string) => (
    <View key={value} style={[styles.pickerItem, { width: ITEM_WIDTH }]}>
      <Text style={[
        styles.pickerText,
        isSelected ? styles.selectedText : styles.unselectedText,
        { color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }
      ]}>
        {value}
      </Text>
      <Text style={[
        styles.unitText,
        isSelected ? styles.selectedUnitText : styles.unselectedUnitText,
        { color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }
      ]}>
        {unit}
      </Text>
    </View>
  );

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
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' }]}>
              <ScrollView
                ref={heightScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="normal"
                onScroll={(e) => handleScroll(e, 'height')}
                onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, 'height')}
                scrollEventThrottle={16}
                contentContainerStyle={[
                  styles.pickerContent,
                  { paddingHorizontal: initialPadding }
                ]}
                snapToAlignment="center"
                pagingEnabled={false}
              >
                {heightOptions.map(height => renderPickerItem(
                  height,
                  selectedHeight === String(height),
                  'cm'
                ))}
              </ScrollView>
              <View style={styles.pickerOverlay}>
                <View style={[styles.pickerCenter, { borderColor: colors.primary, width: ITEM_WIDTH }]} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' }]}>
              <ScrollView
                ref={weightScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="normal"
                onScroll={(e) => handleScroll(e, 'weight')}
                onMomentumScrollEnd={(e) => handleMomentumScrollEnd(e, 'weight')}
                scrollEventThrottle={16}
                contentContainerStyle={[
                  styles.pickerContent,
                  { paddingHorizontal: initialPadding }
                ]}
                snapToAlignment="center"
                pagingEnabled={false}
              >
                {weightOptions.map(weight => renderPickerItem(
                  weight,
                  selectedWeight === String(weight),
                  'kg'
                ))}
              </ScrollView>
              <View style={styles.pickerOverlay}>
                <View style={[styles.pickerCenter, { borderColor: colors.primary, width: ITEM_WIDTH }]} />
              </View>
            </View>
          </View>
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
          <Text style={[styles.label, { color: colors.text }]}>Select your main goal</Text>
          <View style={styles.goalsContainer}>
            {[
              { value: 'Gain muscle', icon: '💪', title: 'Gain Muscle' },
              { value: 'Lose fat', icon: '🔥', title: 'Lose Fat' },
              { value: 'Gain strength', icon: '🏋️‍♂️', title: 'Gain Strength' },
              { value: 'Maintain muscle', icon: '⚖️', title: 'Maintain Muscle' }
            ].map((goal) => (
              <TouchableOpacity
                key={goal.value}
                style={[
                  styles.goalCard,
                  { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' },
                  formData.goals === goal.value && 
                  { backgroundColor: '#4A90E2' }
                ]}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    goals: goal.value as SurveyData['goals']
                  }));
                }}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalTitle,
                  { 
                    color: formData.goals === goal.value 
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
    },
    {
      title: "Workout Split 🏋️‍♂️",
      subtitle: "Choose your workout structure",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>Select your preferred split</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <View style={styles.splitOptionsContainer}>
              {(() => {
                const days = parseInt(formData.availability) || 3;
                let splitOptions = [];
                
                // 3 days options
                if (days === 3) {
                  splitOptions = [
                    { value: 'upper_lower_full', title: 'Upper/Lower/Full Body', recommended: true },
                    { value: 'push_pull_legs', title: 'Push/Pull/Legs' },
                    { value: 'full_body_3x', title: '3x Full Body' },
                    { value: 'upper_lower_upper', title: 'Upper/Lower/Upper' },
                  ];
                }
                // 4 days options
                else if (days === 4) {
                  splitOptions = [
                    { value: 'upper_lower_upper_full', title: 'Upper/Lower/Upper/Full Body', recommended: true },
                    { value: 'push_pull_legs_full', title: 'Push/Pull/Legs/Full Body' },
                    { value: 'full_body_4x', title: '4x Full Body' },
                    { value: 'upper_lower_2x', title: '2x Upper/Lower' },
                    { value: 'push_legs_pull_legs', title: 'Push/Legs/Pull/Legs' },
                  ];
                }
                // 5 days options
                else if (days === 5) {
                  splitOptions = [
                    { value: 'upper_lower_upper_lower_full', title: 'Upper/Lower/Upper/Lower/Full Body', recommended: true },
                    { value: 'upper_lower_upper_lower_upper', title: 'Upper/Lower/Upper/Lower/Upper' },
                    { value: 'full_body_5x', title: '5x Full Body' },
                    { value: 'push_pull_legs_upper_lower', title: 'Push/Pull/Legs/Upper/Lower' },
                  ];
                }
                // 6 days options
                else if (days === 6) {
                  splitOptions = [
                    { value: 'upper_lower_full_2x', title: '2x Upper/Lower/Full Body', recommended: true },
                    { value: 'upper_lower_3x', title: '3x Upper/Lower' },
                    { value: 'push_pull_legs_2x', title: '2x Push/Pull/Legs' },
                    { value: 'full_body_6x', title: '6x Full Body' },
                    { value: 'push_pull_legs_upper_lower_full', title: 'Push/Pull/Legs/Upper/Lower/Full Body' },
                  ];
                }
                // Default options for other day counts
                else {
                  splitOptions = [
                    { value: 'full_body', title: 'Full Body', recommended: true },
                  ];
                }
                
                return splitOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.splitOptionCard,
                      { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' },
                      formData.workoutSplit === option.value && 
                      { backgroundColor: '#4A90E2' }
                    ]}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        workoutSplit: option.value
                      }));
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[
                        styles.splitTitle,
                        { 
                          color: formData.workoutSplit === option.value 
                            ? 'white' 
                            : colors.text 
                        }
                      ]}>
                        {option.title}
                      </Text>
                      {option.recommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ));
              })()}
            </View>
          </ScrollView>
        </View>
      )
    },
    {
      title: "Training Volume 🔄",
      subtitle: "Choose your sets per exercise",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>Sets per exercise</Text>
          <View style={styles.setsContainer}>
            {[
              { value: '2', title: '2 Sets', recommended: true },
              { value: '3', title: '3 Sets' },
              { value: '4', title: '4 Sets' },
              { value: '5', title: '5 Sets' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.setsCard,
                  { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' },
                  formData.setsPerExercise === option.value && 
                  { backgroundColor: '#4A90E2' }
                ]}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    setsPerExercise: option.value
                  }));
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[
                    styles.setsTitle,
                    { 
                      color: formData.setsPerExercise === option.value 
                        ? 'white' 
                        : colors.text 
                    }
                  ]}>
                    {option.title}
                  </Text>
                  {option.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    {
      title: "Rest Period ⏱️",
      subtitle: "Choose your rest time between sets",
      content: (
        <View style={styles.pageContent}>
          <Text style={[styles.label, { color: colors.text }]}>Rest time (minutes)</Text>
          <View style={styles.restContainer}>
            {(() => {
              const goal = formData.goals;
              let restOptions = [];
              
              if (goal === 'Gain muscle' || goal === 'Lose fat') {
                restOptions = [
                  { value: '2-3', title: '2-3 min', recommended: true },
                  { value: '1-2', title: '1-2 min' },
                  { value: '3+', title: '3+ min' },
                ];
              } else if (goal === 'Gain strength') {
                restOptions = [
                  { value: '3+', title: '3+ min', recommended: true },
                  { value: '2-3', title: '2-3 min' },
                  { value: '1-2', title: '1-2 min' },
                ];
              } else { // Maintain muscle
                restOptions = [
                  { value: '1-2', title: '1-2 min', recommended: true },
                  { value: '2-3', title: '2-3 min' },
                  { value: '3+', title: '3+ min' },
                ];
              }
              
              return restOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.restCard,
                    { backgroundColor: isDarkMode ? colors.surface : '#f5f5f5' },
                    formData.restTime === option.value && 
                    { backgroundColor: '#4A90E2' }
                  ]}
                  onPress={() => {
                    setFormData(prev => ({
                      ...prev,
                      restTime: option.value
                    }));
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[
                      styles.restTitle,
                      { 
                        color: formData.restTime === option.value 
                          ? 'white' 
                          : colors.text 
                      }
                    ]}>
                      {option.title}
                    </Text>
                    {option.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </View>
        </View>
      )
    }
  ];

  const navigateToPage = (pageIndex: number) => {
    const toValue = -pageIndex * windowWidth;
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
    if (!formData.goals) {
      return 'Please select a fitness goal';
    }
    if (!formData.workoutSplit) {
      return 'Please select a workout split';
    }
    if (!formData.setsPerExercise) {
      return 'Please select the number of sets per exercise';
    }
    if (!formData.restTime) {
      return 'Please select your rest time between sets';
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
        case 4: // Goals
          if (!formData.goals) {
            error = 'Please select your primary fitness goal';
          }
          break;
        case 5: // Workout Split
          if (!formData.workoutSplit) {
            error = 'Please select a workout split';
          }
          break;
        case 6: // Sets per Exercise
          if (!formData.setsPerExercise) {
            error = 'Please select the number of sets per exercise';
          }
          break;
        case 7: // Rest Time
          if (!formData.restTime) {
            error = 'Please select your rest time between sets';
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

  const createStyles = (itemWidth: number) => ({
    pickerItem: {
      width: itemWidth,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    pickerCenter: {
      height: 60,
      borderWidth: 2,
      borderRadius: 12,
      backgroundColor: 'transparent',
      width: itemWidth,
    }
  });

  const dynamicStyles = createStyles(ITEM_WIDTH);

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
              width: windowWidth * pages.length,
            }
          ]}
        >
          {pages.map((page, index) => (
            <View key={index} style={[styles.page, { width: windowWidth }]}>
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
  horizontalPickerContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
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
  horizontalPickerItem: {
    width: 100,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalPickerText: {
    fontWeight: '600',
  },
  selectedPickerText: {
    fontSize: 32,
    opacity: 1,
  },
  unselectedPickerText: {
    fontSize: 20,
    opacity: 0.5,
  },
  pickerContainer: {
    height: 120,
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerContent: {
    alignItems: 'center',
    height: '100%',
  },
  pickerItem: {
    width: ITEM_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  pickerText: {
    fontWeight: '600',
  },
  unitText: {
    fontWeight: '500',
  },
  selectedText: {
    fontSize: 40,
    opacity: 1,
  },
  unselectedText: {
    fontSize: 24,
    opacity: 0.5,
  },
  selectedUnitText: {
    fontSize: 24,
    opacity: 1,
  },
  unselectedUnitText: {
    fontSize: 16,
    opacity: 0.5,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  pickerCenter: {
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
    width: ITEM_WIDTH,
  },
  splitOptionsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  splitOptionCard: {
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
    marginBottom: 10,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  setsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  setsCard: {
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
    marginBottom: 10,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  restContainer: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  restCard: {
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
    marginBottom: 10,
  },
  restTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default SurveyModal; 