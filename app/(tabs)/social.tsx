import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Dimensions, 
  Platform, 
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Animated,
  StatusBar,
  Modal,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as Location from 'expo-location';

// Add Story related imports
import StoryRing from '@/components/StoryRing';
import StoryViewer from '@/components/StoryViewer';
import StoryCreator from '@/components/StoryCreator';
import { fetchActiveStories, UserWithStories } from '@/utils/storyService';

const { width: screenWidth } = Dimensions.get('window');

const DEFAULT_USERNAME = 'user_fitcore';

type Post = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  image_url?: string | null;
  likes: number;
  comments: number;
  created_at: string;
  isLiked: boolean;
  timeAgo?: string;
  commentsList?: Comment[];
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  content: string;
  created_at: string;
  timeAgo?: string;
};

type ImageMapping = {
  [key: string]: string;
};

export default function SocialScreen() {
  const { isDarkMode, colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPostInput, setShowPostInput] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Post options modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  // Location state
  const [location, setLocation] = useState<string | null>(null);

  // Add new state for comments
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});

  // Add this new state for modal animation
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // Add story related state
  const [stories, setStories] = useState<UserWithStories[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<UserWithStories | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  // Add state for current user avatar
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserUsername, setCurrentUserUsername] = useState<string>('user_fitcore');
  
  useEffect(() => {
    let isMounted = true;

    // Get the current user ID
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setCurrentUserId(data.user?.id || null);
        
        // If we have a user ID, fetch their avatar and username
        if (data.user?.id) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('avatar_url, username')
              .eq('id', data.user.id)
              .single();
              
            if (!error && userData && isMounted) {
              setCurrentUserAvatar(userData.avatar_url);
              setCurrentUserUsername(userData.username || data.user.email?.split('@')[0] || 'user_fitcore');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      }
    };

    const init = async () => {
      setLoading(true); // Show loading state while initializing
      try {
        await getCurrentUser();
        
        // Animate FAB in
        if (isMounted) {
          Animated.spring(fabAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7
          }).start();
          
          // Start pulsing animation for FAB
          Animated.loop(
            Animated.sequence([
              Animated.timing(fabPulse, {
                toValue: 1.1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(fabPulse, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);
  
  // Function to clean up expired stories
  const cleanupExpiredStories = async () => {
    try {
      if (!currentUserId) return;
      
      // Get current time
      const currentTime = new Date().toISOString();
      
      // Update all expired stories to set is_active to false
      const { error } = await supabase
        .from('user_stories')
        .update({ is_active: false })
        .lt('expires_at', currentTime);
        
      if (error) {
        console.error('Error cleaning up expired stories:', error);
      }
    } catch (err) {
      console.error('Error in cleanupExpiredStories:', err);
    }
  };
  
  // Add a separate useEffect that will fetch posts and stories when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      cleanupExpiredStories(); // Clean up expired stories first
      fetchPosts();
      fetchStories();
    }
  }, [currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPosts(),
        fetchStories() // Also refresh stories on pull-to-refresh
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Function to fetch posts from the database
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      if (!currentUserId) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // First, get the list of users that the current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', currentUserId);

      if (followingError) {
        console.error('Error fetching following list:', followingError);
        setLoading(false);
        return;
      }

      // Get list of user IDs to include in posts (following + current user)
      const followingIds = followingData?.map(f => f.followed_id) || [];
      const userIdsToShow = [...followingIds, currentUserId]; // Include current user's posts

      // If user doesn't follow anyone and has no posts, show empty feed
      if (userIdsToShow.length === 1 && userIdsToShow[0] === currentUserId) {
        // Check if current user has any posts
        const { count: userPostCount } = await supabase
          .from('social_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUserId);

        if (!userPostCount || userPostCount === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      // Fetch posts only from followed users and current user
      const { data, error } = await supabase
        .from('social_posts')
        .select('*, profiles:user_id(username, avatar_url)')
        .in('user_id', userIdsToShow)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
        return;
      }

      // Get reactions for the user
      const { data: reactions } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', currentUserId || '');

      // Get image mappings from AsyncStorage (for posts created before DB migration)
      let imagePostMapping: ImageMapping = {};
      try {
        const imageMapping = await AsyncStorage.getItem('imagePostMapping');
        imagePostMapping = imageMapping ? JSON.parse(imageMapping) : {};
      } catch (error) {
        console.error('Error loading image mappings:', error);
      }
      
      const formattedPosts = data.map(post => {
        const timeAgo = formatTimeAgo(new Date(post.created_at));
        // Support both "id" and "post_id" field names
        const postId = post.id || post.post_id;
        const isLiked = reactions?.some(r => r.post_id === postId && r.reaction_type === 'like') || false;
        
        // Check for image URL - first try database column, then fallback to AsyncStorage
        let imageUrl = post.image_url || null;
        
        // If no image URL in database, try to find it in AsyncStorage
        if (!imageUrl) {
          imageUrl = imagePostMapping[`post_${postId}`] || null;
        }

        return {
          id: postId,
          user_id: post.user_id,
          username: post.profiles?.username || 'anonymous',
          avatar_url: post.profiles?.avatar_url || null,
          content: post.content,
          image_url: imageUrl,
          likes: 0, // We'll get the count from a different query
          comments: 0, // We'll get the count from a different query
          created_at: post.created_at,
          isLiked,
          timeAgo
        };
      });

      // Get likes count for each post
      for (const post of formattedPosts) {
        const { count: likeCount } = await supabase
          .from('post_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('reaction_type', 'like');
        
        post.likes = likeCount || 0;

        // Get comment count from post_comments table
        const { count: commentCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        post.comments = commentCount || 0;
      }

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch stories
  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      if (!currentUserId) {
        setStories([]);
        setLoadingStories(false);
        return;
      }
      const storiesData = await fetchActiveStories(currentUserId);
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  // Format the time ago string (e.g., "5m", "1h", "2d")
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleLike = async (postId: string) => {
    try {
      // Play like animation
      Animated.sequence([
        Animated.timing(likeScale, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.spring(likeScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true
        })
      ]).start();
      
      if (!currentUserId) {
        Alert.alert('Error', 'You must be logged in to like posts');
        return;
      }

      // Find the post and check if it's already liked
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        // Remove the like
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
          .eq('reaction_type', 'like');
      } else {
        // Add the like
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: currentUserId,
            reaction_type: 'like',
          });
      }

      // Update state immediately for better UX
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked,
          };
        }
        return post;
      }));

    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Add base64 option like profile upload
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Store base64 data for upload
      if (result.assets[0].base64) {
        setImageBase64(result.assets[0].base64);
      }
    }
  };

  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your camera');
      return;
    }
    
    // Launch camera
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true, // Add base64 option like profile upload
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Store base64 data for upload
      if (result.assets[0].base64) {
        setImageBase64(result.assets[0].base64);
      }
    }
  };
  
  const getLocationAsync = async () => {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your location');
      return;
    }
    
    try {
      // Get current location coordinates
      const location = await Location.getCurrentPositionAsync({});
      
      // Instead of using reverseGeocodeAsync (deprecated), we'll use a manual approach
      // or suggest a manual location entry
      Alert.alert(
        'Add Location',
        'How would you like to add your location?',
        [
          {
            text: 'Type manually',
            onPress: () => {
              // Use a cross-platform approach instead of Alert.prompt (which is iOS-only)
              if (Platform.OS === 'ios') {
                Alert.prompt(
                  'Location',
                  'Enter your current location (e.g., Lisbon, Portugal)',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Add',
                      onPress: (locationText) => {
                        if (locationText && locationText.trim()) {
                          setLocation(locationText.trim());
                        }
                      }
                    }
                  ]
                );
              } else {
                // For Android, use a simple location list
                Alert.alert(
                  'Choose a Location',
                  'Select a location:',
                  [
                    { text: 'Lisbon, Portugal', onPress: () => setLocation('Lisbon, Portugal') },
                    { text: 'Porto, Portugal', onPress: () => setLocation('Porto, Portugal') },
                    { text: 'Braga, Portugal', onPress: () => setLocation('Braga, Portugal') },
                    { text: 'Coimbra, Portugal', onPress: () => setLocation('Coimbra, Portugal') },
                    { text: 'Faro, Portugal', onPress: () => setLocation('Faro, Portugal') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }
            }
          },
          {
            text: 'Use coordinates',
            onPress: () => {
              // Use the coordinates in a simple format
              const locationString = `${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`;
              setLocation(locationString);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };
  
  const handleEmojiSelect = () => {
    // We'll use a simple approach with some predefined emojis
    // In a full implementation, you'd use a proper emoji picker library
    const commonEmojis = ['😊', '👍', '❤️', '🔥', '😂', '🎉', '💪', '🏋️'];
    
    Alert.alert(
      'Choose an Emoji',
      'Select an emoji to add:',
      [
        ...commonEmojis.map(emoji => ({
          text: emoji,
          onPress: () => {
            setNewPost(prev => prev + emoji);
          }
        })),
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const uploadImage = async () => {
    if (!image || !imageBase64) return null;
    
    try {
      setUploading(true);

      // Convert base64 to ArrayBuffer (same as profile upload)
      const { decode } = await import('base64-arraybuffer');
      const arrayBuffer = decode(imageBase64);
      
      // Generate a unique file name
      const fileName = `post_image_${Date.now()}.jpg`;
      
      // Upload to Supabase Storage with contentType (same as profile upload)
      const { data, error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('post-images')
        .getPublicUrl(fileName);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !image) {
      Alert.alert('Error', 'Post must contain text or an image');
      return;
    }

    try {
      setUploading(true);
      if (!currentUserId) {
        Alert.alert('Error', 'You must be logged in to create posts');
        return;
      }

      // Upload image if it exists
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
      }

      // Create post content with location if available
      let finalContent = newPost.trim();
      if (location) {
        finalContent += location ? `\n\n📍 ${location}` : '';
      }

      try {
        const { error } = await supabase
          .from('social_posts')
          .insert({
            user_id: currentUserId,
            content: finalContent,
            image_url: imageUrl,
            created_at: new Date().toISOString(),
          });

        if (error) {
          // If the database doesn't have an image_url column yet, 
          // store the URL in AsyncStorage as a fallback
          if (imageUrl) {
            const timestamp = Date.now();
            const imageMapping = await AsyncStorage.getItem('imagePostMapping');
            const imagePostMapping: ImageMapping = imageMapping ? JSON.parse(imageMapping) : {};
            
            // Query to get the post we just created
            const { data: recentPosts } = await supabase
              .from('social_posts')
              .select('*')
              .eq('user_id', currentUserId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (recentPosts && recentPosts.length > 0) {
              const postId = recentPosts[0].id;
              imagePostMapping[`post_${postId}`] = imageUrl;
              await AsyncStorage.setItem('imagePostMapping', JSON.stringify(imagePostMapping));
            }
          }
        }
      } catch (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post');
        return;
      }

      // Refresh posts to show the new one
      fetchPosts();
      
      // Reset post creation form
      setNewPost('');
      setImage(null);
      setImageBase64(null);
      setLocation(null);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleAddFriends = () => {
    // Navigate to the discover users screen
    router.push('/discover-users');
  };

  // Function to search for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      
      // Try the users table - include avatar_url in the query
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(10);
          
      if (usersError || !usersData || usersData.length === 0) {
        console.log('Error with "users" table or no results found');
        setSearchResults([]);
      } else {
        // We found users in the users table
        console.log('Found users:', usersData.length);
        
        // Filter results by username containing search query
        const filteredUsers = usersData.filter((user: { id: string, username: string }) => 
          user.id !== currentUserId && 
          user.username?.toLowerCase().includes(query.toLowerCase())
        );
        
        console.log('Filtered users count:', filteredUsers.length);
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error in searchUsers:', error);
      Alert.alert('Error', 'An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Handle search input changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSearch) {
        searchUsers(searchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSearch]);

  // Function to open post options modal
  const handlePostOptions = (post: Post) => {
    setSelectedPost(post);
    setShowPostOptions(true);
  };

  // Function to edit post
  const handleEditPost = () => {
    if (selectedPost) {
      setEditMode(true);
      setEditContent(selectedPost.content);
    }
  };

  // Function to update post content
  const handleUpdatePost = async () => {
    if (!selectedPost || (!editContent.trim() && !image && selectedPost.image_url)) return;
    
    try {
      setUploading(true);
      
      // Handle image update
      let imageUrl = null;
      if (image) {
        // Upload new image if a new one is selected
        if (image !== selectedPost.image_url) {
          imageUrl = await uploadImage();
        } else {
          // Keep existing image if not changed
          imageUrl = image;
        }
      }
      // If image is null, it means we want to remove the image
      
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          content: editContent.trim(),
          image_url: imageUrl 
        })
        .eq('post_id', selectedPost.id);
      
      if (error) throw error;

      // If we had an old image and it was changed or removed, delete it from storage
      if (selectedPost.image_url && selectedPost.image_url !== imageUrl) {
        try {
          // Extract the file name from the URL
          const oldFileName = selectedPost.image_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('post-images')
              .remove([oldFileName]);
          }
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
          // Don't throw error here as the post update was successful
        }
      }
      
      // Update the post in the local state
      setPosts(posts.map(post => 
        post.id === selectedPost.id 
          ? { ...post, content: editContent.trim(), image_url: imageUrl } 
          : post
      ));
      
      // Reset states
      setEditMode(false);
      setShowPostOptions(false);
      setSelectedPost(null);
      setEditContent('');
      setImage(null);
      setImageBase64(null);
      
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Function to delete post
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    
    try {
      // First delete all reactions for this post
      const { error: reactionsError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', selectedPost.id);
      
      if (reactionsError) throw reactionsError;

      // Then delete the post itself
      const { error: postError } = await supabase
        .from('social_posts')
        .delete()
        .eq('post_id', selectedPost.id);
      
      if (postError) throw postError;
      
      // Remove the post from the local state
      setPosts(posts.filter(post => post.id !== selectedPost.id));
      
      // Reset states
      setShowPostOptions(false);
      setSelectedPost(null);
      
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    }
  };

  // Add function to fetch comments for a post
  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      
      // Convert postId to integer since that's what our database expects
      const postIdInt = parseInt(postId);
      if (isNaN(postIdInt)) {
        throw new Error('Invalid post ID');
      }

      // First get the comments
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          users!user_id (username, avatar_url)
        `)
        .eq('post_id', postIdInt)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments = comments.map((comment: any) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        username: comment.users?.username || 'anonymous',
        avatar_url: comment.users?.avatar_url || null,
        content: comment.content,
        created_at: comment.created_at,
        timeAgo: formatTimeAgo(new Date(comment.created_at))
      }));

      // Update the post with comments
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, commentsList: formattedComments }
            : post
        )
      );

    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Add function to handle adding a new comment
  const handleAddComment = async (postId: string) => {
    if (!commentText[postId]?.trim() || !currentUserId) return;

    try {
      // Convert postId to integer
      const postIdInt = parseInt(postId);
      if (isNaN(postIdInt)) {
        throw new Error('Invalid post ID');
      }

      // Get current user's username
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUserId)
        .single();

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postIdInt,
          user_id: currentUserId,
          content: commentText[postId].trim(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Clear comment text
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      
      // Refresh comments
      await fetchComments(postId);
      
      // Update comment count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments: (post.comments || 0) + 1 }
            : post
        )
      );

    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  // Add function to toggle comments visibility
  const toggleComments = async (postId: string) => {
    const isVisible = showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: !isVisible }));
    
    if (!isVisible && !posts.find(p => p.id === postId)?.commentsList) {
      await fetchComments(postId);
    }
  };

  // Add these functions for modal animation
  const showCommentsModal = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: true }));
    fetchComments(postId);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
  };

  const hideCommentsModal = (postId: string) => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setShowComments(prev => ({ ...prev, [postId]: false }));
    });
  };

  // Add story related handlers
  const handleOpenStory = (userWithStories: UserWithStories, index = 0) => {
    // Show the story viewer immediately
    setSelectedUserStories(userWithStories);
    setInitialStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
    setSelectedUserStories(null);
  };

  const handleStoryComplete = () => {
    setShowStoryViewer(false);
    setSelectedUserStories(null);
    // Optionally, you might want to navigate to the next user's stories
  };

  const handleCreateStory = () => {
    setShowStoryCreator(true);
  };

  const handleStoryCreated = () => {
    setShowStoryCreator(false);
    fetchStories(); // Refresh stories after creating a new one
  };

  const handleStoryDeleted = () => {
    // Refresh stories after deletion
    fetchStories();
    // Close the story viewer if it's open
    if (showStoryViewer) {
      setShowStoryViewer(false);
      setSelectedUserStories(null);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a2e',
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 15 : 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#3e3e50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#2c2c3e',
    },
    headerActions: {
      flexDirection: 'row',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    storiesContainer: {
      height: 110,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    storiesContent: {
      padding: 15,
    },
    storyItem: {
      alignItems: 'center',
      marginHorizontal: 8,
    },
    storyRing: {
      width: 65,
      height: 65,
      borderRadius: 35,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#3e3e50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1a1a2e',
    },
    storyName: {
      color: '#fff',
      fontSize: 12,
      marginTop: 5,
    },
    storyAdd: {
      alignItems: 'center',
      marginRight: 8,
    },
    storyAddIcon: {
      width: 55,
      height: 55,
      borderRadius: 30,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#4a90e2',
    },
    storyAddText: {
      color: '#4a90e2',
      fontSize: 12,
      marginTop: 5,
    },
    storyAddRing: {
      width: 65,
      height: 65,
      borderRadius: 35,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    feed: {
      flex: 1,
      backgroundColor: '#1a1a2e',
    },
    feedContent: {
      paddingBottom: 80,
      paddingTop: 5,
    },
    loadingContainer: {
      padding: 15,
    },
    loadingCard: {
      backgroundColor: '#2c2c3e',
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    loadingHeader: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    loadingAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3e3e50',
      marginRight: 10,
    },
    loadingLines: {
      flex: 1,
      justifyContent: 'center',
    },
    loadingLine1: {
      height: 12,
      width: '60%',
      backgroundColor: '#3e3e50',
      borderRadius: 6,
      marginBottom: 8,
    },
    loadingLine2: {
      height: 10,
      width: '40%',
      backgroundColor: '#3e3e50',
      borderRadius: 5,
    },
    loadingImage: {
      height: 200,
      borderRadius: 8,
      backgroundColor: '#3e3e50',
      marginBottom: 15,
    },
    loadingFooter: {
      flexDirection: 'row',
    },
    loadingAction: {
      height: 20,
      width: 80,
      backgroundColor: '#3e3e50',
      borderRadius: 10,
      marginRight: 15,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      minHeight: 400,
    },
    emptyText: {
      color: '#fff',
      marginTop: 15,
      fontSize: 20,
      fontWeight: 'bold',
    },
    emptySubtext: {
      color: '#8e8e93',
      marginTop: 5,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 25,
    },
    emptyButton: {
      backgroundColor: '#4a90e2',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 25,
    },
    emptyButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    postCard: {
      backgroundColor: '#2c2c3e',
      borderRadius: 16,
      marginHorizontal: 15,
      marginTop: 15,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3e3e50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#2c2c3e',
    },
    username: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    timeAgo: {
      color: '#8e8e93',
      fontSize: 13,
    },
    moreButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      position: 'relative',
    },
    postImage: {
      width: '100%',
      height: 350,
      backgroundColor: '#3e3e50',
    },
    doubleTapArea: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
    },
    postContent: {
      padding: 15,
    },
    postText: {
      color: '#fff',
      fontSize: 16,
      lineHeight: 22,
    },
    postActions: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.03)',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    actionText: {
      color: '#fff',
      marginLeft: 5,
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
    },
    fabGradient: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
      width: screenWidth - 30,
      maxHeight: 500,
      borderRadius: 20,
      backgroundColor: '#2c2c3e',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    createPostContent: {
      padding: 15,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    createPostUsername: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    postInput: {
      color: '#fff',
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    selectedImageContainer: {
      marginVertical: 15,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      position: 'relative',
    },
    selectedImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    postOptions: {
      marginTop: 15,
    },
    addToPostText: {
      color: '#8e8e93',
      marginBottom: 10,
    },
    postOptionsRow: {
      flexDirection: 'row',
    },
    postOptionButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    publishButton: {
      backgroundColor: '#4a90e2',
      padding: 14,
      borderRadius: 25,
      marginTop: 20,
      alignItems: 'center',
    },
    publishButtonDisabled: {
      backgroundColor: 'rgba(74,144,226,0.5)',
    },
    publishButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    bottomPadding: {
      height: 100,
    },
    searchModalContent: {
      width: screenWidth - 30,
      height: '80%',
      borderRadius: 20,
      backgroundColor: '#2c2c3e',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    searchHeader: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 20,
      paddingHorizontal: 15,
      height: 40,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      color: '#fff',
      height: 40,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeSearchButton: {
      marginLeft: 15,
    },
    cancelText: {
      color: '#4a90e2',
      fontSize: 16,
    },
    searchLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    noResultsText: {
      color: '#8e8e93',
      fontSize: 16,
      marginTop: 10,
    },
    searchResultsContainer: {
      padding: 15,
      flex: 1,
    },
    userResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    resultAvatar: {
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor: '#3e3e50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#2c2c3e',
    },
    userResultInfo: {
      flex: 1,
    },
    userResultUsername: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    userResultName: {
      color: '#8e8e93',
      fontSize: 14,
    },
    optionsModal: {
      width: 280,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    optionText: {
      fontSize: 16,
      marginLeft: 12,
    },
    cancelOption: {
      justifyContent: 'center',
      borderBottomWidth: 0,
    },
    locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 12,
      marginTop: 10,
    },
    locationText: {
      marginLeft: 8,
      marginRight: 8,
    },
    commentSection: {
      padding: 15,
      borderTopWidth: 1,
    },
    commentInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    commentTextInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 15,
      marginRight: 10,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentsList: {
      marginTop: 10,
    },
    commentItem: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    commentAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    commentContent: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 10,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    commentUsername: {
      fontWeight: 'bold',
      marginRight: 8,
    },
    commentTime: {
      fontSize: 12,
    },
    commentText: {
      fontSize: 14,
      lineHeight: 20,
    },
    showCommentsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
    },
    showCommentsText: {
      marginLeft: 5,
    },
    viewCommentsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderTopWidth: 1,
    },
    viewCommentsText: {
      marginLeft: 8,
      fontSize: 14,
    },
    commentCount: {
      fontSize: 14,
      color: '#8e8e93',
      marginLeft: 'auto',
    },
    commentsModalContainer: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    commentsModalContent: {
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
    },
    commentsModalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(0,0,0,0.2)',
      alignSelf: 'center',
      marginVertical: 8,
    },
    commentsModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      position: 'relative',
    },
    commentsModalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    commentsCloseButton: {
      position: 'absolute',
      right: 15,
      top: 15,
    },
    commentsListContainer: {
      flex: 1,
      padding: 15,
    },
    commentsInputContainer: {
      borderTopWidth: 1,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', // Add background color
      paddingBottom: Platform.OS === 'ios' ? 30 : 15, // Add extra padding for iOS
    },
    commentsInput: {
      flex: 1,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 12,
      marginRight: 10,
      fontSize: 16,
      minHeight: 40,
      maxHeight: 100,
    },
    commentsSendButton: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyNamePlaceholder: {
      width: 40,
      height: 10,
      borderRadius: 5,
      marginTop: 8,
    },
    noStoriesContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 120,
    },
    noStoriesText: {
      fontSize: 14,
      marginTop: 10,
    },
  });

  // Place this before the return statement
  const renderCommentsModal = (post: Post) => (
    <Modal
      key={`modal-${post.id}`}
      visible={showComments[post.id] || false}
      transparent
      animationType="slide"
      onRequestClose={() => hideCommentsModal(post.id)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => hideCommentsModal(post.id)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 0 }}
        >
          <View
            style={[
              styles.commentsModalContent,
              {
                backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff',
                position: 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: Dimensions.get('window').height * 0.75,
                minHeight: Dimensions.get('window').height * 0.5,
              }
            ]}
          >
            <View style={styles.commentsModalHandle} />
            <View style={[styles.commentsModalHeader, {
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}>
              <Text style={[styles.commentsModalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Comments
              </Text>
              <TouchableOpacity
                style={styles.commentsCloseButton}
                onPress={() => hideCommentsModal(post.id)}
              >
                <Feather name="x" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={[styles.commentsListContainer, { flex: 1 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {loadingComments[post.id] ? (
                <ActivityIndicator size="small" color="#4a90e2" style={{ marginTop: 20 }} />
              ) : (
                post.commentsList?.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <LinearGradient
                      colors={['#f2709c', '#ff9472']}
                      style={styles.commentAvatar}
                    >
                      {comment.avatar_url ? (
                        <Image
                          source={{ uri: comment.avatar_url }}
                          style={[styles.avatar, {
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                          }]}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.avatar, {
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                          borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                        }]}>
                          <FontAwesome name="user" size={16} color={isDarkMode ? "#fff" : "#333"} />
                        </View>
                      )}
                    </LinearGradient>
                    <View style={[styles.commentContent, {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }]}>
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentUsername, { color: isDarkMode ? '#fff' : '#000' }]}>
                          {comment.username}
                        </Text>
                        <Text style={[styles.commentTime, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                          {comment.timeAgo}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: isDarkMode ? '#fff' : '#000' }]}>
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={[styles.commentsInputContainer, {
              borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff',
              paddingBottom: Platform.OS === 'ios' ? 34 : 15,
            }]}>
              <TextInput
                style={[styles.commentsInput, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: isDarkMode ? '#fff' : '#000'
                }]}
                placeholder="Add a comment..."
                placeholderTextColor={isDarkMode ? '#8e8e93' : '#666'}
                value={commentText[post.id] || ''}
                onChangeText={(text) => setCommentText(prev => ({ ...prev, [post.id]: text }))}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.commentsSendButton, {
                  backgroundColor: commentText[post.id]?.trim()
                    ? '#4a90e2'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)'
                }]}
                onPress={() => handleAddComment(post.id)}
                disabled={!commentText[post.id]?.trim()}
              >
                <Feather
                  name="send"
                  size={18}
                  color={commentText[post.id]?.trim() ? '#fff' : isDarkMode ? '#8e8e93' : '#666'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  // Modify the Stories Section 
  const renderStoriesSection = () => {
    return (
    <View style={[styles.storiesContainer, { 
      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
    }]}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}
      >
        <TouchableOpacity style={styles.storyAdd} onPress={handleCreateStory}>
          <LinearGradient
            colors={['rgba(74,144,226,0.2)', 'rgba(74,144,226,0.1)']}
            style={styles.storyAddRing}
          >
            <View style={[styles.storyAddIcon, {
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'
            }]}>
              <Feather name="plus" size={20} color="#4a90e2" />
            </View>
          </LinearGradient>
          <Text style={[styles.storyAddText, { color: '#4a90e2' }]}>Add</Text>
        </TouchableOpacity>
        
        {loadingStories ? (
          // Show placeholders while loading
          Array.from({ length: 5 }).map((_, index) => (
            <View key={`placeholder-${index}`} style={styles.storyItem}>
              <View style={[styles.storyRing, { opacity: 0.5 }]}>
                <View style={[styles.storyInner, { 
                  backgroundColor: isDarkMode ? '#3e3e50' : '#f0f0f0'
                }]} />
              </View>
              <View style={[styles.storyNamePlaceholder, {
                backgroundColor: isDarkMode ? '#3e3e50' : '#f0f0f0',
              }]} />
            </View>
          ))
        ) : stories.length > 0 ? (
          // Show actual stories
          stories.map((userStories) => (
            <TouchableOpacity 
              key={userStories.id} 
              style={styles.storyItem}
              onPress={() => handleOpenStory(userStories)}
              activeOpacity={0.7}
            >
              <StoryRing size={60} seen={!userStories.hasUnviewedStories}>
                {userStories.avatar_url ? (
                  <Image 
                    source={{ uri: userStories.avatar_url }}
                    style={[styles.storyInner, { 
                      backgroundColor: isDarkMode ? '#3e3e50' : '#ffffff',
                      borderColor: isDarkMode ? '#1a1a2e' : '#e0e0e0'
                    }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.storyInner, { 
                    backgroundColor: isDarkMode ? '#3e3e50' : '#ffffff',
                    borderColor: isDarkMode ? '#1a1a2e' : '#e0e0e0'
                  }]}>
                    <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                  </View>
                )}
              </StoryRing>
              <Text 
                style={[
                  styles.storyName, 
                  { 
                    color: isDarkMode ? '#fff' : '#000',
                    fontWeight: userStories.hasUnviewedStories ? '700' : '400'
                  }
                ]}
              >
                {userStories.username}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          // Show "No stories" message if none exist
          <View style={styles.noStoriesContainer}>
            <Text style={[styles.noStoriesText, { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
              No stories from people you follow
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#2b2b45', '#1a1a2e'] : ['#f5f5f5', '#e0e0e0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <StoryRing 
              size={36} 
              hasStories={stories.some(userStories => userStories.id === currentUserId)}
              seen={!stories.find(userStories => userStories.id === currentUserId)?.hasUnviewedStories}
            >
              {currentUserAvatar ? (
                <Image
                  source={{ uri: currentUserAvatar }}
                  style={styles.avatarSmall}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarSmall, { 
                  backgroundColor: isDarkMode ? '#3e3e50' : '#ffffff',
                  borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                }]}>
                  <FontAwesome name="user" size={16} color={isDarkMode ? "#fff" : "#333"} />
                </View>
              )}
            </StoryRing>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => setShowSearch(true)}
          >
            <Feather name="search" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handleAddFriends}
          >
            <Feather name="user-plus" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => router.push('/chat')}
          >
            <Feather name="message-circle" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stories Section - Replace with our new renderStoriesSection */}
      {renderStoriesSection()}

      {/* Posts Feed */}
      <Animated.ScrollView 
        style={[styles.feed, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingCard, { backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff' }]}>
              <View style={styles.loadingHeader}>
                <View style={[styles.loadingAvatar, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
                <View style={styles.loadingLines}>
                  <View style={[styles.loadingLine1, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
                  <View style={[styles.loadingLine2, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
                </View>
              </View>
              <View style={[styles.loadingImage, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
              <View style={styles.loadingFooter}>
                <View style={[styles.loadingAction, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
                <View style={[styles.loadingAction, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
                <View style={[styles.loadingAction, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]} />
              </View>
            </View>
          </View>
        ) : posts.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group" size={80} color={isDarkMode ? "#8e8e93" : "#999"} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>Your feed is empty</Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? '#8e8e93' : '#666' }]}>Follow people to see their posts here</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddFriends}
            >
              <Text style={styles.emptyButtonText}>Discover People</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => (
            <View key={post.id} style={[styles.postCard, { 
              backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }]}>
              <View style={[styles.postHeader, { 
                borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <View style={styles.userInfo}>
                  <StoryRing 
                    size={40} 
                    hasStories={stories.some(userStories => userStories.id === post.user_id)}
                    seen={!stories.find(userStories => userStories.id === post.user_id)?.hasUnviewedStories}
                  >
                    {post.avatar_url ? (
                      <Image 
                        source={{ uri: post.avatar_url }}
                        style={styles.avatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.avatar, { 
                        backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                        borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                      }]}>
                        <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                      </View>
                    )}
                  </StoryRing>
                  <TouchableOpacity 
                    onPress={() => router.push(`/${post.user_id}`)}
                    style={{ marginLeft: 12 }}
                  >
                    <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>{post.username}</Text>
                    <Text style={[styles.timeAgo, { color: isDarkMode ? '#8e8e93' : '#666' }]}>{post.timeAgo}</Text>
                  </TouchableOpacity>
                </View>
                {post.user_id === currentUserId ? (
                  <TouchableOpacity 
                    style={[styles.moreButton, { 
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
                    }]}
                    onPress={() => handlePostOptions(post)}
                  >
                    <Feather name="more-horizontal" size={20} color={isDarkMode ? "#8e8e93" : "#666"} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {post.image_url && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: post.image_url }} 
                    style={styles.postImage} 
                    resizeMode="cover"
                  />
                  
                  <TouchableOpacity 
                    style={styles.doubleTapArea}
                    onPress={() => handleLike(post.id)}
                  />
                </View>
              )}

              {post.content && (
                <LinearGradient
                  colors={['rgba(74,144,226,0.05)', 'rgba(0,0,0,0)']}
                  style={styles.postContent}
                >
                  <Text style={[styles.postText, { color: isDarkMode ? '#fff' : '#000' }]}>{post.content}</Text>
                </LinearGradient>
              )}

              {/* Post Actions */}
              <View style={[styles.postActions, { 
                borderTopColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleLike(post.id)}
                >
                  <Animated.View
                    style={[
                      post.isLiked && { transform: [{ scale: likeScale }] }
                    ]}
                  >
                    {post.isLiked ? (
                      <MaterialCommunityIcons name="heart" size={26} color="#ff4757" />
                    ) : (
                      <MaterialCommunityIcons name="heart-outline" size={26} color={isDarkMode ? "#fff" : "#000"} />
                    )}
                  </Animated.View>
                  <Text style={[styles.actionText, { color: isDarkMode ? '#fff' : '#000' }]}>{post.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => showCommentsModal(post.id)}
                >
                  <MaterialCommunityIcons 
                    name="comment-outline"
                    size={26} 
                    color={isDarkMode ? "#fff" : "#000"} 
                  />
                  <Text style={[styles.actionText, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {post.comments}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Feather name="share" size={24} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>

              {/* Comments Input Section */}
              <View style={[styles.commentSection, {
                borderTopColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'
              }]}>
                <View style={styles.commentInput}>
                  <TextInput
                    style={[styles.commentTextInput, {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: isDarkMode ? '#fff' : '#000'
                    }]}
                    placeholder="Write a comment..."
                    placeholderTextColor={isDarkMode ? '#8e8e93' : '#666'}
                    value={commentText[post.id] || ''}
                    onChangeText={(text) => setCommentText(prev => ({ ...prev, [post.id]: text }))}
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, {
                      backgroundColor: commentText[post.id]?.trim() ? '#4a90e2' : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }]}
                    onPress={() => handleAddComment(post.id)}
                    disabled={!commentText[post.id]?.trim()}
                  >
                    <Feather
                      name="send"
                      size={20}
                      color={commentText[post.id]?.trim() ? '#fff' : isDarkMode ? '#8e8e93' : '#666'}
                    />
                  </TouchableOpacity>
                </View>

                {/* View Comments Button */}
                <TouchableOpacity
                  style={[styles.viewCommentsButton, {
                    borderTopColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'
                  }]}
                  onPress={() => showCommentsModal(post.id)}
                >
                  <MaterialCommunityIcons
                    name="comment-text-outline"
                    size={20}
                    color={isDarkMode ? '#8e8e93' : '#666'}
                  />
                  <Text style={[styles.viewCommentsText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    View all comments
                  </Text>
                  <Text style={[styles.commentCount, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    {post.comments}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Comments Modal */}
              {renderCommentsModal(post)}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        style={[
          styles.fab,
          {
            transform: [
              { scale: fabAnimation },
              { scale: fabPulse },
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 500],
                  outputRange: [0, 100],
                  extrapolate: 'clamp'
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#4776E6', '#8E54E9']}
          style={styles.fabGradient}
        >
          <TouchableOpacity 
            style={styles.fabButton}
            onPress={() => {
              setShowPostInput(true);
            }}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Post Creation Modal */}
      {showPostInput && (
        <BlurView intensity={80} style={styles.modalOverlay} tint={isDarkMode ? "dark" : "light"}>
          <Animated.View 
            style={[styles.modalContent, {
              backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}
          >
            <View style={[styles.modalHeader, {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Create Post</Text>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => {
                  setShowPostInput(false);
                  setImage(null);
                  setNewPost('');
                  setImageBase64(null);
                  setLocation(null);
                }}
              >
                <Feather name="x" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.createPostContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.userRow}>
                <StoryRing 
                  size={40} 
                  hasStories={stories.some(userStories => userStories.id === currentUserId)}
                  seen={!stories.find(userStories => userStories.id === currentUserId)?.hasUnviewedStories}
                >
                  {currentUserAvatar ? (
                    <Image
                      source={{ uri: currentUserAvatar }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, {
                      backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                      borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                    }]}>
                      <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                    </View>
                  )}
                </StoryRing>
                <Text style={[styles.createPostUsername, { color: isDarkMode ? '#fff' : '#000' }]}>{currentUserUsername}</Text>
              </View>

              <TextInput
                style={[styles.postInput, { color: isDarkMode ? '#fff' : '#000' }]}
                placeholder="What are you thinking?"
                placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                autoFocus
              />

              {/* Image Preview and Controls */}
              {(image || selectedPost?.image_url) && (
                <View style={[styles.selectedImageContainer, {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }]}>
                  {(image || selectedPost?.image_url) && (
                    <Image 
                      source={{ uri: image || selectedPost?.image_url || '' }}
                      style={styles.selectedImage} 
                    />
                  )}
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImage(null);
                      if (selectedPost) {
                        // Create a new object with the same properties but null image_url
                        setSelectedPost({
                          ...selectedPost,
                          image_url: null
                        });
                      }
                    }}
                  >
                    <Feather name="x-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.postOptions}>
                <Text style={[styles.addToPostText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>Add to post:</Text>
                <View style={styles.postOptionsRow}>
                  <TouchableOpacity 
                    style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={pickImage}
                  >
                    <Feather name="image" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={takePhoto}
                  >
                    <Feather name="camera" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                </View>
                
                {location && (
                  <View style={[styles.locationTag, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#4a90e2" />
                    <Text style={[styles.locationText, { color: isDarkMode ? '#fff' : '#000' }]}>
                      {location}
                    </Text>
                    <TouchableOpacity onPress={() => setLocation(null)}>
                      <Feather name="x" size={16} color={isDarkMode ? "#8e8e93" : "#666"} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.publishButton, 
                  ((!newPost.trim() && !image) || uploading) && styles.publishButtonDisabled
                ]}
                onPress={() => {
                  handlePost();
                  setShowPostInput(false);
                }}
                disabled={(!newPost.trim() && !image) || uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.publishButtonText}>Publish</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </BlurView>
      )}

      {/* Search Modal */}
      {showSearch && (
        <BlurView intensity={80} style={styles.modalOverlay} tint={isDarkMode ? "dark" : "light"}>
          <Animated.View style={[styles.searchModalContent, {
            backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }]}>
            <View style={[styles.searchHeader, {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}>
              <View style={[styles.searchInputContainer, {
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'
              }]}>
                <Feather name="search" size={20} color={isDarkMode ? "#8e8e93" : "#666"} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#000' }]}
                  placeholder="Search users..."
                  placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => setSearchQuery('')}
                  >
                    <Feather name="x" size={18} color={isDarkMode ? "#8e8e93" : "#666"} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.closeSearchButton}
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {searchLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="large" color="#4a90e2" />
              </View>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <MaterialCommunityIcons name="account-search-outline" size={60} color={isDarkMode ? "#8e8e93" : "#666"} />
                <Text style={[styles.noResultsText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>No users found</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.searchResultsContainer}
                keyboardShouldPersistTaps="handled"
              >
                {searchResults.map(user => (
                  <TouchableOpacity 
                    key={user.id} 
                    style={[styles.userResultItem, {
                      borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }]}
                    onPress={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      // Navigate to user profile page with user ID
                      router.push(`/${user.id}`);
                    }}
                  >
                    <StoryRing 
                      size={36} 
                      hasStories={stories.some(userStories => userStories.id === user.id)}
                      seen={!stories.find(userStories => userStories.id === user.id)?.hasUnviewedStories}
                    >
                      {user.avatar_url ? (
                        <Image 
                          source={{ uri: user.avatar_url }}
                          style={styles.resultAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.resultAvatar}>
                          <FontAwesome name="user" size={18} color="#fff" />
                        </View>
                      )}
                    </StoryRing>
                    <View style={styles.userResultInfo}>
                      <Text style={styles.userResultUsername}>{user.username}</Text>
                      <Text style={styles.userResultName}>{user.full_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </BlurView>
      )}

      {/* Post Options Modal */}
      {showPostOptions && selectedPost && (
        <BlurView intensity={80} style={styles.modalOverlay} tint={isDarkMode ? "dark" : "light"}>
          <View 
            style={[styles.optionsModal, {
              backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }]}
          >
            {editMode ? (
              <>
                <View style={[styles.modalHeader, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }]}>
                  <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Edit Post</Text>
                  <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => {
                      setEditMode(false);
                      setEditContent('');
                      setImage(null);
                      setImageBase64(null);
                    }}
                  >
                    <Feather name="x" size={24} color={isDarkMode ? "#fff" : "#000"} />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  style={styles.createPostContent}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <TextInput
                    style={[styles.postInput, { color: isDarkMode ? '#fff' : '#000' }]}
                    placeholder="Edit your post..."
                    placeholderTextColor={isDarkMode ? '#8e8e93' : '#999'}
                    multiline
                    value={editContent}
                    onChangeText={setEditContent}
                  />
                  
                  {/* Image Preview and Controls */}
                  {(image || selectedPost?.image_url) && (
                    <View style={[styles.selectedImageContainer, {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                    }]}>
                      {(image || selectedPost?.image_url) && (
                        <Image 
                          source={{ uri: image || selectedPost?.image_url || '' }}
                          style={styles.selectedImage} 
                        />
                      )}
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => {
                          setImage(null);
                          if (selectedPost) {
                            // Create a new object with the same properties but null image_url
                            setSelectedPost({
                              ...selectedPost,
                              image_url: null
                            });
                          }
                        }}
                      >
                        <Feather name="x-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Image Options */}
                  <View style={styles.postOptions}>
                    <Text style={[styles.addToPostText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                      Change image:
                    </Text>
                    <View style={styles.postOptionsRow}>
                      <TouchableOpacity 
                        style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={pickImage}
                      >
                        <Feather name="image" size={22} color="#4a90e2" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={takePhoto}
                      >
                        <Feather name="camera" size={22} color="#4a90e2" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.publishButton,
                      ((!editContent.trim() && !image) || uploading) && styles.publishButtonDisabled
                    ]}
                    onPress={handleUpdatePost}
                    disabled={(!editContent.trim() && !image) || uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.publishButtonText}>Update</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={handleEditPost}
                >
                  <Feather name="edit-2" size={22} color={isDarkMode ? "#fff" : "#000"} />
                  <Text style={[styles.optionText, { color: isDarkMode ? '#fff' : '#000' }]}>Edit Post</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={handleDeletePost}
                >
                  <Feather name="trash-2" size={22} color="#ff4757" />
                  <Text style={[styles.optionText, { color: '#ff4757' }]}>Delete Post</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.optionItem, styles.cancelOption]}
                  onPress={() => setShowPostOptions(false)}
                >
                  <Text style={[styles.optionText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      )}

      {/* Add this at the end of the return statement */}
      {posts.map(post => renderCommentsModal(post))}

      {/* Story Viewer Modal */}
      {selectedUserStories && showStoryViewer && (
        <StoryViewer
          stories={selectedUserStories.stories}
          currentUserID={currentUserId || ''}
          initialStoryIndex={initialStoryIndex}
          onClose={handleCloseStoryViewer}
          onComplete={handleStoryComplete}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* Story Creator Modal */}
      <StoryCreator
        visible={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onStoryCreated={handleStoryCreated}
        userId={currentUserId || ''}
      />
    </View>
  );
} 