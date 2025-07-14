import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'annual' | 'lifetime') => void;
  onStartTrial: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isVisible, onClose, onSubscribe, onStartTrial }) => {
  const { colors, isDarkMode } = useTheme();

  const plans = [
    {
      name: 'Monthly Plan',
      price: '$3.99',
      period: '/month',
      features: [
        'Custom Workouts',
        'Strength Ranks',
        'Enhanced Profile',
        'Premium Features',
      ],
      type: 'monthly',
      popular: false
    },
    {
      name: 'Annual Plan',
      price: '$49.99',
      period: '/year',
      features: [
        'All Monthly Features',
        'Save ~33%',
        'Priority Support',
        'Exclusive Content',
      ],
      type: 'annual',
      popular: true
    },
    {
      name: 'Lifetime Access',
      price: '$89.99',
      period: 'one-time',
      features: [
        'All Features Forever',
        'Best Value',
        'No Monthly Fees',
        'Future Updates',
      ],
      type: 'lifetime',
      popular: false
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={[styles.closeButtonBackground, { backgroundColor: colors.surface }]}>
                <Ionicons name="close" size={24} color={colors.text} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Unlock all premium features and take your fitness to the next level
              </Text>
            </View>
          </View>

          {/* Plans */}
          <ScrollView style={styles.plansContainer} showsVerticalScrollIndicator={false}>
            {plans.map((plan, index) => (
              <View key={index} style={styles.planWrapper}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <LinearGradient
                      colors={[colors.primary, '#6bb6ff']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.popularBadgeGradient}
                    >
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </LinearGradient>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.planCard, 
                    { 
                      backgroundColor: colors.surface,
                      borderColor: plan.popular ? colors.primary : colors.border,
                      borderWidth: plan.popular ? 2 : 1
                    }
                  ]}
                  onPress={() => onSubscribe(plan.type as 'monthly' | 'annual' | 'lifetime')}
                  activeOpacity={0.8}
                >
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.price, { color: colors.primary }]}>{plan.price}</Text>
                      <Text style={[styles.period, { color: colors.textSecondary }]}>{plan.period}</Text>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, fIndex) => (
                      <View key={fIndex} style={styles.featureRow}>
                        <View style={[styles.checkIcon, { backgroundColor: colors.primary + '20' }]}>
                          <Ionicons name="checkmark" size={16} color={colors.primary} />
                        </View>
                        <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.subscribeButtonWrapper}
                    onPress={() => onSubscribe(plan.type as 'monthly' | 'annual' | 'lifetime')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={plan.popular ? [colors.primary, '#6bb6ff'] : ['#5a9fd4', '#4a90e2']}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.subscribeButton}
                    >
                      <Text style={[
                        styles.subscribeButtonText, 
                        { color: '#fff' }
                      ]}>
                        Choose {plan.name.split(' ')[0]}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.trialButtonWrapper}
              onPress={onStartTrial}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.trialBadge}
              >
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={[styles.trialText, { color: colors.primary }]}>
                  Start your 14-day free trial today
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} style={styles.trialArrow} />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
              Cancel anytime. No commitments.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    borderRadius: 24,
    width: screenWidth * 0.95,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  closeButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    marginTop: 8,
    paddingRight: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  plansContainer: {
    paddingHorizontal: 24,
    maxHeight: '60%',
  },
  planWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  popularBadgeGradient: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    marginLeft: 8,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  subscribeButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  subscribeButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  trialButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
  },
  trialText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  trialArrow: {
    marginLeft: 8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 14,
  },
});

export default SubscriptionModal; 