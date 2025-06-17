import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type Story = {
  id: number;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  story_type: 'image' | 'video';
  is_active: boolean;
  username?: string;
  avatar_url?: string;
  timeAgo?: string;
};

export type UserWithStories = {
  id: string;
  username: string;
  avatar_url?: string;
  hasUnviewedStories: boolean;
  stories: Story[];
};

// Fetch all active stories grouped by user
export const fetchActiveStories = async (currentUserId: string | null): Promise<UserWithStories[]> => {
  try {
    if (!currentUserId) {
      return [];
    }

    // First, get the list of users that the current user follows
    const { data: followingData, error: followingError } = await supabase
      .from('user_followers')
      .select('followed_id')
      .eq('follower_id', currentUserId);

    if (followingError) {
      console.error('Error fetching following list:', followingError);
      return [];
    }

    // Get list of user IDs to include in stories (following + current user)
    const followingIds = followingData?.map(f => f.followed_id) || [];
    const userIdsToShow = [...followingIds, currentUserId]; // Include current user's stories

    // Current time to check for expired stories
    const currentTime = new Date().toISOString();

    // If user doesn't follow anyone, only show their own stories
    if (userIdsToShow.length === 1 && userIdsToShow[0] === currentUserId) {
      // Check if current user has any active, non-expired stories
      const { count: userStoryCount } = await supabase
        .from('user_stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_active', true)
        .gt('expires_at', currentTime); // Only stories that haven't expired

      if (!userStoryCount || userStoryCount === 0) {
        return [];
      }
    }

    // Fetch stories only from followed users and current user
    // Only fetch active stories that haven't expired
    const { data: stories, error } = await supabase
      .from('user_stories')
      .select('*')
      .in('user_id', userIdsToShow)
      .eq('is_active', true)
      .gt('expires_at', currentTime) // Only stories that haven't expired
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      return [];
    }

    if (!stories || stories.length === 0) {
      return [];
    }

    // Get usernames in a separate query
    const userIds = [...new Set(stories.map((story: any) => story.user_id))];
    
    let usernameMap: Record<string, { username: string, avatar_url?: string }> = {};
    
    if (userIds.length > 0) {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);
          
        if (users && users.length > 0) {
          users.forEach((user: any) => {
            usernameMap[user.id] = {
              username: user.username,
              avatar_url: user.avatar_url
            };
          });
        }
      } catch (userError) {
        console.error('Error fetching usernames:', userError);
        // Continue without usernames if there's an error
      }
    }

    // Group stories by user
    const userStoriesMap: Record<string, UserWithStories> = {};

    stories.forEach((story: any) => {
      // Check if story has expired (just an additional check)
      const expiresAt = new Date(story.expires_at);
      const now = new Date();
      if (expiresAt < now) {
        // Skip expired stories (this is a safety check in case the database query didn't filter properly)
        return;
      }

      const userId = story.user_id;
      
      // Get username from the map or use a default
      const username = usernameMap[userId]?.username || 'anonymous';
      const avatar_url = usernameMap[userId]?.avatar_url;
                      
      // Handle null viewed_by array
      const viewedBy = story.viewed_by || [];
      const hasBeenViewed = currentUserId ? viewedBy.includes(currentUserId) : false;

      if (!userStoriesMap[userId]) {
        userStoriesMap[userId] = {
          id: userId,
          username: username,
          avatar_url: avatar_url,
          hasUnviewedStories: !hasBeenViewed,
          stories: []
        };
      } else if (!hasBeenViewed && !userStoriesMap[userId].hasUnviewedStories) {
        userStoriesMap[userId].hasUnviewedStories = true;
      }

      userStoriesMap[userId].stories.push({
        ...story,
        username: username,
        avatar_url: avatar_url,
        viewed_by: viewedBy, // Ensure viewed_by is never null
        timeAgo: formatTimeAgo(new Date(story.created_at))
      });
    });

    // Convert map to array and sort
    return Object.values(userStoriesMap).sort((a, b) => {
      // Users with unviewed stories first
      if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
      if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;

      // Then sort by most recent story
      const aLatestStory = a.stories[0]?.created_at || '';
      const bLatestStory = b.stories[0]?.created_at || '';
      return new Date(bLatestStory).getTime() - new Date(aLatestStory).getTime();
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
};

// Create a new story
export const createStory = async (
  userId: string,
  mediaUri: string,
  caption: string | null = null,  // We'll keep the parameter for backward compatibility but won't use it
  storyType: 'image' | 'video' = 'image',
  base64?: string // Add base64 parameter
): Promise<Story> => {
  try {
    // 1. Upload media to storage
    const mediaUrl = await uploadStoryMedia(mediaUri, storyType, base64);
    if (!mediaUrl) {
      throw new Error('Failed to upload media');
    }

    // 2. Create story record in database
    const { data, error } = await supabase
      .from('user_stories')  // Changed back to user_stories
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        story_type: storyType,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        viewed_by: [], // Initialize with empty array
        is_active: true // Set as active by default
      })
      .select()
      .single();

    if (error) throw error;
    
    return data as Story;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
};

