import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StoryEditorButton from './StoryEditorButton';
import { fetchActiveStories, UserWithStories } from '@/utils/storyService';

// Example user ID for the current user
const CURRENT_USER_ID = 'user123';

const StoryEditorExample: React.FC = () => {
  const [stories, setStories] = useState<UserWithStories[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch stories on component mount and after new story is created
  const loadStories = async () => {
    try {
      setIsRefreshing(true);
      const activeStories = await fetchActiveStories(CURRENT_USER_ID);
      setStories(activeStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  // Handle story creation
  const handleStoryCreated = () => {
    Alert.alert('Success', 'Story created successfully!');
    loadStories();
  };

  // Render story avatar
  const renderStoryItem = ({ item }: { item: UserWithStories }) => {
    return (
      <TouchableOpacity style={styles.storyItem}>
        <View style={[styles.storyRing, item.hasUnviewedStories && styles.unviewedStoryRing]}>
          <Image
            source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.storyAvatar}
          />
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>

      <View style={styles.storyBar}>
        <View style={styles.createStoryContainer}>
          <StoryEditorButton 
            userId={CURRENT_USER_ID} 
            onStoryCreated={handleStoryCreated} 
          />
        </View>

        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyList}
          onRefresh={loadStories}
          refreshing={isRefreshing}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="images-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>
            Create your first story by tapping the "Create Story" button above!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  storyBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  createStoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  storyList: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unviewedStoryRing: {
    borderColor: '#4a90e2',
  },
  storyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  storyUsername: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    width: 68,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default StoryEditorExample; 