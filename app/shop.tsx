import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  Vibration,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Empty shop items array
const SHOP_ITEMS: ShopItem[] = [];

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'themes' | 'features' | 'cosmetics' | 'achievements';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userCoins, setUserCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  const headerScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    loadUserCoins();
    loadPurchasedItems();
    
    // Animate header entrance
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const loadUserCoins = async () => {
    try {
      const coins = await AsyncStorage.getItem('userCoins');
      setUserCoins(coins ? parseInt(coins) : 0);
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
                if (Platform.OS !== 'web') {
                  Vibration.vibrate(50);
                }
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
              if (Platform.OS !== 'web') {
                Vibration.vibrate(30);
              }
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

  const renderCategory = ({ item, index }: { item: typeof CATEGORIES[0]; index: number }) => {
    const isSelected = selectedCategory === item.id;
    const defaultColors = [`${colors.surface}80`, `${colors.surface}40`] as const;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== 'web') {
              Vibration.vibrate(30);
            }
            setSelectedCategory(item.id);
          }}
          style={styles.categoryButton}
        >
          <LinearGradient
            colors={isSelected ? item.gradient : defaultColors}
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
                if (Platform.OS !== 'web') {
                  Vibration.vibrate(30);
                }
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Shop</Text>
            
            <View style={styles.coinsContainer}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.coinsText}>{userCoins}</Text>
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
          renderItem={() => null} // No items to render since array is empty
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
}); 