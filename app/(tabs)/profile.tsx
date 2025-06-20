import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/utils/supabase';
import { ACHIEVEMENTS_DATA } from '../(tabs)/achievements';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const AVATAR_SIZE = screenWidth * 0.26; 

// Define IconType to match the one in achievements.tsx
type IconType = 'fontawesome' | 'ionicons' | 'material';

// Add these type definitions before the component
interface UserData {
  username: string;
  name: string;
  bio: string;
  avatar: any; // Using any for the require() image type
  avatarUrl: string | null;
}

// Achievement interface
interface RecentAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconType: IconType;
  color: string;
  unlocked_at: string;
}

// Interface for the achievement data in the achievements.tsx file
interface AchievementData {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconType: IconType;
  color: string;
  category: string;
  progress: number;
}

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

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [userData, setUserData] = useState<UserData>({
    username: user?.email?.split('@')[0] || 'USERNAME_123',
    name: user?.user_metadata?.full_name || 'User',
    bio: '',
    avatar: require('../../assets/images/default-avatar.png'),
    avatarUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<RecentAchievement[]>([]);
  
  // Add followers/following state
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalUsers, setModalUsers] = useState<FollowUser[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch user data from database when component mounts
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchWorkoutDays();
      fetchRecentAchievements();
      fetchUserStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch existing user data from the database
  const fetchUserProfile = async () => {
    try {
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if email is verified
      if (!user.email_confirmed_at) {
        Alert.alert(
          'Email not verified',
          'Please verify your email to confirm registration and access your profile.'
        );
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('username, full_name, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If the error is 'No rows found', the profile might not exist yet due to pending email verification
        if (error.code === 'PGRST116') {
          Alert.alert(
            'Profile not found',
            'Your profile is still being processed after email verification. Please try again in a few moments.'
          );
          router.replace('/login');
          return;
        }
      } else if (data) {
        // Update user data with database values
        setUserData({
          username: data.username || user?.email?.split('@')[0] || 'USERNAME_123',
          name: data.full_name || user?.user_metadata?.full_name || 'User',
          bio: data.bio || 'No bio available.',
          avatar: require('../../assets/images/default-avatar.png'),
          avatarUrl: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch days with workouts for the current month
  const fetchWorkoutDays = async () => {
    try {
      if (!user) return;
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // JS months are 0-indexed
      
      // Create date range for current month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextMonthYear = month === 12 ? year + 1 : year;
      const endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      
      const { data, error } = await supabase
        .from('sessions')
        .select('start_time')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startDate)
        .lt('start_time', endDate);
      
      if (error) {
        console.error('Error fetching workout days:', error);
        return;
      }
      
      const days = data.map(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate.getDate();
      });
      
      setWorkoutDays(days);
    } catch (error) {
      console.error('Error fetching workout days:', error);
    }
  };

  // Fetch recent achievements
  const fetchRecentAchievements = async () => {
    try {
      if (!user) return;
      
      // Get most recent unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .not('unlocked_at', 'is', null)
        .order('unlocked_at', { ascending: false })
        .limit(2);
      
      if (userAchievementsError) {
        console.error('Error fetching recent achievements:', userAchievementsError);
        return;
      }

      if (userAchievements && userAchievements.length > 0) {
        // Map user achievements with achievement data from the imported ACHIEVEMENTS_DATA
        const achievements = userAchievements.map(userAchievement => {
          const achievementData = ACHIEVEMENTS_DATA.find(
            a => a.id === userAchievement.achievement_id
          );
          
          if (achievementData) {
            return {
              id: userAchievement.achievement_id,
              title: achievementData.title,
              description: achievementData.description,
              icon: achievementData.icon,
              iconType: achievementData.iconType,
              color: achievementData.color,
              unlocked_at: new Date(userAchievement.unlocked_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            } as RecentAchievement;
          }
          return null;
        }).filter((item): item is RecentAchievement => item !== null);
        
        setRecentAchievements(achievements);
      }
    } catch (error) {
      console.error('Error in fetchRecentAchievements:', error);
    }
  };

  // Fetch user stats (posts, followers/following)
  const fetchUserStats = async () => {
    try {
      if (!user) return;

      // Get posts count from social_posts table
      const { count: postsCount } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get followers count
      const { count: followersCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', user.id);

      // Get following count
      const { count: followingCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      setStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch followers
  const fetchFollowers = async () => {
    try {
      if (!user) return;
      
      setModalLoading(true);

      const { data: followersData, error: followersError } = await supabase
        .from('user_followers')
        .select('follower_id')
        .eq('followed_id', user.id);

      if (followersError) throw followersError;

      if (!followersData || followersData.length === 0) {
        setModalUsers([]);
        return;
      }

      const followerIds = followersData.map(f => f.follower_id);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', followerIds);

      if (usersError) throw usersError;

      if (!usersData) {
        setModalUsers([]);
        return;
      }

      const followersWithStatus = await Promise.all(
        usersData.map(async (userData) => {
          let isFollowing = false;
          if (user.id !== userData.id) {
            const { data: followCheck } = await supabase
              .from('user_followers')
              .select('id')
              .eq('follower_id', user.id)
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

  // Fetch following
  const fetchFollowing = async () => {
    try {
      if (!user) return;
      
      setModalLoading(true);

      const { data: followingData, error: followingError } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      if (!followingData || followingData.length === 0) {
        setModalUsers([]);
        return;
      }

      const followingIds = followingData.map(f => f.followed_id);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', followingIds);

      if (usersError) throw usersError;

      if (!usersData) {
        setModalUsers([]);
        return;
      }

      const followingWithStatus = await Promise.all(
        usersData.map(async (userData) => {
          let isFollowing = false;
          if (user.id !== userData.id) {
            const { data: followCheck } = await supabase
              .from('user_followers')
              .select('id')
              .eq('follower_id', user.id)
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

  // Modal handlers
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

  // Handle follow/unfollow user
  const handleFollowUser = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (!user) {
        alert('You must be logged in to follow users');
        return;
      }

      if (user.id === targetUserId) {
        alert('You cannot follow yourself');
        return;
      }

      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            followed_id: targetUserId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setModalUsers(prev => 
        prev.map(modalUser => 
          modalUser.id === targetUserId 
            ? { ...modalUser, isFollowing: !isCurrentlyFollowing }
            : modalUser
        )
      );

      if (modalType === 'following' && isCurrentlyFollowing) {
        setStats(prev => ({
          ...prev,
          following: Math.max(0, prev.following - 1)
        }));
      }
      
      if (!isCurrentlyFollowing) {
        setStats(prev => ({
          ...prev,
          following: prev.following + 1
        }));
      }

    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (targetUserId: string) => {
    closeModal();
    router.push(`/${targetUserId}`);
  };

  // Render user item for modal
  const renderUserItem = ({ item }: { item: FollowUser }) => {
    const isCurrentUser = user?.id === item.id;

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

  // Generate an array of days for the calendar preview (showing current week)
  const generateCalendarDays = () => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysToShow = 14; // Show two weeks
    
    // Start 3 days before today, or from day 1 if that would be negative
    let startDay = Math.max(1, currentDay - 3);
    
    // Adjust if near the end of the month to always show 14 days
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (startDay + daysToShow > daysInMonth) {
      startDay = Math.max(1, daysInMonth - daysToShow + 1);
    }
    
    const days = [];
    for (let i = 0; i < daysToShow; i++) {
      const day = startDay + i;
      if (day <= daysInMonth) {
        days.push(day);
      }
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  // Render achievement icon
  const renderAchievementIcon = (icon: string, iconType: string, color: string) => {
    if (iconType === 'fontawesome') {
      return <FontAwesome name={icon as any} size={22} color={color} />;
    } else if (iconType === 'material') {
      return <MaterialCommunityIcons name={icon as any} size={22} color={color} />;
    } else {
      return <Ionicons name={icon as any} size={22} color={color} />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Profile Info Section */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={['rgba(74, 144, 226, 0.3)', 'rgba(74, 144, 226, 0.1)']}
              style={styles.profileHeaderGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={userData.avatarUrl ? { uri: userData.avatarUrl } : userData.avatar} 
                    style={styles.avatar} 
                  />
                  <TouchableOpacity 
                    style={styles.editAvatarButton}
                    onPress={handleEditProfile}
                  >
                    <FontAwesome name="camera" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: colors.text }]}>{userData.username}</Text>
                  <Text style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
                  
                  {/* Social Stats */}
                  <View style={styles.profileStats}>
                    <TouchableOpacity style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>{stats.posts}</Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>Posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={openFollowersModal}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followers}</Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>Followers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={openFollowingModal}>
                      <Text style={[styles.statNumber, { color: colors.text }]}>{stats.following}</Text>
                      <Text style={[styles.statLabel, { color: colors.text }]}>Following</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioLabel, { color: colors.text }]}>Bio</Text>
              <Text style={[styles.bioText, { color: colors.text }]}>{userData.bio}</Text>
              
              {/* Edit Profile Button */}
              <TouchableOpacity 
                style={[styles.editProfileButton, { borderColor: 'rgba(74, 144, 226, 0.4)' }]}
                onPress={handleEditProfile}
              >
                <FontAwesome name="pencil" size={14} color="#4a90e2" style={styles.editIcon} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#FF4757', '#FF6B81']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <FontAwesome name="shopping-cart" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>LOJA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/workouts')}
            >
              <LinearGradient
                colors={['#3E64FF', '#5A7BFF']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <Ionicons name="fitness" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>TREINO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/personal-records')}
            >
              <LinearGradient
                colors={['#11998E', '#38EF7D']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <FontAwesome name="trophy" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>MY BESTS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/settings')}
            >
              <LinearGradient
                colors={['#F7971E', '#FFD200']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <FontAwesome name="cog" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>SETTINGS</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendar</Text>
          <TouchableOpacity 
            style={[styles.calendarSection, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/calendar')}
            activeOpacity={0.8}
          >
            <View style={styles.calendarHeader}>
              <FontAwesome name="calendar" size={20} color="#4a90e2" />
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.calendarDay,
                    { backgroundColor: colors.background },
                    day === new Date().getDate() && styles.calendarDayActive
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    { color: colors.text },
                    day === new Date().getDate() && styles.calendarDayTextActive
                  ]}>{day}</Text>
                  {workoutDays.includes(day) && <View style={styles.calendarDayDot} />}
                </View>
              ))}
            </View>
          </TouchableOpacity>
          
          {/* Achievements Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Achievements</Text>
          <View style={[styles.achievementsSection, { backgroundColor: colors.surface }]}>
            {recentAchievements.length > 0 ? (
              recentAchievements.map((achievement, index) => (
                <View 
                  key={`achievement-${achievement.id}`} 
                  style={[
                    styles.achievement, 
                    index < recentAchievements.length - 1 && { 
                      borderBottomColor: 'rgba(200, 200, 200, 0.2)',
                      borderBottomWidth: 1
                    }
                  ]}
                >
                  <View style={[styles.achievementIconContainer, { backgroundColor: `${achievement.color}33` }]}>
                    {renderAchievementIcon(achievement.icon, achievement.iconType, achievement.color)}
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
                    <Text style={styles.achievementDate}>Completed on {achievement.unlocked_at}</Text>
                  </View>
                  <View style={styles.pointsContainer}>
                    <Text style={styles.achievementPoints}>+250</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyAchievements}>
                <Ionicons name="trophy-outline" size={36} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyAchievementsText}>No achievements yet</Text>
              </View>
            )}
          </View>
          
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  header: {
    padding: screenWidth * 0.05,
    paddingTop: screenWidth * 0.05,
  },
  profileCard: {
    backgroundColor: '#3e3e50',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: screenWidth * 0.06,
  },
  profileHeaderGradient: {
    padding: screenWidth * 0.05,
    paddingBottom: screenWidth * 0.06,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.05,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4a90e2',
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: screenWidth * 0.055,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  name: {
    color: '#e0e0e0',
    fontSize: screenWidth * 0.038,
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: '#4a90e2',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 15,
  },
  editIcon: {
    marginRight: 5,
  },
  editProfileText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
  },
  bioContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: screenWidth * 0.05,
  },
  bioLabel: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  bioText: {
    fontSize: screenWidth * 0.04,
    color: '#e0e0e0',
    lineHeight: screenWidth * 0.056,
  },
  sectionTitle: {
    fontSize: screenWidth * 0.055,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: screenWidth * 0.04,
    marginTop: screenWidth * 0.08,
    paddingLeft: screenWidth * 0.01,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionItem: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: screenWidth * 0.16,
    height: screenWidth * 0.16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: screenWidth * 0.032,
    fontWeight: '700',
    marginTop: 4,
  },
  calendarSection: {
    backgroundColor: '#3e3e50',
    borderRadius: 20,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth * 0.05,
  },
  calendarTitle: {
    color: '#fff',
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    marginLeft: screenWidth * 0.02,
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '13.5%',
    aspectRatio: 1,
    backgroundColor: '#2c2c3e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: '0.25%',
  },
  calendarDayActive: {
    backgroundColor: '#4a90e2',
  },
  calendarDayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarDayTextActive: {
    color: 'white',
  },
  calendarDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginTop: 2,
  },
  achievementsSection: {
    backgroundColor: '#3e3e50',
    borderRadius: 20,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  achievementIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(247, 151, 30, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#aaa',
  },
  pointsContainer: {
    backgroundColor: 'rgba(17, 153, 142, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38EF7D',
  },
  emptyAchievements: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyAchievementsText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    fontSize: 14,
  },
  // Profile stats styles (in header)
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  statNumber: {
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: screenWidth * 0.032,
    opacity: 0.8,
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
}); 