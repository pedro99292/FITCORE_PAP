import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';

// Add Story related imports
import StoryViewer from '@/components/StoryViewer';
import { fetchActiveStories, UserWithStories } from '@/utils/storyService';

const { width: screenWidth } = Dimensions.get('window');

type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type UserData = {
  experience_level: string | null;
  goals: string | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  workouts_per_week: number | null;
  age: number | null;
};

type UserProfileWithData = UserProfile & UserData;

// Add type for follower/following user
type FollowUser = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  isFollowing: boolean;
};

// Add modal type
type ModalType = 'followers' | 'following' | null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#3e3e50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  followButton: {
    backgroundColor: '#4a90e2',
  },
  messageButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  infoCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingContainer: {
    width: 126,
    height: 126,
    borderRadius: 63,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  clickableAvatar: {
    // Add subtle shadow or transform to indicate it's interactive
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userUsername: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userFullName: {
    fontSize: 14,
    opacity: 0.7,
  },
  followUserButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  followUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  clickableStatItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
});

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfileWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const { isDarkMode, colors } = useTheme();

  // Add story related state
  const [stories, setStories] = useState<UserWithStories[]>([]);
  const [userStories, setUserStories] = useState<UserWithStories | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
    checkIfFollowing();
    checkIfOwnProfile();
    initializeData();
  }, [userId]);

  const initializeData = async () => {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      // Fetch stories for this specific user
      await fetchUserStories();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const fetchUserStories = async () => {
    try {
      const storiesData = await fetchActiveStories(currentUserId);
      setStories(storiesData);
      
      // Find stories for this specific user
      const currentUserStories = storiesData.find(userWithStories => userWithStories.id === userId);
      setUserStories(currentUserStories || null);
      
      // Debug logging
      console.log('Profile User ID:', userId);
      console.log('Stories found for user:', currentUserStories ? currentUserStories.stories.length : 0);
      console.log('Has stories:', currentUserStories && currentUserStories.stories.length > 0);
    } catch (error) {
      console.error('Error fetching user stories:', error);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followed_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error in checkIfFollowing:', error);
    }
  };

  const checkIfOwnProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsOwnProfile(user.id === userId);
      }
    } catch (error) {
      console.error('Error checking own profile:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // First, fetch the basic user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      // Then fetch the user fitness data separately
      const { data: userDataRecord, error: dataError } = await supabase
        .from('users_data')
        .select(`
          age,
          weight,
          height,
          gender,
          goals,
          experience_level,
          workouts_per_week
        `)
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to handle case where user_data might not exist
      
      // Note: We don't throw on dataError since a user might not have fitness data yet
      
      // Flatten the data structure
      const userProfileWithData: UserProfileWithData = {
        id: userData.id,
        username: userData.username,
        full_name: userData.full_name,
        bio: userData.bio,
        avatar_url: userData.avatar_url,
        age: userDataRecord?.age || null,
        weight: userDataRecord?.weight || null,
        height: userDataRecord?.height || null,
        gender: userDataRecord?.gender || null,
        goals: userDataRecord?.goals || null,
        experience_level: userDataRecord?.experience_level || null,
        workouts_per_week: userDataRecord?.workouts_per_week || null,
      };
      
      setUserProfile(userProfileWithData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get posts count
      const { count: postsCount } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get followers count (you'll need to implement this based on your schema)
      // This is a placeholder implementation
      const { count: followersCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', userId);

      // Get following count
      const { count: followingCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to follow users');
        return;
      }

      if (user.id === userId) {
        alert('You cannot follow yourself');
        return;
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', userId);

        if (error) throw error;

        // Update local state
        setIsFollowing(false);
        setStats(prev => ({
          ...prev,
          followers: Math.max(0, prev.followers - 1)
        }));
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            followed_id: userId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        // Update local state
        setIsFollowing(true);
        setStats(prev => ({
          ...prev,
          followers: prev.followers + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  const handleMessage = () => {
    // Implement message functionality
    console.log('Message button pressed');
  };

  // Add story handlers
  const handleOpenStory = () => {
    if (userStories && userStories.stories.length > 0) {
      setShowStoryViewer(true);
    }
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
  };

  const handleStoryComplete = () => {
    setShowStoryViewer(false);
  };

  const handleStoryDeleted = () => {
    // Refresh stories after deletion
    fetchUserStories();
    setShowStoryViewer(false);
  };

  const fetchFollowers = async () => {
    try {
      setModalLoading(true);
      
      // Get current user for checking follow status
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // First, get the follower IDs
      const { data: followersData, error: followersError } = await supabase
        .from('user_followers')
        .select('follower_id')
        .eq('followed_id', userId);

      if (followersError) throw followersError;

      if (!followersData || followersData.length === 0) {
        setModalUsers([]);
        return;
      }

      // Extract follower IDs
      const followerIds = followersData.map(f => f.follower_id);

      // Fetch user details for all followers
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', followerIds);

      if (usersError) throw usersError;

      if (!usersData) {
        setModalUsers([]);
        return;
      }

      // Check follow status for each follower
      const followersWithStatus = await Promise.all(
        usersData.map(async (userData) => {
          let isFollowing = false;
          if (currentUserId && currentUserId !== userData.id) {
            const { data: followCheck } = await supabase
              .from('user_followers')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('followed_id', userData.id)
              .single();
            
            isFollowing = !!followCheck;
          }

          return {
            id: userData.id,
            username: userData.username,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            isFollowing
          };
        })
      );

      setModalUsers(followersWithStatus);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setModalLoading(true);
      
      // Get current user for checking follow status
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // First, get the following IDs
      const { data: followingData, error: followingError } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      if (!followingData || followingData.length === 0) {
        setModalUsers([]);
        return;
      }

      // Extract following IDs
      const followingIds = followingData.map(f => f.followed_id);

      // Fetch user details for all following
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', followingIds);

      if (usersError) throw usersError;

      if (!usersData) {
        setModalUsers([]);
        return;
      }

      // Check follow status for each followed user
      const followingWithStatus = await Promise.all(
        usersData.map(async (userData) => {
          let isFollowing = false;
          if (currentUserId && currentUserId !== userData.id) {
            const { data: followCheck } = await supabase
              .from('user_followers')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('followed_id', userData.id)
              .single();
            
            isFollowing = !!followCheck;
          }

          return {
            id: userData.id,
            username: userData.username,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            isFollowing
          };
        })
      );

      setModalUsers(followingWithStatus);
    } catch (error) {
      console.error('Error fetching following:', error);
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowersModal = () => {
    setModalType('followers');
    setModalVisible(true);
    fetchFollowers();
  };

  const openFollowingModal = () => {
    setModalType('following');
    setModalVisible(true);
    fetchFollowing();
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setModalUsers([]);
  };

  const handleFollowUser = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be logged in to follow users');
        return;
      }

      if (user.id === targetUserId) {
        alert('You cannot follow yourself');
        return;
      }

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', targetUserId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            followed_id: targetUserId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update the modal users list with new follow status
      setModalUsers(prev => 
        prev.map(user => 
          user.id === targetUserId 
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        )
      );

      // Update stats count when unfollowing from your own following list
      if (modalType === 'following' && userId === user.id && isCurrentlyFollowing) {
        setStats(prev => ({
          ...prev,
          following: Math.max(0, prev.following - 1)
        }));
      }
      
      // Update stats count when following someone new from any modal
      if (!isCurrentlyFollowing) {
        // If we're viewing our own profile and just followed someone, update following count
        if (userId === user.id) {
          setStats(prev => ({
            ...prev,
            following: prev.following + 1
          }));
        }
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  const navigateToUserProfile = (targetUserId: string) => {
    closeModal();
    router.push(`/${targetUserId}`);
  };

  // Helper function to format goals display
  const formatGoals = (goals: string | null | string[] | any): string => {
    // Handle null/undefined
    if (!goals) return '';
    
    // Handle array directly
    if (Array.isArray(goals)) {
      return goals.join(', ');
    }
    
    // Handle string
    if (typeof goals === 'string') {
      try {
        // Try to parse as JSON if it looks like JSON
        if (goals.startsWith('[') || goals.startsWith('"')) {
          const parsed = JSON.parse(goals);
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return String(parsed);
        }
        
        // Return string as is
        return goals;
      } catch (error) {
        // If JSON parsing fails, clean up manually
        return goals
          .replace(/^\[|\]$/g, '') // Remove square brackets
          .replace(/^"|"$/g, '') // Remove outer quotes
          .replace(/","/g, ', ') // Replace quote comma quote with comma space
          .replace(/"/g, ''); // Remove any remaining quotes
      }
    }
    
    // Handle any other type
    return String(goals);
  };

  const renderUserItem = ({ item }: { item: FollowUser }) => {
    const isCurrentUser = currentUserId === item.id;

    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        onPress={() => navigateToUserProfile(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.userAvatar, { backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5' }]}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <FontAwesome name="user" size={20} color={colors.text} />
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userUsername, { color: colors.text }]}>
            @{item.username}
          </Text>
          {item.full_name && (
            <Text style={[styles.userFullName, { color: colors.text }]}>
              {item.full_name}
            </Text>
          )}
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followUserButton,
              { 
                backgroundColor: item.isFollowing ? 'rgba(255,255,255,0.1)' : '#4a90e2',
                borderWidth: item.isFollowing ? 1 : 0,
                borderColor: item.isFollowing ? colors.text : 'transparent'
              }
            ]}
            onPress={() => handleFollowUser(item.id, item.isFollowing)}
          >
            <Text style={[
              styles.followUserButtonText,
              { color: item.isFollowing ? colors.text : '#fff' }
            ]}>
              {item.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            // Fallback to the social tab if can't go back
            router.push('/(tabs)/social');
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              onPress={userStories && userStories.stories.length > 0 ? handleOpenStory : undefined}
              activeOpacity={userStories && userStories.stories.length > 0 ? 0.7 : 1}
              style={userStories && userStories.stories.length > 0 ? styles.clickableAvatar : null}
            >
              {userStories && userStories.stories.length > 0 ? (
                // User has stories - show with ring
                <View style={[
                  styles.storyRingContainer,
                  {
                    borderColor: userStories.hasUnviewedStories 
                      ? '#4a90e2' 
                      : 'rgba(255,255,255,0.3)'
                  }
                ]}>
                  <LinearGradient
                    colors={['#f2709c', '#ff9472']}
                    style={styles.avatarGradient}
                  >
                    <View style={[styles.avatar, { borderColor: colors.background }]}>
                      {userProfile.avatar_url ? (
                        <Image
                          source={{ uri: userProfile.avatar_url }}
                          style={{ width: '100%', height: '100%', borderRadius: 55 }}
                        />
                      ) : (
                        <FontAwesome name="user" size={40} color={colors.text} />
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                // User has no stories - completely clean avatar without any gradient or ring
                <View style={[styles.avatar, { 
                  borderColor: colors.background,
                  backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5'
                }]}>
                  {userProfile.avatar_url ? (
                    <Image
                      source={{ uri: userProfile.avatar_url }}
                      style={{ width: '100%', height: '100%', borderRadius: 55 }}
                    />
                  ) : (
                    <FontAwesome name="user" size={40} color={colors.text} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.username, { color: colors.text }]}>
            @{userProfile.username}
          </Text>
          {userProfile.full_name && (
            <Text style={{ color: colors.text, opacity: 0.7 }}>
              {userProfile.full_name}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.clickableStatItem} onPress={() => router.push(`/${userId}/posts`)}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.posts}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clickableStatItem} onPress={openFollowersModal}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clickableStatItem} onPress={openFollowingModal}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Following</Text>
            </TouchableOpacity>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.followButton]}
                onPress={handleFollow}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.messageButton]}
                onPress={handleMessage}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Fitness Information
        </Text>

        <BlurView
          intensity={isDarkMode ? 40 : 60}
          tint={isDarkMode ? 'dark' : 'light'}
          style={styles.infoCard}
        >
          {userProfile.height && userProfile.weight && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Height / Weight</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.height}cm / {userProfile.weight}kg
              </Text>
            </View>
          )}

          {userProfile.experience_level && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Experience Level</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.experience_level}
              </Text>
            </View>
          )}

          {userProfile.workouts_per_week && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Training Days</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.workouts_per_week} days/week
              </Text>
            </View>
          )}

          {userProfile.goals && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Goals</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatGoals(userProfile.goals)}
              </Text>
            </View>
          )}

          {userProfile.bio && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Bio</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.bio}
              </Text>
            </View>
          )}
        </BlurView>
      </ScrollView>

      {/* Story Viewer Modal */}
      {userStories && showStoryViewer && (
        <StoryViewer
          stories={userStories.stories}
          currentUserID={currentUserId || ''}
          initialStoryIndex={0}
          onClose={handleCloseStoryViewer}
          onComplete={handleStoryComplete}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* Modal for followers/following list */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={isDarkMode ? 40 : 60}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.modalContent, { backgroundColor: isDarkMode ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)' }]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalType === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {modalLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : modalUsers.length > 0 ? (
                <FlatList
                  data={modalUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUserItem}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>
                    {modalType === 'followers' ? 'No followers found' : 'No following found'}
                  </Text>
                </View>
              )}
            </BlurView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}