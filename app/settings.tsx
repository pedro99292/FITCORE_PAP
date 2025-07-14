import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { LinearGradient } from 'expo-linear-gradient';
import SafetyPreferences from '@/utils/safetyPreferences';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signOut, loading } = useAuth();
  const { isSubscribed } = useSubscription();

  const [safetyWarningsEnabled, setSafetyWarningsEnabled] = useState(true);

  // Load safety warnings preference on mount
  useEffect(() => {
    const loadSafetyPreference = async () => {
      try {
        const enabled = await SafetyPreferences.areWarningsEnabled();
        setSafetyWarningsEnabled(enabled);
      } catch (error) {
        console.log('Error loading safety preference:', error);
      }
    };

    loadSafetyPreference();
  }, []);

  const handleBackToProfile = () => {
    router.replace('/(tabs)/profile');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSafetyWarningsToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Enable warnings by removing the preference
        await SafetyPreferences.enableWarnings();
        setSafetyWarningsEnabled(true);
        Alert.alert(
          'Safety Warnings Enabled',
          'You will now see safety warnings before starting workouts.',
          [{ text: 'OK' }]
        );
      } else {
        // Disable warnings with confirmation
        Alert.alert(
          'Disable Safety Warnings',
          'Are you sure you want to disable workout safety warnings? These warnings help prevent injuries and are important for your safety.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await SafetyPreferences.disableWarnings();
                setSafetyWarningsEnabled(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.log('Error updating safety preference:', error);
      Alert.alert('Error', 'Could not update safety warning preference. Please try again.');
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    hasSwitch, 
    switchValue, 
    onSwitchChange,
    onPress 
  }: {
    icon: keyof typeof FontAwesome.glyphMap;
    title: string;
    subtitle?: string;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
        <FontAwesome name={icon} size={24} color={colors.text} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.background, true: colors.primary }}
          thumbColor={switchValue ? '#fff' : '#f4f3f4'}
        />
      )}
      {!hasSwitch && (
        <FontAwesome name="chevron-right" size={20} color="#8e8e93" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBackToProfile}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              Settings
            </Text>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="user"
              title="Profile"
              subtitle="Edit personal information"
              onPress={() => router.push('/edit-profile')}
            />
            {isSubscribed && (
              <SettingItem
                icon="cog"
                title="Workout Preferences"
                subtitle="Manage workout settings and generated plans"
                onPress={() => router.push('/workout-preferences')}
              />
            )}
            <SettingItem
              icon="credit-card"
              title="Subscription"
              subtitle="Manage your subscription"
              onPress={() => router.push('/subscription-management')}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Application</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="shield"
              title="Safety Warnings"
              subtitle="Show workout safety tips and warnings"
              hasSwitch
              switchValue={safetyWarningsEnabled}
              onSwitchChange={handleSafetyWarningsToggle}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Support</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="envelope"
              title="Contact"
              subtitle="Contact us"
              onPress={() => router.push('/contact-us')}
            />
            <SettingItem
              icon="info-circle"
              title="About"
              subtitle="Version 1.6.3"
              onPress={() => router.push('/about')}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
          <LinearGradient
            colors={['#e24a4a', '#b23535']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.logoutGradient}>
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <FontAwesome name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 2,
  },
  backButton: {
    margin: 16,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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