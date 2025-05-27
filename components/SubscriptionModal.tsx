import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'annual' | 'lifetime') => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isVisible, onClose, onSubscribe }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      type: 'monthly'
    },
    {
      name: 'Annual Plan',
      price: '$49.99',
      period: '/year',
      features: [
        'All Monthly Features',
        'Save ~33%',
        'Priority Support',
      ],
      type: 'annual'
    },
    {
      name: 'Lifetime Access',
      price: '$89.99',
      period: 'one-time',
      features: [
        'All Features Forever',
        'Best Value',
        'Exclusive Content',
      ],
      type: 'lifetime'
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Unlock all premium features</Text>

          <ScrollView style={styles.plansContainer}>
            {plans.map((plan, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.planCard, { borderColor: colors.tint }]}
                onPress={() => onSubscribe(plan.type as 'monthly' | 'annual' | 'lifetime')}
              >
                <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: colors.tint }]}>{plan.price}</Text>
                  <Text style={[styles.period, { color: colors.icon }]}>{plan.period}</Text>
                </View>
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, fIndex) => (
                    <View key={fIndex} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                      <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: colors.tint }]}
                  onPress={() => onSubscribe(plan.type as 'monthly' | 'annual' | 'lifetime')}
                >
                  <Text style={styles.subscribeButtonText}>Choose Plan</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.trialText, { color: colors.icon }]}>
            Try Premium free for 14 days
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  plansContainer: {
    maxHeight: '70%',
  },
  planCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    marginLeft: 5,
  },
  featuresContainer: {
    marginTop: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
  },
  subscribeButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trialText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});

export default SubscriptionModal; 