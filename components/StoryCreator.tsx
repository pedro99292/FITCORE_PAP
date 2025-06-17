import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Animated,
  InteractionManager,
  PixelRatio
} from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { createStory, pickStoryMedia, captureStoryMedia } from '@/utils/storyService';
import { useTheme } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIXEL_RATIO = PixelRatio.get();

// Calculate optimized story dimensions
const STORY_ASPECT_RATIO = 9 / 16;
const STORY_WIDTH = SCREEN_WIDTH;
const STORY_HEIGHT = STORY_WIDTH / STORY_ASPECT_RATIO;
const FINAL_STORY_WIDTH = STORY_HEIGHT > SCREEN_HEIGHT ? SCREEN_HEIGHT * STORY_ASPECT_RATIO : STORY_WIDTH;
const FINAL_STORY_HEIGHT = STORY_HEIGHT > SCREEN_HEIGHT ? SCREEN_HEIGHT : STORY_HEIGHT;

// Enhanced filter configurations with performance optimizations
const FILTERS = {
  Normal: { name: 'Normal', overlay: null, transform: null },
  Grayscale: { 
    name: 'Grayscale', 
    overlay: { backgroundColor: '#000', opacity: 0.5, mixBlendMode: 'color-burn' } 
  },
  Sepia: { 
    name: 'Sepia', 
    overlay: { backgroundColor: '#704214', opacity: 0.3, mixBlendMode: 'multiply' } 
  },
  Vintage: { 
    name: 'Vintage', 
    overlay: { backgroundColor: '#534741', opacity: 0.25, mixBlendMode: 'overlay' } 
  },
  Bright: { 
    name: 'Bright', 
    overlay: { backgroundColor: '#FFFFFF', opacity: 0.2, mixBlendMode: 'screen' } 
  },
  Cool: {
    name: 'Cool',
    overlay: { backgroundColor: '#4A90E2', opacity: 0.15, mixBlendMode: 'multiply' }
  },
  Warm: {
    name: 'Warm',
    overlay: { backgroundColor: '#FF6B35', opacity: 0.15, mixBlendMode: 'multiply' }
  },
  Dramatic: {
    name: 'Dramatic',
    overlay: { backgroundColor: '#000', opacity: 0.3, mixBlendMode: 'multiply' }
  }
};

// Enhanced text styling options
const TEXT_FONTS = [
  { name: 'Default', fontFamily: 'System' },
  { name: 'Bold', fontFamily: 'System', fontWeight: 'bold' },
  { name: 'Light', fontFamily: 'System', fontWeight: '300' },
  { name: 'Italic', fontFamily: 'System', fontStyle: 'italic' }
];

const TEXT_SIZES = [16, 20, 24, 28, 32, 40, 48, 56];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF5252', '#FFD740', '#69F0AE', 
  '#448AFF', '#E040FB', '#FF9800', '#4CAF50', '#9C27B0'
];

// Drawing tools configuration
const BRUSH_SIZES = [2, 4, 8, 12, 16, 20];
const BRUSH_COLORS = ['#FFFFFF', '#FF5252', '#FFD740', '#69F0AE', '#448AFF', '#E040FB', '#000000'];

// Sticker categories and data
const STICKER_CATEGORIES = {
  emotions: ['😀', '😂', '😍', '🥺', '😎', '🤔', '😭', '🔥', '💯', '❤️', '👍', '🙌'],
  activities: ['🎉', '🎊', '🎈', '🎁', '🏆', '⚽', '🎸', '🎵', '📸', '✈️', '🚗', '🏠'],
  nature: ['🌟', '⭐', '🌙', '☀️', '🌈', '🌸', '🌺', '🍀', '🌊', '⛰️', '🔥', '❄️'],
  objects: ['💎', '👑', '💄', '👗', '👠', '⌚', '📱', '💻', '🎯', '💡', '🔮', '🗝️']
};

