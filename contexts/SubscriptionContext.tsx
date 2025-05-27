import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionService, SubscriptionType, SubscriptionStatus } from '@/utils/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionType: SubscriptionType;
  subscriptionStatus: SubscriptionStatus;
  showSubscriptionModal: boolean;
  showSurveyModal: boolean;
  subscribe: (type: SubscriptionType) => Promise<boolean>;
  startTrial: () => Promise<boolean>;
  setShowSubscriptionModal: (show: boolean) => void;
  setShowSurveyModal: (show: boolean) => void;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('inactive');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const checkSubscription = async () => {
    if (!user) {
      setIsSubscribed(false);
      setSubscriptionType('free');
      setSubscriptionStatus('inactive');
      return;
    }

    const details = await subscriptionService.getSubscriptionDetails(user.id);
    if (details) {
      const isActive = await subscriptionService.checkSubscriptionStatus(user.id);
      setIsSubscribed(isActive);
      setSubscriptionType(details.type);
      setSubscriptionStatus(details.status);

      // Show subscription modal if subscription is inactive or expired
      if (!isActive && !showSubscriptionModal) {
        setShowSubscriptionModal(true);
      }
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const subscribe = async (type: SubscriptionType) => {
    if (!user) return false;
    
    const success = await subscriptionService.subscribe(user.id, type);
    if (success) {
      setShowSubscriptionModal(false);
      setShowSurveyModal(true);
      await checkSubscription();
    }
    return success;
  };

  const startTrial = async () => {
    if (!user) return false;
    
    const success = await subscriptionService.startTrial(user.id);
    if (success) {
      setShowSubscriptionModal(false);
      setShowSurveyModal(true);
      await checkSubscription();
    }
    return success;
  };

  const value = {
    isSubscribed,
    subscriptionType,
    subscriptionStatus,
    showSubscriptionModal,
    showSurveyModal,
    subscribe,
    startTrial,
    setShowSubscriptionModal,
    setShowSurveyModal,
    checkSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 