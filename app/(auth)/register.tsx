import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/utils/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RegisterScreen() {
  const { colors, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const logoScale = useSharedValue(0.9);
  const formOpacity = useSharedValue(0);
  
  // Animate elements on component mount
  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    formOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, []);
  
  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }]
    };
  });
  
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: (1 - formOpacity.value) * 20 }]
    };
  });

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As palavras-passe não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);

      // Register the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Now the user is registered, they need to confirm their email
        Alert.alert(
          'Registo Bem-sucedido',
          'Por favor, verifique o seu email para confirmar o registo.'
        );
        
        // Navigate to login page
        router.replace('/login');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha no registo');
      console.error('Registration error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.headerContainer, logoAnimatedStyle]}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>FITCORE</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>Inicie a Sua Jornada</Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formAnimatedStyle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Criar Conta</Text>
          
          <View style={[
            styles.inputContainer, 
            isNameFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="person-outline" size={20} color={isNameFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nome Completo"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
            />
          </View>

          <View style={[
            styles.inputContainer, 
            isEmailFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="mail-outline" size={20} color={isEmailFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </View>

          <View style={[
            styles.inputContainer,
            isPasswordFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={isPasswordFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Palavra-passe"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <View style={[
            styles.inputContainer,
            isConfirmPasswordFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={isConfirmPasswordFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirmar Palavra-passe"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              onFocus={() => setIsConfirmPasswordFocused(true)}
              onBlur={() => setIsConfirmPasswordFocused(false)}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: 'rgba(255,255,255,0.7)' }]}>
              Ao registar-se, concorda com os nossos <Text style={[styles.termsLink, { color: colors.primary }]}>Termos de Serviço</Text> e <Text style={[styles.termsLink, { color: colors.primary }]}>Política de Privacidade</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}>
            <LinearGradient
              colors={['#4a90e2', '#3570b2']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientButton}>
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>CRIAR CONTA</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: 'rgba(255,255,255,0.7)' }]}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => {
              const path = '/login';
              router.push(path as any);
            }}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 25,
    backgroundColor: '#3e3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 60,
  },
  inputContainerFocused: {
    borderColor: '#4a90e2',
    borderWidth: 1.5,
  },
  inputIcon: {
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 60,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    padding: 15,
  },
  termsContainer: {
    marginBottom: 25,
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  registerButton: {
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
}); 