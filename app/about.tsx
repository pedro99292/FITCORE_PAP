import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    router.back();
  };

  const FeatureCard = ({ 
    icon, 
    title, 
    description 
  }: {
    icon: keyof typeof FontAwesome.glyphMap;
    title: string;
    description: string;
  }) => (
    <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.background }]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
        <FontAwesome name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.text }]}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'About FITCORE',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBack}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              About FITCORE
            </Text>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.header}>
                      <LinearGradient
              colors={[colors.primary, colors.primary]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.headerGradient}
            >
            <FontAwesome name="heartbeat" size={48} color="#fff" />
            <Text style={styles.appTitle}>FITCORE</Text>
            <Text style={styles.appSubtitle}>Your Complete Fitness Companion</Text>
            <Text style={styles.version}>Version 1.6.5</Text>
          </LinearGradient>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.description, { color: colors.text }]}>
            FITCORE is a comprehensive fitness application designed to help you achieve your fitness goals through 
            intelligent workout planning, progress tracking, and social motivation. Whether you're a beginner or 
            an experienced athlete, FITCORE adapts to your needs and grows with your fitness journey.
          </Text>
        </View>

        {/* Key Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Key Features</Text>
          
          <FeatureCard
            icon="building"
            title="Smart Workout Builder"
            description="Create personalized workout routines with our intelligent exercise database and customizable templates."
          />
          
          <FeatureCard
            icon="calendar"
            title="Workout Scheduling"
            description="Plan your training sessions with our integrated calendar system and never miss a workout."
          />
          
          <FeatureCard
            icon="trophy"
            title="Personal Records Tracking"
            description="Track your progress and celebrate new personal bests across all your exercises."
          />
          
          <FeatureCard
            icon="users"
            title="Social Community"
            description="Connect with other fitness enthusiasts, share achievements, and stay motivated together."
          />
          
          <FeatureCard
            icon="comments"
            title="Built-in Messaging"
            description="Chat with friends, share workout tips, and build your fitness network."
          />
          
          <FeatureCard
            icon="star"
            title="Achievement System"
            description="Unlock achievements and badges as you reach new milestones in your fitness journey."
          />
          
          <FeatureCard
            icon="history"
            title="Workout History"
            description="Review your past workouts, analyze your progress, and identify areas for improvement."
          />
          
          <FeatureCard
            icon="user"
            title="Profile Management"
            description="Customize your profile, track your fitness stats, and showcase your achievements."
          />
        </View>

        {/* Technology & Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Technology & Data</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Built with React Native and Expo for cross-platform compatibility. Your data is securely stored 
              and synchronized across all your devices using Supabase infrastructure.
            </Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Our Mission</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              To make fitness accessible, enjoyable, and sustainable for everyone by providing the tools, 
              community, and motivation needed to achieve lasting health and wellness goals.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerGradient: {
    padding: 30,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
  version: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
    opacity: 0.7,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
}); 