import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
const ACHIEVEMENTS_DATA: Achievement[] = [
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
    id: 8,
    title: "Form Focused",
    description: "View 20 exercise instruction animations.",
    icon: "play-circle-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF5722",
    category: "Workout Mastery"
  },
  {
    id: 9,
    title: "Rest is Best",
    description: "Consistently adhere to rest times for 30 workouts.",
    icon: "time-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#607D8B",
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
    id: 15,
    title: "Graph Guru",
    description: "Analyze your workout stats 50 times.",
    icon: "stats-chart-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#9C27B0",
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
    category: "Progress"
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
  {
    id: 18,
    title: "Workout Historian",
    description: "Review your workout history 25 times.",
    icon: "library-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#607D8B",
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
    description: "Workout before 7 AM for 30 days.",
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
    id: 27,
    title: "Routine Ritualist",
    description: "Maintain the same workout schedule for a month.",
    icon: "repeat-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#00BCD4",
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
    id: 33,
    title: "Weight Wizard",
    description: "Successfully track and manage your weight for 3 months.",
    icon: "fitness-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#9C27B0",
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
    description: "Share your first workout update.",
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
    description: "Create 10 Instagram-style stories.",
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
    id: 43,
    title: "Location Scout",
    description: "Tag locations in 25 posts.",
    icon: "location-outline",
    iconType: "ionicons",
    progress: 0,
    color: "#FF5722",
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
    title: "Milestone Marvel",
    description: "Achieve 50 unique milestones.",
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
    id: 52,
    title: "Transformation Triumph",
    description: "Document an extraordinary physical transformation.",
    icon: "refresh",
    iconType: "fontawesome",
    progress: 0,
    color: "#4CAF50",
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

// Componente de item de conquista modernizado
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
              <Text style={styles.completedText}>Concluído</Text>
                </View>
          ) : (
            <View style={styles.inProgressBadge}>
              <Ionicons name="time-outline" size={16} color="#FF9800" />
              <Text style={styles.inProgressText}>Em progresso</Text>
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

// Componente para os filtros de categoria
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity 
            key={category} 
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.activeCategoryChip,
            ]}
            onPress={() => onSelect(category)}
          >
            <LinearGradient
              colors={selectedCategory === category 
                ? ['#4a90e2', '#3570b2'] 
                : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryGradient}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.activeCategoryChipText
                ]}
              >
                {category}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Indicador de seleção separado, em vez de estender a borda */}
      {selectedCategory === 'All' && (
        <View style={styles.selectionIndicator} />
      )}
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
          currentFilter === 'Todas' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('Todas')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'Todas' && styles.activeStatusTabText
        ]}>
          Todas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.statusTab,
          currentFilter === 'Concluídas' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('Concluídas')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'Concluídas' && styles.activeStatusTabText
        ]}>
          Concluídas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.statusTab,
          currentFilter === 'Em Progresso' && styles.activeStatusTab
        ]}
        onPress={() => onFilterChange('Em Progresso')}
      >
        <Text style={[
          styles.statusTabText,
          currentFilter === 'Em Progresso' && styles.activeStatusTabText
        ]}>
          Em Progresso
        </Text>
      </TouchableOpacity>
        </View>
    );
};

// Memoized AchievementsPage component to improve performance
const AchievementsPage = () => {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [filter, setFilter] = useState('Todas');
  const [loading, setLoading] = useState(false);
  
  // For trophies section
  const trophies = useMemo(() => [
    { id: 1, title: 'Bronze', color: '#CD7F32', unlocked: achievements.filter(a => a.progress === 100).length >= 5 },
    { id: 2, title: 'Prata', color: '#C0C0C0', unlocked: achievements.filter(a => a.progress === 100).length >= 10 },
    { id: 3, title: 'Ouro', color: '#FFD700', unlocked: achievements.filter(a => a.progress === 100).length >= 15 },
    { id: 4, title: 'Platina', color: '#E5E4E2', unlocked: achievements.filter(a => a.progress === 100).length >= 20 },
    { id: 5, title: 'Diamante', color: '#B9F2FF', unlocked: achievements.filter(a => a.progress === 100).length >= 25 },
  ], [achievements]);
  
  // Format value with K suffix if over 1000
  const formatValue = (val: number): string => {
    if (val >= 1000) {
      if (val < 10000) {
        // Format with one decimal place (like 1.2K)
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        // Format without decimal places (like 10K)
        return Math.floor(val / 1000) + 'K';
      }
    }
    return val.toString();
  };
  
  // Initialize categories from static data
  useEffect(() => {
    const uniqueCategories = ['Todas', ...new Set(ACHIEVEMENTS_DATA.map(item => item.category))];
    setCategories(uniqueCategories);
  }, []);
  
  // Filter achievements based on selected category and status
  const filteredAchievements = useMemo(() => {
    let filtered = ACHIEVEMENTS_DATA;
    
    // Apply category filter
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }
    
    // Apply progress filter
    if (filter === 'Concluídas') {
      filtered = filtered.filter(achievement => achievement.progress === 100);
    } else if (filter === 'Em Progresso') {
      filtered = filtered.filter(achievement => achievement.progress < 100);
    }
    
    return filtered;
  }, [selectedCategory, filter]);

  // Update achievements state when filters change
  useEffect(() => {
    setAchievements(filteredAchievements);
  }, [filteredAchievements]);

  // Calcular conquistas concluídas e em progresso
  const completedAchievements = achievements.filter(achievement => achievement.progress === 100);
  const inProgressAchievements = achievements.filter(achievement => achievement.progress < 100);
    
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
          <Text style={styles.headerTitle}>Conquistas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatValue(completedAchievements.length)}</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatValue(inProgressAchievements.length)}</Text>
              <Text style={styles.statLabel}>Em Progresso</Text>
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
      
      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Achievements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'Todas' 
                ? 'Todas as Conquistas' 
                : `Conquistas: ${selectedCategory}`}
            </Text>
                </View>
                
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a90e2" />
              <Text style={styles.loadingText}>Carregando conquistas...</Text>
            </View>
          ) : achievements.length > 0 ? (
                <View style={styles.achievementsList}>
              {achievements.map((achievement) => (
                        <AchievementItem 
                            key={achievement.achievement_id || achievement.id} 
                            title={achievement.title} 
                            description={achievement.description} 
                  date={achievement.date || ''} 
                            icon={achievement.icon}
                  iconType={achievement.iconType} 
                            progress={achievement.progress}
                            color={achievement.color}
                  category={achievement.category} 
                        />
                    ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="trophy-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateText}>
                Nenhuma conquista encontrada
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tente alterar os filtros ou complete mais desafios
              </Text>
            </View>
          )}
                </View>
                
        {/* Trophies Section */}
        <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coleção de Troféus</Text>
            <Text style={styles.sectionSubtitle}>
              Complete mais conquistas para desbloquear troféus
            </Text>
                    </View>
          
          <View style={styles.trophiesContainer}>
            {trophies.map((trophy) => (
              <TrophyCard 
                key={trophy.id}
                color={trophy.color}
                title={trophy.title}
                unlocked={trophy.unlocked}
              />
                        ))}
                    </View>
                </View>
            </ScrollView>
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
    position: 'absolute',
    bottom: -6,
    left: 28, // Posição aproximada para "Todas"
    width: 40,
    height: 3,
    backgroundColor: '#FF9800',
    borderRadius: 2,
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
    paddingBottom: 30,
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
        flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
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
});

export default AchievementsPage;
