import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { getExercisePersonalRecords, deletePersonalRecord } from '@/utils/personalRecordsService';
import { PersonalRecord, RecordType } from '@/types/personalRecords';
import AddPRModal from '@/components/AddPRModal';

const { width: screenWidth } = Dimensions.get('window');

export default function ExercisePRDetailsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('strength');

  useEffect(() => {
    if (exerciseId) {
      loadRecords();
    }
  }, [exerciseId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await getExercisePersonalRecords(exerciseId!);
      setRecords(data);
    } catch (error) {
      console.error('Error loading exercise records:', error);
      Alert.alert('Error', 'Failed to load personal records');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this personal record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonalRecord(recordId);
              await loadRecords();
              Alert.alert('Success', 'Personal record deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record');
            }
          },
        },
      ]
    );
  };

  const getRecordsByType = (type: RecordType) => {
    // Map UI types to database types for filtering
    let filterTypes: string[] = [];
    if (type === 'strength') {
      filterTypes = ['strength', 'weight', 'reps'];
    } else if (type === 'endurance') {
      filterTypes = ['endurance', 'time', 'distance'];
    } else {
      filterTypes = [type];
    }
    
    return records
      .filter(record => filterTypes.includes(record.record_type))
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime());
  };

  const getRecordTypeIcon = (type: RecordType) => {
    const icons: Record<RecordType, string> = {
      'strength': 'balance-scale',
      'endurance': 'clock-o',
      'weight': 'balance-scale',
      'reps': 'repeat',
      'time': 'clock-o',
      'distance': 'road',
    };
    return icons[type];
  };

  const formatValue = (value: number, unit: string, reps?: number) => {
    if (reps && unit !== 'reps') {
      return `${value}${unit} x ${reps}`;
    }
    return `${value}${unit}`;
  };

  const recordTypes: RecordType[] = ['strength', 'endurance'];
  const availableTypes = recordTypes.filter(type => {
    if (type === 'strength') {
      return records.some(record => ['strength', 'weight', 'reps'].includes(record.record_type));
    } else if (type === 'endurance') {
      return records.some(record => ['endurance', 'time', 'distance'].includes(record.record_type));
    }
    return records.some(record => record.record_type === type);
  });

  const exerciseName = records[0]?.exercise_name || 'Exercise';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
            Personal Records
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <FontAwesome name="plus" size={18} color="#4a90e2" />
        </TouchableOpacity>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="trophy" size={48} color={colors.text + '40'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Records Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.text + '80' }]}>
            Start tracking your progress by adding your first personal record for this exercise!
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => setShowAddModal(true)}
          >
            <LinearGradient
              colors={['#4a90e2', '#5A7BFF']}
              style={styles.addFirstGradient}
            >
              <FontAwesome name="plus" size={16} color="#ffffff" />
              <Text style={styles.addFirstText}>Add First Record</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Record Type Tabs */}
          {availableTypes.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
              contentContainerStyle={styles.tabsContent}
            >
              {availableTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: selectedRecordType === type ? '#4a90e2' : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setSelectedRecordType(type)}
                >
                  <FontAwesome
                    name={getRecordTypeIcon(type) as any}
                    size={16}
                    color={selectedRecordType === type ? '#ffffff' : colors.text}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: selectedRecordType === type ? '#ffffff' : colors.text }
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Records List */}
          <ScrollView
            style={styles.recordsList}
            contentContainerStyle={styles.recordsContent}
            showsVerticalScrollIndicator={false}
          >
            {getRecordsByType(selectedRecordType).map((record, index) => (
              <View
                key={record.id}
                style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <View style={styles.recordValueContainer}>
                      <Text style={[styles.recordValue, { color: colors.text }]}>
                        {formatValue(record.value, record.unit, record.reps)}
                      </Text>
                      {index === 0 && (
                        <View style={styles.bestBadge}>
                          <FontAwesome name="trophy" size={12} color="#FFD700" />
                          <Text style={styles.bestText}>BEST</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.recordDate, { color: colors.text + '80' }]}>
                      {new Date(record.achieved_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteRecord(record.id)}
                    style={styles.deleteButton}
                  >
                    <FontAwesome name="trash" size={16} color="#FF4757" />
                  </TouchableOpacity>
                </View>
                
                {record.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: colors.text + '80' }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.text }]}>{record.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Add PR Modal */}
      <AddPRModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (newRecord) => {
          try {
            const { createPersonalRecord } = await import('@/utils/personalRecordsService');
            await createPersonalRecord(newRecord);
            await loadRecords();
            Alert.alert('Success', 'Personal record added successfully!');
          } catch (error) {
            console.error('Error adding PR:', error);
            throw error;
          }
        }}
        initialExercise={records[0] ? {
          id: records[0].exercise_id,
          name: records[0].exercise_name,
          bodyPart: records[0].exercise_body_part || '',
          target: records[0].exercise_target || '',
          equipment: records[0].exercise_equipment || '',
        } : undefined}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addFirstButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addFirstText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    paddingVertical: 16,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordsList: {
    flex: 1,
  },
  recordsContent: {
    padding: 16,
  },
  recordCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordInfo: {
    flex: 1,
  },
  recordValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bestText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 4,
  },
  recordDate: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 18,
  },
}); 