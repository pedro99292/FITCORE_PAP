import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, ScrollView, Dimensions, Modal, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Configure locale for Calendar
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'en';

export default function CalendarScreen() {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<{[key: string]: any}>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [workoutsForDay, setWorkoutsForDay] = useState<any[]>([]);
  const [accountCreationDate, setAccountCreationDate] = useState<Date | null>(null);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Fetch account creation date and workout sessions when component mounts
  useEffect(() => {
    if (user) {
      fetchAccountCreationDate();
      fetchWorkoutSessions();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user's account creation date
  const fetchAccountCreationDate = async () => {
    try {
      if (!user) return;
      
      // Get user metadata to find creation date
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }
      
      // Use created_at from user metadata
      if (data?.user?.created_at) {
        const createdAt = new Date(data.user.created_at);
        setAccountCreationDate(createdAt);
      }
    } catch (error) {
      console.error('Error fetching account creation date:', error);
    }
  };

  // Fetch all workout sessions and mark them on calendar
  const fetchWorkoutSessions = async () => {
    try {
      if (!user) return;
      
      setIsLoading(true);
      
      // Get all completed sessions for the user
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          session_id, 
          start_time,
          workouts:workout_id (
            title
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (error) {
        console.error('Error fetching workout sessions:', error);
        return;
      }
      
      // Process and mark dates on calendar
      const dates: {[key: string]: any} = {};
      data.forEach(session => {
        const sessionDate = session.start_time?.split('T')[0];
        if (sessionDate) {
          dates[sessionDate] = {
            marked: true,
            dotColor: '#4a90e2',
            // If there are multiple workouts on the same day, we'll show a different color
            ...(dates[sessionDate] ? { dots: [...(dates[sessionDate].dots || []), { color: '#4a90e2' }] } : {})
          };
        }
      });
      
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch workouts for a specific day
  const fetchWorkoutsForDay = async (date: string) => {
    try {
      if (!user) return;
      
      setIsLoadingWorkouts(true);
      
      // Create start and end of day timestamps
      const startDate = new Date(`${date}T00:00:00`);
      const endDate = new Date(`${date}T23:59:59`);
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          session_id, 
          duration, 
          workouts:workout_id (
            title
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startDate.toISOString())
        .lt('start_time', endDate.toISOString());
      
      if (error) {
        console.error('Error fetching workouts for day:', error);
        return;
      }
      
      setWorkoutsForDay(data || []);
    } catch (error) {
      console.error('Error fetching workouts for day:', error);
    } finally {
      setIsLoadingWorkouts(false);
    }
  };

  // Handle date selection
  const handleDayPress = (day: {dateString: string}) => {
    setSelectedDate(day.dateString);
    fetchWorkoutsForDay(day.dateString);
  };

  // Format duration from seconds to minutes
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // Navigate back
  const handleGoBack = () => {
    router.back();
  };

  // Handle workout selection for preview
  const handleWorkoutPress = (workout: any) => {
    setSelectedWorkout(workout);
    setPreviewVisible(true);
  };
  
  // Close preview modal
  const closePreview = () => {
    setPreviewVisible(false);
  };

  // Handle workout deletion
  const handleDeleteWorkout = async (sessionId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the session from the database
              const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('session_id', sessionId)
                .eq('user_id', user?.id);

              if (error) {
                console.error('Error deleting workout session:', error);
                Alert.alert('Error', 'Failed to delete workout session. Please try again.');
                return;
              }

              // Refresh the workouts for the selected day
              if (selectedDate) {
                fetchWorkoutsForDay(selectedDate);
              }
              
              // Refresh the calendar to update marked dates
              fetchWorkoutSessions();
              
              Alert.alert('Success', 'Workout session deleted successfully.');
            } catch (error) {
              console.error('Error deleting workout session:', error);
              Alert.alert('Error', 'Failed to delete workout session. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header with animated gradient background */}
      <LinearGradient
        colors={['rgba(74, 144, 226, 0.8)', 'rgba(74, 144, 226, 0.1)']}
        start={[0, 0]}
        end={[0, 1]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Calendar</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Component */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
          <Calendar
            minDate={accountCreationDate ? accountCreationDate.toISOString().split('T')[0] : undefined}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: '#4a90e2',
              }
            }}
            onDayPress={handleDayPress}
            monthFormat={'MMMM yyyy'}
            hideArrows={false}
            hideExtraDays={false}
            disableMonthChange={false}
            firstDay={1} // Monday as first day
            enableSwipeMonths={true}
            renderArrow={(direction: string) => (
              <View style={styles.arrowContainer}>
                <Ionicons 
                  name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color="#fff"
                />
              </View>
            )}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: '#4a90e2',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#4a90e2',
              dayTextColor: colors.text,
              textDisabledColor: 'rgba(150, 150, 150, 0.5)',
              dotColor: '#4a90e2',
              selectedDotColor: '#ffffff',
              arrowColor: '#4a90e2',
              monthTextColor: colors.text,
              indicatorColor: '#4a90e2',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>
        
        {/* Workouts for Selected Day */}
        {selectedDate && (
          <View style={[styles.workoutsList, { backgroundColor: colors.surface }]}>
            <View style={styles.workoutsHeader}>
              <View style={styles.dateContainer}>
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar" size={20} color="#fff" />
                </View>
                <Text style={[styles.workoutsTitle, { color: colors.text }]}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </Text>
              </View>
              {workoutsForDay.length > 0 && (
                <View style={styles.workoutCountContainer}>
                  <Text style={styles.workoutCount}>{workoutsForDay.length}</Text>
                </View>
              )}
            </View>
            
            {isLoadingWorkouts ? (
              <ActivityIndicator size="small" color="#4a90e2" style={styles.workoutsLoading} />
            ) : workoutsForDay.length > 0 ? (
              workoutsForDay.map((workout) => (
                <View key={workout.session_id} style={styles.workoutItem}>
                  <LinearGradient
                    colors={['rgba(74, 144, 226, 0.8)', 'rgba(90, 107, 255, 0.8)']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.workoutGradient}
                  >
                    <TouchableOpacity 
                      style={styles.workoutMainContent}
                      onPress={() => handleWorkoutPress(workout)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.workoutIconContainer}>
                        <Ionicons name="barbell-outline" size={24} color="#fff" />
                      </View>
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutName}>{workout.workouts?.title || 'Workout'}</Text>
                        <View style={styles.workoutMetaInfo}>
                          <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.workoutDuration}>{formatDuration(workout.duration)}</Text>
                        </View>
                      </View>
                      <View style={styles.workoutArrowContainer}>
                        <Ionicons name="chevron-forward" size={22} color="#fff" />
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteWorkout(workout.session_id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ))
            ) : (
              <View style={styles.noWorkoutsContainer}>
                <Ionicons name="fitness-outline" size={50} color="rgba(150, 150, 150, 0.5)" />
                <Text style={[styles.noWorkoutsText, { color: colors.text }]}>No workouts recorded for this date</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Workout Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={closePreview}
          />
          <View style={[styles.previewContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                {selectedWorkout?.workouts?.title || 'Workout Details'}
              </Text>
              <TouchableOpacity onPress={closePreview} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <Ionicons name="time-outline" size={20} color="#4a90e2" style={styles.previewIcon} />
                <Text style={[styles.previewLabel, { color: colors.text }]}>Duration:</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {formatDuration(selectedWorkout?.duration || 0)}
                </Text>
              </View>
              
              <View style={styles.previewRow}>
                <Ionicons name="calendar-outline" size={20} color="#4a90e2" style={styles.previewIcon} />
                <Text style={[styles.previewLabel, { color: colors.text }]}>Date:</Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US') : ''}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => {
                  closePreview();
                  if (selectedWorkout?.session_id) {
                    router.push(`/workout-history/${selectedWorkout.session_id}`);
                  }
                }}
              >
                <LinearGradient
                  colors={['#4a90e2', '#5a6bff']}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.detailsButtonGradient}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.06,
    paddingTop: screenWidth * 0.04,
    paddingBottom: screenWidth * 0.04,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: screenWidth * 0.06,
  },
  calendarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 5,
    padding: 12,
    paddingBottom: 20,
  },
  arrowContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  workoutsList: {
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    padding: 0,
  },
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  workoutsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutCountContainer: {
    backgroundColor: '#4a90e2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  workoutsLoading: {
    marginVertical: 30,
  },
  workoutItem: {
    margin: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  workoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 18,
  },
  workoutMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDuration: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginLeft: 5,
  },
  workoutArrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  noWorkoutsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noWorkoutsText: {
    fontSize: 15,
    opacity: 0.7,
    marginTop: 15,
    marginBottom: 20,
  },
  addWorkoutButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addWorkoutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewContainer: {
    width: screenWidth * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  previewContent: {
    padding: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewIcon: {
    marginRight: 10,
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '500',
    width: 70,
  },
  previewValue: {
    fontSize: 15,
    flex: 1,
  },
  detailsButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailsButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 