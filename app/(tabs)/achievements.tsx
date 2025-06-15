import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/utils/supabase';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getUserAchievements, 
  updateAllAchievements, 
  getAchievementStats,
  initializeUserAchievements,
  UserAchievement
} from '@/utils/achievementService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CACHE_KEY = 'user_achievements_cache';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

type IconType = 'fontawesome' | 'ionicons' | 'material';

interface AchievementItemProps {
    title: string;
    description: string;
    date: string;
    icon: string;
    iconType: IconType;
    progress: number;
    color: string;
    category: string;
}

interface Achievement {
  id: number;
  achievement_id?: number;
  title: string;
  description: string;
  date?: string;
  icon: string;
  iconType: IconType;
  progress: number;
  color: string;
  category: string;
  points?: number;
}

// Static achievements data
export const ACHIEVEMENTS_DATA: Achievement[] = [
  // 🏋️‍♂️ Workout Mastery
  {
    id: 1,
    title: "First Rep",
    description: "Complete your first workout session.",
    icon: "fitness-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#4CAF50",
    category: "Workout Mastery"
  },
  {
    id: 2,
    title: "Consistency Rookie",
    description: "Workout consistently for 7 days.",
    icon: "calendar-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#2196F3",
    category: "Workout Mastery"
  },
  {
    id: 3,
    title: "Fitness Enthusiast",
    description: "Complete 50 workouts.",
    icon: "barbell-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF9800",
    category: "Workout Mastery"
  },
  {
    id: 4,
    title: "Workout Warrior",
    description: "Finish 100 workouts.",
    icon: "shield-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#E91E63",
    category: "Workout Mastery"
  },
  {
    id: 5,
    title: "Routine Expert",
    description: "Create and use 10 custom workout templates.",
    icon: "create-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#9C27B0",
    category: "Workout Mastery"
  },
  {
    id: 7,
    title: "Exercise Explorer",
    description: "Perform 50 unique exercises.",
    icon: "search-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#00BCD4",
    category: "Workout Mastery"
  },
  {
    id: 10,
    title: "Custom Crafter",
    description: "Build and complete 5 personalized workouts.",
    icon: "construct-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#795548",
    category: "Workout Mastery"
  },

  // 📈 Progress
  {
    id: 11,
    title: "Tracker Beginner",
    description: "Log your first workout.",
    icon: "list-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#4CAF50",
    category: "Progress"
  },
  {
    id: 12,
    title: "Volume Victor",
    description: "Lift a cumulative total of 10,000 kg.",
    icon: "trending-up-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF9800",
    category: "Progress"
  },
  {
    id: 13,
    title: "Strength Seeker",
    description: "Set 5 personal bests.",
    icon: "trophy-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FFD700",
    category: "Progress"
  },
  {
    id: 14,
    title: "Endurance Ace",
    description: "Record a total of 100 workout hours.",
    icon: "timer-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#2196F3",
    category: "Progress"
  },
  {
    id: 16,
    title: "Visual Vanguard",
    description: "Upload 10 progress photos.",
    icon: "camera-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#E91E63",
    category: "Social"
  },
  {
    id: 17,
    title: "Record Breaker",
    description: "Achieve 20 new personal records.",
    icon: "medal-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF5722",
    category: "Progress"
  },
  // 🔥 Consistency
  {
    id: 19,
    title: "First Streak",
    description: "Workout 3 days in a row.",
    icon: "flame-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF5722",
    category: "Consistency"
  },
  {
    id: 20,
    title: "Week Warrior",
    description: "Maintain a workout streak of 7 days.",
    icon: "flash-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF9800",
    category: "Consistency"
  },
  {
    id: 21,
    title: "Month of Motivation",
    description: "Keep a 30-day workout streak.",
    icon: "calendar-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#4CAF50",
    category: "Consistency"
  },
  {
    id: 22,
    title: "Unstoppable",
    description: "Maintain a workout streak of 60 days.",
    icon: "infinite-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#2196F3",
    category: "Consistency"
  },
  {
    id: 23,
    title: "Habit Hero",
    description: "Achieve a 100-day workout streak.",
    icon: "ribbon-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#9C27B0",
    category: "Consistency"
  },
  {
    id: 24,
    title: "Early Bird",
    description: "Workout before 7 AM 10 times.",
    icon: "sunny-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FFD700",
    category: "Consistency"
  },
  {
    id: 25,
    title: "Night Owl",
    description: "Workout after 9 PM for 30 days.",
    icon: "moon-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#3F51B5",
    category: "Consistency"
  },
  {
    id: 26,
    title: "Weekend Warrior",
    description: "Workout every weekend for a month.",
    icon: "calendar-week",
    iconType: "material",
    progress: 0,
    color: "#E91E63",
    category: "Consistency"
  },
  {
    id: 28,
    title: "Consistency Champion",
    description: "Complete 200 total workouts.",
    icon: "trophy-variant",
    iconType: "material",
    progress: 0,
    color: "#795548",
    category: "Consistency"
  },

  // 🎯 Goals & Milestones
  {
    id: 29,
    title: "Goal Setter",
    description: "Set your first fitness goal.",
    icon: "flag-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#4CAF50",
    category: "Goals & Milestones"
  },
  {
    id: 30,
    title: "Goal Getter",
    description: "Achieve your first set fitness goal.",
    icon: "checkmark-done-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF9800",
    category: "Goals & Milestones"
  },
  {
    id: 31,
    title: "Lift Legend",
    description: "Hit a major strength milestone (e.g., bench press your bodyweight).",
    icon: "barbell-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#E91E63",
    category: "Goals & Milestones"
  },
  {
    id: 32,
    title: "Endurance Elite",
    description: "Run or perform cardio for 100 cumulative hours.",
    icon: "walk-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#2196F3",
    category: "Goals & Milestones"
  },
  {
    id: 34,
    title: "Fitness Veteran",
    description: "Reach advanced experience level.",
    icon: "star-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FFD700",
    category: "Goals & Milestones"
  },
  {
    id: 35,
    title: "Elite Athlete",
    description: "Achieve advanced level in multiple muscle areas.",
    icon: "medal-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF5722",
    category: "Goals & Milestones"
  },

  // 👥 Social
  {
    id: 36,
    title: "First Post",
    description: "Share your first Post.",
    icon: "chatbox-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#4CAF50",
    category: "Social"
  },
  {
    id: 37,
    title: "Community Contributor",
    description: "Post 20 times in the social feed.",
    icon: "people-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#2196F3",
    category: "Social"
  },
  {
    id: 38,
    title: "Inspiration Icon",
    description: "Receive 100 likes on a single post.",
    icon: "heart-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#E91E63",
    category: "Social"
  },
  {
    id: 39,
    title: "Engagement Expert",
    description: "Comment 50 times on community posts.",
    icon: "chatbubbles-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF9800",
    category: "Social"
  },
  {
    id: 40,
    title: "Storyteller",
    description: "Create 10 stories.",
    icon: "camera-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#9C27B0",
    category: "Social"
  },
  {
    id: 41,
    title: "Follower Fanatic",
    description: "Follow 50 other fitness enthusiasts.",
    icon: "person-add-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#00BCD4",
    category: "Social"
  },
  {
    id: 42,
    title: "Emoji Enthusiast",
    description: "React to 100 posts with emojis.",
    icon: "happy-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FFD700",
    category: "Social"
  },
  {
    id: 44,
    title: "Social Star",
    description: "Reach 500 followers.",
    icon: "star-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#795548",
    category: "Social"
  },

  // 🥇 Special Trophies
  {
    id: 45,
    title: "Iron Titan",
    description: "Lift a cumulative total of 100,000 kg.",
    icon: "trophy",
    iconType: "fontawesome",
    progress: 0,
    color: "#8BC34A",
    category: "Special Trophies"
  },
  {
    id: 46,
    title: "Endurance Emperor",
    description: "Accumulate 500 hours of exercise.",
    icon: "crown",
    iconType: "fontawesome",
    progress: 0,
    color: "#FFD700",
    category: "Special Trophies"
  },
  {
    id: 47,
    title: "Consistency Conqueror",
    description: "Workout every week for one full year.",
    icon: "calendar",
    iconType: "fontawesome",
    progress: 0,
    color: "#E91E63",
    category: "Special Trophies"
  },
  {
    id: 48,
    title: "Achievement Marvel",
    description: "Achieve 50 unique achievements.",
    icon: "diamond",
    iconType: "fontawesome",
    progress: 0,
    color: "#9C27B0",
    category: "Special Trophies"
  },
  {
    id: 49,
    title: "Ultimate Athlete",
    description: "Achieve advanced-level status across all muscle categories.",
    icon: "star",
    iconType: "fontawesome",
    progress: 0,
    color: "#FF5722",
    category: "Special Trophies"
  },
  {
    id: 50,
    title: "Legendary Lifter",
    description: "Set a personal best of twice your body weight.",
    icon: "trophy",
    iconType: "fontawesome",
    progress: 0,
    color: "#607D8B",
    category: "Special Trophies"
  },
  {
    id: 51,
    title: "Time Keeper",
    description: "Accumulate 1000 total hours of workouts.",
    icon: "clock-o",
    iconType: "fontawesome",
    progress: 0,
    color: "#00BCD4",
    category: "Special Trophies"
  },
  {
    id: 53,
    title: "Community Leader",
    description: "Be featured as a top community contributor.",
    icon: "users",
    iconType: "fontawesome",
    progress: 0,
    color: "#2196F3",
    category: "Special Trophies"
  },
  {
    id: 54,
    title: "Fitness Icon",
    description: "Unlock every achievement in the app.",
    icon: "trophy",
    iconType: "fontawesome",
    progress: 0,
    color: "#FFD700",
    category: "Special Trophies"
  }
];

