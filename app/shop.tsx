import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
  FadeInDown,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAchievements } from '../contexts/AchievementContext';
import { subscriptionService, SubscriptionType } from '../utils/subscriptionService';
import { supabase } from '../utils/supabase';
import { CoinService } from '../utils/coinService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Shop items array
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'premium_monthly',
    name: '1 Month Premium Access',
    description: 'Unlock all premium features for 1 month.',
    price: 8000, // coins
    category: 'features',
    icon: 'star',
    owned: false
  },
  {
    id: 'premium_lifetime',
    name: 'Lifetime Premium Access',
    description: 'Get lifetime access to all premium features FOREVER. Never pay again and enjoy unlimited premium benefits.',
    price: 30000, // coins
    category: 'features',
    icon: 'diamond',
    owned: false
  },
  {
    id: 'double_coin_booster',
    name: 'Double Coin Booster',
    description: 'Double all coin earnings for 24 hours! Stack up those rewards faster and maximize your achievement gains.',
    price: 800, // coins
    category: 'achievements',
    icon: 'flash',
    owned: false
  },
  {
    id: 'streak_saver',
    name: 'Streak Saver',
    description: 'Protect your workout streak for 3 extra days! Auto-activates when your streak is at risk. Perfect insurance for busy days.',
    price: 600, // coins
    category: 'achievements',
    icon: 'shield-checkmark',
    owned: false
  },
  {
    id: 'nutrients_guide',
    name: 'Complete Nutrients Guide',
    description: 'Complete guide containing all essential nutrients your body needs, their health benefits, and the best food sources to get them from.',
    price: 300, // coins
    category: 'features',
    icon: 'nutrition',
    owned: false
  }
];

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'themes' | 'features' | 'cosmetics' | 'achievements';
  icon: string;
  owned?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '✨', gradient: ['#667eea', '#764ba2'] as const },
  { id: 'themes', name: 'Themes', icon: '🎨', gradient: ['#f093fb', '#f5576c'] as const },
  { id: 'features', name: 'Features', icon: '⚡', gradient: ['#4facfe', '#00f2fe'] as const },
  { id: 'cosmetics', name: 'Cosmetics', icon: '💎', gradient: ['#a8edea', '#fed6e3'] as const },
  { id: 'achievements', name: 'Boosts', icon: '🚀', gradient: ['#ff9a9e', '#fecfef'] as const },
];

