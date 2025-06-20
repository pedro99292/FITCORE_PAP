import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  StatusBar,
  TextInput,
  Animated,
  Pressable
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router, useRouter, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define TypeScript types for our data
type Conversation = {
  id: string;
  participant1_id: string;
  participant2_id: string;
  participant_username: string;
  participant_avatar_url: string | null;
  updated_at: string;
  last_message: string | null;
  unread_count: number;
  last_message_time: string;
  last_message_read: boolean;
  last_message_sender_id: string | null;
  last_message_id: string | null;
  has_attachment: boolean;
  attachment_type: string | null;
};

export default function ChatScreen() {
  const { isDarkMode, colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchBarAnim] = useState(new Animated.Value(0));
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Function to fetch the current user ID
  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
    return data.user?.id;
  };

  // Function to format time
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    // For older messages, just display the date
    return date.toLocaleDateString();
  };

  // Function to fetch conversations
  const fetchConversations = async () => {
    try {
      const userId = await getCurrentUser();
      
      if (!userId) {
        setLoading(false);
        return;
      }

      console.log('Fetching conversations for user:', userId);

      // Get conversations where the current user is a participant
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
      }

      // Process each conversation to get the other participant's details and last message
      const processedConversations: Conversation[] = [];
      
      for (const conversation of conversationsData) {
        // Determine which participant is the other user (not current user)
        const otherParticipantId = 
          conversation.participant1_id === userId 
            ? conversation.participant2_id 
            : conversation.participant1_id;
        
        // Get the other participant's details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', otherParticipantId)
          .single();
          
        if (userError) {
          console.error('Error fetching user data:', userError);
          continue;
        }
        
        // Get the last message in this conversation
        const { data: lastMessageData, error: messageError } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id, read, attachments')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (messageError) {
          console.error('Error fetching last message:', messageError);
          continue;
        }
        
        // Get count of unread messages where the current user is not the sender
        const { count: unreadCount, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('read', false)
          .neq('sender_id', userId);
          
        if (countError) {
          console.error('Error counting unread messages:', countError);
        }
        
        const lastMessage = lastMessageData?.[0];
        
        processedConversations.push({
          id: conversation.id,
          participant1_id: conversation.participant1_id,
          participant2_id: conversation.participant2_id,
          participant_username: userData?.username || 'Unknown',
          participant_avatar_url: userData?.avatar_url,
          updated_at: conversation.updated_at,
          last_message: lastMessage?.content || null,
          unread_count: unreadCount || 0,
          last_message_time: lastMessage?.created_at 
            ? formatTimeAgo(lastMessage.created_at) 
            : '',
          last_message_read: lastMessage?.read || false,
          last_message_sender_id: lastMessage?.sender_id || null,
          last_message_id: lastMessage?.id || null,
          has_attachment: lastMessage?.attachments?.length > 0 || false,
          attachment_type: lastMessage?.attachments?.[0]?.type || null
        });
      }
      
      console.log(`Processed ${processedConversations.length} conversations, refreshing UI`);
      setConversations(processedConversations);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch conversations on component mount and set up real-time subscriptions
  useEffect(() => {
    fetchConversations();
    
    // Set up real-time subscriptions for new messages
    const setupMessageSubscription = async () => {
      const userId = await getCurrentUser();
      
      if (!userId) return;
      
      console.log('Setting up real-time subscriptions for user:', userId);
      
      // Create a broader subscription for all relevant changes
      const subscription = supabase
        .channel('chats-list-updates')
        // Subscribe to new messages (sent to or from the user)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, async (payload) => {
          console.log('New message inserted:', payload);
          // Immediately update conversations to show the new message
          await fetchConversations();
        })
        // Subscribe to message updates (read status changes)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        }, async (payload) => {
          console.log('Message updated:', payload);
          await fetchConversations();
        })
        // Subscribe to conversation updates
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        }, async (payload) => {
          console.log('Conversation updated:', payload);
          await fetchConversations();
        })
        .subscribe((status) => {
          console.log(`Real-time subscription status: ${status}`);
        });
      
      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up real-time subscriptions');
        supabase.removeChannel(subscription);
      };
    };
    
    setupMessageSubscription();
  }, []);
  
  // Add useFocusEffect to refresh conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Chat list screen focused - refreshing conversations');
      fetchConversations();
      
      return () => {
        console.log('Chat list screen unfocused');
      };
    }, [])
  );
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };
  
  // Toggle search bar focus animation
  const toggleSearchFocus = (focused: boolean) => {
    setIsSearchFocused(focused);
    Animated.spring(searchBarAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
    }).start();
  };

  // Get message preview text based on message type
  const getMessagePreview = (conversation: Conversation): string => {
    if (conversation.has_attachment) {
      if (conversation.attachment_type?.startsWith('image')) {
        return '📷 Image';
      } else if (conversation.attachment_type?.startsWith('video')) {
        return '🎥 Video';
      } else if (conversation.attachment_type?.startsWith('audio')) {
        return '🎵 Audio';
      } else if (conversation.attachment_type) {
        return '📎 Attachment';
      }
    }
    
    return conversation.last_message || 'No messages yet';
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(conversation => 
        conversation.participant_username
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : conversations;
  
  // Navigate to conversation
  const goToConversation = (conversationId: string, otherUserId: string, username: string) => {
    router.push({
      pathname: `/chat/conversation/[id]`,
      params: { 
        id: conversationId, 
        userId: otherUserId,
        username: username
      }
    });
  };

  // Navigate to new message screen
  const goToNewMessage = () => {
    router.push('/chat/new-message');
  };
  
  // Render item for FlatList with animation
  const renderConversationItem = ({ item, index }: { item: Conversation; index: number }) => {
    // Determine which participant is the other user (not current user)
    const otherUserId = 
      item.participant1_id === currentUserId 
        ? item.participant2_id 
        : item.participant1_id;
    
    // Check if the last message was sent by the current user
    const isLastMessageFromCurrentUser = item.last_message_sender_id === currentUserId;
    
    return (
      <Animated.View
        style={{
          opacity: 1,
          transform: [{ 
            translateY: 0
          }],
        }}
      >
        <Pressable 
          style={({ pressed }) => [
            styles.conversationItem, 
            { 
              backgroundColor: isDarkMode ? '#2c2c3e' : '#ffffff',
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }
          ]}
          onPress={() => goToConversation(item.id, otherUserId, item.participant_username)}
          android_ripple={{ color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
          <View style={styles.avatarContainer}>
            {item.participant_avatar_url ? (
              <Image 
                source={{ uri: item.participant_avatar_url }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {item.participant_username.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.username, { color: isDarkMode ? '#fff' : '#000' }]}>
                {item.participant_username}
              </Text>
              <Text style={[styles.timeStamp, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                {item.last_message_time}
              </Text>
            </View>
            
            <View style={styles.messagePreview}>
              <View style={styles.messageTextContainer}>
                {isLastMessageFromCurrentUser && (
                  <View style={styles.messageStatus}>
                    {item.last_message_read ? (
                      <Ionicons name="checkmark-done" size={14} color={isDarkMode ? '#64d2ff' : '#0084ff'} />
                    ) : (
                      <Ionicons name="checkmark" size={14} color={isDarkMode ? '#8e8e93' : '#888'} />
                    )}
                  </View>
                )}
                <Text 
                  style={[
                    styles.lastMessage, 
                    { color: isDarkMode ? '#8e8e93' : '#666' },
                    item.unread_count > 0 && { fontWeight: '600', color: isDarkMode ? '#fff' : '#000' }
                  ]}
                  numberOfLines={1}
                >
                  {getMessagePreview(item)}
                </Text>
              </View>
              
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };
  
  // Loading placeholder with improved animation
  const renderLoadingPlaceholder = () => (
    <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
        Loading conversations...
      </Text>
    </View>
  );
  
  // Empty conversations placeholder with improved design
  const renderEmptyPlaceholder = () => (
    <View style={[styles.emptyContainer, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}>
      <View style={styles.emptyImageContainer}>
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.emptyGradient}
        >
          <Feather name="message-circle" size={60} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptySubtext, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
        Start chatting with your friends
      </Text>
      <TouchableOpacity 
        style={styles.newMessageButton}
        onPress={goToNewMessage}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.newMessageButtonText}>New Message</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Search bar animation values
  const searchBarWidth = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '100%']
  });
  
  const searchBarBorderRadius = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 12]
  });
  
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Adding Stack.Screen with back button */}
      <Stack.Screen
        options={{
          headerTitle: 'Messages',
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
          headerRight: () => (
            <TouchableOpacity 
              style={[styles.newChatButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={goToNewMessage}
            >
              <Feather name="edit" size={22} color={isDarkMode ? "#fff" : "#333"} />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Search Bar with Animation */}
      <View style={styles.searchContainer}>
        <Animated.View 
          style={[
            styles.searchBar, 
            { 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              width: searchBarWidth,
              borderRadius: searchBarBorderRadius,
              borderColor: isSearchFocused ? colors.primary : 'transparent',
              borderWidth: 1,
            }
          ]}
        >
          <Feather name="search" size={18} color={isDarkMode ? "#8e8e93" : "#666"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#000' }]}
            placeholder="Search conversations..."
            placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => toggleSearchFocus(true)}
            onBlur={() => toggleSearchFocus(false)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={isDarkMode ? "#8e8e93" : "#666"} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
      
      {/* Conversation List */}
      {loading ? (
        renderLoadingPlaceholder()
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyPlaceholder}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      
      {/* Floating Action Button for New Message */}
      <TouchableOpacity 
        style={[styles.fab]}
        onPress={goToNewMessage}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.fabGradient}
        >
          <Feather name="message-square" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    paddingTop: 15,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 100,
  },
  conversationItem: {
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
    justifyContent: 'center',
    alignItems: 'center',
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
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  timeStamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageStatus: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  emptyGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },
  newMessageButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  newMessageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 