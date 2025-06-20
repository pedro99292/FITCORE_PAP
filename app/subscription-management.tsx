import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionService, SubscriptionType } from '@/utils/subscriptionService';
import { supabase } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRelativeTime } from '@/utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');



export default function SubscriptionManagementScreen() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const { user } = useAuth();
  const { 
    subscriptionType, 
    subscriptionStatus, 
    isSubscribed, 
    checkSubscription,
    subscribe: contextSubscribe
  } = useSubscription();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);


  const fetchSubscriptionDetails = async () => {
    if (!user) return;
    
    try {
      const details = await subscriptionService.getSubscriptionDetails(user.id);
      setSubscriptionDetails(details);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };



  useEffect(() => {
    fetchSubscriptionDetails();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      checkSubscription(),
      fetchSubscriptionDetails(),
    ]);
    setRefreshing(false);
  };

  const handleSubscriptionChange = (newType: SubscriptionType) => {
    console.log('handleSubscriptionChange called with:', newType);
    Alert.alert(
      'Change Subscription',
      `Are you sure you want to switch to ${newType} subscription?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (!user) {
              console.log('No user found');
              return;
            }
            
            console.log('Starting subscription change process...');
            setLoading(true);
            try {
              // Use the context's subscribe method which handles survey and workout generation
              const success = await contextSubscribe(newType);
              
              if (success) {
                await fetchSubscriptionDetails();
                
                // Show simple success message - context will handle modals
                Alert.alert(
                  'Subscription Updated! ✅', 
                  'Your subscription has been updated successfully. You can now access all premium features.',
                  [{ text: 'Great!', onPress: () => {} }]
                );
              } else {
                Alert.alert('Error', 'Failed to update subscription. Please try again.');
              }
            } catch (error) {
              console.error('Error in subscription change:', error);
              Alert.alert('Error', 'Failed to update subscription. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription?\n\n⚠️ This will:\n• Remove access to premium features\n• Delete all your auto-generated workout plans\n• Keep your custom workouts and workout history\n\nYou can resubscribe anytime to generate new workout plans.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            
            setLoading(true);
            try {
              const success = await subscriptionService.cancelSubscription(user.id);
              if (success) {
                await checkSubscription();
                await fetchSubscriptionDetails();
                Alert.alert(
                  'Subscription Canceled', 
                  'Your subscription has been canceled successfully. All auto-generated workouts have been removed, but your custom workouts and history remain intact.'
                );
              } else {
                Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'active':
        return '#4CAF50';
      case 'trial':
        return '#FF9800';
      case 'inactive':
        return '#F44336';
      default:
        return colors.text;
    }
  };

  const getSubscriptionTypeDisplay = (type: SubscriptionType) => {
    switch (type) {
      case 'monthly':
        return 'Monthly Premium';
      case 'annual':
        return 'Annual Premium';
      case 'lifetime':
        return 'Lifetime Premium';
      case 'free':
        return 'Free Plan';
      default:
        return 'Free Plan';
    }
  };

  const SubscriptionPlan = ({ 
    type, 
    title, 
    price, 
    features, 
    isCurrentPlan,
    onSelect 
  }: {
    type: SubscriptionType;
    title: string;
    price: string;
    features: string[];
    isCurrentPlan: boolean;
    onSelect: () => void;
  }) => (
    <TouchableOpacity 
      style={[
        styles.planCard, 
        { 
          backgroundColor: colors.surface,
          borderColor: isCurrentPlan ? colors.primary : colors.background,
          borderWidth: isCurrentPlan ? 2 : 1,
        }
      ]}
      onPress={!isCurrentPlan ? onSelect : undefined}
      disabled={isCurrentPlan || loading}
    >
      <View style={styles.planHeader}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.planPrice, { color: colors.primary }]}>{price}</Text>
      </View>
      
      {isCurrentPlan && (
        <View style={[styles.currentPlanBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.currentPlanText}>Current Plan</Text>
        </View>
      )}
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <FontAwesome name="check" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Subscription Management',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Subscription Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Current Subscription</Text>
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusType, { color: colors.text }]}>
                {getSubscriptionTypeDisplay(subscriptionType)}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>
                    {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
                  </Text>
                </View>
              </View>
              {subscriptionDetails?.endDate && (
                <Text style={[styles.statusDate, { color: colors.text + '80' }]}>
                  {subscriptionStatus === 'active' ? 'Renews on' : 'Expires on'}: {' '}
                  {subscriptionDetails.endDate.toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Available Plans</Text>
          
          <SubscriptionPlan
            type="free"
            title="Free Plan"
            price="€0/month"
            features={[
              "Basic workout tracking",
              "Limited exercise library",
              "Basic progress tracking"
            ]}
            isCurrentPlan={subscriptionType === 'free'}
            onSelect={() => handleSubscriptionChange('free')}
          />

          <SubscriptionPlan
            type="monthly"
            title="Monthly Premium"
            price="€4.99/month"
            features={[
              "Unlimited workout creation",
              "Full exercise library",
              "Advanced analytics",
              "Priority support"
            ]}
            isCurrentPlan={subscriptionType === 'monthly'}
            onSelect={() => handleSubscriptionChange('monthly')}
          />

          <SubscriptionPlan
            type="annual"
            title="Annual Premium"
            price="€49.99/year"
            features={[
              "All monthly features",
              "2 months free",
              "Exclusive content",
              "Early access to features"
            ]}
            isCurrentPlan={subscriptionType === 'annual'}
            onSelect={() => handleSubscriptionChange('annual')}
          />

          <SubscriptionPlan
            type="lifetime"
            title="Lifetime Premium"
            price="€149.99 once"
            features={[
              "All premium features forever",
              "No recurring payments",
              "Exclusive lifetime perks",
              "Priority support"
            ]}
            isCurrentPlan={subscriptionType === 'lifetime'}
            onSelect={() => handleSubscriptionChange('lifetime')}
          />
        </View>

        {/* Cancel Subscription */}
        {isSubscribed && subscriptionType !== 'free' && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: '#F44336' }]}
              onPress={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#F44336" size="small" />
              ) : (
                <>
                  <FontAwesome name="times-circle" size={18} color="#F44336" />
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
  },
  statusCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusInfo: {
    gap: 8,
  },
  statusType: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDate: {
    fontSize: 14,
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  currentPlanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  cancelButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  workoutPreferencesButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutPreferencesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutPreferencesText: {
    flex: 1,
  },
  workoutPreferencesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutPreferencesSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});