import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Platform } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const { width: screenWidth } = Dimensions.get('window');

const DEFAULT_USERNAME = 'user_fitcore';

type Post = {
  id: string;
  username: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
};

export default function SocialScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      username: 'joao_fitness',
      content: 'Acabei de completar meu treino de hoje! 💪 Novo recorde pessoal no supino: 100kg x 5!',
      likes: 24,
      comments: 3,
      timeAgo: '5m',
      isLiked: false,
    },
    {
      id: '2',
      username: 'maria_strong',
      content: 'Dica do dia: Não se esqueça de se hidratar durante os treinos! 🚰 #FitLife #Saúde',
      likes: 15,
      comments: 5,
      timeAgo: '15m',
      isLiked: true,
    },
    {
      id: '3',
      username: 'carlos_runner',
      content: 'Meta de hoje alcançada: 10km em 45 minutos! 🏃‍♂️ Quem mais está treinando para a maratona?',
      likes: 32,
      comments: 8,
      timeAgo: '1h',
      isLiked: false,
    },
  ]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked,
        };
      }
      return post;
    }));
  };

  const handlePost = () => {
    if (!newPost.trim()) return;

    const newPostObj: Post = {
      id: Date.now().toString(),
      username: DEFAULT_USERNAME,
      content: newPost,
      likes: 0,
      comments: 0,
      timeAgo: 'agora',
      isLiked: false,
    };

    setPosts([newPostObj, ...posts]);
    setNewPost('');
  };

  const handleAddFriends = () => {
    // This would open the add friends screen or modal
    console.log('Open add friends screen');
  };

  return (
    <View style={styles.container}>
      {/* Search and Add Friends Section */}
      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Procurar amigos..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addFriendsButton}
          onPress={handleAddFriends}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <ScrollView 
        style={styles.feed} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
      >
        {posts.map(post => (
          <View key={post.id} style={styles.post}>
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <FontAwesome name="user-circle" size={40} color="#fff" />
                </View>
                <View>
                  <Text style={styles.username}>{post.username}</Text>
                  <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(post.id)}
              >
                <FontAwesome 
                  name={post.isLiked ? "heart" : "heart-o"} 
                  size={24} 
                  color={post.isLiked ? "#ff4757" : "#fff"} 
                />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="comment-o" size={24} color="#fff" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="share" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* New Post Input (Fixed at bottom) */}
      <View style={styles.bottomPostContainer}>
        <View style={styles.newPostContainer}>
          <View style={styles.userAvatar}>
            <FontAwesome name="user-circle" size={40} color="#fff" />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Em que estás a pensar?"
              placeholderTextColor="#8e8e93"
              value={newPost}
              onChangeText={setNewPost}
              multiline
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim()}
        >
          <Text style={styles.postButtonText}>Publicar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e50',
    zIndex: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e3e50',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 40,
  },
  addFriendsButton: {
    backgroundColor: '#4a90e2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 140, // Add space at the bottom to prevent content from being hidden behind the post container
  },
  bottomPostContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c2c3e',
    borderTopWidth: 1,
    borderTopColor: '#3e3e50',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Add padding for iOS devices with home indicator
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  newPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 0,
  },
  userAvatar: {
    marginRight: 15,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#3e3e50',
    borderRadius: 20,
    padding: 12,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  postButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  post: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e50',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeAgo: {
    color: '#8e8e93',
    fontSize: 14,
  },
  postContent: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 25,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#3e3e50',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
  },
  bottomPadding: {
    height: 20,
  },
}); 