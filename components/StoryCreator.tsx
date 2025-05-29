import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  PanResponder,
  Animated
} from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { createStory, pickStoryMedia, captureStoryMedia } from '@/utils/storyService';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define filter configurations
const FILTERS = {
  Normal: { name: 'Normal', overlay: null },
  Grayscale: { 
    name: 'Grayscale', 
    overlay: { backgroundColor: '#000', opacity: 0.5 } 
  },
  Sepia: { 
    name: 'Sepia', 
    overlay: { backgroundColor: '#704214', opacity: 0.2 } 
  },
  Vintage: { 
    name: 'Vintage', 
    overlay: { backgroundColor: '#534741', opacity: 0.2 } 
  },
  Bright: { 
    name: 'Bright', 
    overlay: { backgroundColor: '#FFFFFF', opacity: 0.15 } 
  },
};

interface StoryCreatorProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  userId: string;
}

const StoryCreator: React.FC<StoryCreatorProps> = ({
  visible,
  onClose,
  onStoryCreated,
  userId
}) => {
  const { isDarkMode, colors } = useTheme();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const videoRef = useRef<Video>(null);
  
  // Add animation values for entrance/exit effects
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Editing features state
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textPosition, setTextPosition] = useState<{ x: number, y: number }>({ x: 0.5, y: 0.3 });
  const [activeFilter, setActiveFilter] = useState<keyof typeof FILTERS>('Normal');
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'draw' | 'stickers' | 'crop'>('filters');
  
  // Simpler approach for text dragging - use state directly
  const [textDragPosition, setTextDragPosition] = useState({ x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.3 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Image size/crop state
  const [imageScale, setImageScale] = useState<number>(1);
  const [imageOffset, setImageOffset] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [imageRotation, setImageRotation] = useState<number>(0);

  // Update drag position when text position changes
  useEffect(() => {
    setTextDragPosition({
      x: textPosition.x * SCREEN_WIDTH,
      y: textPosition.y * SCREEN_HEIGHT
    });
  }, [textPosition]);

  // Setup text pan responder with simpler approach
  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        setTextDragPosition({
          x: gesture.moveX,
          y: gesture.moveY
        });
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        
        // Update the text position as percentage of screen
        const newX = Math.max(0, Math.min(1, textDragPosition.x / SCREEN_WIDTH));
        const newY = Math.max(0, Math.min(1, textDragPosition.y / SCREEN_HEIGHT));
        
        setTextPosition({ 
          x: newX,
          y: newY 
        });
      }
    })
  ).current;

  // Effect to animate entrance when visible changes
  useEffect(() => {
    if (visible) {
      // Animate in
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
    }
  }, [visible]);

  const resetState = () => {
    setMediaUri(null);
    setMediaType('image');
    setIsLoading(false);
    setIsPickerVisible(true);
    setShowOptions(false);
    setTextOverlay('');
    setShowTextInput(false);
    setTextColor('#FFFFFF');
    setTextPosition({ x: 0.5, y: 0.3 });
    setTextDragPosition({ x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.3 });
    setActiveFilter('Normal');
    setActiveTab('filters');
    setImageScale(1);
    setImageOffset({x: 0, y: 0});
    setImageRotation(0);
  };

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
      resetState();
      onClose();
    });
  };

  const handlePickImage = async () => {
    try {
      const result = await pickStoryMedia({ mediaTypes: 'Images' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await pickStoryMedia({ mediaTypes: 'Videos' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await captureStoryMedia({ mediaType: 'photo' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRecordVideo = async () => {
    try {
      const result = await captureStoryMedia({ mediaType: 'video' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const handleCreateStory = async () => {
    if (!mediaUri) {
      Alert.alert('Missing Media', 'Please select or capture an image or video.');
      return;
    }

    try {
      setIsLoading(true);
      
      // TODO: In a real implementation, we would need to:
      // 1. Apply the selected filter to the image
      // 2. Render the text overlay onto the image
      // 3. Apply any drawings or stickers
      // 4. Generate a new image/video with all edits applied
      
      await createStory(userId, mediaUri, null, mediaType);
      setIsLoading(false);
      
      // Animate out and then call onStoryCreated
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
        resetState();
        onStoryCreated();
      });
    } catch (error) {
      console.error('Error creating story:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to create story. Please try again.');
    }
  };

  const handleBackToOptions = () => {
    setMediaUri(null);
    setIsPickerVisible(true);
  };
  
  // Editing features handlers
  const handleAddText = () => {
    setShowTextInput(true);
  };
  
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
  };
  
  const handleApplyFilter = (filterName: keyof typeof FILTERS) => {
    setActiveFilter(filterName);
  };

  // Function to handle image scale changes
  const handleScaleChange = (change: number) => {
    setImageScale(prevScale => {
      const newScale = prevScale + change;
      return Math.max(0.5, Math.min(newScale, 2)); // Limit scale between 0.5 and 2
    });
  };

  // Function to handle image rotation
  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };
  
  const renderFilterOptions = () => {
    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {Object.keys(FILTERS).map((filterKey) => {
            const filter = FILTERS[filterKey as keyof typeof FILTERS];
            return (
              <TouchableOpacity 
                key={filterKey}
                style={[
                  styles.filterOption,
                  activeFilter === filterKey && styles.activeFilterOption
                ]}
                onPress={() => handleApplyFilter(filterKey as keyof typeof FILTERS)}
              >
                <View style={styles.filterPreviewContainer}>
                  <Image 
                    source={{ uri: mediaUri || '' }}
                    style={styles.filterPreview}
                  />
                  
                  {/* Filter overlay */}
                  {filter.overlay && (
                    <View 
                      style={[
                        styles.filterPreviewOverlay, 
                        { 
                          backgroundColor: filter.overlay.backgroundColor,
                          opacity: filter.overlay.opacity
                        }
                      ]} 
                    />
                  )}
                </View>
                <Text style={styles.filterName}>{filter.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };
  
  const renderTextTools = () => {
    const colors = ['#FFFFFF', '#FF5252', '#FFD740', '#69F0AE', '#448AFF', '#E040FB'];
    
    return (
      <View style={styles.textTools}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                textColor === color && styles.activeColorOption
              ]}
              onPress={() => handleTextColorChange(color)}
            />
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.addTextButton} onPress={handleAddText}>
          <Feather name="type" size={24} color="#FFFFFF" />
          <Text style={styles.addTextLabel}>Add Text</Text>
        </TouchableOpacity>
        
        {textOverlay && (
          <Text style={styles.dragHint}>Drag text to position it</Text>
        )}
      </View>
    );
  };

  const renderCropTools = () => {
    return (
      <View style={styles.cropTools}>
        <View style={styles.cropControlRow}>
          <TouchableOpacity style={styles.cropButton} onPress={() => handleScaleChange(-0.1)}>
            <Feather name="minus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.scaleText}>{`${Math.round(imageScale * 100)}%`}</Text>
          
          <TouchableOpacity style={styles.cropButton} onPress={() => handleScaleChange(0.1)}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.rotateButton} onPress={handleRotate}>
          <MaterialCommunityIcons name="rotate-right" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Rotate</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderEditingTools = () => {
    return (
      <View style={styles.editingTools}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'filters' && styles.activeTab]} 
            onPress={() => setActiveTab('filters')}
          >
            <MaterialIcons name="photo-filter" size={24} color={activeTab === 'filters' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'filters' && styles.activeTabText]}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'text' && styles.activeTab]} 
            onPress={() => setActiveTab('text')}
          >
            <Feather name="type" size={24} color={activeTab === 'text' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'crop' && styles.activeTab]} 
            onPress={() => setActiveTab('crop')}
          >
            <MaterialCommunityIcons name="crop" size={24} color={activeTab === 'crop' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'crop' && styles.activeTabText]}>Size</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'draw' && styles.activeTab]} 
            onPress={() => setActiveTab('draw')}
          >
            <FontAwesome5 name="paint-brush" size={24} color={activeTab === 'draw' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'draw' && styles.activeTabText]}>Draw</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stickers' && styles.activeTab]} 
            onPress={() => setActiveTab('stickers')}
          >
            <MaterialIcons name="emoji-emotions" size={24} color={activeTab === 'stickers' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'stickers' && styles.activeTabText]}>Stickers</Text>
          </TouchableOpacity>
        </View>
        
        {/* Show the appropriate tool panel based on the active tab */}
        <View style={styles.toolPanel}>
          {activeTab === 'filters' && renderFilterOptions()}
          {activeTab === 'text' && renderTextTools()}
          {activeTab === 'crop' && renderCropTools()}
          {activeTab === 'draw' && (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Drawing tools coming soon</Text>
            </View>
          )}
          {activeTab === 'stickers' && (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Stickers coming soon</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  // Render the media selection view
  if (isPickerVisible) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <BlurView intensity={80} style={styles.modalOverlay} tint={isDarkMode ? "dark" : "light"}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Create Story
              </Text>
              <View style={{width: 24}} />
            </View>

            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Choose an option
              </Text>
              
              <View style={styles.optionsGrid}>
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={32} color="#4a90e2" />
                  <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#000' }]}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                  onPress={handlePickImage}
                >
                  <Ionicons name="image" size={32} color="#4a90e2" />
                  <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#000' }]}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                  onPress={handleRecordVideo}
                >
                  <Ionicons name="videocam" size={32} color="#4a90e2" />
                  <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#000' }]}>Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} 
                  onPress={handlePickVideo}
                >
                  <Ionicons name="film" size={32} color="#4a90e2" />
                  <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#000' }]}>Video Gallery</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.infoText, { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
                Stories disappear after 24 hours
              </Text>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  }

  // Render the editing view
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.editorContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        
        <SafeAreaViewRN style={styles.safeAreaContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={handleBackToOptions}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.editorTitle}>New Story</Text>
            <TouchableOpacity 
              onPress={handleCreateStory}
              disabled={isLoading}
              style={styles.postButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaViewRN>
        
        {/* Media Preview with Filter */}
        <View style={styles.mediaContainer}>
          {/* Main media */}
          {mediaType === 'image' ? (
            <Image
              source={{ uri: mediaUri || '' }}
              style={[
                styles.mediaPreview,
                {
                  transform: [
                    { scale: imageScale },
                    { translateX: imageOffset.x },
                    { translateY: imageOffset.y },
                    { rotate: `${imageRotation}deg` }
                  ]
                }
              ]}
              resizeMode="cover"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: mediaUri || '' }}
              style={[
                styles.mediaPreview,
                {
                  transform: [
                    { scale: imageScale },
                    { translateX: imageOffset.x },
                    { translateY: imageOffset.y },
                    { rotate: `${imageRotation}deg` }
                  ]
                }
              ]}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping
            />
          )}
          
          {/* Filter overlay */}
          {FILTERS[activeFilter]?.overlay && (
            <View 
              style={[
                styles.filterOverlay, 
                { 
                  backgroundColor: FILTERS[activeFilter].overlay?.backgroundColor,
                  opacity: FILTERS[activeFilter].overlay?.opacity,
                }
              ]} 
            />
          )}
          
          {/* Text Overlay */}
          {textOverlay ? (
            <View
              style={[
                styles.textOverlayContainer,
                {
                  top: textDragPosition.y,
                  left: textDragPosition.x,
                  transform: [{ translateX: -100 }, { translateY: -20 }],
                }
              ]}
              {...textPanResponder.panHandlers}
            >
              <Text style={[styles.textOverlay, { color: textColor }]}>
                {textOverlay}
              </Text>
            </View>
          ) : null}
        </View>
        
        {/* Text Input Modal */}
        {showTextInput && (
          <BlurView intensity={50} style={styles.textInputOverlay} tint="dark">
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { color: textColor }]}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={textOverlay}
                onChangeText={setTextOverlay}
                multiline
                autoFocus
              />
              <View style={styles.textInputButtons}>
                <TouchableOpacity onPress={() => setShowTextInput(false)}>
                  <Text style={styles.textInputButton}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTextInput(false)}>
                  <Text style={styles.textInputButton}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        )}
        
        {/* Editing Tools */}
        {renderEditingTools()}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '94%',
    height: '90%',
    maxHeight: 700,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  optionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  optionButton: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
  },
  
  // Story Editor Styles
  editorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  safeAreaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  editorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  mediaPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  textOverlayContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  textOverlay: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  textInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  textInputContainer: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    paddingVertical: 10,
    minHeight: 100,
  },
  textInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  textInputButton: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
  
  // Editing Tools Styles
  editingTools: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: '#4a90e2',
  },
  toolPanel: {
    padding: 15,
  },
  filterContainer: {
    marginVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
    opacity: 0.7,
  },
  activeFilterOption: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 8,
    padding: 3,
  },
  filterPreviewContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  filterPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#333',
  },
  filterPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  filterName: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  textTools: {
    alignItems: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  addTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
    minWidth: 150,
  },
  addTextLabel: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  dragHint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    fontSize: 14,
  },
  cropTools: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cropControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cropButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  scaleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
  },
  comingSoon: {
    padding: 20,
    alignItems: 'center',
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default StoryCreator; 