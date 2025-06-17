import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { createStory, pickStoryMedia, captureStoryMedia } from '@/utils/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate optimized story dimensions
const STORY_ASPECT_RATIO = 9 / 16;
const STORY_WIDTH = SCREEN_WIDTH;
const STORY_HEIGHT = STORY_WIDTH / STORY_ASPECT_RATIO;
const FINAL_STORY_WIDTH = STORY_HEIGHT > SCREEN_HEIGHT ? SCREEN_HEIGHT * STORY_ASPECT_RATIO : STORY_WIDTH;
const FINAL_STORY_HEIGHT = STORY_HEIGHT > SCREEN_HEIGHT ? SCREEN_HEIGHT : STORY_HEIGHT;

// Simple filter options
const FILTERS = {
  Normal: { name: 'Normal', overlay: null },
  Grayscale: { 
    name: 'Grayscale', 
    overlay: { backgroundColor: '#000', opacity: 0.5, mixBlendMode: 'color-burn' } 
  },
  Warm: {
    name: 'Warm',
    overlay: { backgroundColor: '#FF6B35', opacity: 0.15, mixBlendMode: 'multiply' }
  },
  Cool: {
    name: 'Cool',
    overlay: { backgroundColor: '#4A90E2', opacity: 0.15, mixBlendMode: 'multiply' }
  },
  Vintage: { 
    name: 'Vintage', 
    overlay: { backgroundColor: '#534741', opacity: 0.25, mixBlendMode: 'overlay' } 
  }
};

// Background colors
const BACKGROUND_COLORS = [
  '#FFFFFF', // White (default)
  '#000000', // Black
  '#FF5252', // Red
  '#FFD740', // Yellow
  '#69F0AE', // Green
  '#448AFF', // Blue
  '#E040FB', // Purple
  '#FF9800'  // Orange
];

// Text styles
const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF5252', '#FFD740', '#69F0AE', 
  '#448AFF', '#E040FB', '#FF9800'
];

// Drawing tools
const BRUSH_SIZES = [4, 8, 12, 16];
const BRUSH_COLORS = ['#FFFFFF', '#FF5252', '#FFD740', '#69F0AE', '#448AFF', '#E040FB', '#000000'];

// Text element interface
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  rotation: number;
}

// Drawing path interface
interface DrawPath {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
}

interface SimpleStoryEditorProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  userId: string;
}

