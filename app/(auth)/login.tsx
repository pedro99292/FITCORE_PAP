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

export default function LoginScreen() {
  const { colors, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, insira email e palavra-passe');
      return;
    }

    try {
      setIsLoading(true);

      // Sign in the user with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          Alert.alert(
            'Email não verificado',
            'Por favor, verifique o seu email para confirmar o registo antes de fazer login.'
          );
          setIsLoading(false);
          return;
        }

        // Email is verified, login successful, navigate to the main app
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Login falhou';
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email ou palavra-passe inválidos';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Por favor, verifique o seu email para confirmar o registo.';
      }
      
      Alert.alert('Erro de Login', errorMessage);
      console.error('Login error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira o seu endereço de email');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      Alert.alert(
        'Email de Recuperação Enviado',
        'Se o seu email existir no nosso sistema, receberá instruções para redefinir a sua palavra-passe.'
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao enviar email de recuperação');
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
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>Alcance os Seus Objetivos</Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formAnimatedStyle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Login</Text>
          
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

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Esqueceu a Palavra-passe?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}>
            <LinearGradient
              colors={['#4a90e2', '#3570b2']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientButton}>
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>ENTRAR</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: 'rgba(255,255,255,0.7)' }]}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => {
              const path = '/register';
              router.push(path as any);
            }}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Registar</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
}); 