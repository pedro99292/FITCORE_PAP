import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { PersonalRecord } from '@/types/personalRecords';

interface PRGoalCardProps {
  goal: PersonalRecord;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkAchieved?: () => void;
}

const PRGoalCard: React.FC<PRGoalCardProps> = ({ 
  goal, 
  onPress, 
  onEdit, 
  onDelete, 
  onMarkAchieved 
}) => {
  const { colors, isDarkMode } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4a90e2';
      case 'achieved':
        return '#4CAF50';
      case 'overdue':
        return '#ff6b6b';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#4a90e2';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'bullseye';
      case 'achieved':
        return 'check';
      case 'overdue':
        return 'exclamation-triangle';
      case 'cancelled':
        return 'times';
      default:
        return 'bullseye';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatValue = (value: number, unit: string, reps?: number) => {
    if (goal.record_type === 'strength' && reps) {
      return `${value}${unit} × ${reps} reps`;
    }
    return `${value}${unit}`;
  };

  const isOverdue = () => {
    if (!goal.target_date) return false;
    return new Date(goal.target_date) < new Date() && goal.status === 'active';
  };

  const getDaysUntilTarget = () => {
    if (!goal.target_date) return null;
    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAchieved = () => {
    Alert.alert(
      'Mark as Achieved',
      'Are you sure you want to mark this goal as achieved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Achieved', onPress: onMarkAchieved }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete }
      ]
    );
  };

  const daysUntilTarget = getDaysUntilTarget();
  const statusColor = getStatusColor(goal.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={
          goal.status === 'achieved' 
            ? isDarkMode 
              ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)']
              : ['rgba(76, 175, 80, 0.08)', 'rgba(76, 175, 80, 0.02)']
            : goal.status === 'overdue' 
            ? isDarkMode
              ? ['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)']
              : ['rgba(255, 107, 107, 0.08)', 'rgba(255, 107, 107, 0.02)']
            : isDarkMode
            ? ['rgba(74, 144, 226, 0.15)', 'rgba(74, 144, 226, 0.05)']
            : ['rgba(74, 144, 226, 0.08)', 'rgba(74, 144, 226, 0.02)']
        }
        style={styles.gradientContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
              <FontAwesome 
                name={getStatusIcon(goal.status)} 
                size={12} 
                color={statusColor} 
              />
              <Text style={[styles.status, { color: statusColor }]}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {goal.status === 'active' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' + '15' }]}
                onPress={handleMarkAchieved}
              >
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </TouchableOpacity>
            )}
            
            {(goal.status === 'active' || goal.status === 'overdue') && onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={onEdit}
              >
                <Ionicons name="pencil" size={16} color={colors.text} />
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ff6b6b' + '15' }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={16} color="#ff6b6b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {goal.exercise_name}
          </Text>
          
          {goal.exercise_body_part && (
            <Text style={[styles.bodyPart, { color: colors.text + '80' }]}>
              {goal.exercise_body_part}
            </Text>
          )}
        </View>

        {/* Goal Details */}
        <View style={styles.goalDetails}>
          <View style={[styles.targetContainer, { backgroundColor: isDarkMode ? colors.background : colors.card }]}>
            <View style={[styles.targetIcon, { backgroundColor: statusColor + '20' }]}>
              <FontAwesome name="bullseye" size={14} color={statusColor} />
            </View>
            <View style={styles.targetInfo}>
              <Text style={[styles.targetLabel, { color: colors.text + '70' }]}>Target</Text>
              <Text style={[styles.targetValue, { color: colors.text }]}>
                {formatValue(goal.target_value || goal.value, goal.unit, goal.target_reps || goal.reps)}
              </Text>
            </View>
            {goal.record_type && (
              <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.typeText, { color: colors.text + '80' }]}>
                  {goal.record_type.charAt(0).toUpperCase() + goal.record_type.slice(1)}
                </Text>
              </View>
            )}
          </View>

          {goal.target_date && (
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.text + '80' }]}>
                Target Date:
              </Text>
              <Text style={[
                styles.goalValue, 
                { 
                  color: isOverdue() ? '#ff6b6b' : colors.text,
                  fontWeight: isOverdue() ? '600' : '400'
                }
              ]}>
                {formatDate(goal.target_date)}
                {daysUntilTarget !== null && (
                  <Text style={[styles.daysText, { 
                    color: daysUntilTarget < 0 ? '#ff6b6b' : daysUntilTarget <= 7 ? '#ff9800' : colors.text + '80' 
                  }]}>
                    {daysUntilTarget < 0 
                      ? ` (${Math.abs(daysUntilTarget)} days overdue)`
                      : daysUntilTarget === 0 
                      ? ' (Today!)'
                      : ` (${daysUntilTarget} days left)`
                    }
                  </Text>
                )}
              </Text>
            </View>
          )}

          {goal.status === 'achieved' && goal.achieved_at && (
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.text + '80' }]}>
                Achieved:
              </Text>
              <Text style={[styles.goalValue, { color: '#4CAF50', fontWeight: '600' }]}>
                {formatDate(goal.achieved_at)}
                {goal.value && (
                  <Text style={{ color: colors.text }}>
                    {' '}({formatValue(goal.value, goal.unit, goal.reps)})
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {goal.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesText, { color: colors.text + '80' }]}>
              {goal.notes}
            </Text>
          </View>
        )}

        {/* Progress Indicator for Active Goals */}
        {goal.status === 'active' && goal.target_date && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: daysUntilTarget && daysUntilTarget < 0 ? '#ff6b6b' : statusColor,
                    width: '0%' // This would be calculated based on current vs target
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  exerciseInfo: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bodyPart: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalDetails: {
    marginTop: 4,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  targetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  targetInfo: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 144, 226, 0.1)',
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default PRGoalCard; 