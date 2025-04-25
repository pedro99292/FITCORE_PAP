import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const AVATAR_SIZE = screenWidth * 0.26;

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userStats, setUserStats] = useState({
    posts: 0,
    following: 0,
    followers: 0
  });

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      checkIfFollowing();
      fetchUserStats();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setProfileData(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfFollowing = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" error
        console.error('Error checking follow status:', error);
        return;
      }
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error in checkIfFollowing:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get post count
      const { count: postsCount } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get followers count
      const { count: followersCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      // Get following count
      const { count: followingCount } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      setUserStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      alert('You need to be logged in to follow users');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        // Follow
        await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            following_id: userId,
            created_at: new Date().toISOString()
          });
      }

      // Update local state optimistically
      setIsFollowing(!isFollowing);
      setUserStats(prev => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1
      }));
      
      // Refresh stats from server
      fetchUserStats();
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profileData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Stack.Screen 
        options={{
          title: profileData.username || 'User Profile',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerBackVisible: true,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#2b2b45', '#1a1a2e']}
          style={styles.profileHeader}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.customBackButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          {/* Profile Image */}
          <LinearGradient
            colors={['#f2709c', '#ff9472']}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarContainer}>
              <FontAwesome name="user" size={AVATAR_SIZE * 0.5} color="#fff" />
            </View>
          </LinearGradient>
          
          {/* User Info */}
          <Text style={styles.username}>@{profileData.username}</Text>
          <Text style={styles.fullName}>{profileData.full_name}</Text>
          
          {/* User Bio */}
          {profileData.bio && (
            <Text style={styles.bio}>{profileData.bio}</Text>
          )}
          
          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {user?.id !== userId ? (
              <TouchableOpacity 
                style={[
                  styles.followButton, 
                  isFollowing && styles.followingButton
                ]}
                onPress={handleFollowToggle}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        {/* User Details */}
        <View style={styles.detailsContainer}>
          {/* Fitness Information */}
          <Text style={styles.sectionTitle}>Fitness Information</Text>
          
          <View style={styles.detailsCard}>
            {profileData.experience_level && (
              <View style={styles.detailRow}>
                <Ionicons name="fitness-outline" size={22} color="#4a90e2" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Experience Level</Text>
                  <Text style={styles.detailValue}>{profileData.experience_level}</Text>
                </View>
              </View>
            )}
            
            {profileData.goals && (
              <View style={styles.detailRow}>
                <Ionicons name="flag-outline" size={22} color="#4a90e2" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Fitness Goals</Text>
                  <Text style={styles.detailValue}>{profileData.goals}</Text>
                </View>
              </View>
            )}
            
            {profileData.days_per_week && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={22} color="#4a90e2" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Workout Days Per Week</Text>
                  <Text style={styles.detailValue}>{profileData.days_per_week}</Text>
                </View>
              </View>
            )}
            
            {(profileData.height || profileData.weight) && (
              <View style={styles.detailRow}>
                <Ionicons name="body-outline" size={22} color="#4a90e2" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Physical Stats</Text>
                  <Text style={styles.detailValue}>
                    {profileData.height && `${profileData.height} cm`}
                    {profileData.height && profileData.weight && " • "}
                    {profileData.weight && `${profileData.weight} kg`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  avatarGradient: {
    width: AVATAR_SIZE + 10,
    height: AVATAR_SIZE + 10,
    borderRadius: (AVATAR_SIZE + 10) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#3e3e50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2c2c3e',
  },
  username: {
    color: '#4a90e2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
  },
  bio: {
    color: '#d1d1d6',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  followButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailsCard: {
    backgroundColor: '#2c2c3e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailContent: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    color: '#8e8e93',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    marginTop: 2,
  },
  customBackButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
    fontWeight: '500',
  },
});