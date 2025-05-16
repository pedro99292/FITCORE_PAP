import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Exercise } from '@/types/exercise';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type ExerciseCardProps = {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect, selected }) => {
  const [imageSource, setImageSource] = React.useState(require('@/assets/images/muscle-silhouette-front.png'));
  
  // Determine if the URL is a GIF (ExerciseDB) or an image (Wger)
  const isGif = exercise.gifUrl?.toLowerCase().endsWith('.gif');

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
        
        {/* Data source badge */}
        <View style={[styles.sourceBadge, { 
          backgroundColor: exercise.source === 'exercisedb' ? '#4f46e5' : '#10b981' 
        }]}>
          <Text style={styles.sourceBadgeText}>
            {exercise.source === 'exercisedb' ? 'ExDB' : 'Wger'}
          </Text>
        </View>
        
        {/* Media type indicator */}
        <View style={styles.mediaTypeBadge}>
          <Ionicons 
            name={isGif ? "videocam" : "image-outline"} 
            size={14} 
            color="#fff" 
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={2}>{exercise.name}</Text>
        
        <View style={styles.muscleGroups}>
          <Text style={styles.muscleGroupTitle}>Primary Muscle:</Text>
          <Text style={styles.muscleGroupValue}>{exercise.target}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="body-outline" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{exercise.bodyPart}</Text>
          </View>
          
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
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  sourceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
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
  muscleGroups: {
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 4,
  },
  muscleGroupTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  muscleGroupValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textTransform: 'capitalize',
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