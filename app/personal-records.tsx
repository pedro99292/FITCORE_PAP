import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPRSummaries,
  getPRStats,
  createPersonalRecord,
  searchRecords,
  getRecordsByBodyPart,
} from '@/utils/personalRecordsService';
import { PRSummary, PRStats, NewPersonalRecord } from '@/types/personalRecords';
import PRCard from '@/components/PRCard';
import AddPRModal from '@/components/AddPRModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type FilterType = 'all' | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'abs' | 'cardio';

export default function PersonalRecordsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [prSummaries, setPRSummaries] = useState<PRSummary[]>([]);
  const [stats, setStats] = useState<PRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filteredPRs, setFilteredPRs] = useState<PRSummary[]>([]);

  // Redesigned filter options with proper icons and colors
  const filterOptions: { 
    label: string; 
    value: FilterType; 
    gradient: [string, string];
  }[] = [
    { 
      label: 'All', 
      value: 'all', 
      gradient: ['#667eea', '#764ba2'],
    },
    { 
      label: 'Chest', 
      value: 'chest', 
      gradient: ['#f093fb', '#f5576c'],
    },
    { 
      label: 'Back', 
      value: 'back', 
      gradient: ['#4facfe', '#00f2fe'],
    },
    { 
      label: 'Shoulders', 
      value: 'shoulders', 
      gradient: ['#43e97b', '#38f9d7'],
    },
    { 
      label: 'Arms', 
      value: 'arms', 
      gradient: ['#fa709a', '#fee140'],
    },
    { 
      label: 'Legs', 
      value: 'legs', 
      gradient: ['#a8edea', '#fed6e3'],
    },
    { 
      label: 'Abs', 
      value: 'abs', 
      gradient: ['#ffecd2', '#fcb69f'],
    },
    { 
      label: 'Cardio', 
      value: 'cardio', 
      gradient: ['#ff9a9e', '#fecfef'],
    },
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    filterPRs();
  }, [prSummaries, searchQuery, activeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summariesData, statsData] = await Promise.all([
        getPRSummaries(),
        getPRStats(),
      ]);
      setPRSummaries(summariesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading PR data:', error);
      Alert.alert('Error', 'Failed to load personal records');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterPRs = async () => {
    try {
      let filtered = prSummaries;

      // Apply body part filter
      if (activeFilter !== 'all') {
        filtered = prSummaries.filter(pr => 
          pr.exercise_body_part?.toLowerCase() === activeFilter ||
          pr.exercise_target?.toLowerCase().includes(activeFilter)
        );
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const searchResults = await searchRecords(searchQuery);
        const searchExerciseIds = new Set(searchResults.map(r => r.exercise_id));
        filtered = filtered.filter(pr => searchExerciseIds.has(pr.exercise_id));
      }

      setFilteredPRs(filtered);
    } catch (error) {
      console.error('Error filtering PRs:', error);
      setFilteredPRs(prSummaries);
    }
  };

  const handleAddPR = async (record: NewPersonalRecord) => {
    try {
      await createPersonalRecord(record);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Personal record added successfully!');
    } catch (error) {
      console.error('Error adding PR:', error);
      throw error;
    }
  };

  const handlePRCardPress = (prSummary: PRSummary) => {
    // Navigate to exercise detail page with PR history
    router.push({
      pathname: '/exercise-pr-details',
      params: { exerciseId: prSummary.exercise_id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your PRs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Personal Records</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <FontAwesome name="plus" size={18} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4a90e2']}
            tintColor="#4a90e2"
          />
        }
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['#4a90e2', '#5A7BFF']}
              style={styles.statsCard}
              start={[0, 0]}
              end={[1, 1]}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.total_prs}</Text>
                  <Text style={styles.statLabel}>Total PRs</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.this_month_prs}</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.favorite_body_part}</Text>
                  <Text style={styles.statLabel}>Favorite Part</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.biggest_improvement.improvement_percentage > 0 
                      ? `+${stats.biggest_improvement.improvement_percentage.toFixed(1)}%`
                      : 'No data'
                    }
                  </Text>
                  <Text style={styles.statLabel}>Best Improvement</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome name="search" size={16} color={colors.text + '60'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor={colors.text + '60'}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <FontAwesome name="times" size={14} color={colors.text + '60'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Redesigned Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
            Filter by Muscle Group
          </Text>
          <View style={styles.filtersGrid}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: activeFilter === filter.value ? '#4a90e2' : colors.border,
                    borderWidth: activeFilter === filter.value ? 2 : 1,
                  }
                ]}
                onPress={() => setActiveFilter(filter.value)}
                activeOpacity={0.7}
              >
                {activeFilter === filter.value ? (
                  <View style={[styles.filterCardActive, { backgroundColor: '#4a90e2' }]}>
                    <Text style={styles.filterCardTextActive}>{filter.label}</Text>
                  </View>
                ) : (
                  <View style={styles.filterCardContent}>
                    <Text style={[styles.filterCardText, { color: colors.text }]}>
                      {filter.label}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PR Cards */}
        <View style={styles.prContainer}>
          {filteredPRs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="trophy" size={48} color={colors.text + '40'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery || activeFilter !== 'all' ? 'No PRs Found' : 'No Personal Records Yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text + '80' }]}>
                {searchQuery || activeFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Start tracking your personal records by adding your first PR!'
                }
              </Text>
              {(!searchQuery && activeFilter === 'all') && (
                <TouchableOpacity
                  style={styles.addFirstPRButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <LinearGradient
                    colors={['#4a90e2', '#5A7BFF']}
                    style={styles.addFirstPRGradient}
                  >
                    <FontAwesome name="plus" size={16} color="#ffffff" />
                    <Text style={styles.addFirstPRText}>Add Your First PR</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredPRs.map((prSummary) => (
              <PRCard
                key={prSummary.exercise_id}
                prSummary={prSummary}
                onPress={() => handlePRCardPress(prSummary)}
              />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4a90e2', '#5A7BFF']}
          style={styles.floatingButtonGradient}
        >
          <FontAwesome name="plus" size={20} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add PR Modal */}
      <AddPRModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddPR}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 10,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  searchContainer: {
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
    borderRadius: 12,
  },
  filtersSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterCard: {
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  filterCardActive: {
    borderRadius: 16,
    padding: 0,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  filterCardText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  filterCardTextActive: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#ffffff',
    textAlign: 'center',
  },
  prContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstPRButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstPRGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addFirstPRText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 