// Mark a story as viewed by the current user
export const markStoryAsViewed = async (storyId: number, userId: string): Promise<void> => {
  try {
    // Get current viewed_by array
    const { data: storyData, error: fetchError } = await supabase
      .from('user_stories')  // Changed back to user_stories
      .select('viewed_by')
      .eq('id', storyId)
      .single();

    if (fetchError) throw fetchError;

    // Check if user has already viewed
    const viewedBy: string[] = storyData.viewed_by || [];
    if (viewedBy.includes(userId)) {
      return; // Already viewed
    }

    // Add user to viewed_by array
    const updatedViewedBy = [...viewedBy, userId];
    const { error: updateError } = await supabase
      .from('user_stories')  // Changed back to user_stories
      .update({ viewed_by: updatedViewedBy })
      .eq('id', storyId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    throw error;
  }
};

// Delete a story
export const deleteStory = async (storyId: number): Promise<void> => {
  try {
    // Get the story to find media URL
    const { data: story, error: fetchError } = await supabase
      .from('user_stories')  // Changed back to user_stories
      .select('media_url')
      .eq('id', storyId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the story record
    const { error: deleteError } = await supabase
      .from('user_stories')  // Changed back to user_stories
      .delete()
      .eq('id', storyId);

    if (deleteError) throw deleteError;

    // Delete media from storage if possible
    try {
      if (story.media_url) {
        const mediaPath = story.media_url.split('/').pop();
        if (mediaPath) {
          await supabase.storage
            .from('post-images')
            .remove([mediaPath]);
        }
      }
    } catch (mediaError) {
      console.error('Error deleting story media:', mediaError);
      // Continue even if media deletion fails
    }
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

// Helper to pick media from library for story
export const pickStoryMedia = async (options: { mediaTypes: 'Images' | 'Videos' | 'All' } = { mediaTypes: 'All' }): Promise<{ uri: string; type: 'image' | 'video'; base64?: string } | null> => {
  try {
    let mediaTypes: ImagePicker.MediaTypeOptions;
    switch (options.mediaTypes) {
      case 'Images':
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
        break;
      case 'Videos':
        mediaTypes = ImagePicker.MediaTypeOptions.Videos;
        break;
      default:
        mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: false, // Disable editing to avoid iOS square limitation
      quality: 0.8,
      base64: options.mediaTypes === 'Images' || options.mediaTypes === 'All', // Get base64 for images
    });

    if (result.canceled) {
      return null;
    }

    // Determine if this is an image or video
    const uri = result.assets[0].uri;
    const type = uri.endsWith('.mp4') || uri.includes('video') ? 'video' : 'image';

    return { 
      uri, 
      type,
      base64: result.assets[0].base64 || undefined // Convert null to undefined for type safety
    };
  } catch (error) {
    console.error('Error picking media:', error);
    throw error;
  }
};

// Helper to take a photo/video for story
export const captureStoryMedia = async (options: { mediaType: 'photo' | 'video' | 'mixed' } = { mediaType: 'photo' }): Promise<{ uri: string; type: 'image' | 'video'; base64?: string } | null> => {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: options.mediaType === 'photo' 
        ? ImagePicker.MediaTypeOptions.Images 
        : options.mediaType === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.All,
      allowsEditing: false, // Disable editing to avoid iOS square limitation
      quality: 0.8,
      base64: options.mediaType === 'photo' || options.mediaType === 'mixed', // Get base64 for photos
      // Video-specific options
      videoMaxDuration: 30, // 30 seconds max for stories
    });

    if (result.canceled) {
      return null;
    }

    // Determine if this is an image or video
    const uri = result.assets[0].uri;
    const type = uri.endsWith('.mp4') || uri.includes('video') ? 'video' : 'image';

    return { 
      uri, 
      type,
      base64: result.assets[0].base64 || undefined // Convert null to undefined for type safety
    };
  } catch (error) {
    console.error('Error capturing media:', error);
    throw error;
  }
};

// Helper to upload media to Supabase storage
const uploadStoryMedia = async (uri: string, type: 'image' | 'video', base64?: string): Promise<string | null> => {
  try {
    // For images, convert to base64 and upload like profile images
    if (type === 'image') {
      let base64Data: string;
      
      if (base64) {
        // Use provided base64 data
        base64Data = base64;
      } else {
        // Fallback to converting URI to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove the data:image/jpeg;base64, prefix
            const base64DataFromBlob = base64.split(',')[1];
            resolve(base64DataFromBlob);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        
        base64Data = await base64Promise;
      }
      
      // Convert base64 to ArrayBuffer (same as profile upload)
      const { decode } = await import('base64-arraybuffer');
      const arrayBuffer = decode(base64Data);
      
      // Generate a unique file name with proper extension
      const fileName = `story_${Date.now()}.jpg`;
      
      // Upload to Supabase Storage with contentType (same as profile upload)
      const { data, error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } 
    else if (type === 'video') {
      // For videos, use blob approach
      console.log('Uploading video...');
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `story_${Date.now()}.mp4`;
      
      const { data, error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, blob, {
          contentType: 'video/mp4',
          upsert: true,
        });
        
      if (error) {
        console.error('Video upload error:', error);
        throw error;
      }
      
      const { data: urlData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(fileName);
      
      console.log('Video uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    }
    
    return null; // Should not reach here, but added for type safety
  } catch (error) {
    console.error('Error uploading story media:', error);
    throw error;
  }
};

// Helper function to format timeAgo for stories
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return 'agora';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}; 