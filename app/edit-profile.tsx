import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Image, StatusBar, Alert, ActivityIndicator, Dimensions, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

      // First get basic profile data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, full_name, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching profile:', userError);
        throw userError;
      }

      // Then get extended profile data from users_data table
      const { data: userDataExtended, error: userDataError } = await supabase
        .from('users_data')
        .select('age')
        .eq('user_id', user.id)
        .single();

      if (userDataError && userDataError.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching user data:', userDataError);
        // Continue with partial data
      }

      // Populate the form with existing data
      if (userData) {
        setUsername(userData.username || '');
        setName(userData.full_name || user?.user_metadata?.full_name || '');
        setBio(userData.bio || '');
        setAvatarUrl(userData.avatar_url);
      }

      // Add age from extended data if available
      if (userDataExtended) {
        setAge(userDataExtended.age ? userDataExtended.age.toString() : '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Erro ao buscar perfil do utilizador:', error);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission denied', 'We need permission to access your photos');
        return;
      }
      
      // Use the deprecated MediaTypeOptions since that's what's available in the current version
      // This can be updated when expo-image-picker is updated to a version that uses MediaType
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.base64) {
          await uploadImage(asset.base64);
        } else {
          Alert.alert('Error', 'Could not load the image');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Error', 'Could not select the image');
    }
  };

  const uploadImage = async (base64Image: string) => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Create a simple file name without folders
      const fileName = `avatar_${Date.now()}.jpg`;
      
      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64Image);
      
      // Set public access for the file
      const { data, error } = await supabase.storage
        .from('useravatars')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('useravatars')
        .getPublicUrl(fileName);
      
      if (publicUrlData?.publicUrl) {
        setAvatarUrl(publicUrlData.publicUrl);
        
        // Update users table with new avatar URL (this is still correct since avatar_url is in users table)
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating profile with avatar URL:', updateError);
        }
        
        Alert.alert('Success', 'Profile image updated');
      }
    } catch (error: any) {
      console.error('Erro ao carregar imagem:', error);
      Alert.alert('Error', error.message || 'Failed to load image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Only validate age if provided
    if (age && isNaN(Number(age))) {
      Alert.alert('Error', 'Age must be a number');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsLoading(true);

      // Update user metadata in Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name.trim() }
      });

      if (authError) throw authError;

      // Update basic profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          full_name: name.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update extended profile in users_data table
      // First check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('users_data')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not a "not found" error
        throw checkError;
      }

      // Update or insert age in users_data table
      if (existingData) {
        // Update existing record
        const { error: updateDataError } = await supabase
          .from('users_data')
          .update({
            age: age ? parseInt(age) : null,
          })
          .eq('user_id', user.id);

        if (updateDataError) throw updateDataError;
      } else {
        // Insert new record
        const { error: insertDataError } = await supabase
          .from('users_data')
          .insert({
            user_id: user.id,
            age: age ? parseInt(age) : null,
          });

        if (insertDataError) throw insertDataError;
      }

      Alert.alert('Success', 'Profile updated successfully');
      // Use direct navigation instead of router.back()
      handleBackNavigation();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
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
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={handleBackNavigation}>
                <FontAwesome name="arrow-left" size={20} color="#fff" style={{marginRight: 10}} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: '#262c3a',
          },
          headerTintColor: '#fff',
          headerLeft: () => null,
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContainer}>
          {/* Profile Image */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/default-avatar.png')} 
                style={styles.profileImage} 
              />
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={pickImage}
                disabled={uploading}
              >
                <Ionicons name="camera" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarText}>
              {uploading ? 'Loading...' : 'Tap to change photo'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8e8ea0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#555"
                  selectionColor="#4a90e2"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="id-card-outline" size={20} color="#8e8ea0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#555"
                  selectionColor="#4a90e2"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#8e8ea0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  maxLength={3}
                  placeholderTextColor="#555"
                  selectionColor="#4a90e2"
                />
              </View>
            </View>

            {/* Bio field if needed */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="create-outline" size={20} color="#8e8ea0" style={[styles.inputIcon, {alignSelf: 'flex-start', paddingTop: 12}]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us a bit about yourself"
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#555"
                  selectionColor="#4a90e2"
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#4a90e2', '#357ad6']}
            style={styles.saveButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.saveButtonText}>SAVE</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBackNavigation}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262c3a',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  mainContainer: {
    padding: 16,
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#2d3446',
    paddingVertical: 24,
    borderRadius: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4a90e2',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#2d3446',
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2b',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3a3f4c',
  },
  inputIcon: {
    padding: 10,
    marginLeft: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 14,
    color: '#ffffff',
    height: 'auto',
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  footerContainer: {
    padding: 16,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#9da3b4',
    fontSize: 14,
  },
});