// Enhanced template configurations
const STORY_TEMPLATES = [
  {
    id: 'solid_white',
    name: 'White',
    background: { type: 'solid', color: '#FFFFFF' }
  },
  {
    id: 'gradient_1',
    name: 'Sunset',
    background: { type: 'gradient', colors: ['#FF6B35', '#F7931E', '#FFD23F'], angle: 45 }
  },
  {
    id: 'gradient_2', 
    name: 'Ocean',
    background: { type: 'gradient', colors: ['#4A90E2', '#50C878', '#7FDBFF'], angle: 90 }
  },
  {
    id: 'gradient_3',
    name: 'Night',
    background: { type: 'gradient', colors: ['#2C3E50', '#34495E', '#5D6D7E'], angle: 135 }
  },
  {
    id: 'solid_1',
    name: 'Black',
    background: { type: 'solid', color: '#000000' }
  }
];

// Enhanced interfaces
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  fontStyle: "normal" | "italic";
  rotation: number;
  opacity: number;
}

interface DrawPath {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface StickerElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

interface HistoryState {
  textElements: TextElement[];
  drawPaths: DrawPath[];
  stickerElements: StickerElement[];
  activeFilter: keyof typeof FILTERS;
  imageScale: number;
  imageOffset: { x: number; y: number };
  imageRotation: number;
  backgroundColor: string;
}

interface StoryCreatorProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  userId: string;
}