const SimpleStoryEditor: React.FC<SimpleStoryEditorProps> = ({
  visible,
  onClose,
  onStoryCreated,
  userId
}) => {
  // Core media state
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(true);
  
  // Add background color state
  const [backgroundColor, setBackgroundColor] = useState('#000000'); // Default black
  
  // Add text input state
  const [textInputValue, setTextInputValue] = useState('');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const videoRef = useRef<Video>(null);
  
  // Editing state
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'draw' | 'background'>('filters');
  const [activeFilter, setActiveFilter] = useState<keyof typeof FILTERS>('Normal');
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#FFFFFF');
  const [currentTextSize, setCurrentTextSize] = useState(24);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPath, setCurrentDrawPath] = useState<string>('');
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  
  // Image manipulation - direct transform manipulation
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [debugInfo, setDebugInfo] = useState('Ready');
  
  // Track gesture start position
  const gestureStart = useRef({ x: 0, y: 0 });

  // Entrance animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
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

  // Pan responder for drawing
  const drawPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeTab === 'draw',
      onPanResponderGrant: (evt) => {
        if (activeTab === 'draw') {
          const { locationX, locationY } = evt.nativeEvent;
          setIsDrawing(true);
          setCurrentDrawPath(`M${locationX},${locationY}`);
        }
      },
      onPanResponderMove: (evt) => {
        if (activeTab === 'draw' && isDrawing) {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentDrawPath(prev => `${prev} L${locationX},${locationY}`);
        }
      },
      onPanResponderRelease: () => {
        if (activeTab === 'draw' && isDrawing && currentDrawPath) {
          const newPath: DrawPath = {
            id: Date.now().toString(),
            path: currentDrawPath,
            color: brushColor,
            strokeWidth: brushSize
          };
          setDrawPaths(prev => [...prev, newPath]);
          setCurrentDrawPath('');
          setIsDrawing(false);
        }
      }
    })
  ).current;

  // Dead simple pan responder - manual position tracking
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        // Store where the gesture started
        gestureStart.current = { x: imagePosition.x, y: imagePosition.y };
        setDebugInfo(`Gesture start from: ${gestureStart.current.x}, ${gestureStart.current.y}`);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new position = starting position + gesture delta
        const newX = gestureStart.current.x + gestureState.dx;
        const newY = gestureStart.current.y + gestureState.dy;
        
        // Update position with state - this will trigger re-render
        setImagePosition({ x: newX, y: newY });
        
        setDebugInfo(`Moving: ${newX.toFixed(0)}, ${newY.toFixed(0)} (delta: ${gestureState.dx.toFixed(0)}, ${gestureState.dy.toFixed(0)})`);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setDebugInfo(`Released at: ${imagePosition.x.toFixed(0)}, ${imagePosition.y.toFixed(0)}`);
      },
    })
  ).current;

  // Reset state function
  const resetState = useCallback(() => {
    setMediaUri(null);
    setMediaBase64(null);
    setMediaType('image');
    setIsLoading(false);
    setIsPickerVisible(true);
    setTextElements([]);
    setDrawPaths([]);
    setActiveTab('filters');
    setActiveFilter('Normal');
    setShowTextInput(false);
    setCurrentTextColor('#FFFFFF');
    setCurrentTextSize(24);
    setIsDrawing(false);
    setCurrentDrawPath('');
    setBrushSize(8);
    setBrushColor('#FFFFFF');
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 }); // Reset position
    gestureStart.current = { x: 0, y: 0 }; // Reset gesture start
    setDebugInfo('Reset to center');
    setBackgroundColor('#000000'); // Reset background color
  }, []);

  // Close handler with animation
  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      resetState();
      onClose();
    });
  }, [resetState, onClose, fadeAnim, scaleAnim]);

  // Media handlers
  const handlePickImage = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pickStoryMedia({ mediaTypes: 'Images' });
      if (result) {
        setMediaUri(result.uri);
        setMediaBase64(result.base64 || null);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePickVideo = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Picking video from gallery...');
      const result = await pickStoryMedia({ mediaTypes: 'Videos' });
      
      if (result) {
        console.log('Video selected:', result.uri, 'Type:', result.type);
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      } else {
        console.log('No video selected or selection canceled');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await captureStoryMedia({ mediaType: 'photo' });
      if (result) {
        setMediaUri(result.uri);
        setMediaBase64(result.base64 || null);
        setMediaType(result.type);
        setIsPickerVisible(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRecordVideo = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Opening camera for video recording...');
      const result = await captureStoryMedia({ mediaType: 'video' });
      
      if (result) {
        console.log('Video recorded:', result.uri, 'Type:', result.type);
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
      } else {
        console.log('Video recording canceled');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Text management
  const addTextElement = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const newElement: TextElement = {
      id: Date.now().toString(),
      text,
      x: FINAL_STORY_WIDTH / 2,
      y: FINAL_STORY_HEIGHT / 2,
      color: currentTextColor,
      fontSize: currentTextSize,
      rotation: 0
    };
    
    setTextElements(prev => [...prev, newElement]);
  }, [currentTextColor, currentTextSize]);

  // Handle adding text element from input
  const handleAddTextElement = useCallback(() => {
    if (textInputValue.trim()) {
      addTextElement(textInputValue);
      setTextInputValue('');
      setShowTextInput(false);
    }
  }, [addTextElement, textInputValue]);

  // Handle canceling text input
  const handleCancelTextInput = useCallback(() => {
    setTextInputValue('');
    setShowTextInput(false);
  }, []);

  // Create story
  const handleCreateStory = useCallback(async () => {
    if (!mediaUri) {
      Alert.alert('Missing Content', 'Please select media.');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Creating story with media type:', mediaType);
      console.log('Media URI:', mediaUri);
      
      // For a real implementation, you would need to composite all elements
      // onto the media here before uploading, including the background color
      
      await createStory(userId, mediaUri, null, mediaType, mediaBase64 || undefined);
      console.log('Story created successfully with mediaType:', mediaType);
      onStoryCreated();
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        resetState();
      });
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to create story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mediaUri, mediaType, mediaBase64, userId, fadeAnim, scaleAnim, resetState, onStoryCreated]);

  // Rendering functions
  const renderFilterOptions = () => {
    return (
      <View style={styles.toolContainer}>
        <Text style={styles.toolTitle}>Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterOptions}>
            {Object.keys(FILTERS).map((filterName) => (
              <TouchableOpacity
                key={filterName}
                style={[
                  styles.filterOption,
                  activeFilter === filterName && styles.activeOption
                ]}
                onPress={() => setActiveFilter(filterName as keyof typeof FILTERS)}
              >
                <View style={styles.filterPreview}>
                  {FILTERS[filterName as keyof typeof FILTERS].overlay && (
                    <View
                      style={[
                        styles.filterPreviewOverlay,
                        {
                          backgroundColor: FILTERS[filterName as keyof typeof FILTERS].overlay?.backgroundColor,
                          opacity: FILTERS[filterName as keyof typeof FILTERS].overlay?.opacity
                        }
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.filterName}>{filterName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderTextTools = () => {
    return (
      <View style={styles.toolContainer}>
        <View style={styles.toolHeader}>
          <Text style={styles.toolTitle}>Text</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowTextInput(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonLabel}>Add Text</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.colorRow}>
            {TEXT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  currentTextColor === color && styles.activeOption
                ]}
                onPress={() => setCurrentTextColor(color)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDrawTools = () => {
    return (
      <View style={styles.toolContainer}>
        <Text style={styles.toolTitle}>Draw</Text>
        <View style={styles.brushSizeRow}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.brushSizeOption,
                brushSize === size && styles.activeOption
              ]}
              onPress={() => setBrushSize(size)}
            >
              <View style={[styles.brushSizePreview, { width: size, height: size }]} />
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.colorRow}>
            {BRUSH_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  brushColor === color && styles.activeOption
                ]}
                onPress={() => setBrushColor(color)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Add background color selector
  const renderBackgroundColorOptions = () => {
    return (
      <View style={styles.toolContainer}>
        <Text style={styles.toolTitle}>Background Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.colorRow}>
            {BACKGROUND_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  backgroundColor === color && styles.activeOption
                ]}
                onPress={() => setBackgroundColor(color)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

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
        <BlurView intensity={90} style={styles.modalOverlay} tint="dark">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Story</Text>
              <View style={{width: 24}} />
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Choose an option</Text>
              
              <View style={styles.optionsGrid}>
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={32} color="#4a90e2" />
                  <Text style={styles.optionText}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={handlePickImage}
                >
                  <Ionicons name="image" size={32} color="#4a90e2" />
                  <Text style={styles.optionText}>Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={handleRecordVideo}
                >
                  <Ionicons name="videocam" size={32} color="#4a90e2" />
                  <Text style={styles.optionText}>Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={handlePickVideo}
                >
                  <Ionicons name="film" size={32} color="#4a90e2" />
                  <Text style={styles.optionText}>Video Gallery</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.infoText}>
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
        
        <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
          {/* Header */}
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={handleClose}>
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
        </SafeAreaView>
        
        {/* Media Preview with Background and Filter */}
        <View style={styles.storyContainer}>
          {/* Debug Info */}
          <View style={{position: 'absolute', top: 10, left: 10, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 4}}>
            <Text style={{color: 'white', fontSize: 12}}>{debugInfo}</Text>
            <Text style={{color: 'white', fontSize: 10}}>Pos: {imagePosition.x.toFixed(0)}, {imagePosition.y.toFixed(0)}</Text>
          </View>
          
          {/* Background Layer */}
          <View style={[styles.backgroundLayer, { backgroundColor }]} />
          
          {/* Media Layer */}
          {mediaUri && (
            <Animated.View
              style={[
                styles.mediaContainer,
                {
                  transform: [
                    { scale: imageScale },
                    { translateX: imagePosition.x },
                    { translateY: imagePosition.y }
                  ]
                }
              ]}
              {...panResponder.panHandlers}
            >
              {mediaType === 'image' ? (
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  ref={videoRef}
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay
                  isMuted={true}
                />
              )}
              
              {activeFilter !== 'Normal' && FILTERS[activeFilter].overlay && (
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
            </Animated.View>
          )}
          
          {/* Drawing Layer */}
          <Svg style={styles.drawingLayer} {...drawPanResponder.panHandlers}>
            {drawPaths.map(path => (
              <Path
                key={path.id}
                d={path.path}
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                fill="none"
              />
            ))}
            {currentDrawPath && (
              <Path
                d={currentDrawPath}
                stroke={brushColor}
                strokeWidth={brushSize}
                fill="none"
              />
            )}
          </Svg>
          
          {/* Text Elements */}
          {textElements.map(element => (
            <View
              key={element.id}
              style={[
                styles.textElementContainer,
                {
                  transform: [
                    { translateX: element.x },
                    { translateY: element.y },
                    { rotate: `${element.rotation}deg` }
                  ]
                }
              ]}
            >
              <Text
                style={[
                  styles.textElement,
                  {
                    color: element.color,
                    fontSize: element.fontSize
                  }
                ]}
              >
                {element.text}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Main Editing Tools */}
        {!isPickerVisible && (
          <View style={styles.toolsContainer}>
            <View style={styles.tabButtons}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'filters' && styles.activeTabButton]}
                onPress={() => setActiveTab('filters')}
              >
                <Ionicons name="color-filter" size={24} color="#FFFFFF" />
                <Text style={styles.tabButtonText}>Filters</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'text' && styles.activeTabButton]}
                onPress={() => setActiveTab('text')}
              >
                <Ionicons name="text" size={24} color="#FFFFFF" />
                <Text style={styles.tabButtonText}>Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'draw' && styles.activeTabButton]}
                onPress={() => setActiveTab('draw')}
              >
                <MaterialIcons name="brush" size={24} color="#FFFFFF" />
                <Text style={styles.tabButtonText}>Draw</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'background' && styles.activeTabButton]}
                onPress={() => setActiveTab('background')}
              >
                <MaterialIcons name="format-color-fill" size={24} color="#FFFFFF" />
                <Text style={styles.tabButtonText}>BG</Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'filters' && renderFilterOptions()}
            {activeTab === 'text' && renderTextTools()}
            {activeTab === 'draw' && renderDrawTools()}
            {activeTab === 'background' && renderBackgroundColorOptions()}
          </View>
        )}
        
        {/* Media Picker Buttons */}
        {isPickerVisible && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Create a Story</Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={32} color="#FFFFFF" />
                <Text style={styles.pickerButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.pickerButton} onPress={handlePickImage}>
                <Ionicons name="image" size={32} color="#FFFFFF" />
                <Text style={styles.pickerButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Text Input Modal */}
        {showTextInput && (
          <View style={styles.textInputOverlay}>
            <BlurView intensity={80} style={StyleSheet.absoluteFill} />
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { color: currentTextColor }]}
                placeholder="Enter text..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoFocus
                multiline
                onChangeText={(text) => setTextInputValue(text)}
                value={textInputValue}
              />
              
              <View style={styles.textInputButtons}>
                <TouchableOpacity style={styles.textInputButton} onPress={handleCancelTextInput}>
                  <Text style={styles.textInputButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.textInputButton} onPress={handleAddTextElement}>
                  <Text style={styles.textInputButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    width: '90%',
    height: '80%',
    maxHeight: 600,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
    color: '#fff',
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  infoText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Editor Styles
  editorContainer: {
    flex: 1,
    backgroundColor: '#000000',
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
  storyContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF', // Default white background
  },
  mediaContainer: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreview: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  drawingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
  },
  textElementContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textElement: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#00A3FF',
  },
  toolsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  tabButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pickerButton: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pickerButtonText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
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
  textInputButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
  
  // Filter Styles
  filterRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  filterOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
    opacity: 0.7,
  },
  activeOption: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 8,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
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
  
  // Text Tools Styles
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.2)',
    padding: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  clearButtonLabel: {
    color: '#FF5252',
    marginLeft: 4,
    fontSize: 12,
  },
  
  // Draw Tools Styles
  drawToolsRow: {
    marginBottom: 15,
  },
  brushSizeRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  brushSizeOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  brushSizePreview: {
    borderRadius: 20,
    marginBottom: 4,
  },
  toolContainer: {
    padding: 15,
  },
  
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default SimpleStoryEditor; 