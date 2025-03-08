import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/utils/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const AVATAR_SIZE = screenWidth * 0.26; 

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [userData, setUserData] = useState({
    username: user?.email?.split('@')[0] || 'USERNAME_123',
    name: user?.user_metadata?.full_name || 'Utilizador',
    bio: '',
    avatar: require('../../assets/images/default-avatar.png'),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from database when component mounts
  useEffect(() => {
    if (user) {
      fetchUserProfile();
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
          'Email não verificado',
          'Por favor, verifique o seu email para confirmar o registo e acessar o seu perfil.'
        );
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('username, full_name, bio')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // If the error is 'No rows found', the profile might not exist yet due to pending email verification
        if (error.code === 'PGRST116') {
          Alert.alert(
            'Perfil não encontrado',
            'O seu perfil ainda está sendo processado após a verificação de email. Por favor, tente novamente em alguns instantes.'
          );
          router.replace('/login');
          return;
        }
      } else if (data) {
        // Update user data with database values
        setUserData({
          username: data.username || user?.email?.split('@')[0] || 'USERNAME_123',
          name: data.full_name || user?.user_metadata?.full_name || 'Utilizador',
          bio: data.bio || 'Sem biografia disponível.',
          avatar: require('../../assets/images/default-avatar.png'),
        });
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do utilizador:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>A carregar perfil...</Text>
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
                  <Image source={userData.avatar} style={styles.avatar} />
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
                  <TouchableOpacity 
                    style={[styles.editProfileButton, { borderColor: 'rgba(74, 144, 226, 0.4)' }]}
                    onPress={handleEditProfile}
                  >
                    <FontAwesome name="pencil" size={14} color="#4a90e2" style={styles.editIcon} />
                    <Text style={styles.editProfileText}>Editar Perfil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioLabel, { color: colors.text }]}>Bio</Text>
              <Text style={[styles.bioText, { color: colors.text }]}>{userData.bio}</Text>
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
            
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#3E64FF', '#5A7BFF']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <Ionicons name="fitness" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>TREINO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <LinearGradient
                colors={['#11998E', '#38EF7D']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionIcon}>
                <FontAwesome name="graduation-cap" size={26} color="#fff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: colors.text }]}>APRENDER</Text>
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
              <Text style={[styles.actionText, { color: colors.text }]}>DEFINIÇÕES</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendário</Text>
          <View style={[styles.calendarSection, { backgroundColor: colors.surface }]}>
            <View style={styles.calendarHeader}>
              <FontAwesome name="calendar" size={20} color="#4a90e2" />
              <Text style={[styles.calendarTitle, { color: colors.text }]}>Janeiro 2024</Text>
              <TouchableOpacity style={styles.calendarAction}>
                <Text style={styles.calendarActionText}>Ver Tudo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.calendarDay,
                    { backgroundColor: colors.background },
                    day === 8 && styles.calendarDayActive
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    { color: colors.text },
                    day === 8 && styles.calendarDayTextActive
                  ]}>{day}</Text>
                  {day === 8 && <View style={styles.calendarDayDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Achievements Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conquistas Recentes</Text>
          <View style={[styles.achievementsSection, { backgroundColor: colors.surface }]}>
            <View style={[styles.achievement, { borderBottomColor: 'rgba(200, 200, 200, 0.2)' }]}>
              <View style={[styles.achievementIconContainer, { backgroundColor: 'rgba(247, 151, 30, 0.15)' }]}>
                <FontAwesome name="trophy" size={22} color="#F7971E" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>10 Dias Seguidos</Text>
                <Text style={styles.achievementDate}>Concluído a 15 de Jan, 2024</Text>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.achievementPoints}>+250</Text>
              </View>
            </View>
            
            <View style={styles.achievement}>
              <View style={[styles.achievementIconContainer, { backgroundColor: 'rgba(255, 71, 87, 0.15)' }]}>
                <FontAwesome name="fire" size={22} color="#FF4757" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>5000 Calorias Queimadas</Text>
                <Text style={styles.achievementDate}>Concluído a 10 de Jan, 2024</Text>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.achievementPoints}>+500</Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
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
  calendarAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  calendarActionText: {
    color: '#4a90e2',
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 200, 200, 0.1)',
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
}); 