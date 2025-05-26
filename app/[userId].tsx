import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';

const { width: screenWidth } = Dimensions.get('window');

type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  experience_level: string | null;
  goals: string | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  days_per_week: number | null;
};

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
    top: 20,
    left: 20,
    zIndex: 1,
  },
});

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
    checkIfFollowing();
    checkIfOwnProfile();
  }, [userId]);

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

          <Text style={[styles.username, { color: colors.text }]}>
            @{userProfile.username}
          </Text>
          {userProfile.full_name && (
            <Text style={{ color: colors.text, opacity: 0.7 }}>
              {userProfile.full_name}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.posts}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.following}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Following</Text>
            </View>
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

          {userProfile.days_per_week && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Training Days</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.days_per_week} days/week
              </Text>
            </View>
          )}

          {userProfile.goals && (
            <View style={[styles.infoRow, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Goals</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {userProfile.goals}
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
    </View>
  );
}