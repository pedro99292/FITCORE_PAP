import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { FontAwesome, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { supabase } from '../utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import StoryRing from '@/components/StoryRing';
import { fetchActiveStories, UserWithStories } from '@/utils/storyService';

const { width: screenWidth } = Dimensions.get('window');

type DiscoverUser = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  mutual_connections: number;
  mutual_usernames: string[];
  isFollowing: boolean;
};

export default function DiscoverUsersScreen() {
  const { isDarkMode, colors } = useTheme();
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stories, setStories] = useState<UserWithStories[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await Promise.all([
          fetchDiscoverUsers(user.id),
          fetchStories(),
        ]);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const storiesData = await fetchActiveStories(currentUserId);
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchDiscoverUsers = async (userId: string) => {
    try {
      setLoading(true);

      // First, get users that the current user is following
      const { data: currentUserFollowing } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', userId);

      const followingIds = currentUserFollowing?.map(f => f.followed_id) || [];
      setFollowingUsers(new Set(followingIds));

      // Get all users except the current user
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, bio')
        .neq('id', userId);

      if (usersError) throw usersError;

      if (!allUsers || allUsers.length === 0) {
        setUsers([]);
        return;
      }

      // Calculate mutual connections and followers for each user
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          // Get mutual connections
          const mutualConnections = await getMutualConnections(userId, user.id, followingIds);
          
          // Get followers count
          const { count: followersCount } = await supabase
            .from('user_followers')
            .select('*', { count: 'exact', head: true })
            .eq('followed_id', user.id);

          return {
            ...user,
            followers_count: followersCount || 0,
            mutual_connections: mutualConnections.count,
            mutual_usernames: mutualConnections.usernames,
            isFollowing: followingIds.includes(user.id),
          };
        })
      );

      // Sort users by mutual connections first, then by followers count
      const sortedUsers = usersWithStats
        .filter(user => !user.isFollowing) // Exclude users already being followed
        .sort((a, b) => {
          // First priority: mutual connections
          if (a.mutual_connections !== b.mutual_connections) {
            return b.mutual_connections - a.mutual_connections;
          }
          // Second priority: followers count
          return b.followers_count - a.followers_count;
        });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching discover users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMutualConnections = async (currentUserId: string, targetUserId: string, currentUserFollowing: string[]) => {
    try {
      // Get users that the target user is following
      const { data: targetUserFollowing } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', targetUserId);

      const targetFollowingIds = targetUserFollowing?.map(f => f.followed_id) || [];
      
      // Find mutual connections
      const mutualIds = currentUserFollowing.filter(id => targetFollowingIds.includes(id));
      
      // Get usernames of mutual connections (limit to 3 for display)
      let mutualUsernames: string[] = [];
      if (mutualIds.length > 0) {
        const { data: mutualUsers } = await supabase
          .from('users')
          .select('username')
          .in('id', mutualIds.slice(0, 3));
        
        mutualUsernames = mutualUsers?.map(u => u.username) || [];
      }

      return {
        count: mutualIds.length,
        usernames: mutualUsernames,
      };
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      return { count: 0, usernames: [] };
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const user = users.find(u => u.id === targetUserId);
      if (!user) return;

      if (user.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('followed_id', targetUserId);

        if (error) throw error;

        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === targetUserId 
            ? { ...u, isFollowing: false, followers_count: Math.max(0, u.followers_count - 1) }
            : u
        ));
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: currentUserId,
            followed_id: targetUserId,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;

        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === targetUserId 
            ? { ...u, isFollowing: true, followers_count: u.followers_count + 1 }
            : u
        ));
        setFollowingUsers(prev => new Set([...prev, targetUserId]));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const onRefresh = async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    try {
      await fetchDiscoverUsers(currentUserId);
    } finally {
      setRefreshing(false);
    }
  };

  const renderUser = (user: DiscoverUser) => {
    const hasStories = stories.some(userStories => userStories.id === user.id);
    const hasUnviewedStories = stories.find(userStories => userStories.id === user.id)?.hasUnviewedStories;

    return (
      <View key={user.id} style={[styles.userCard, { 
        backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }]}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/${user.id}`)}
          activeOpacity={0.7}
        >
          <StoryRing 
            size={60} 
            hasStories={hasStories}
            seen={!hasUnviewedStories}
          >
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, { 
                backgroundColor: isDarkMode ? '#3e3e50' : '#f5f5f5',
                borderColor: isDarkMode ? '#2c2c3e' : '#e0e0e0'
              }]}>
                <FontAwesome name="user" size={24} color={isDarkMode ? "#fff" : "#333"} />
              </View>
            )}
          </StoryRing>
          
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>
              {user.username}
            </Text>
            {user.full_name && (
              <Text style={[styles.fullName, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                {user.full_name}
              </Text>
            )}
            
            {user.mutual_connections > 0 ? (
              <Text style={[styles.mutualText, { color: isDarkMode ? '#4a90e2' : '#007AFF' }]}>
                {user.mutual_connections} mutual connection{user.mutual_connections > 1 ? 's' : ''}
                {user.mutual_usernames.length > 0 && (
                  <Text style={[styles.mutualNames, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    {' '}• {user.mutual_usernames.join(', ')}
                    {user.mutual_connections > user.mutual_usernames.length && ' and others'}
                  </Text>
                )}
              </Text>
            ) : (
              <Text style={[styles.followersText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                {user.followers_count} follower{user.followers_count !== 1 ? 's' : ''}
              </Text>
            )}
            
            {user.bio && (
              <Text 
                style={[styles.bio, { color: isDarkMode ? '#8e8e93' : '#666' }]}
                numberOfLines={2}
              >
                {user.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.followButton, {
            backgroundColor: user.isFollowing ? isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' : '#4a90e2'
          }]}
          onPress={() => handleFollow(user.id)}
        >
          <Text style={[styles.followButtonText, {
            color: user.isFollowing ? isDarkMode ? '#fff' : '#000' : '#fff'
          }]}>
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 15 : 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
    },
    content: {
      flex: 1,
    },
    sectionHeader: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      opacity: 0.7,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginHorizontal: 15,
      marginBottom: 10,
      borderRadius: 16,
      borderWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    userInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#3e3e50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
    },
    userDetails: {
      flex: 1,
      marginLeft: 15,
    },
    username: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    fullName: {
      fontSize: 14,
      marginBottom: 4,
    },
    mutualText: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 4,
    },
    mutualNames: {
      fontWeight: '400',
    },
    followersText: {
      fontSize: 13,
      marginBottom: 4,
    },
    bio: {
      fontSize: 13,
      lineHeight: 18,
    },
    followButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: "Discover People",
          headerShown: false,
        }} 
      />
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Custom Header */}
      <LinearGradient
        colors={isDarkMode ? ['#2b2b45', '#1a1a2e'] : ['#f5f5f5', '#e0e0e0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, {
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { 
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
          }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Discover People
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.text, marginTop: 10 }]}>Finding people for you...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              People You May Know
            </Text>
            <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
              Based on mutual connections and popularity
            </Text>
          </View>

          {users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="account-search" 
                size={80} 
                color={isDarkMode ? "#8e8e93" : "#999"} 
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                No New People to Discover
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                You're all caught up! Try following more people to get better recommendations.
              </Text>
            </View>
          ) : (
            users.map(renderUser)
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
} 