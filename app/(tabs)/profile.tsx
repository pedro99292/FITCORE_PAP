import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const AVATAR_SIZE = screenWidth * 0.22; 

export default function ProfileScreen() {
  // Sample user data - you would replace this with actual user data
  const user = {
    username: 'USERNAME_123',
    name: 'Nome',
    avatar: require('../../assets/images/default-avatar.png'),
  };

  // Generate an array of days for the calendar (example)
  const generateCalendarDays = () => {
    const days = [];
    for (let i = 31; i <= 31; i++) {
      days.push(i);
    }
    for (let i = 1; i <= 13; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          {/* Profile Info Section */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image source={user.avatar} style={styles.avatar} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.name}>{user.name}</Text>
            </View>
            <TouchableOpacity style={styles.helpButton}>
              <FontAwesome name="question" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionItem}>
              <FontAwesome name="shopping-cart" size={42} color="#fff" />
              <Text style={styles.actionText}>LOJA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="fitness" size={42} color="#fff" />
              <Text style={styles.actionText}>Treino</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <FontAwesome name="graduation-cap" size={42} color="#fff" />
              <Text style={styles.actionText}>Aprender</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => router.push('/settings')}
            >
              <FontAwesome name="cog" size={42} color="#fff" />
              <Text style={styles.actionText}>Definições</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <FontAwesome name="calendar" size={26} color="#fff" />
              <Text style={styles.calendarTitle}>Calendário</Text>
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => (
                <TouchableOpacity key={index} style={styles.calendarDay}>
                  <Text style={styles.calendarDayText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2B3F',
  },
  scrollView: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  header: {
    padding: screenWidth * 0.06,
    paddingTop: screenWidth * 0.15, 
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth * 0.08, 
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: screenWidth * 0.05,
    overflow: 'hidden',
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
    color: '#fff',
    fontSize: screenWidth * 0.055, // Increased from 0.05 to 0.055
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: screenWidth * 0.045, // Increased from 0.04 to 0.045
    opacity: 0.7,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: screenWidth * 0.1, // Increased from 0.08 for more space below buttons
    paddingHorizontal: screenWidth * 0.01, // Reduced to give more space for larger buttons
  },
  actionItem: {
    alignItems: 'center',
    padding: screenWidth * 0.02,
    width: screenWidth * 0.22, // Increased from 0.2 for bigger buttons
    height: screenWidth * 0.22, // Increased from 0.18 for bigger buttons
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: screenWidth * 0.025, // Slightly more space between icon and text
    fontSize: screenWidth * 0.042, // Increased from 0.04 for larger text
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarSection: {
    backgroundColor: '#3e3e50',
    borderRadius: 15,
    padding: screenWidth * 0.06, // Increased from 0.05 to 0.06
    marginTop: screenWidth * 0.06, // Increased from 0.04 to 0.06
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth * 0.05, // Increased from 0.04 to 0.05
  },
  calendarTitle: {
    color: '#fff',
    fontSize: screenWidth * 0.06, // Increased from 0.055 to 0.06
    fontWeight: 'bold',
    marginLeft: screenWidth * 0.03,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '13.5%', // Slightly reduced from 14% to create more space between items
    aspectRatio: 1, // square shape
    backgroundColor: '#22223b',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Increased from 8 to 10
    marginHorizontal: '0.25%', // Add a tiny bit of horizontal spacing
  },
  calendarDayText: {
    color: '#fff',
    fontSize: 18, // Increased from 16 to 18
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    padding: 16, // Increased from 15 to 16
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18, // Increased from 16 to 18
    fontWeight: 'bold',
  },
  calendarPreviewText: {
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: screenWidth * 0.02,
  },
}); 