import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Exercise } from '@/types/exercise';
import { Ionicons } from '@expo/vector-icons';

type ExerciseCardProps = {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect, selected }) => {
  const [imageSource, setImageSource] = React.useState(require('@/assets/images/muscle-silhouette-front.png'));

  return (
    <TouchableOpacity 
      style={[styles.container, selected && styles.selectedContainer]} 
      onPress={() => onSelect?.(exercise)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: exercise.gifUrl }}
          style={styles.image}
          resizeMode="contain"
          defaultSource={require('@/assets/images/muscle-silhouette-front.png')}
          onError={(error) => {
            console.log('Error loading image:', exercise.gifUrl);
            // If network image fails, fall back to local silhouette
            setImageSource(require('@/assets/images/muscle-silhouette-front.png'));
          }}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="body-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{exercise.bodyPart}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="fitness-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{exercise.target}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="barbell-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{exercise.equipment}</Text>
          </View>
        </View>

        {selected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    width: windowWidth - 32,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  contentContainer: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

export default ExerciseCard; 