// Skeleton loading component for achievements
const AchievementSkeleton = () => {
  const styles = StyleSheet.create({
    achievementCard: {
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
      elevation: 8,
    },
    cardGradient: {
      borderRadius: 16,
      padding: 15,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    categoryBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressBackground: {
      flex: 1,
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 4,
      overflow: 'hidden',
      marginRight: 10,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inProgressBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 152, 0, 0.2)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    }
  });

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.achievementCard}
    >
      <View style={[styles.cardGradient, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          
          <View style={styles.titleContainer}>
            <View style={{ width: '70%', height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
            <View style={[styles.categoryBadge, { width: '40%', marginTop: 8, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={{ width: '100%', height: 12, backgroundColor: 'transparent' }} />
            </View>
          </View>
        </View>
        
        <View style={{ width: '90%', height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginVertical: 10 }} />
        <View style={{ width: '60%', height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 15 }} />
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: '30%', backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          </View>
          <View style={{ width: 30, height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
        </View>
        
        <View style={styles.cardFooter}>
          <View style={[styles.inProgressBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={{ width: 70, height: 12, backgroundColor: 'transparent' }} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Component for achievement item remains mostly the same
const AchievementItem: React.FC<AchievementItemProps> = ({ 
  title, 
  description, 
  date, 
  icon, 
  iconType, 
  progress, 
  color, 
  category 
}) => {
  const { colors } = useTheme();
  const progressWidth = useSharedValue(0);
  
  // Animar a barra de progresso na montagem do componente
  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
      transform: [],
    };
  });

    const renderIcon = () => {
    if (iconType === 'fontawesome') {
      return <FontAwesome name={icon as any} size={26} color="#fff" />;
    } else if (iconType === 'material') {
      return <MaterialCommunityIcons name={icon as any} size={26} color="#fff" />;
    } else {
      return <Ionicons name={icon as any} size={26} color="#fff" />;
    }
  };

  // Determina se a conquista está concluída
  const isCompleted = progress === 100;

    return (
    <Animated.View 
      entering={FadeInDown.duration(400).delay(Math.random() * 300)}
      layout={undefined}
      style={styles.achievementCard}
    >
      <LinearGradient
        colors={[`${color}33`, `${color}11`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                {renderIcon()}
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.achievementTitle}>{title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.achievementDescription}>{description}</Text>
        
                <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill,
                progressStyle,
                { backgroundColor: color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
                    </View>
        
        <View style={styles.cardFooter}>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>Completed</Text>
                </View>
          ) : (
            <View style={styles.inProgressBadge}>
              <Ionicons name="time-outline" size={16} color="#FF9800" />
              <Text style={styles.inProgressText}>In Progress</Text>
            </View>
          )}
          
          {date && (
            <Text style={styles.dateText}>{date}</Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Componente que mostra um troféu
const TrophyCard = ({ color, title, unlocked }: { color: string, title: string, unlocked: boolean }) => {
  return (
    <Animated.View 
      entering={FadeIn.duration(500).delay(Math.random() * 400)}
      layout={undefined}
      style={[styles.trophyCard, { opacity: unlocked ? 1 : 0.5 }]}
    >
      <LinearGradient
        colors={unlocked ? [`${color}CC`, color] : ['#444', '#222']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.trophyGradient}
      >
        <FontAwesome name="trophy" size={32} color={unlocked ? "#FFD700" : "#555"} />
        <Text style={styles.trophyTitle}>{title}</Text>
        {!unlocked && (
          <BlurView intensity={80} style={styles.trophyLock}>
            <FontAwesome name="lock" size={20} color="#FFF" />
          </BlurView>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// CategoryFilter now with horizontal FlatList
const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelect 
}: { 
  categories: string[], 
  selectedCategory: string, 
  onSelect: (category: string) => void 
}) => {
  return (
    <View style={styles.categoryFilterContainer}>
      <FlatList
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.activeCategoryChip,
            ]}
            onPress={() => onSelect(item)}
          >
            <LinearGradient
              colors={selectedCategory === item 
                ? ['#4a90e2', '#3570b2'] 
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryGradient}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.activeCategoryChipText
                ]}
              >
                {item}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Componente da barra de status
const StatusFilter = ({ 
  currentFilter, 
  onFilterChange 
}: { 
  currentFilter: string, 
  onFilterChange: (filter: string) => void 
}) => {
  return (
    <View style={styles.statusFilterContainer}>
      <TouchableOpacity 
        style={[
          styles.statusTab,
          currentFilter === 'All' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('All')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'All' && styles.activeStatusTabText
        ]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.statusTab,
          currentFilter === 'Completed' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('Completed')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'Completed' && styles.activeStatusTabText
        ]}>
          Completed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.statusTab,
          currentFilter === 'In Progress' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('In Progress')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'In Progress' && styles.activeStatusTabText
        ]}>
          In Progress
        </Text>
      </TouchableOpacity>
        </View>
    );
};

// Main component with optimizations
const AchievementsPage = () => {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loadedAllItems, setLoadedAllItems] = useState(false);
  
  // For trophies section
  const trophies = useMemo(() => [
    { id: 1, title: 'Bronze', color: '#CD7F32', unlocked: achievements.filter(a => a.progress === 100).length >= 5 },
    { id: 2, title: 'Silver', color: '#C0C0C0', unlocked: achievements.filter(a => a.progress === 100).length >= 10 },
    { id: 3, title: 'Gold', color: '#FFD700', unlocked: achievements.filter(a => a.progress === 100).length >= 15 },
    { id: 4, title: 'Platinum', color: '#E5E4E2', unlocked: achievements.filter(a => a.progress === 100).length >= 20 },
    { id: 5, title: 'Diamond', color: '#B9F2FF', unlocked: achievements.filter(a => a.progress === 100).length >= 25 },
  ], [achievements]);
  
  // Format value with K suffix if over 1000
  const formatValue = (val: number): string => {
    if (val >= 1000) {
      if (val < 10000) {
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        return Math.floor(val / 1000) + 'K';
      }
    }
    return val.toString();
  };

  // Load data from cache first, then update from server
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { achievements: cachedAchievements, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cached data if not expired
          if (now - timestamp < CACHE_EXPIRY && cachedAchievements.length > 0) {
            setAchievements(cachedAchievements);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading cached achievements:', error);
      }
      
      // Fetch fresh data in background
      fetchUserAchievements();
    };
    
    loadCachedData();
  }, []);

  // Optimized fetch function
  const fetchUserAchievements = useCallback(async () => {
    try {
      // Don't show loading if we already have cached data
      if (achievements.length === 0) {
      setLoading(true);
      }
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      // Get user achievements using the service function
      let userAchievementsData = await getUserAchievements(userId);
      
      // If no achievements exist, initialize them
      if (userAchievementsData.length === 0) {
        await initializeUserAchievements(userId);

        userAchievementsData = await getUserAchievements(userId);
      }

      // Process achievements data
      const mergedAchievements = ACHIEVEMENTS_DATA.map(staticAchievement => {
        const userProgress = userAchievementsData.find(
          ua => ua.achievement_id === staticAchievement.id
        );
        
        return {
          ...staticAchievement,
          progress: userProgress?.progress || 0,
          date: userProgress?.unlocked_at ? new Date(userProgress.unlocked_at).toLocaleDateString('en-US') : undefined
        };
      });

      setAchievements(mergedAchievements);
      
      // Cache the data
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        achievements: mergedAchievements,
        timestamp: Date.now()
      }));
      
      // Update achievements in background without blocking UI
      setTimeout(() => {
        updateAllAchievements(userId).then(newUnlocks => {
          if (newUnlocks.length > 0) {
            // Show notification for new unlocks
            if (Platform.OS === 'web') {
              alert(`🏆 Congratulations! You unlocked ${newUnlocks.length} new achievement${newUnlocks.length === 1 ? '' : 's'}!`);
            } else {
              Alert.alert(
                '🏆 New Achievement Unlocked!',
                `Congratulations! You unlocked ${newUnlocks.length} new achievement${newUnlocks.length === 1 ? '' : 's'}!`,
                [{ text: 'View', style: 'default' }]
              );
            }
            
            // Refresh data after unlocking new achievements
            fetchUserAchievements();
          }
        });
      }, 100);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [achievements.length]);

  // Refresh achievements
  const refreshAchievements = useCallback(async () => {
    setRefreshing(true);
    await AsyncStorage.removeItem(CACHE_KEY); // Clear cache on manual refresh
    await fetchUserAchievements();
  }, [fetchUserAchievements]);
  
  // Initialize categories from static data
  useEffect(() => {
    const uniqueCategories = ['All', ...new Set(ACHIEVEMENTS_DATA.map(item => item.category))];
    setCategories(uniqueCategories);
  }, []);
  
  // Filter achievements based on selected category and status
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }
    
    // Apply progress filter
    if (filter === 'Completed') {
      filtered = filtered.filter(achievement => achievement.progress === 100);
    } else if (filter === 'In Progress') {
      filtered = filtered.filter(achievement => achievement.progress < 100);
    }
    
    // Return the complete filtered list (no pagination)
    return filtered;
  }, [achievements, selectedCategory, filter, itemsPerPage]);

  // Get the paginated achievements for display
  const paginatedAchievements = useMemo(() => {
    return filteredAchievements.slice(0, itemsPerPage);
  }, [filteredAchievements, itemsPerPage]);
  
  // Update loadedAllItems state when filteredAchievements or itemsPerPage changes
  useEffect(() => {
    setLoadedAllItems(filteredAchievements.length <= itemsPerPage);
  }, [filteredAchievements, itemsPerPage]);

  // Load more items when button is clicked
  const handleLoadMore = useCallback(() => {
    setItemsPerPage(prev => prev + 10);
  }, []);
  
  // Reset pagination when filters change
  useEffect(() => {
    setItemsPerPage(10);
    setLoadedAllItems(false);
  }, [selectedCategory, filter]);

  const completedAchievements = useMemo(() => 
    achievements.filter(achievement => achievement.progress === 100),
  [achievements]);
  
  const inProgressAchievements = useMemo(() => 
    achievements.filter(achievement => achievement.progress < 100),
  [achievements]);

  // Render item for FlatList
  const renderAchievementItem = useCallback(({ item }: { item: Achievement }) => (
    <AchievementItem 
      title={item.title} 
      description={item.description} 
      date={item.date || ''} 
      icon={item.icon}
      iconType={item.iconType} 
      progress={item.progress}
      color={item.color}
      category={item.category} 
    />
  ), []);

  // Render trophy item
  const renderTrophyItem = useCallback(({ item }: { item: any }) => (
    <TrophyCard 
      color={item.color}
      title={item.title}
      unlocked={item.unlocked}
    />
  ), []);

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <View key={`skeleton-${index}`} style={{ marginBottom: 15 }}>
        <AchievementSkeleton />
      </View>
    ));
  };
    
    return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(600)}
        layout={undefined}
        style={styles.header}
      >
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.3)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Achievements</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatValue(completedAchievements.length)}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatValue(inProgressAchievements.length)}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatValue(achievements.length)}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Status Filter */}
      <StatusFilter 
        currentFilter={filter}
        onFilterChange={setFilter}
      />
      
      {/* Category Filter */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
      
      {/* Main Content - FlatList instead of ScrollView */}
      <FlatList
        data={loading ? [] : paginatedAchievements}
        keyExtractor={(item) => `achievement-${item.id}`}
        renderItem={renderAchievementItem}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refreshAchievements}
        ListEmptyComponent={() => (
        <View style={styles.sectionContainer}>
          {loading ? (
            <View style={styles.achievementsList}>
                {renderSkeletons()}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="trophy-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateText}>
                  No achievements found
              </Text>
              <Text style={styles.emptyStateSubtext}>
                  Try changing filters or complete more challenges
              </Text>
            </View>
          )}
        </View>
        )}
        ListFooterComponent={() => (
          <>
            {!loading && filteredAchievements.length > paginatedAchievements.length && (
              <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4a90e2', '#3570b2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loadMoreGradient}
                >
                  <Text style={styles.loadMoreText}>Load More</Text>
                  <Ionicons name="chevron-down" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trophy Collection</Text>
                <Text style={styles.sectionSubtitle}>
                  Complete more achievements to unlock trophies
                </Text>
              </View>
              
              <FlatList
                data={trophies}
                keyExtractor={(item) => `trophy-${item.id}`}
                renderItem={renderTrophyItem}
                numColumns={2}
                columnWrapperStyle={styles.trophiesContainer}
              />
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: '#2c2c3e',
    },
    header: {
    paddingTop: 10,
    paddingBottom: 15,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    height: 30,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
        color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statusFilterContainer: {
        flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeStatusTab: {
    borderBottomColor: '#4a90e2',
  },
  statusTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryFilterContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  categoryScroll: {
    marginTop: 5,
  },
  categoryScrollContent: {
        paddingHorizontal: 20,
    paddingVertical: 5,
  },
  categoryChip: {
    marginRight: 10,
        borderRadius: 20,
    overflow: 'hidden',
  },
  selectionIndicator: {
  },
  activeCategoryChip: {
    boxShadow: '0px 2px 3px rgba(74, 144, 226, 0.3)',
    elevation: 4,
  },
  categoryGradient: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
        fontWeight: '500',
    },
  activeCategoryChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    fontSize: 14,
  },
    achievementsList: {
    gap: 15,
  },
  achievementCard: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 15,
  },
  cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    marginBottom: 10,
    },
    iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    marginRight: 12,
    },
  titleContainer: {
        flex: 1,
    },
  achievementTitle: {
    fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  achievementDescription: {
        fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
    lineHeight: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    marginBottom: 12,
    },
    progressBackground: {
        flex: 1,
        height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
    overflow: 'hidden',
        marginRight: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
  progressText: {
    fontSize: 14,
        color: '#fff',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  inProgressBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inProgressText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
        fontWeight: 'bold',
    marginTop: 15,
  },
  emptyStateSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: '80%',
  },
  trophiesContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  trophyCard: {
    width: (screenWidth - 50) / 2.5,
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
    elevation: 8,
    marginBottom: 10,
  },
  trophyGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
        alignItems: 'center',
    padding: 15,
    },
  trophyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
        color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  trophyLock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadMoreButton: {
    marginVertical: 20,
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loadMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default AchievementsPage;
