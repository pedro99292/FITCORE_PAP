import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PRSummary, RecordType } from '@/types/personalRecords';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

interface PRCardProps {
  prSummary: PRSummary;
  onPress: () => void;
}

const PRCard: React.FC<PRCardProps> = ({ prSummary, onPress }) => {
  const { colors, isDarkMode } = useTheme();

  const getBodyPartIcon = (bodyPart?: string) => {
    const icons: Record<string, { library: 'material' | 'ionicons' | 'fontawesome'; name: string }> = {
      'chest': { library: 'material', name: 'dumbbell' },
      'back': { library: 'material', name: 'dumbbell' },
      'shoulders': { library: 'material', name: 'dumbbell' },
      'arms': { library: 'ionicons', name: 'fitness-outline' },
      'legs': { library: 'ionicons', name: 'walk-outline' },
      'abs': { library: 'ionicons', name: 'body-outline' },
      'core': { library: 'ionicons', name: 'body-outline' },
      'cardio': { library: 'ionicons', name: 'heart-outline' },
      'biceps': { library: 'material', name: 'dumbbell' },
      'triceps': { library: 'material', name: 'dumbbell' },
      'quadriceps': { library: 'ionicons', name: 'walk-outline' },
      'hamstrings': { library: 'ionicons', name: 'walk-outline' },
      'calves': { library: 'ionicons', name: 'walk-outline' },
      'glutes': { library: 'ionicons', name: 'walk-outline' },
      'upper legs': { library: 'ionicons', name: 'walk-outline' },
      'lower legs': { library: 'ionicons', name: 'walk-outline' },
    };
    return icons[bodyPart?.toLowerCase() || ''] || { library: 'ionicons', name: 'fitness-outline' };
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
  const availableRecords = recordTypes.filter(type => prSummary.latest_records[type]);

  const renderBodyPartIcon = (bodyPart?: string) => {
    const iconConfig = getBodyPartIcon(bodyPart);
    
    switch (iconConfig.library) {
      case 'material':
        return (
          <MaterialCommunityIcons 
            name={iconConfig.name as any} 
            size={24} 
            color="#4a90e2" 
          />
        );
      case 'fontawesome':
        return (
          <FontAwesome 
            name={iconConfig.name as any} 
            size={24} 
            color="#4a90e2" 
          />
        );
      default:
        return (
          <Ionicons 
            name={iconConfig.name as any} 
            size={24} 
            color="#4a90e2" 
          />
        );
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={isDarkMode ? ['#3e3e50', '#2c2c3e'] : ['#ffffff', '#f8f9fa']}
        style={[styles.card, { shadowColor: isDarkMode ? '#000' : '#333' }]}
      >
        <View style={styles.header}>
          <View style={styles.exerciseInfo}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}>
              {renderBodyPartIcon(prSummary.exercise_body_part)}
            </View>
            <View style={styles.textInfo}>
              <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                {prSummary.exercise_name}
              </Text>
              <Text style={[styles.bodyPart, { color: colors.text + '80' }]} numberOfLines={1}>
                {prSummary.exercise_body_part || prSummary.exercise_target || 'Unknown'}
              </Text>
            </View>
          </View>
          <View style={styles.totalRecords}>
            <Text style={[styles.totalText, { color: colors.text + '80' }]}>
              {prSummary.total_records} PRs
            </Text>
          </View>
        </View>

        <View style={styles.recordsContainer}>
          {availableRecords.slice(0, 3).map((recordType) => {
            const record = prSummary.latest_records[recordType]!;
            return (
              <View key={recordType} style={[styles.recordItem, { backgroundColor: colors.background + '40' }]}>
                <FontAwesome 
                  name={getRecordTypeIcon(recordType) as any} 
                  size={14} 
                  color="#4a90e2" 
                  style={styles.recordIcon}
                />
                <View style={styles.recordInfo}>
                  <Text style={[styles.recordType, { color: colors.text + '80' }]}>
                    {recordType.toUpperCase()}
                  </Text>
                  <Text style={[styles.recordValue, { color: colors.text }]}>
                    {formatValue(record.value, record.unit, record.reps)}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {availableRecords.length > 3 && (
            <View style={[styles.moreRecords, { backgroundColor: colors.background + '40' }]}>
              <Text style={[styles.moreText, { color: colors.text + '80' }]}>
                +{availableRecords.length - 3}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.lastUpdate, { color: colors.text + '60' }]}>
            Last update: {new Date(
              Math.max(...availableRecords.map(type => 
                new Date(prSummary.latest_records[type]!.achieved_at).getTime()
              ))
            ).toLocaleDateString()}
          </Text>
          <FontAwesome name="chevron-right" size={12} color={colors.text + '60'} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  bodyPart: {
    fontSize: 13,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  totalRecords: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    minWidth: (screenWidth - 56) / 3 - 10,
    maxWidth: (screenWidth - 56) / 2,
  },
  recordIcon: {
    marginRight: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordType: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  moreRecords: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4a90e2',
    minWidth: (screenWidth - 56) / 3 - 10,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  lastUpdate: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PRCard; 