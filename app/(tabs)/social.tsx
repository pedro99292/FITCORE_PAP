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
  StatusBar
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

const DEFAULT_USERNAME = 'user_fitcore';

type Post = {
  id: string;
  user_id: string;
  username: string;
  content: string;
  image_url?: string | null;
  likes: number;
  comments: number;
  created_at: string;
  isLiked: boolean;
  timeAgo?: string;
};

type ImageMapping = {
  [key: string]: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
  avatarGradientSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  avatarGradient: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
  resultAvatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
});

export default function SocialScreen() {
  const { isDarkMode, colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPostInput, setShowPostInput] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchPosts();
    
    // Animate FAB in
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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // Function to fetch posts from the database
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      const { data, error } = await supabase
        .from('social_posts')
        .select('*, profiles:user_id(username)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
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

        const { count: commentCount } = await supabase
          .from('post_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .not('comment', 'is', null);
        
        post.comments = commentCount || 0;
      }

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format the time ago string (e.g., "5m", "1h", "2d")
  const formatTimeAgo = (date: Date) => {
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
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
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
          .eq('user_id', userId)
          .eq('reaction_type', 'like');
      } else {
        // Add the like
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: userId,
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

      // Refresh posts to get updated counts
      fetchPosts();
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
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    
    try {
      setUploading(true);

      // Convert URI to Blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Generate a unique file name
      const fileName = `post_image_${Date.now()}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('post-images')
        .upload(fileName, blob);
        
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
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to create posts');
        return;
      }

      // Upload image if it exists
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
      }

      // Create a single post with both text and image
      // Assuming the database has been modified to either:
      // 1. Have a larger varchar size for content
      // 2. Have a separate image_url column
      try {
        const { error } = await supabase
          .from('social_posts')
          .insert({
            user_id: userId,
            content: newPost.trim(),
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
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (recentPosts && recentPosts.length > 0) {
              const postId = recentPosts[0].id || recentPosts[0].post_id;
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
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleAddFriends = () => {
    // This would open the add friends screen or modal
    console.log('Open add friends screen');
  };

  // Function to search for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      console.log('Searching for:', query);
      
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;
      console.log('Current user ID:', currentUserId);
      
      // After seeing the screenshots, we know the table exists but with a different name
      // Let's try without specifying a schema name (default public schema)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('user')  // Try "user" instead of "users" or "profiles"
        .select('*')
        .limit(10);
      
      if (allUsersError) {
        console.log('Error with "user" table, trying "users"');
        // Try the original "users" table again
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(10);
          
        if (usersError) {
          console.log('Error with both "user" and "users" tables, trying "auth.users"');
          // Try auth schema
          const { data: authUsersData, error: authUsersError } = await supabase
            .from('auth.users')
            .select('*')
            .limit(10);
            
          if (authUsersError) {
            console.log('All known user table attempts failed. Using RPC call as last resort');
            
            // Try a direct SQL query using RPC (if you have a function set up)
            // This is a last resort attempt
            try {
              const { data: rpcUsers } = await supabase.rpc('get_all_users');
              
              if (rpcUsers && rpcUsers.length > 0) {
                console.log('Found users through RPC call');
                // Filter out current user and filter by query
                const filteredUsers = rpcUsers.filter((user: { id: string; username?: string; email?: string }) => 
                  user.id !== currentUserId && 
                  (user.username?.toLowerCase().includes(query.toLowerCase()) || 
                   user.email?.toLowerCase().includes(query.toLowerCase()))
                );
                
                setSearchResults(filteredUsers);
                console.log('Found users:', filteredUsers.length);
              } else {
                setSearchResults([]);
              }
            } catch (rpcError) {
              console.error('RPC call failed:', rpcError);
              
              // Last option: Try a direct query using Supabase Functions
              Alert.alert(
                'Database Issue', 
                'Unable to search for users. The database structure may need to be reconfigured.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setSearchLoading(false);
                      setSearchResults([]);
                    }
                  }
                ]
              );
            }
          } else {
            // We found users in auth.users
            const filteredAuthUsers = authUsersData?.filter(user => 
              user.id !== currentUserId && user.email?.toLowerCase().includes(query.toLowerCase())
            ) || [];
            
            console.log('Found users in auth.users:', filteredAuthUsers.length);
            setSearchResults(filteredAuthUsers);
          }
        } else {
          // We found users in the users table
          console.log('Found users in users table:', usersData?.length || 0);
          
          // Check if the structure matches what we see in the screenshot
          if (usersData && usersData.length > 0) {
            console.log('User fields available:', Object.keys(usersData[0]).join(', '));
            
            // Filter results by username or email containing search query
            const filteredUsers = usersData.filter(user => 
              user.id !== currentUserId && 
              (user.username?.toLowerCase().includes(query.toLowerCase()) || 
               user.email?.toLowerCase().includes(query.toLowerCase()))
            );
            
            console.log('Filtered users count:', filteredUsers.length);
            setSearchResults(filteredUsers);
          } else {
            setSearchResults([]);
          }
        }
      } else {
        // We found users in the "user" table
        console.log('Found users in user table:', allUsers?.length || 0);
        
        if (allUsers && allUsers.length > 0) {
          console.log('User fields available:', Object.keys(allUsers[0]).join(', '));
          
          // Filter results
          const filteredUsers = allUsers.filter(user => 
            user.id !== currentUserId && 
            (user.username?.toLowerCase().includes(query.toLowerCase()) || 
             user.email?.toLowerCase().includes(query.toLowerCase()))
          );
          
          console.log('Filtered users count:', filteredUsers.length);
          setSearchResults(filteredUsers);
        } else {
          setSearchResults([]);
        }
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
            <LinearGradient
              colors={['#f2709c', '#ff9472']}
              style={styles.avatarGradientSmall}
            >
              <View style={[styles.avatarSmall, { 
                backgroundColor: isDarkMode ? '#3e3e50' : '#ffffff',
                borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
              }]}>
                <FontAwesome name="user" size={16} color={isDarkMode ? "#fff" : "#333"} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => setShowSearch(true)}
          >
            <Feather name="search" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Feather name="bell" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Feather name="message-circle" size={22} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stories Section */}
      <View style={[styles.storiesContainer, { 
        borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
      }]}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          <TouchableOpacity style={styles.storyAdd}>
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
          
          {['John', 'Maria', 'Carlos', 'Ana', 'Pedro'].map((name, index) => (
            <TouchableOpacity key={index} style={styles.storyItem}>
              <LinearGradient
                colors={index % 2 === 0 ? ['#f2709c', '#ff9472'] : ['#4776E6', '#8E54E9']}
                style={styles.storyRing}
              >
                <View style={[styles.storyInner, { 
                  backgroundColor: isDarkMode ? '#3e3e50' : '#ffffff',
                  borderColor: isDarkMode ? '#1a1a2e' : '#e0e0e0'
                }]}>
                  <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                </View>
              </LinearGradient>
              <Text style={[styles.storyName, { color: isDarkMode ? '#fff' : '#000' }]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
            <MaterialCommunityIcons name="post-outline" size={80} color={isDarkMode ? "#8e8e93" : "#999"} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>Não existem posts ainda</Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? '#8e8e93' : '#666' }]}>Sê o primeiro a partilhar!</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowPostInput(true)}
            >
              <Text style={styles.emptyButtonText}>Criar Post</Text>
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
                  <LinearGradient
                    colors={['#f2709c', '#ff9472']}
                    style={styles.avatarGradient}
                  >
                    <View style={[styles.avatar, { 
                      backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                      borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                    }]}>
                      <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                    </View>
                  </LinearGradient>
                  <View>
                    <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>{post.username}</Text>
                    <Text style={[styles.timeAgo, { color: isDarkMode ? '#8e8e93' : '#666' }]}>{post.timeAgo}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.moreButton, { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
                }]}>
                  <Feather name="more-horizontal" size={20} color={isDarkMode ? "#8e8e93" : "#666"} />
                </TouchableOpacity>
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

                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="comment-outline" size={26} color={isDarkMode ? "#fff" : "#000"} />
                  <Text style={[styles.actionText, { color: isDarkMode ? '#fff' : '#000' }]}>{post.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Feather name="share" size={24} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>
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
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Criar Post</Text>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => {
                  setShowPostInput(false);
                  setImage(null);
                  setNewPost('');
                }}
              >
                <Feather name="x" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.createPostContent}>
              <View style={styles.userRow}>
                <LinearGradient
                  colors={['#f2709c', '#ff9472']}
                  style={styles.avatarGradient}
                >
                  <View style={[styles.avatar, {
                    backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                    borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
                  }]}>
                    <FontAwesome name="user" size={22} color={isDarkMode ? "#fff" : "#333"} />
                  </View>
                </LinearGradient>
                <Text style={[styles.createPostUsername, { color: isDarkMode ? '#fff' : '#000' }]}>{DEFAULT_USERNAME}</Text>
              </View>

              <TextInput
                style={[styles.postInput, { color: isDarkMode ? '#fff' : '#000' }]}
                placeholder="Em que estás a pensar?"
                placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                autoFocus
              />

              {image && (
                <View style={[styles.selectedImageContainer, {
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                }]}>
                  <Image source={{ uri: image }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setImage(null)}
                  >
                    <Feather name="x-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.postOptions}>
                <Text style={[styles.addToPostText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>Adicionar ao post:</Text>
                <View style={styles.postOptionsRow}>
                  <TouchableOpacity 
                    style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={pickImage}
                  >
                    <Feather name="image" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Feather name="camera" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name="emoticon-outline" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.postOptionButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                </View>
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
                  <Text style={styles.publishButtonText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
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
                    <LinearGradient
                      colors={['#f2709c', '#ff9472']}
                      style={styles.resultAvatarGradient}
                    >
                      <View style={styles.resultAvatar}>
                        <FontAwesome name="user" size={18} color="#fff" />
                      </View>
                    </LinearGradient>
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
    </View>
  );
} 