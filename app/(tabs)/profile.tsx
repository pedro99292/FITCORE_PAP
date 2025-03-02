import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');
const AVATAR_SIZE = screenWidth * 0.25; 

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  
  // Fallback data if user isn't loaded yet
  const userData = {
    username: user?.email?.split('@')[0] || 'USERNAME_123',
    name: user?.user_metadata?.full_name || 'User',
    avatar: require('../../assets/images/default-avatar.png'),
  };

  // Generate an array of days for the calendar (example)
  const generateCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {/* Profile Info Section */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image source={userData.avatar} style={styles.avatar} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{userData.username}</Text>
                <Text style={styles.name}>{userData.name}</Text>
              </View>
              <TouchableOpacity style={styles.helpButton}>
                <FontAwesome name="question" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>28</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>154</Text>
                <Text style={styles.statLabel}>Hours</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8.6k</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#FF4757', '#FF6B81']}
                style={styles.actionIcon}>
                <FontAwesome name="shopping-cart" size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>STORE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#3E64FF', '#5A7BFF']}
                style={styles.actionIcon}>
                <Ionicons name="fitness" size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>WORKOUT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#11998E', '#38EF7D']}
                style={styles.actionIcon}>
                <FontAwesome name="graduation-cap" size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>LEARN</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/settings')}
            >
              <LinearGradient
                colors={['#F7971E', '#FFD200']}
                style={styles.actionIcon}>
                <FontAwesome name="cog" size={26} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>SETTINGS</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <Text style={styles.sectionTitle}>Activity Calendar</Text>
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <FontAwesome name="calendar" size={20} color="#666" />
              <Text style={styles.calendarTitle}>January 2024</Text>
              <TouchableOpacity style={styles.calendarAction}>
                <Text style={styles.calendarActionText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.calendarDay,
                    day === 8 && styles.calendarDayActive
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    day === 8 && styles.calendarDayTextActive
                  ]}>{day}</Text>
                  {day === 8 && <View style={styles.calendarDayDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Achievements Section */}
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsSection}>
            <View style={styles.achievement}>
              <View style={styles.achievementIconContainer}>
                <FontAwesome name="trophy" size={22} color="#F7971E" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>10 Day Streak</Text>
                <Text style={styles.achievementDate}>Completed Jan 15, 2024</Text>
              </View>
              <Text style={styles.achievementPoints}>+250</Text>
            </View>
            
            <View style={styles.achievement}>
              <View style={styles.achievementIconContainer}>
                <FontAwesome name="fire" size={22} color="#FF4757" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Burnt 5000 Calories</Text>
                <Text style={styles.achievementDate}>Completed Jan 10, 2024</Text>
              </View>
              <Text style={styles.achievementPoints}>+500</Text>
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
        <LinearGradient
          colors={['#FF4757', '#E5394A']}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.logoutGradient}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <FontAwesome name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    width: '100%',
  },
  header: {
    padding: screenWidth * 0.05,
    paddingTop: screenWidth * 0.08,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: screenWidth * 0.05,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth * 0.05,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.04,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FF4757',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#333',
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
  },
  name: {
    color: '#666',
    fontSize: screenWidth * 0.038,
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: screenWidth * 0.04,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: screenWidth * 0.032,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: screenWidth * 0.048,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: screenWidth * 0.03,
    marginTop: screenWidth * 0.06,
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
    width: screenWidth * 0.14,
    height: screenWidth * 0.14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionText: {
    color: '#555',
    fontSize: screenWidth * 0.032,
    fontWeight: '600',
  },
  calendarSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth * 0.05,
  },
  calendarTitle: {
    color: '#333',
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    marginLeft: screenWidth * 0.02,
    flex: 1,
  },
  calendarAction: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  calendarActionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '13.5%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: '0.25%',
  },
  calendarDayActive: {
    backgroundColor: '#FF4757',
  },
  calendarDayText: {
    color: '#333',
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: screenWidth * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  achievementIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  achievementDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  achievementPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#11998E',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
}); 