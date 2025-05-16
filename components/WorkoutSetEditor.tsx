import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSet } from '@/types/exercise';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

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
          {/* Header Row */}
          <View style={styles.labelsRow}>
            <View style={styles.setLabelContainer}>
              <Text style={styles.label}>SET</Text>
            </View>
            
            <View style={styles.repsLabelContainer}>
              <Text style={styles.label}>REPS</Text>
            </View>
            
            <View style={styles.restLabelContainer}>
              <Text style={styles.label}>REST (SEC)</Text>
            </View>
            
            <View style={styles.actionLabelContainer} />
          </View>

          {/* Set Rows */}
          {sets.map((set, index) => (
            <View key={index} style={[
              styles.setRow,
              index === sets.length - 1 && styles.lastSetRow
            ]}>
              {/* Set Number */}
              <View style={styles.setNumberContainer}>
                <Text style={styles.setNumber}>{index + 1}</Text>
              </View>
              
              {/* Reps Input */}
              <View style={styles.repsContainer}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={set.reps?.toString() || ''}
                  onChangeText={(text) => onUpdateSet(index, { reps: text ? parseInt(text) : undefined })}
                  placeholder="10"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              
              {/* Rest Time Input */}
              <View style={styles.restContainer}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={set.duration?.toString() || ''}
                  onChangeText={(text) => onUpdateSet(index, { duration: text ? parseInt(text) : undefined })}
                  placeholder="60"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              
              {/* Delete Button */}
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
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setLabelContainer: {
    width: 40,
  },
  repsLabelContainer: {
    flex: 1.5,
    alignItems: 'center',
  },
  restLabelContainer: {
    flex: 1.5,
    alignItems: 'center',
  },
  actionLabelContainer: {
    width: 44,
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
  repsContainer: {
    flex: 1.5,
    marginHorizontal: 4,
  },
  restContainer: {
    flex: 1.5,
    marginHorizontal: 4,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
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
    marginLeft: 4,
  },
});

export default WorkoutSetEditor; 