import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ActivityIndicator, 
  Platform,
  StatusBar,
  Animated,
  Pressable
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

// Define TypeScript types for data
type User = {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export default function NewMessageScreen() {
  const { isDarkMode, colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<User[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(50)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Run entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Focus the search input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Focus animation for search bar
  const handleSearchFocus = (focused: boolean) => {
    Animated.timing(searchBarAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    
    getCurrentUser();
  }, []);

  // Search for users as the user types
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        // If search is empty, fetch all users
        fetchUsers();
      }
    }, 300); // Reduced delay for more responsive search
    
    return () => clearTimeout(searchTimer);
  }, [searchQuery]);
  
  // Fetch all users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [currentUserId]);

  // Fetch users the current user has interacted with or can chat with
  const fetchUsers = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      
      // Get all users except the current user
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUserId)
        .order('username');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      setUsers(data || []);
      
      // Simulate recent searches (in a real app, this would be stored in storage)
      if (data && data.length > 0) {
        setRecentSearches(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search for users by username
  const searchUsers = async (query: string) => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      
      // Search users by username or full name
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUserId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('username');
      
      if (error) {
        console.error('Error searching users:', error);
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error in searchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create or get a conversation with selected user
  const startConversation = async (userId: string, username: string) => {
    if (!currentUserId) return;
    
    try {
      // Add a loading state for better UX
      setLoading(true);
      
      // Call the function to get or create a conversation
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: currentUserId,
        user2_id: userId
      });
      
      if (error) {
        console.error('Error creating conversation:', error);
        setLoading(false);
        return;
      }
      
      // Navigate to the conversation
      router.push({
        pathname: `/chat/conversation/[id]`,
        params: { 
          id: data, 
          userId: userId,
          username: username
        }
      });
    } catch (error) {
      console.error('Error in startConversation:', error);
      setLoading(false);
    }
  };

  // Render section header
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
        {title}
      </Text>
    </View>
  );

  // Render user item
  const renderUserItem = ({ item, index }: { item: User, index: number }) => {
    // Stagger animation based on index
    const itemDelay = index * 50;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: translateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 20 + itemDelay]
            })
          }]
        }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.userItem, 
            { 
              backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
          onPress={() => startConversation(item.id, item.username)}
          android_ripple={{ color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image 
                source={{ uri: item.avatar_url }} 
                style={styles.avatar} 
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>
                {item.username}
              </Text>
              
              {/* Last seen (simulated) */}
              {index % 2 !== 0 && (
                <Text style={styles.lastSeen}>
                  {Math.floor(Math.random() * 10) + 1}m ago
                </Text>
              )}
            </View>
            
            {item.full_name && (
              <Text style={[styles.fullName, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                {item.full_name}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };
  
  // Render suggested contacts
  const renderRecentSearches = () => {
    if (searchQuery || !recentSearches.length) return null;
    
    return (
      <View style={styles.recentSearchesSection}>
        {renderSectionHeader('Recent')}
        <View style={styles.recentsList}>
          {recentSearches.map((user, index) => (
            <TouchableOpacity 
              key={user.id}
              style={[styles.recentItem, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => startConversation(user.id, user.username)}
            >
              <View style={styles.recentAvatarContainer}>
                {user.avatar_url ? (
                  <Image 
                    source={{ uri: user.avatar_url }} 
                    style={styles.recentAvatar} 
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.primary, colors.primary]}
                    style={styles.recentAvatar}
                  >
                    <Text style={styles.recentAvatarText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
              </View>
              <Text style={[styles.recentUsername, { color: isDarkMode ? '#fff' : '#000' }]} numberOfLines={1}>
                {user.username}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Search bar active styles
  const searchBarBorderRadius = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 15]
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Stack.Screen
        options={{
          title: 'New Message',
          headerStyle: {
            backgroundColor: isDarkMode ? '#2b2b45' : '#f5f5f5'
          },
          headerShadowVisible: false,
          headerTintColor: isDarkMode ? '#fff' : '#000',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ marginRight: 10 }}
            >
              <Feather name="arrow-left" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Animated.View 
          style={[
            styles.searchBar, 
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              borderRadius: searchBarBorderRadius,
              borderColor: searchBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.primary]
              }),
              borderWidth: 1
            }
          ]}
        >
          <Feather name="search" size={18} color={isDarkMode ? "#8e8e93" : "#666"} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#000' }]}
            placeholder="Search for users..."
            placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => handleSearchFocus(true)}
            onBlur={() => handleSearchFocus(false)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={isDarkMode ? "#8e8e93" : "#666"} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
      
      {/* Recent Searches */}
      {renderRecentSearches()}
      
      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
            Finding users...
          </Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            style={styles.emptyImageContainer}
          >
            <Feather name="users" size={40} color="#fff" />
          </LinearGradient>
          <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>
            No users found
          </Text>
          <Text style={[styles.emptySubText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <>
          {searchQuery && renderSectionHeader('Search Results')}
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.usersList}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  recentSearchesSection: {
    marginBottom: 15,
  },
  recentsList: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  recentItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 8,
    borderRadius: 12,
    width: 70,
  },
  recentAvatarContainer: {
    marginBottom: 5,
  },
  recentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentUsername: {
    fontSize: 12,
    textAlign: 'center',
  },
  usersList: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarContainer: {
    marginRight: 15,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3e3e50',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  lastSeen: {
    fontSize: 12,
    color: '#8e8e93',
  },
  fullName: {
    fontSize: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  }
}); 