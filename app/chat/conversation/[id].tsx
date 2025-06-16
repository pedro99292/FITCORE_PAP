import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  Animated,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';

// Define TypeScript types for our data
type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachments?: {
    url: string;
    type: string;
  }[] | null;
};

export default function ConversationScreen() {
  const { isDarkMode, colors } = useTheme();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const otherUserId = params.userId as string;
  const otherUsername = params.username as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{uri: string, type: string} | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  
  const flatListRef = useRef<FlatList>(null);
  const realtimeSubscription = useRef<RealtimeChannel | null>(null);
  const windowWidth = Dimensions.get('window').width;
  const typingTimeout = useRef<number | null>(null);
  
  // Format date for messages
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
      
    const isYesterday = 
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isToday) {
      return `${hours}:${minutes}`;
    } else if (isYesterday) {
      return `Yesterday ${hours}:${minutes}`;
    } else {
      return `${date.toLocaleDateString()} ${hours}:${minutes}`;
    }
  };

  // Run entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Toggle attachment options animation
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
    Animated.timing(optionsAnim, {
      toValue: showAttachmentOptions ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  
  // Get current user and set up real-time subscription
  useEffect(() => {
    let isMounted = true;
    
    const setup = async () => {
      try {
        // Get current user
        const { data } = await supabase.auth.getUser();
        if (isMounted) {
          setCurrentUserId(data.user?.id || null);
          
          // Get avatar for the other user
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', otherUserId)
            .single();
            
          if (!userError && userData && isMounted) {
            setOtherUserAvatar(userData.avatar_url);
          }
        }
        
        // Fetch messages
        await fetchMessages();
        
        // Set up real-time subscription
        if (data.user?.id) {
          setupRealtimeSubscription(data.user.id);
        }
        
        // Run animation after loading
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error in setup:', error);
      }
    };
    
    setup();
    
    return () => {
      isMounted = false;
      // Clean up subscription
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
      }
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [conversationId]);
  
  // Simulate typing
  const handleTyping = () => {
    // In a real implementation, you would broadcast typing status via Supabase
    // For now, we'll just simulate it randomly
    if (Math.random() > 0.7) {
      setIsTyping(true);
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };
  
  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      if (messagesData) {
        setMessages(messagesData);
        
        // Mark messages as read if they're not from the current user
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId);
      
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  };
  
  // Setup real-time subscription
  const setupRealtimeSubscription = (userId: string) => {
    // Unsubscribe from existing subscription if any
    if (realtimeSubscription.current) {
      realtimeSubscription.current.unsubscribe();
    }
    
    // Subscribe to new messages
    realtimeSubscription.current = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          setMessages((currentMessages) => [...currentMessages, newMessage]);
          
          // If the message is from the other user, mark it as read
          if (newMessage.sender_id !== userId) {
            markMessageAsRead(newMessage.id);
            setIsTyping(false);
            
            // Play sound here if needed
          } else {
            // Message sent by current user
          }
          
          // Scroll to the new message
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      )
      .subscribe();
    
    // Additionally, subscribe to typing indicators
    // This would be a real implementation if backend supported it
  };
  
  // Mark a single message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (error) {
        console.error('Error marking message as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  };
  
  // Animate new message send
  const animateMessageSend = useCallback(() => {
    const animation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
    
    animation.start();
  }, [scaleAnim]);
  
  // Send a message
  const sendMessage = async () => {
    if ((!messageText.trim() && !attachment) || !currentUserId) return;
    
    try {
      setSending(true);
      animateMessageSend();
      
      // Create message object
      const newMessage: any = {
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        read: false
      };
      
      // If there's an attachment, upload it
      if (attachment) {
        try {
          // Generate a unique file name
          const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${attachment.uri.split('.').pop()}`;
          
          // Read file as base64
          const fileContent = await FileSystem.readAsStringAsync(attachment.uri, { encoding: FileSystem.EncodingType.Base64 });
          
          // Convert base64 to ArrayBuffer
          const arrayBuffer = decode(fileContent);          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('chat-attachments')
            .upload(fileName, arrayBuffer, {
              contentType: attachment.type,
              upsert: true
            });
            
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL
          const { data: urlData } = supabase
            .storage
            .from('chat-attachments')
            .getPublicUrl(fileName);
            
          // Add attachment to message
          newMessage.attachments = [{
            url: urlData.publicUrl,
            type: attachment.type
          }];
        } catch (e) {
          console.error('Error uploading file:', e);
          // Continue sending the message without the attachment
        }
      }
      
      // Insert message into database
      const { error } = await supabase
        .from('messages')
        .insert(newMessage);
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      // Clear input
      setMessageText('');
      setAttachment(null);
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Pick an image from the library
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          type: asset.type === 'image' ? 'image/jpeg' : 'video/mp4'
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  // Take a photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('We need camera permissions to take a photo');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };
  
  // Format date header
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };
  
  // Render a message item
  const renderMessageItem = ({ item, index }: { item: Message, index: number }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: isLastMessage ? slideAnim : 0 },
              { scale: isLastMessage ? scaleAnim : 1 }
            ]
          }
        ]}
      >
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            {otherUserAvatar ? (
              <Image 
                source={{ uri: otherUserAvatar }} 
                style={styles.avatar} 
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {otherUsername.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>
        )}
        
        <Pressable
          style={({ pressed }) => [
            styles.messageBubble,
            isCurrentUser 
              ? [styles.currentUserBubble, { 
                backgroundColor: pressed ? 
                  'rgba(74, 144, 226, 0.9)' : 
                  colors.primary 
              }]
              : [styles.otherUserBubble, { 
                backgroundColor: pressed ? 
                  isDarkMode ? 'rgba(62, 62, 80, 0.9)' : 'rgba(224, 224, 224, 0.9)' : 
                  isDarkMode ? '#3e3e50' : '#e0e0e0' 
              }]
          ]}
          android_ripple={{ 
            color: isCurrentUser ? 
              'rgba(255,255,255,0.1)' : 
              isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
          }}
        >
          {/* Render attachments if any */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentContainer}>
              {item.attachments.map((att, index) => (
                <Pressable 
                  key={index} 
                  style={({ pressed }) => [
                    styles.imageContainer,
                    { opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  {att.type.startsWith('image') ? (
                    <Image 
                      source={{ uri: att.url }} 
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  ) : att.type.startsWith('video') ? (
                    <View style={styles.videoPlaceholder}>
                      <Feather name="video" size={24} color="#fff" />
                      <Text style={styles.videoText}>Video</Text>
                    </View>
                  ) : (
                    <View style={styles.filePlaceholder}>
                      <Feather name="file" size={24} color="#fff" />
                      <Text style={styles.fileText}>File</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
          
          {/* Render message text */}
          {item.content && (
            <Text style={[
              styles.messageText,
              { color: isCurrentUser ? '#fff' : isDarkMode ? '#fff' : '#000' }
            ]}>
              {item.content}
            </Text>
          )}
          
          {/* Render time and read status */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }
            ]}>
              {formatMessageTime(item.created_at)}
            </Text>
            
            {isCurrentUser && (
              <Ionicons 
                name={item.read ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={item.read ? "#4CD964" : "rgba(255,255,255,0.7)"} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };
  
  // Render a date header
  const renderDateHeader = (date: string) => (
    <View style={styles.dateHeaderContainer}>
      <View style={[styles.dateHeader, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Text style={[styles.dateHeaderText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {formatDateHeader(date)}
        </Text>
      </View>
    </View>
  );
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={[styles.typingBubble, { backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0' }]}>
          <View style={styles.typingDots}>
            <Animated.View 
              style={[
                styles.typingDot,
                {
                  backgroundColor: isDarkMode ? '#8e8e93' : '#666',
                  opacity: fadeAnim
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.typingDot,
                {
                  backgroundColor: isDarkMode ? '#8e8e93' : '#666',
                  opacity: fadeAnim
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.typingDot,
                {
                  backgroundColor: isDarkMode ? '#8e8e93' : '#666',
                  opacity: fadeAnim
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  // Render attachment options
  const renderAttachmentOptions = () => {
    if (!showAttachmentOptions) return null;

    return (
      <Animated.View
        style={[
          styles.attachmentOptionsContainer,
          {
            opacity: optionsAnim,
            transform: [
              { scale: optionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ]
          }
        ]}
      >
        <BlurView intensity={isDarkMode ? 30 : 50} style={styles.blurOverlay} tint={isDarkMode ? "dark" : "light"}>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
              <View style={[styles.optionIconContainer, {backgroundColor: '#4A90E2'}]}>
                <Feather name="image" size={24} color="#fff" />
              </View>
              <Text style={[styles.optionText, {color: isDarkMode ? '#fff' : '#000'}]}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <View style={[styles.optionIconContainer, {backgroundColor: '#4CD964'}]}>
                <Feather name="camera" size={24} color="#fff" />
              </View>
              <Text style={[styles.optionText, {color: isDarkMode ? '#fff' : '#000'}]}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton}>
              <View style={[styles.optionIconContainer, {backgroundColor: '#FF9500'}]}>
                <Feather name="file" size={24} color="#fff" />
              </View>
              <Text style={[styles.optionText, {color: isDarkMode ? '#fff' : '#000'}]}>Document</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.cancelButton, {backgroundColor: isDarkMode ? '#3e3e50' : '#e0e0e0'}]}
            onPress={toggleAttachmentOptions}
          >
            <Text style={[styles.cancelText, {color: isDarkMode ? '#fff' : '#000'}]}>Cancel</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    );
  };
  
  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowAttachmentOptions(false);
    }}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f5f5' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        
        <Stack.Screen
          options={{
            headerTitle: () => (
              <TouchableOpacity style={styles.headerTitleContainer}>
                <View style={styles.headerAvatarContainer}>
                  {otherUserAvatar ? (
                    <Image 
                      source={{ uri: otherUserAvatar }} 
                      style={styles.headerAvatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.primary]}
                      style={styles.headerAvatar}
                    >
                      <Text style={styles.headerAvatarText}>
                        {otherUsername.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
                <View>
                  <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 17, fontWeight: '600' }}>
                    {otherUsername}
                  </Text>
                  {isTyping && (
                    <Text style={{ color: isDarkMode ? '#8e8e93' : '#666', fontSize: 12 }}>
                      typing...
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: isDarkMode ? '#2b2b45' : '#f5f5f5'
            },
            headerShadowVisible: false,
            headerTintColor: isDarkMode ? '#fff' : '#000',
            headerBackTitle: 'Back',
            headerBackVisible: true,
            headerLeft: ({ canGoBack }) => 
              canGoBack ? (
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                  <Feather name="arrow-left" size={24} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
              ) : undefined,
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: 10 }}>
                <Feather name="more-vertical" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            ),
          }}
        />
        
        {/* Messages List */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <LinearGradient
                    colors={[colors.primary, colors.primary]}
                    style={styles.emptyImage}
                  >
                    <Feather name="message-circle" size={40} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#000' }]}>
                    No messages yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    Send a message to start the conversation
                  </Text>
                </View>
              }
            />
          )}
          
          {/* Typing indicator */}
          {renderTypingIndicator()}
        </View>
        
        {/* Input Area */}
        <Animated.View 
          style={[
            styles.inputContainer, 
            { 
              backgroundColor: isDarkMode ? '#2c2c3e' : '#fff',
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Attachment Preview */}
          {attachment && (
            <View style={styles.attachmentPreview}>
              <Image 
                source={{ uri: attachment.uri }}
                style={styles.attachmentPreviewImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeAttachmentButton}
                onPress={() => setAttachment(null)}
              >
                <Feather name="x" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            {/* Attachment Button */}
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={toggleAttachmentOptions}
            >
              <Feather name="plus" size={24} color={isDarkMode ? "#8e8e93" : "#666"} />
            </TouchableOpacity>
            
            {/* Text Input */}
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: isDarkMode ? '#fff' : '#000'
              }]}
              placeholder="Type a message..."
              placeholderTextColor={isDarkMode ? "#8e8e93" : "#666"}
              value={messageText}
              onChangeText={text => {
                setMessageText(text);
                handleTyping();
              }}
              multiline
              maxLength={1000}
            />
            
            {/* Emoji button */}
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => setShowEmoji(!showEmoji)}
            >
              <Feather name="smile" size={24} color={isDarkMode ? "#8e8e93" : "#666"} />
            </TouchableOpacity>
            
            {/* Send Button */}
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: colors.primary },
                (!messageText.trim() && !attachment) && { opacity: 0.5 }
              ]}
              onPress={sendMessage}
              disabled={(!messageText.trim() && !attachment) || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Attachment Options Panel */}
        {renderAttachmentOptions()}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    marginRight: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  avatarContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  typingContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  typingBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8e8e93',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateHeader: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  attachmentPreview: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  attachmentPreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 5,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3d3d3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    marginTop: 5,
  },
  filePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5856D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileText: {
    color: '#fff',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  attachmentOptionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  blurOverlay: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  optionButton: {
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  }
}); 