export default function ShopScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { subscriptionType, isSubscribed } = useSubscription();
  const { triggerCoinsRefresh } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userCoins, setUserCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostTimeRemaining, setBoostTimeRemaining] = useState(0);
  const [streakSaverCount, setStreakSaverCount] = useState(0);
  const [isStreakProtectionActive, setIsStreakProtectionActive] = useState(false);
  const [streakProtectionTimeRemaining, setStreakProtectionTimeRemaining] = useState(0);

  // Format large numbers with K suffix
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      if (price < 10000) {
        return (price / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      } else {
        return Math.floor(price / 1000) + 'K';
      }
    }
    return price.toString();
  };

  const headerScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    loadUserCoins();
    loadPurchasedItems();
    loadBoostStatus();
    loadStreakSaverStatus();
    
    // Animate header entrance
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Update boost timer and streak saver status every second
    const interval = setInterval(() => {
      loadBoostStatus();
      loadStreakSaverStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh coins when screen comes into focus
  useFocusEffect(() => {
    loadUserCoins();
  });

  const loadUserCoins = async () => {
    try {
      const coins = await CoinService.getCoins();
      setUserCoins(coins);
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  };

  const loadPurchasedItems = async () => {
    try {
      const items = await AsyncStorage.getItem('purchasedItems');
      setPurchasedItems(items ? JSON.parse(items) : []);
    } catch (error) {
      console.error('Error loading purchased items:', error);
    }
  };

  const loadBoostStatus = async () => {
    try {
      const isActive = await CoinService.isDoubleCoinBoostActive();
      const timeRemaining = await CoinService.getDoubleCoinBoostTimeRemaining();
      setIsBoostActive(isActive);
      setBoostTimeRemaining(timeRemaining);
    } catch (error) {
      console.error('Error loading boost status:', error);
    }
  };

  const loadStreakSaverStatus = async () => {
    try {
      const count = await CoinService.getUnusedStreakSaverCount();
      const isProtectionActive = await CoinService.isStreakProtectionActive();
      const timeRemaining = await CoinService.getStreakProtectionTimeRemaining();
      
      setStreakSaverCount(count);
      setIsStreakProtectionActive(isProtectionActive);
      setStreakProtectionTimeRemaining(timeRemaining);
    } catch (error) {
      console.error('Error loading streak saver status:', error);
    }
  };

  const handleNutrientsGuideAccess = async () => {
    try {
      const pdfUrl = 'https://drive.google.com/file/d/1gCqG5rFMPQL3PdepjJFy4-hiwGi1jZnB/view?usp=sharing';
      
      if (Platform.OS === 'web') {
        // On web, open in new tab
        window.open(pdfUrl, '_blank');
      } else {
        // On mobile, use expo-web-browser for PDF viewing
        await WebBrowser.openBrowserAsync(pdfUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#007AFF',
          showTitle: true,
        });
      }
    } catch (error) {
      console.error('Error accessing nutrients guide:', error);
      Alert.alert(
        'Error Opening Guide',
        'Unable to open the PDF guide. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(item => item.category === selectedCategory);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const renderEmptyState = () => (
    <Animated.View 
      entering={FadeInDown.delay(300)}
      style={styles.emptyStateContainer}
    >
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.surface}00`]}
        style={styles.emptyStateGradient}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Animated.View 
          entering={BounceIn.delay(500)}
          style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}20` }]}
        >
          <Ionicons name="storefront-outline" size={80} color={colors.primary} />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(700)} style={styles.emptyTextContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Shop Coming Soon!
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(900)} style={styles.emptyActionsContainer}>
          <LinearGradient
            colors={[colors.primary, `${colors.primary}CC`]}
            style={styles.emptyActionButton}
            start={[0, 0]}
            end={[1, 0]}
          >
            <TouchableOpacity
              style={styles.emptyActionButtonInner}
              onPress={() => {
                router.push('/(tabs)/achievements');
              }}
            >
              <Ionicons name="trophy" size={20} color="#fff" />
              <Text style={styles.emptyActionButtonText}>Earn More Coins</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <TouchableOpacity
            style={[styles.emptySecondaryButton, { borderColor: colors.primary }]}
            onPress={() => {
              router.back();
            }}
          >
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={[styles.emptySecondaryButtonText, { color: colors.primary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );

  const extendMonthlySubscription = async (userId: string): Promise<boolean> => {
    try {
      // Get current subscription details
      const currentDetails = await subscriptionService.getSubscriptionDetails(userId);
      
      let newStartDate: Date;
      let newEndDate: Date;
      
      if (currentDetails && currentDetails.status === 'active' && currentDetails.endDate && new Date() < currentDetails.endDate) {
        // If user has active subscription that hasn't expired, extend from current end date
        newStartDate = currentDetails.startDate;
        newEndDate = new Date(currentDetails.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        console.log(`Extending existing subscription from ${currentDetails.endDate} to ${newEndDate}`);
      } else {
        // If no active subscription or it's expired, start from now
        newStartDate = new Date();
        newEndDate = new Date();
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        console.log(`Starting new subscription from ${newStartDate} to ${newEndDate}`);
      }
      
      // Manually update the subscription with the calculated dates
      const { data, error } = await supabase
        .from('users')
        .update({
          subscription_type: 'monthly',
          subscription_status: 'active',
          subscription_start_date: newStartDate.toISOString(),
          subscription_end_date: newEndDate.toISOString(),
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Supabase error extending subscription:', error);
        throw error;
      }
      
      console.log('Subscription extended successfully:', data);
      return true;
    } catch (error) {
      console.error('Error extending monthly subscription:', error);
      return false;
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make purchases.');
      return;
    }

    if (userCoins < item.price) {
      Alert.alert('Insufficient Coins', 'You need more coins to purchase this item. Complete achievements to earn more coins!');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${item.name} for ${formatPrice(item.price)} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              // Handle special items
              if (item.id === 'premium_monthly' || item.id === 'premium_lifetime') {
                let subscriptionSuccess = false;
                
                if (item.id === 'premium_monthly') {
                  // Use custom extension function for monthly subscription
                  subscriptionSuccess = await extendMonthlySubscription(user.id);
                } else {
                  // Use regular subscribe for lifetime
                  subscriptionSuccess = await subscriptionService.subscribe(user.id, 'lifetime');
                }
                
                if (!subscriptionSuccess) {
                  Alert.alert('Error', 'Failed to activate subscription. Please try again.');
                  return;
                }
              } else if (item.id === 'double_coin_booster') {
                // Activate double coin boost
                await CoinService.activateDoubleCoinBoost();
                loadBoostStatus(); // Refresh boost status
              } else if (item.id === 'streak_saver') {
                // Add a streak saver
                await CoinService.addStreakSaver();
                loadStreakSaverStatus(); // Refresh streak saver status
              } else if (item.id === 'nutrients_guide') {
                // Unlock nutrients guide access
                await handleNutrientsGuideAccess();
              }

              // Deduct coins using CoinService
              const success = await CoinService.subtractCoins(item.price);
              if (!success) {
                Alert.alert('Error', 'Failed to deduct coins. Please try again.');
                return;
              }
              
              // Update local state
              const newCoins = await CoinService.getCoins();
              setUserCoins(newCoins);
              
              // Trigger global coins refresh for HeaderStats
              triggerCoinsRefresh();
              
              let newPurchasedItems = [...purchasedItems];
              
              // Only mark as permanently owned if it's not consumable items
              if (item.id !== 'premium_monthly' && item.id !== 'double_coin_booster') {
                newPurchasedItems = [...purchasedItems, item.id];
                await AsyncStorage.setItem('purchasedItems', JSON.stringify(newPurchasedItems));
                setPurchasedItems(newPurchasedItems);
              }
              
              // Show success message based on item type
              if (item.id === 'premium_monthly') {
                Alert.alert(
                  'Premium Month Added! 🎉', 
                  'Your premium subscription has been extended by 1 month! The time has been added to your current subscription end date. Purchase again anytime to stack more months!',
                  [{ text: 'Awesome!', style: 'default' }]
                );
              } else if (item.id === 'premium_lifetime') {
                Alert.alert(
                  'Lifetime Premium Unlocked! 🚀', 
                  'Congratulations! You now have lifetime access to all premium features. Welcome to the premium club!',
                  [{ text: 'Amazing!', style: 'default' }]
                );
              } else if (item.id === 'double_coin_booster') {
                Alert.alert(
                  'Double Coins Activated! ⚡', 
                  'Your coin earnings are now doubled for the next 24 hours! Go complete some achievements and maximize your rewards!',
                  [{ text: 'Let\'s Go!', style: 'default' }]
                );
              } else if (item.id === 'streak_saver') {
                Alert.alert(
                  'Streak Saver Purchased! 🛡️', 
                  'Your streak saver is ready! It will automatically activate if your workout streak is at risk, protecting it for 3 extra days.',
                  [{ text: 'Perfect!', style: 'default' }]
                );
              } else if (item.id === 'nutrients_guide') {
                Alert.alert(
                  'Nutrients Guide Unlocked! 📖', 
                  'Your complete nutrition guide is now available! The PDF has been opened and you can access it anytime from your purchased items.',
                  [{ text: 'Great!', style: 'default' }]
                );
              } else {
                Alert.alert('Purchase Successful!', `You have purchased ${item.name}!`);
              }
            } catch (error) {
              console.error('Purchase error:', error);
              Alert.alert('Error', 'Failed to complete purchase. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderShopItem = ({ item }: { item: ShopItem }) => {
    // Check ownership based on actual subscription status
    let isOwned = false;
    let buttonText = 'Purchase';
    
    if (item.id === 'premium_monthly') {
      // Monthly subscription is never "owned" - can be purchased multiple times
      isOwned = false;
    } else if (item.id === 'premium_lifetime') {
      // Lifetime subscription is "owned" only if user has active lifetime subscription
      isOwned = isSubscribed && subscriptionType === 'lifetime';
      buttonText = isOwned ? 'Owned' : 'Purchase';
    } else if (item.id === 'double_coin_booster') {
      // Double coin booster is "active" but can be purchased again
      isOwned = false;
      if (isBoostActive) {
        const hours = Math.floor(boostTimeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((boostTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        buttonText = `Active (${hours}h ${minutes}m)`;
      } else {
        buttonText = 'Purchase';
      }
    } else if (item.id === 'streak_saver') {
      // Streak saver shows count and can always be purchased
      isOwned = false;
      if (streakSaverCount > 0) {
        if (isStreakProtectionActive) {
          const days = Math.floor(streakProtectionTimeRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((streakProtectionTimeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          buttonText = `Protected (${days}d ${hours}h)`;
        } else {
          buttonText = `Owned (${streakSaverCount})`;
        }
      } else {
        buttonText = 'Purchase';
      }
    } else if (item.id === 'nutrients_guide') {
      // Nutrients guide shows "Open PDF" when owned
      isOwned = purchasedItems.includes(item.id);
      buttonText = isOwned ? 'Open PDF' : 'Purchase';
    } else {
      // Other items use the purchase history
      isOwned = purchasedItems.includes(item.id);
      buttonText = isOwned ? 'Owned' : 'Purchase';
    }
    
    const canAfford = userCoins >= item.price;
    const canPurchase = (item.id === 'double_coin_booster' || item.id === 'streak_saver') ? canAfford : 
                       (item.id === 'nutrients_guide' && isOwned) ? true : // Always clickable if owned (to open PDF)
                       (!isOwned && canAfford);

    return (
      <Animated.View entering={FadeInDown.delay(100)} style={styles.shopItem}>
        <LinearGradient
          colors={[`${colors.primary}20`, `${colors.surface}80`]}
          style={[styles.shopItemGradient, { borderColor: colors.primary }]}
        >
          <View style={styles.shopItemHeader}>
            <View style={[styles.shopItemIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name={item.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.shopItemInfo}>
              <Text style={[styles.shopItemName, { color: colors.text }]}>{item.name}</Text>
            </View>
            <View style={styles.shopItemPrice}>
              <Ionicons name="wallet" size={16} color={colors.primary} />
              <Text style={[styles.shopItemPriceText, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
            </View>
          </View>
          
          <Text style={[styles.shopItemDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              {
                backgroundColor: (isOwned && item.id !== 'double_coin_booster' && item.id !== 'streak_saver' && item.id !== 'nutrients_guide') ? '#4CAF50' : 
                                 (isBoostActive && item.id === 'double_coin_booster') ? '#FF9800' : 
                                 (isStreakProtectionActive && item.id === 'streak_saver') ? '#9C27B0' :
                                 (streakSaverCount > 0 && item.id === 'streak_saver') ? '#4CAF50' :
                                 (isOwned && item.id === 'nutrients_guide') ? '#2196F3' : colors.primary,
                opacity: canPurchase ? 1 : 0.5
              }
            ]}
            onPress={() => {
              if (canPurchase) {
                if (item.id === 'nutrients_guide' && purchasedItems.includes(item.id)) {
                  // If already owned, just open the PDF
                  handleNutrientsGuideAccess();
                } else {
                  // Otherwise, proceed with purchase
                  handlePurchase(item);
                }
              }
            }}
            disabled={!canPurchase}
          >
            <Text style={styles.purchaseButtonText}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderCategory = ({ item, index }: { item: typeof CATEGORIES[0]; index: number }) => {
    const isSelected = selectedCategory === item.id;
    const defaultColors = [`${colors.surface}80`, `${colors.surface}40`] as const;
    const selectedColors = [colors.primary, `${colors.primary}CC`] as const;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(item.id);
          }}
          style={styles.categoryButton}
        >
          <LinearGradient
            colors={isSelected ? selectedColors : defaultColors}
            style={[styles.categoryGradient, isSelected && styles.selectedCategory]}
            start={[0, 0]}
            end={[1, 0]}
          >
            <Text style={styles.categoryEmoji}>{item.icon}</Text>
            <Text style={[
              styles.categoryText,
              { color: isSelected ? '#fff' : colors.text }
            ]}>
              {item.name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[colors.primary, `${colors.primary}DD`]}
          style={styles.headerGradient}
          start={[0, 0]}
          end={[1, 1]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Shop</Text>
            
            <View style={styles.headerRight}>
              <View style={styles.coinsContainer}>
                <Ionicons name="wallet" size={20} color="#fff" />
                <Text style={styles.coinsText}>{userCoins}</Text>
                {isBoostActive && (
                  <View style={styles.boostIndicator}>
                    <Ionicons name="flash" size={16} color="#FFD700" />
                    <Text style={styles.boostText}>2x</Text>
                  </View>
                )}
              </View>
              
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            Enhance your fitness journey
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesList}
        />
      </View>

      {/* Shop Items */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id}
          style={styles.shopList}
          contentContainerStyle={styles.shopListContent}
          showsVerticalScrollIndicator={false}
          numColumns={1}
        />
      ) : (
        <ScrollView 
          style={styles.shopList}
          contentContainerStyle={[styles.shopListContent, styles.emptyScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  categoriesContainer: {
    marginVertical: 20,
  },
  categoriesList: {
    paddingLeft: 20,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryButton: {
    marginRight: 12,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  selectedCategory: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  shopList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  shopListContent: {
    paddingBottom: 100,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
    minHeight: screenHeight * 0.4,
  },
  emptyStateGradient: {
    width: '100%',
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
  },
  emptyIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  emptyActionsContainer: {
    width: '100%',
    gap: 12,
  },
  emptyActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyActionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  emptyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptySecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  emptySecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shopItem: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  shopItemGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shopItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  shopItemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shopItemPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  shopItemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  purchaseButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },

  boostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  boostText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});