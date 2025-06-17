import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Dimensions, Image } from 'react-native';

// Calculate dimensions for consistent stories
const { width, height } = Dimensions.get('window');
const STORY_ASPECT_RATIO = 9 / 16;
const STORY_WIDTH = width;
const STORY_HEIGHT = STORY_WIDTH / STORY_ASPECT_RATIO;

/**
 * Applies a filter effect to an image
 * @param uri - The image URI to process
 * @param filterType - The type of filter to apply
 * @returns Promise with processed image URI
 */
export const applyImageFilter = async (
  uri: string, 
  filterType: 'grayscale' | 'sepia' | 'vintage' | 'cool' | 'warm'
): Promise<string> => {
  try {
    // Note: expo-image-manipulator doesn't support true filters like saturate, brightness, etc.
    // We would need a more advanced library for real filters
    // Here we just do basic adjustments with the available options
    
    // For simplicity, just return the original image for now
    return uri;
  } catch (error) {
    console.error('Error applying filter:', error);
    return uri; // Return original on error
  }
};

/**
 * Crops an image to story dimensions (9:16 aspect ratio)
 * @param uri - The image URI to crop
 * @returns Promise with cropped image URI
 */
export const cropToStoryDimensions = async (uri: string): Promise<string> => {
  try {
    // Get the image dimensions
    const imageInfo = await FileSystem.getInfoAsync(uri);
    if (!imageInfo.exists) {
      throw new Error('Image does not exist');
    }
    
    // Get image dimensions using promise-based approach
    const getImageSize = (imageUri: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => resolve({width, height}),
          error => {
            console.error('Error getting image size:', error);
            reject(error);
          }
        );
      });
    };
    
    const { width: imageWidth, height: imageHeight } = await getImageSize(uri);
    
    // Calculate crop dimensions to match 9:16 aspect ratio
    let cropWidth, cropHeight, originX, originY;
    
    if (imageWidth / imageHeight > STORY_ASPECT_RATIO) {
      // Image is wider than 9:16
      cropHeight = imageHeight;
      cropWidth = cropHeight * STORY_ASPECT_RATIO;
      originX = (imageWidth - cropWidth) / 2;
      originY = 0;
    } else {
      // Image is taller than 9:16
      cropWidth = imageWidth;
      cropHeight = cropWidth / STORY_ASPECT_RATIO;
      originX = 0;
      originY = (imageHeight - cropHeight) / 2;
    }
    
    const result = await manipulateAsync(
      uri,
      [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error cropping image:', error);
    return uri; // Return original on error
  }
};

/**
 * Composite elements (text, stickers, drawings) onto an image
 * Note: This is a placeholder. In a production app, you would use
 * a more robust solution like react-native-view-shot to capture
 * a composite view with all elements
 */
export const compositeElementsOnImage = async (
  baseImageUri: string,
  elements: any[] // Replace with proper types for your elements
): Promise<string> => {
  // This is just a placeholder
  // In a real implementation, you would:
  // 1. Render all elements on a View
  // 2. Use something like react-native-view-shot to capture that View
  // 3. Return the captured image URI
  
  console.log('Compositing elements on image', elements.length);
  return baseImageUri; // Just return the original for now
};

/**
 * Helper function to generate a unique filename for a story
 */
export const generateStoryFilename = (userId: string, type: 'image' | 'video'): string => {
  const timestamp = Date.now();
  const extension = type === 'image' ? 'jpg' : 'mp4';
  return `story_${userId}_${timestamp}.${extension}`;
}; 