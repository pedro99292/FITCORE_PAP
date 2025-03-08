import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  // Navigation handler to return to profile screen
  const handleBackNavigation = () => {
    router.push('/(tabs)/profile');
  };

  // Fetch user profile data when component mounts
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setIsFetchingProfile(false);
    }
  }, [user]);

  // Fetch existing user data from the database
  const fetchUserProfile = async () => {
    try {
      if (!user) {
        setIsFetchingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('username, full_name, age, bio')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else if (data) {
        // Populate the form with existing data
        setUsername(data.username || '');
        setName(data.full_name || user?.user_metadata?.full_name || '');
        setAge(data.age ? data.age.toString() : '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do utilizador:', error);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const handleSave = async () => {
    // Only validate age if provided
    if (age && isNaN(Number(age))) {
      Alert.alert('Erro', 'A idade deve ser um número');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Utilizador não autenticado');
      return;
    }

    try {
      setIsLoading(true);

      // Update user metadata in Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name.trim() }
      });

      if (authError) throw authError;

      // Update profile in custom users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          full_name: name.trim(),
          age: age ? parseInt(age) : null,
          bio: bio.trim(),
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      // Use direct navigation instead of router.back()
      handleBackNavigation();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', error.message || 'Falha ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while fetching profile data
  if (isFetchingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>A carregar perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Stack.Screen 
        options={{
          title: 'Editar Perfil',
          headerStyle: {
            backgroundColor: '#2c2c3e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBackNavigation}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={require('@/assets/images/default-avatar.png')} 
            style={styles.profileImage} 
          />
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>
              Alterar Foto
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome de Utilizador</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="O seu nome de utilizador"
              placeholderTextColor="#888"
              selectionColor="#4a90e2"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="O seu nome completo"
              placeholderTextColor="#888"
              selectionColor="#4a90e2"
            />
          </View>
          
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Idade</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="A sua idade"
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor="#888"
              selectionColor="#4a90e2"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Biografia</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Fale-nos sobre si"
              multiline
              numberOfLines={4}
              placeholderTextColor="#888"
              selectionColor="#4a90e2"
            />
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.saveButton, isLoading && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#4a90e2', '#3570b2']}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.gradientButton}>
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>GUARDAR</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c3e',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4a90e2',
  },
  changePhotoButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  changePhotoText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#3e3e50',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#2a2a38',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    margin: 16,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
