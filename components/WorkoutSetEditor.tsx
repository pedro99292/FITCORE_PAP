import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSet } from '@/types/exercise';

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sets</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddSet}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Set</Text>
        </TouchableOpacity>
      </View>

      {sets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sets added yet</Text>
          <Text style={styles.emptySubtext}>Add a set to get started</Text>
        </View>
      ) : (
        <View style={styles.setsContainer}>
          <View style={styles.labelsRow}>
            <Text style={[styles.label, styles.setLabel]}>SET</Text>
            
            {exerciseType === 'weight_reps' && (
              <>
                <Text style={[styles.label, styles.repsLabel]}>REPS</Text>
                <Text style={[styles.label, styles.weightLabel]}>WEIGHT</Text>
              </>
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
            
            <Text style={[styles.label, styles.actionLabel]}></Text>
          </View>

          {sets.map((set, index) => (
            <View key={index} style={styles.setRow}>
              <Text style={styles.setNumber}>{index + 1}</Text>
              
              {exerciseType === 'weight_reps' && (
                <>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={set.reps?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(index, { reps: text ? parseInt(text) : undefined })}
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={set.weight?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(index, { weight: text ? parseFloat(text) : undefined })}
                    placeholder="0"
                  />
                </>
              )}
              
              {exerciseType === 'time' && (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={set.duration?.toString() || ''}
                  onChangeText={(text) => onUpdateSet(index, { duration: text ? parseInt(text) : undefined })}
                  placeholder="0"
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
                  />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={set.duration?.toString() || ''}
                    onChangeText={(text) => onUpdateSet(index, { duration: text ? parseInt(text) : undefined })}
                    placeholder="0"
                  />
                </>
              )}
              
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveSet(index)}
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  setsContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  labelsRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  setLabel: {
    width: 40,
  },
  repsLabel: {
    flex: 1,
  },
  weightLabel: {
    flex: 1,
  },
  timeLabel: {
    flex: 2,
  },
  distanceLabel: {
    flex: 1,
  },
  actionLabel: {
    width: 40,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  setNumber: {
    width: 40,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    fontSize: 16,
    color: '#1f2937',
  },
  removeButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
});

export default WorkoutSetEditor; 