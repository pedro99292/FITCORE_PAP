import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

const { width: screenWidth } = Dimensions.get('window');

// Default username to use instead of auth
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

  return (
    <View style={styles.container}>
      {/* New Post Input */}
      <View style={styles.newPostContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="O que você está pensando?"
            placeholderTextColor="#666"
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
        </View>
        <TouchableOpacity 
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={!newPost.trim()}
        >
          <Text style={styles.postButtonText}>Postar</Text>
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <ScrollView style={styles.feed}>
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
                <FontAwesome name="ellipsis-h" size={20} color="#fff" />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  newPostContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e50',
  },
  inputContainer: {
    backgroundColor: '#3e3e50',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
  },
  postButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  feed: {
    flex: 1,
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
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 10,
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
    gap: 20,
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
}); 