import React, { useState, useEffect, useCallback } from 'react';
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
      {selectedCategory === 'Todas' && (
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

// Componente principal da página
const AchievementsPage = () => {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todas']);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [filter, setFilter] = useState('Todas');
  const [loading, setLoading] = useState(true);
  
  // Buscar todas as categorias ao iniciar
  useEffect(() => {
    async function fetchAllCategories() {
      const { data } = await supabase
        .from('achievements')
        .select('category')
        .order('category');
        
      if (data) {
        const uniqueCategories = ['Todas', ...new Set(data.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    }
    
    fetchAllCategories();
  }, []);
  
  // Buscar conquistas filtradas
  useEffect(() => {
    async function fetchAchievements() {
      setLoading(true);
      
      let query = supabase.from('achievements').select('*');
      
      // Aplicar filtro de categoria
      if (selectedCategory !== 'Todas') {
        query = query.eq('category', selectedCategory);
      }
      
      // Aplicar filtro de progresso
      if (filter === 'Concluídas') {
        query = query.eq('progress', 100);
      } else if (filter === 'Em Progresso') {
        query = query.lt('progress', 100);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao buscar conquistas:", error);
      } else {
        setAchievements(data || []);
      }
      
      setLoading(false);
    }
    
    fetchAchievements();
  }, [selectedCategory, filter]);

  // Calcular conquistas concluídas e em progresso
  const completedAchievements = achievements.filter(achievement => achievement.progress === 100);
  const inProgressAchievements = achievements.filter(achievement => achievement.progress < 100);
  
  // Exemplo de troféus (seriam baseados nas conquistas)
  const trophies = [
    { id: 1, title: 'Bronze', color: '#CD7F32', unlocked: completedAchievements.length >= 5 },
    { id: 2, title: 'Prata', color: '#C0C0C0', unlocked: completedAchievements.length >= 10 },
    { id: 3, title: 'Ouro', color: '#FFD700', unlocked: completedAchievements.length >= 15 },
    { id: 4, title: 'Platina', color: '#E5E4E2', unlocked: completedAchievements.length >= 20 },
    { id: 5, title: 'Diamante', color: '#B9F2FF', unlocked: completedAchievements.length >= 25 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <Animated.View 
        entering={FadeIn.duration(600)}
        style={styles.header}
      >
        <LinearGradient
          colors={['rgba(74, 144, 226, 0.3)', 'transparent']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Conquistas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedAchievements.length}</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{inProgressAchievements.length}</Text>
              <Text style={styles.statLabel}>Em Progresso</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{achievements.length}</Text>
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
                  key={achievement.id} 
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
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
