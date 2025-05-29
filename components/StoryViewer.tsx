import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Story, markStoryAsViewed, deleteStory } from '@/utils/storyService';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerProps {
  stories: Story[];
  currentUserID: string;
  initialStoryIndex?: number;
  onClose: () => void;
  onComplete: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  currentUserID,
  initialStoryIndex = 0,
  onClose,
  onComplete
}) => {
  const { isDarkMode, colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  
  // Add animation values for entrance effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const videoRef = useRef<Video>(null);
  
  const currentStory = stories[currentIndex];
  const isCurrentUserStory = currentStory?.user_id === currentUserID;
  
  // Effect to animate the entrance of the story viewer
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Setup and start progress animation
  const startProgressAnimation = () => {
    // Reset progress
    progressAnim.setValue(0);
    
    // For videos, we'll let the onPlaybackStatusUpdate handle the progress
    if (currentStory?.story_type === 'video') {
      return;
    }
    
    // For images, animate the progress bar
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    
    progressAnimation.current.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  };
  
  // Pause the progress animation
  const pauseProgressAnimation = () => {
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
  };
  
  // Resume the progress animation
  const resumeProgressAnimation = () => {
    if (currentStory?.story_type === 'video') {
      videoRef.current?.playAsync();
      return;
    }
    
    // Get the current value safely - animated values don't have a public _value property
    // Use interpolate to access current value or toValue as a fallback
    let currentProgress = 0;
    progressAnim.addListener(({ value }) => {
      currentProgress = value;
    });
    
    const remainingTime = STORY_DURATION * (1 - currentProgress);
    
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    });
    
    progressAnimation.current.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  };

  // Handle video playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      
      if (status.isPlaying) {
        // Update progress bar based on video position
        const progress = status.positionMillis / status.durationMillis;
        progressAnim.setValue(progress);
        
        // If video ended, go to next story
        if (status.didJustFinish) {
          goToNextStory();
        }
      }
    }
  };
  
  // Create a custom close handler with animation
  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => {
      // Call the actual onClose after animation completes
      onClose();
    });
  };
  
  // Navigate to the next story
  const goToNextStory = () => {
    // If we're at the last story, call onComplete
    if (currentIndex === stories.length - 1) {
      handleClose(); // Use animated close
      return;
    }
    
    // Otherwise, go to the next story
    setCurrentIndex(prevIndex => prevIndex + 1);
  };
  
  // Navigate to the previous story
  const goToPrevStory = () => {
    // If we're at the first story, call onClose to go back
    if (currentIndex === 0) {
      handleClose(); // Use animated close
      return;
    }
    
    // Otherwise, go to the previous story
    setCurrentIndex(prevIndex => prevIndex - 1);
  };
  
  // Handle long press to pause the story
  const handleLongPress = () => {
    setIsPaused(true);
    pauseProgressAnimation();
  };
  
  // Handle release from long press
  const handlePressOut = () => {
    if (isPaused) {
      setIsPaused(false);
      resumeProgressAnimation();
    }
  };
  
  // Handle tap on left/right sides of the screen
  const handlePress = (direction: 'left' | 'right') => {
    if (isPaused) return;
    
    if (direction === 'left') {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };
  
  // Handle delete story
  const handleDeleteStory = async () => {
    try {
      await deleteStory(currentStory.id);
      
      // If this was the only story, close the viewer
      if (stories.length === 1) {
        handleClose();
        return;
      }
      
      // If this was the last story, go to the previous one
      if (currentIndex === stories.length - 1) {
        setCurrentIndex(currentIndex - 1);
        return;
      }
      
      // Otherwise, just show the next story (the index stays the same as the current story is removed)
      const updatedStories = stories.filter((_, index) => index !== currentIndex);
      if (updatedStories.length === 0) {
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    } finally {
      setShowOptions(false);
    }
  };

  // Effect to mark story as viewed
  useEffect(() => {
    const markAsViewed = async () => {
      if (currentStory && currentStory.user_id !== currentUserID) {
        try {
          await markStoryAsViewed(currentStory.id, currentUserID);
        } catch (error) {
          console.error('Error marking story as viewed:', error);
        }
      }
    };
    
    markAsViewed();
  }, [currentIndex, currentStory, currentUserID]);
  
  // Effect to reset and start animation when story changes
  useEffect(() => {
    setIsLoading(true);
    setIsPaused(false);
    
    // Reset any ongoing animation
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    
    // Small delay to ensure media is loaded
    const timer = setTimeout(() => {
      if (currentStory?.story_type !== 'video') {
        setIsLoading(false);
      }
      startProgressAnimation();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [currentIndex, currentStory]);
  
  // Create progress indicators
  const renderProgressBars = () => {
    return (
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: index === currentIndex
                    ? progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : index < currentIndex
                      ? '100%'
                      : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Story Content */}
      <View style={styles.storyContainer}>
        {/* User Info Header with SafeAreaView */}
        <SafeAreaViewRN style={styles.headerSafeArea} edges={['top']}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.header}
          >
            {renderProgressBars()}
            
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfo}>
                <LinearGradient
                  colors={['#4776E6', '#8E54E9']}
                  style={styles.avatarContainer}
                >
                  {currentStory?.avatar_url ? (
                    <Image 
                      source={{ uri: currentStory.avatar_url }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <FontAwesome name="user" size={18} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
                <View>
                  <Text style={styles.username}>{currentStory?.username || 'User'}</Text>
                  <Text style={styles.timestamp}>{currentStory?.timeAgo || 'now'}</Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                {isCurrentUserStory && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowOptions(true)}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </SafeAreaViewRN>
        
        {/* Media Content */}
        {currentStory?.story_type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.media_url }}
            style={styles.mediaContent}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isPaused}
            isLooping={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />
        ) : (
          <Image
            source={{ uri: currentStory?.media_url }}
            style={styles.mediaContent}
            resizeMode="cover"
            onLoad={() => setIsLoading(false)}
          />
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        
        {/* Touch areas for navigation */}
        <View style={styles.touchContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.touchLeft}
            onPress={() => handlePress('left')}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
          />
          <TouchableOpacity
            activeOpacity={1}
            style={styles.touchRight}
            onPress={() => handlePress('right')}
            onLongPress={handleLongPress}
            onPressOut={handlePressOut}
          />
        </View>
        
        {/* Pause indicator */}
        {isPaused && (
          <View style={styles.pauseContainer}>
            <Ionicons name="pause" size={50} color="#ffffff" />
          </View>
        )}
      </View>
      
      {/* Options Modal */}
      {showOptions && (
        <BlurView intensity={80} style={styles.optionsModal}>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleDeleteStory}
            >
              <Ionicons name="trash-outline" size={24} color="#ff4757" />
              <Text style={[styles.optionText, { color: '#ff4757' }]}>Delete Story</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  storyContainer: {
    flex: 1,
    position: 'relative',
    width: screenWidth,
    height: screenHeight,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    position: 'relative',
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  mediaContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  touchContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchLeft: {
    width: '30%',
    height: '100%',
  },
  touchRight: {
    width: '70%',
    height: '100%',
  },
  pauseContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  optionsModal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  optionsContainer: {
    width: 250,
    backgroundColor: '#2c2c3e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default StoryViewer; 