// Utility function for debouncing
const debounce = (func: Function, wait: number) => {
  let timeout: any;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Calculate distance between two points for pinch gesture
const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const StoryCreator: React.FC<StoryCreatorProps> = ({
  visible,
  onClose,
  onStoryCreated,
  userId
}) => {
  // IMPORTANT: Check visibility BEFORE any hooks to prevent hook order violations
  if (!visible) {
    return null;
  }

  const { isDarkMode, colors } = useTheme();
  
  // Core media state
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('solid_white'); // Default to white background
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF'); // Default white background
  
  // Animation and UI state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const videoRef = useRef<Video>(null);
  
  // Enhanced editing state
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [stickerElements, setStickerElements] = useState<StickerElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  
  // Tool state
  const [activeTab, setActiveTab] = useState<'filters' | 'text' | 'draw' | 'stickers' | 'templates'>('filters');
  const [activeFilter, setActiveFilter] = useState<keyof typeof FILTERS>('Normal');
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#FFFFFF');
  const [currentTextSize, setCurrentTextSize] = useState(24);
  const [currentFont, setCurrentFont] = useState(TEXT_FONTS[0]);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPath, setCurrentDrawPath] = useState<string>('');
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushOpacity, setBrushOpacity] = useState(1);
  
  // Image manipulation state
  const [imageScale, setImageScale] = useState(1.2);
  const [imageOffset, setImageOffset] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [imageRotation, setImageRotation] = useState(0);
  
  // Add pinch gesture state
  const initialPinchDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1.2);
  const lastOffset = useRef<{x: number, y: number}>({x: 0, y: 0});
  
  // History/Undo-Redo state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Performance optimizations
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderOptimized, setRenderOptimized] = useState(true);

  // Add a visual touch indicator state
  const [touchActive, setTouchActive] = useState(false);

  // Memoized calculations
  const currentState = useMemo((): HistoryState => ({
    textElements,
    drawPaths,
    stickerElements,
    activeFilter,
    imageScale,
    imageOffset,
    imageRotation,
    backgroundColor
  }), [textElements, drawPaths, stickerElements, activeFilter, imageScale, imageOffset, imageRotation, backgroundColor]);

  // Optimized pan responder for smooth image manipulation
  const imagePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Start responding immediately for better responsiveness
        return Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
      },
      
      onPanResponderGrant: (evt) => {
        setTouchActive(true);
        lastOffset.current = { x: imageOffset.x, y: imageOffset.y };
        
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          const [touch1, touch2] = touches;
          const dist = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + 
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          initialPinchDistance.current = dist;
          initialScale.current = imageScale;
        }
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches && touches.length >= 2) {
          // Pinch to zoom
          const [touch1, touch2] = touches;
          const currentDist = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + 
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (initialPinchDistance.current && initialPinchDistance.current > 0) {
            const scale = (currentDist / initialPinchDistance.current) * initialScale.current;
            const clampedScale = Math.max(0.5, Math.min(3.0, scale));
            setImageScale(clampedScale);
          }
        } else {
          // Single finger drag - always update position based on gesture delta
          const newX = lastOffset.current.x + gestureState.dx;
          const newY = lastOffset.current.y + gestureState.dy;
          setImageOffset({ x: newX, y: newY });
        }
      },
      
      onPanResponderRelease: () => {
        setTouchActive(false);
        initialPinchDistance.current = null;
        saveToHistory();
      },
      
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        setTouchActive(false);
        initialPinchDistance.current = null;
      }
    })
  ).current;

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
        if (activeTab === 'draw' && isDrawing) {
          const newPath: DrawPath = {
            id: Date.now().toString(),
            path: currentDrawPath,
            color: brushColor,
            strokeWidth: brushSize,
            opacity: brushOpacity
          };
          setDrawPaths(prev => [...prev, newPath]);
          setCurrentDrawPath('');
          setIsDrawing(false);
          saveToHistory();
        }
      }
    })
  ).current;

  // History management
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, currentState]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setTextElements(prevState.textElements);
      setDrawPaths(prevState.drawPaths);
      setStickerElements(prevState.stickerElements);
      setActiveFilter(prevState.activeFilter);
      setImageScale(prevState.imageScale);
      setImageOffset(prevState.imageOffset);
      setImageRotation(prevState.imageRotation);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setTextElements(nextState.textElements);
      setDrawPaths(nextState.drawPaths);
      setStickerElements(nextState.stickerElements);
      setActiveFilter(nextState.activeFilter);
      setImageScale(nextState.imageScale);
      setImageOffset(nextState.imageOffset);
      setImageRotation(nextState.imageRotation);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Enhanced entrance animation
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

  // Performance optimization: Debounced scale change
  const debouncedScaleChange = useCallback(
    debounce((newScale: number) => {
      setImageScale(newScale);
    }, 50),
    []
  );

  // Enhanced reset state function
  const resetState = useCallback(() => {
    setMediaUri(null);
    setMediaBase64(null);
    setMediaType('image');
    setIsLoading(false);
    setIsPickerVisible(true);
    setSelectedTemplate(null);
    setTextElements([]);
    setDrawPaths([]);
    setStickerElements([]);
    setSelectedTextId(null);
    setSelectedStickerId(null);
    setActiveTab('filters');
    setActiveFilter('Normal');
    setShowTextInput(false);
    setCurrentTextColor('#FFFFFF');
    setCurrentTextSize(24);
    setCurrentFont(TEXT_FONTS[0]);
    setIsDrawing(false);
    setCurrentDrawPath('');
    setBrushSize(8);
    setBrushColor('#FFFFFF');
    setBrushOpacity(1);
    setImageScale(1.2);
    setImageOffset({x: 0, y: 0});
    setImageRotation(0);
    setHistory([]);
    setHistoryIndex(-1);
    setIsProcessing(false);
  }, []);

  // Optimized close handler
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
      InteractionManager.runAfterInteractions(() => {
        resetState();
        onClose();
      });
    });
  }, [resetState, onClose]);

  // Enhanced media handlers with optimization
  const handlePickImage = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pickStoryMedia({ mediaTypes: 'Images' });
      if (result) {
        setMediaUri(result.uri);
        setMediaBase64(result.base64 || null);
        setMediaType(result.type);
        setIsPickerVisible(false);
        saveToHistory();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const handlePickVideo = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pickStoryMedia({ mediaTypes: 'Videos' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
        saveToHistory();
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const handleTakePhoto = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await captureStoryMedia({ mediaType: 'photo' });
      if (result) {
        setMediaUri(result.uri);
        setMediaBase64(result.base64 || null);
        setMediaType(result.type);
        setIsPickerVisible(false);
        saveToHistory();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const handleRecordVideo = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await captureStoryMedia({ mediaType: 'video' });
      if (result) {
        setMediaUri(result.uri);
        setMediaType(result.type);
        setIsPickerVisible(false);
        saveToHistory();
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  // Enhanced text management
  const addTextElement = useCallback((text: string) => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text,
      x: 0.5,
      y: 0.3,
      color: currentTextColor,
      fontSize: currentTextSize,
      fontFamily: currentFont.fontFamily,
      fontWeight: (currentFont.fontWeight as "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900") || "normal",
      fontStyle: (currentFont.fontStyle as "normal" | "italic") || "normal",
      rotation: 0,
      opacity: 1
    };
    setTextElements(prev => [...prev, newElement]);
    setSelectedTextId(newElement.id);
    saveToHistory();
  }, [currentTextColor, currentTextSize, currentFont]);

  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ));
  }, []);

  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
    setSelectedTextId(null);
    saveToHistory();
  }, []);

  // Enhanced sticker management
  const addStickerElement = useCallback((emoji: string) => {
    const newElement: StickerElement = {
      id: Date.now().toString(),
      emoji,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1
    };
    setStickerElements(prev => [...prev, newElement]);
    setSelectedStickerId(newElement.id);
    saveToHistory();
  }, []);

  const updateStickerElement = useCallback((id: string, updates: Partial<StickerElement>) => {
    setStickerElements(prev => prev.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ));
  }, []);

  const deleteStickerElement = useCallback((id: string) => {
    setStickerElements(prev => prev.filter(element => element.id !== id));
    setSelectedStickerId(null);
    saveToHistory();
  }, []);

  // Template application
  const applyTemplate = useCallback((templateId: string) => {
    const template = STORY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setIsPickerVisible(false);
      saveToHistory();
    }
  }, []);

  // Add custom background color picker function
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    setSelectedTemplate(null); // Clear template selection when custom color is picked
    saveToHistory();
  };

  // Enhanced create story with all elements and background
  const handleCreateStory = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsProcessing(true);
      
      // Here you would implement the actual composition logic
      // This would involve rendering all elements onto the base background/image/video
      
      // Create a story with the current state
      if (mediaUri) {
        // For a complete implementation, you would need to render the background, media, and elements to a single image
        // This would typically involve using a library like react-native-view-shot to capture the composed view
        
        // For now, we'll use the existing createStory function
        await createStory(userId, mediaUri, null, mediaType, mediaBase64 || undefined);
        
        // Call the callback immediately after successful creation to refresh stories
        console.log('Story created successfully, refreshing stories...');
        onStoryCreated();
      } else if (selectedTemplate || backgroundColor) {
        // If no media but has a background, you would create a story with just the background and elements
        // For a complete implementation, you would need to generate an image from the composed view
        
        // For now, we'll show an alert indicating this functionality isn't fully implemented
        Alert.alert('Feature Coming Soon', 'Creating stories with custom backgrounds without media will be available soon.');
        setIsLoading(false);
        setIsProcessing(false);
        return;
      }
      
      // Then handle the animation and closing
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
        InteractionManager.runAfterInteractions(() => {
          resetState();
          setIsLoading(false);
          setIsProcessing(false);
        });
      });
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to create story. Please try again.');
      
      // Reset loading states on error
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, [mediaUri, selectedTemplate, backgroundColor, userId, mediaType, mediaBase64, resetState, onStoryCreated, fadeAnim, scaleAnim]);

  // Editing features handlers
  const handleAddText = () => {
    setShowTextInput(true);
  };
  
  const handleTextColorChange = (color: string) => {
    setCurrentTextColor(color);
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
                onPress={() => {
                  setActiveFilter(filterKey as keyof typeof FILTERS);
                  saveToHistory();
                }}
              >
                <View style={styles.filterPreviewContainer}>
                  {mediaUri ? (
                    <Image 
                      source={{ uri: mediaUri }}
                      style={styles.filterPreview}
                    />
                  ) : (
                    <View style={[styles.filterPreview, { backgroundColor: '#333' }]} />
                  )}
                  
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
    return (
      <View style={styles.textTools}>
        {/* Font Selection */}
        <View style={styles.fontSelector}>
          <Text style={styles.toolSectionTitle}>Font</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontRow}>
            {TEXT_FONTS.map((font, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.fontOption,
                  currentFont.name === font.name && styles.activeFontOption
                ]}
                onPress={() => setCurrentFont(font)}
              >
                <Text style={[
                  styles.fontPreview,
                  {
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight as any,
                    fontStyle: font.fontStyle as any
                  }
                ]}>Aa</Text>
                <Text style={styles.fontName}>{font.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text Size */}
        <View style={styles.sizeSelector}>
          <Text style={styles.toolSectionTitle}>Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeRow}>
            {TEXT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeOption,
                  currentTextSize === size && styles.activeSizeOption
                ]}
                onPress={() => setCurrentTextSize(size)}
              >
                <Text style={[styles.sizeText, { fontSize: Math.min(size / 2, 16) }]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Color Selection */}
        <View style={styles.colorSelector}>
          <Text style={styles.toolSectionTitle}>Color</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.colorPicker}
            contentContainerStyle={styles.colorPickerContent}
          >
            {TEXT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  currentTextColor === color && styles.activeColorOption
                ]}
                onPress={() => setCurrentTextColor(color)}
              />
            ))}
          </ScrollView>
        </View>
        
        <TouchableOpacity style={styles.addTextButton} onPress={() => setShowTextInput(true)}>
          <Feather name="type" size={24} color="#FFFFFF" />
          <Text style={styles.addTextLabel}>Add Text</Text>
        </TouchableOpacity>
        
        {textElements.length > 0 && (
          <>
            <Text style={styles.dragHint}>Tap and drag text to reposition</Text>
            <TouchableOpacity 
              style={styles.clearTextButton} 
              onPress={() => {
                setTextElements([]);
                saveToHistory();
              }}
            >
              <MaterialIcons name="clear" size={20} color="#FF5252" />
              <Text style={styles.clearTextLabel}>Clear All Text</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderDrawTools = () => {
    return (
      <View style={styles.drawTools}>
        {/* Brush Size */}
        <View style={styles.brushSizeSelector}>
          <Text style={styles.toolSectionTitle}>Brush Size</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.brushSizeRow}
            contentContainerStyle={styles.brushSizeRowContent}
          >
            {BRUSH_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.brushSizeOption,
                  brushSize === size && styles.activeBrushSizeOption
                ]}
                onPress={() => setBrushSize(size)}
              >
                <View style={[
                  styles.brushSizePreview,
                  { 
                    width: size + 8,
                    height: size + 8,
                    backgroundColor: brushColor
                  }
                ]} />
                <Text style={styles.brushSizeText}>{size}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Brush Color */}
        <View style={styles.brushColorSelector}>
          <Text style={styles.toolSectionTitle}>Brush Color</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.brushColorRow}
            contentContainerStyle={styles.brushColorRowContent}
          >
            {BRUSH_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.brushColorOption,
                  { backgroundColor: color },
                  brushColor === color && styles.activeBrushColorOption
                ]}
                onPress={() => setBrushColor(color)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Drawing Instructions */}
        <View style={styles.drawInstructions}>
          <Text style={styles.instructionText}>
            {isDrawing ? 'Drawing...' : 'Touch and drag to draw on your story'}
          </Text>
        </View>

        {/* Clear Drawing */}
        {drawPaths.length > 0 && (
          <TouchableOpacity 
            style={styles.clearDrawButton} 
            onPress={() => {
              setDrawPaths([]);
              saveToHistory();
            }}
          >
            <MaterialIcons name="clear" size={20} color="#FF5252" />
            <Text style={styles.clearDrawLabel}>Clear Drawing</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderStickerTools = () => {
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof STICKER_CATEGORIES>('emotions');

    return (
      <View style={styles.stickerTools}>
        {/* Category Tabs */}
        <View style={styles.stickerCategories}>
          {Object.keys(STICKER_CATEGORIES).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory(category as keyof typeof STICKER_CATEGORIES)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.activeCategoryTabText
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sticker Grid */}
        <ScrollView contentContainerStyle={styles.stickerGrid}>
          {STICKER_CATEGORIES[selectedCategory].map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stickerItem}
              onPress={() => addStickerElement(emoji)}
            >
              <Text style={styles.stickerEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Clear Stickers */}
        {stickerElements.length > 0 && (
          <TouchableOpacity 
            style={styles.clearStickersButton} 
            onPress={() => {
              setStickerElements([]);
              saveToHistory();
            }}
          >
            <MaterialIcons name="clear" size={20} color="#FF5252" />
            <Text style={styles.clearStickersLabel}>Clear All Stickers</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTemplateSelector = () => {
    return (
      <View style={styles.toolsContainer}>
        <Text style={styles.toolTitle}>Background</Text>
        
        <View style={styles.templateGrid}>
          {STORY_TEMPLATES.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateItem,
                selectedTemplate === template.id && styles.selectedTemplateItem
              ]}
              onPress={() => {
                setSelectedTemplate(template.id);
                if (template.background.type === 'solid') {
                  setBackgroundColor(template.background.color || '#FFFFFF');
                }
              }}
            >
              {template.background.type === 'gradient' ? (
                  <LinearGradient
                                      colors={(template.background.colors || ['#FFFFFF', '#CCCCCC']) as [string, string, ...string[]]}
                  style={styles.templatePreview}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  />
                ) : (
                <View 
                  style={[
                    styles.templatePreview, 
                    {backgroundColor: template.background.color}
                  ]} 
                />
              )}
              <Text style={styles.templateName}>{template.name}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Custom color picker */}
          <View style={styles.colorPickerContainer}>
            <Text style={styles.toolSubtitle}>Custom Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              {['#FFFFFF', '#000000', '#FF5252', '#FFD740', '#69F0AE', '#448AFF', '#E040FB', '#FF9800', '#4CAF50', '#9C27B0'].map(color => (
          <TouchableOpacity 
                  key={color}
                  style={[
                    styles.bgColorOption,
                    {backgroundColor: color},
                    backgroundColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => handleBackgroundColorChange(color)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };


  
  const renderEditingTools = () => {
    return (
      <View style={styles.editingTools}>
        {/* Undo/Redo Controls */}
        <View style={styles.undoRedoControls}>
          <TouchableOpacity 
            style={[styles.undoRedoButton, historyIndex <= 0 && styles.undoRedoButtonDisabled]} 
            onPress={undo}
            disabled={historyIndex <= 0}
          >
            <MaterialIcons name="undo" size={20} color={historyIndex <= 0 ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.undoRedoButton, historyIndex >= history.length - 1 && styles.undoRedoButtonDisabled]} 
            onPress={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <MaterialIcons name="redo" size={20} color={historyIndex >= history.length - 1 ? "#666" : "#FFFFFF"} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'templates' && styles.activeTab]} 
            onPress={() => setActiveTab('templates')}
          >
            <MaterialIcons name="palette" size={24} color={activeTab === 'templates' ? colors.primary : "#FFFFFF"} />
            <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>Templates</Text>
          </TouchableOpacity>

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
          {activeTab === 'templates' && renderTemplateSelector()}
          {activeTab === 'filters' && renderFilterOptions()}
          {activeTab === 'text' && renderTextTools()}
          {activeTab === 'draw' && renderDrawTools()}
          {activeTab === 'stickers' && renderStickerTools()}
        </View>
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
        <SafeAreaViewRN style={{ flex: 1 }}>
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
        </SafeAreaViewRN>
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
      <SafeAreaViewRN style={styles.safeAreaContainer} edges={['top', 'bottom']}>
      <Animated.View style={[styles.editorContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        
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
        
        {/* Story Canvas with Background, Media and Elements */}
        <View style={styles.canvasContainer}>
          {/* Background Layer */}
          <View 
                  style={[
              styles.backgroundLayer, 
              {backgroundColor: backgroundColor}
            ]}
          />
          
          {selectedTemplate && STORY_TEMPLATES.find(t => t.id === selectedTemplate)?.background.type === 'gradient' && (
            <LinearGradient
              colors={(STORY_TEMPLATES.find(t => t.id === selectedTemplate)?.background.colors || ['#FFFFFF', '#CCCCCC']) as [string, string, ...string[]]}
              style={[styles.backgroundLayer]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            />
          )}
          
          {/* Media Layer - Image or Video on top of background */}
          {mediaUri && (
            <View style={styles.mediaWrapper} collapsable={false}>
              <View 
                style={[
                  styles.mediaTransformContainer,
                  touchActive && styles.mediaTransformActive
                ]} 
                {...imagePanResponder.panHandlers} 
                collapsable={false}
                hitSlop={{ top: 50, bottom: 50, left: 50, right: 50 }}
              >
                <Animated.View
                  style={[
                    styles.mediaContainer,
                    {
                      transform: [
                        { scale: imageScale },
                        { translateX: imageOffset.x },
                        { translateY: imageOffset.y },
                        { rotate: `${imageRotation}deg` }
                      ]
                    }
                  ]}
                >
                  {mediaType === 'image' ? (
                    <Image
                      source={{ uri: mediaUri }}
                      style={styles.mediaImage}
                      resizeMode="contain"
                    />
                  ) : (
                <Video
                  ref={videoRef}
                      source={{ uri: mediaUri }}
                      style={styles.mediaVideo}
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
          </View>
          

            </View>
          )}
          
          {/* Drawing Layer - Only active when drawing */}
          {activeTab === 'draw' && (
            <Svg style={styles.drawingLayer} {...drawPanResponder.panHandlers}>
              {drawPaths.map(path => (
                <Path
                  key={path.id}
                  d={path.path}
                  stroke={path.color}
                  strokeWidth={path.strokeWidth}
                  strokeOpacity={path.opacity}
                  fill="none"
                />
              ))}
              {currentDrawPath && (
                <Path
                  d={currentDrawPath}
                  stroke={brushColor}
                  strokeWidth={brushSize}
                  strokeOpacity={brushOpacity}
                  fill="none"
                />
              )}
            </Svg>
          )}
          
          {/* Drawing Paths - Show when not actively drawing */}
          {activeTab !== 'draw' && drawPaths.length > 0 && (
            <Svg style={styles.drawingLayer} pointerEvents="none">
              {drawPaths.map(path => (
                <Path
                  key={path.id}
                  d={path.path}
                  stroke={path.color}
                  strokeWidth={path.strokeWidth}
                  strokeOpacity={path.opacity}
                  fill="none"
                />
              ))}
            </Svg>
          )}
          
          {/* Text Elements */}
          {textElements.map(element => (
            <Animated.View
              key={element.id}
              style={[
                styles.textElementContainer,
                {
                  transform: [
                    { translateX: element.x },
                    { translateY: element.y },
                    { rotate: `${element.rotation}deg` }
                  ],
                  opacity: element.opacity
                }
              ]}
              pointerEvents={activeTab === 'text' && selectedTextId === element.id ? 'auto' : 'none'}
            >
              <Text
                style={[
                  styles.textElement,
                  {
                    color: element.color,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight as any,
                    fontStyle: element.fontStyle as any
                  }
                ]}
              >
                {element.text}
              </Text>
              {selectedTextId === element.id && (
                <View style={styles.textSelectionIndicator} />
              )}
            </Animated.View>
          ))}

          {/* Sticker Elements */}
          {stickerElements.map(sticker => (
            <Animated.View
              key={sticker.id}
              style={[
                styles.stickerContainer,
                {
                  transform: [
                    { translateX: sticker.x },
                    { translateY: sticker.y },
                    { scale: sticker.scale },
                    { rotate: `${sticker.rotation}deg` }
                  ],
                  opacity: sticker.opacity
                }
              ]}
              pointerEvents={activeTab === 'stickers' && selectedStickerId === sticker.id ? 'auto' : 'none'}
            >
              <Text style={styles.stickerEmojiText}>{sticker.emoji}</Text>
              {selectedStickerId === sticker.id && (
                <View style={styles.stickerSelectionIndicator} />
              )}
            </Animated.View>
          ))}
        </View>
        
        {/* Text Input Modal */}
        {showTextInput && (
          <BlurView intensity={50} style={styles.textInputOverlay} tint="dark">
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { color: currentTextColor }]}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value=""
                onChangeText={(text) => {
                  if (text.trim()) {
                    addTextElement(text);
                    setShowTextInput(false);
                  }
                }}
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
    </SafeAreaViewRN>
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
    flex: 1,
    backgroundColor: '#000000',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#000000',
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
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF', // Default white background
  },
  mediaWrapper: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mediaTransformContainer: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  mediaTransformActive: {
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.7)',
    borderRadius: 8,
  },
  mediaCropMode: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  mediaContainer: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureHintContainer: {
    position: 'absolute',
    bottom: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    alignSelf: 'center',
  },
  gestureHintText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  mediaImage: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
  },
  mediaVideo: {
    width: FINAL_STORY_WIDTH,
    height: FINAL_STORY_HEIGHT,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  drawingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  textElementContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  textElement: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  textSelectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4a90e2',
  },
  stickerContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  stickerEmojiText: {
    fontSize: 24,
  },
  stickerSelectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4a90e2',
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
  
  // Enhanced Editing Tools Styles
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
  undoRedoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  undoRedoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoRedoButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
  },
  activeTabText: {
    color: '#4a90e2',
  },
  toolPanel: {
    padding: 15,
  },
  
  // Tool Section Styles
  toolSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  // Filter Styles
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
  
  // Text Tools Styles
  textTools: {
    alignItems: 'center',
  },
  fontSelector: {
    marginBottom: 15,
    width: '100%',
  },
  fontRow: {
    flexDirection: 'row',
  },
  fontOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
    opacity: 0.7,
  },
  activeFontOption: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 8,
    padding: 3,
  },
  fontPreview: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
  },
  fontName: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  sizeSelector: {
    marginBottom: 15,
    width: '100%',
  },
  sizeRow: {
    flexDirection: 'row',
  },
  sizeOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.7,
  },
  activeSizeOption: {
    opacity: 1,
    backgroundColor: '#4a90e2',
  },
  sizeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  colorSelector: {
    marginBottom: 15,
    width: '100%',
  },
  colorPicker: {
    flexDirection: 'row',
  },
  colorPickerContent: {
    justifyContent: 'center',
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
    marginBottom: 10,
  },
  addTextLabel: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  dragHint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
  clearTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.2)',
    padding: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  clearTextLabel: {
    color: '#FF5252',
    marginLeft: 4,
    fontSize: 12,
  },
  
  // Draw Tools Styles
  drawTools: {
    alignItems: 'center',
  },
  brushSizeSelector: {
    marginBottom: 15,
    width: '100%',
  },
  brushSizeRow: {
    flexDirection: 'row',
  },
  brushSizeRowContent: {
    justifyContent: 'center',
  },
  brushSizeOption: {
    marginHorizontal: 8,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.7,
  },
  activeBrushSizeOption: {
    opacity: 1,
    backgroundColor: '#4a90e2',
  },
  brushSizePreview: {
    borderRadius: 20,
    marginBottom: 4,
  },
  brushSizeText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  brushColorSelector: {
    marginBottom: 15,
    width: '100%',
  },
  brushColorRow: {
    flexDirection: 'row',
  },
  brushColorRowContent: {
    justifyContent: 'center',
  },
  brushColorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeBrushColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  drawInstructions: {
    marginBottom: 15,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  clearDrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  clearDrawLabel: {
    color: '#FF5252',
    marginLeft: 4,
    fontSize: 12,
  },
  
  // Sticker Tools Styles
  stickerTools: {
    alignItems: 'center',
  },
  stickerCategories: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'center',
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
    opacity: 0.7,
  },
  activeCategoryTab: {
    opacity: 1,
    backgroundColor: '#4a90e2',
  },
  categoryTabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryTabText: {
    color: '#FFFFFF',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stickerItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clearStickersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,82,82,0.2)',
    padding: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  clearStickersLabel: {
    color: '#FF5252',
    marginLeft: 4,
    fontSize: 12,
  },
  
  // Template Styles
  toolsContainer: {
    alignItems: 'center',
  },
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  templateGrid: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  templateItem: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
    opacity: 0.7,
  },
  selectedTemplateItem: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 8,
    padding: 3,
  },
  templatePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  templateName: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  colorPickerContainer: {
    marginTop: 12,
    width: '100%',
  },
  toolSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  colorScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  bgColorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#00A3FF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  
  // Crop Tools Styles
  cropTools: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cropTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  gestureInstructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    width: '90%',
  },
  gestureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  gestureInstructionText: {
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
    fontSize: 14,
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
  cropActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
  },
  cropActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default StoryCreator; 