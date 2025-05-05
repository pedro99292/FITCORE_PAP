import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSet } from '@/types/exercise';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

type WorkoutSetEditorProps = {
  sets: WorkoutSet[];
  onAddSet: () => void;
  onUpdateSet: (index: number, set: Partial<WorkoutSet>) => void;
  onRemoveSet: (index: number) => void;
  exerciseType?: 'weight_reps' | 'time' | 'distance'; // Default to weight_reps
};

const WorkoutSetEditor: React.FC<WorkoutSetEditorProps> = ({
  sets,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  exerciseType = 'weight_reps'
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handleAddSet = () => {
    animateButton();
    onAddSet();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sets</Text>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddSet}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Set</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {sets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={32} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyText}>No sets added yet</Text>
          <Text style={styles.emptySubtext}>Add a set to get started</Text>
        </View>
      ) : (
        <View style={styles.setsContainer}>
          <LinearGradient 
            colors={['rgba(74, 144, 226, 0.2)', 'rgba(74, 144, 226, 0.05)']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 0}}
            style={styles.labelsRow}
          >
            <Text style={[styles.label, styles.setLabel]}>SET</Text>
            
            {exerciseType === 'weight_reps' && (
              <Text style={[styles.label, styles.repsLabel]}>REPS</Text>
            )}
            
            {exerciseType === 'time' && (
              <Text style={[styles.label, styles.timeLabel]}>TIME (sec)</Text>
            )}
            
            {exerciseType === 'distance' && (
              <>
                <Text style={[styles.label, styles.distanceLabel]}>DISTANCE (m)</Text>
                <Text style={[styles.label, styles.timeLabel]}>TIME (sec)</Text>
              </>
            )}
            
            <View style={styles.actionLabelContainer}>
              <Text style={[styles.label, styles.actionLabel]}></Text>
            </View>
          </LinearGradient>

          {sets.map((set, index) => (
            <View key={index} style={[
              styles.setRow,
              index === sets.length - 1 && styles.lastSetRow
            ]}>
              <View style={styles.setNumberContainer}>
                <Text style={styles.setNumber}>{index + 1}</Text>
              </View>
              
              {exerciseType === 'weight_reps' && (
                <TextInput
                  style={styles.inputWide}
                  keyboardType="numeric"
                  value={set.reps?.toString() || ''}
                  onChangeText={(text) => onUpdateSet(index, { reps: text ? parseInt(text) : undefined })}
                  placeholder="10"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              )}
              
              {exerciseType === 'time' && (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={set.duration?.toString() || ''}
                  onChangeText={(text) => onUpdateSet(index, { duration: text ? parseInt(text) : undefined })}
                  placeholder="60"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              )}
              
              {exerciseType === 'distance' && (
                <>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={set.distance?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(index, { distance: text ? parseFloat(text) : undefined })}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={set.duration?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(index, { duration: text ? parseInt(text) : undefined })}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </>
              )}
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveSet(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  setsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  labelsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setLabel: {
    width: 40,
  },
  repsLabel: {
    flex: 1,
    textAlign: 'center',
    marginRight: 50,
  },
  weightLabel: {
    flex: 1,
    textAlign: 'center',
  },
  timeLabel: {
    flex: 2,
    textAlign: 'center',
  },
  distanceLabel: {
    flex: 1,
    textAlign: 'center',
  },
  actionLabelContainer: {
    width: 44,
    alignItems: 'center',
  },
  actionLabel: {
    width: 44,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  lastSetRow: {
    borderBottomWidth: 0,
  },
  setNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90e2',
  },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  inputWide: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,0,0,0.1)',
  },
});

export default WorkoutSetEditor; 