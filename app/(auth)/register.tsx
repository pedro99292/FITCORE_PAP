import React, { useState, useEffect, useMemo } from 'react';
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

// Password validation utilities
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: '8-16 characters',
    test: (password: string) => password.length >= 8 && password.length <= 16,
  },
  {
    id: 'uppercase',
    label: 'At least 1 uppercase letter (A-Z)',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'At least 1 lowercase letter (a-z)',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'At least 1 number (0-9)',
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'At least 1 special character (!@#$%^&*()+-=[]{}|;:,.<>?)',
    test: (password: string) => /[!@#$%^&*()+=[\]{}|;:,.<>?-]/.test(password),
  },
];

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  const passedRequirements = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  
  if (passedRequirements === 0) {
    return { score: 0, label: 'Too Weak', color: '#FF4444' };
  } else if (passedRequirements <= 2) {
    return { score: 25, label: 'Weak', color: '#FF6B6B' };
  } else if (passedRequirements <= 3) {
    return { score: 50, label: 'Fair', color: '#FFB366' };
  } else if (passedRequirements <= 4) {
    return { score: 75, label: 'Good', color: '#4ECDC4' };
  } else {
    return { score: 100, label: 'Strong', color: '#45B7D1' };
  }
};

// Password Requirements Component
const PasswordRequirements: React.FC<{ password: string; visible: boolean }> = ({ password, visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.passwordRequirements}>
      <Text style={styles.requirementsTitle}>Password Requirements:</Text>
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const isValid = requirement.test(password);
        return (
          <View key={requirement.id} style={styles.requirementItem}>
            <Ionicons
              name={isValid ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isValid ? '#4CAF50' : '#FF4444'}
              style={styles.requirementIcon}
            />
            <Text style={[
              styles.requirementText,
              { color: isValid ? '#4CAF50' : 'rgba(255,255,255,0.6)' }
            ]}>
              {requirement.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Password Strength Meter Component
const PasswordStrengthMeter: React.FC<{ password: string; visible: boolean }> = ({ password, visible }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  
  if (!visible) return null;

  return (
    <View style={styles.strengthMeter}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Password Strength:</Text>
        <Text style={[styles.strengthValue, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>
      <View style={styles.strengthBar}>
        <View style={styles.strengthBarBackground}>
          <Animated.View
            style={[
              styles.strengthBarFill,
              {
                width: `${strength.score}%`,
                backgroundColor: strength.color,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default function RegisterScreen() {
  const { colors, isDarkMode } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
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

  // Validate password requirements
  const isPasswordValid = useMemo(() => {
    return PASSWORD_REQUIREMENTS.every(req => req.test(password));
  }, [password]);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Password does not meet all requirements');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);

      // Register the user with Supabase with email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
          emailRedirectTo: 'https://vhvoiekejcawjgwqimxy.supabase.co/auth/v1/callback',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Create the user profile in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username: username.trim(),
            full_name: username.trim(), // Use username as default full name
            bio: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Database error saving new user:', profileError);
          throw new Error('Database error saving new user');
        }

        // Now the user is registered, they need to confirm their email
        Alert.alert(
          'Registration Successful',
          'Please check your email to confirm registration. You can only access the application after confirming your email.'
        );
        
        // Navigate to login page
        router.replace('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error.message);
      
      // Provide more specific error messages
      let errorMessage = 'Registration failed';
      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else if (error.message.includes('Database error saving new user')) {
          errorMessage = 'Failed to create user profile. Please try again or contact support if the issue persists.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Error', errorMessage);
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
            source={require('@/assets/images/logo2.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.7)' }]}>Start Your Journey</Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formAnimatedStyle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Create Account</Text>
          
          <View style={[
            styles.inputContainer, 
            isUsernameFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="person-outline" size={20} color={isUsernameFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Username"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
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
              placeholder="Password"
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

          {/* Password Strength Meter */}
          <PasswordStrengthMeter 
            password={password} 
            visible={password.length > 0} 
          />

          {/* Password Requirements */}
          <PasswordRequirements 
            password={password} 
            visible={isPasswordFocused || (password.length > 0 && !isPasswordValid)} 
          />

          <View style={[
            styles.inputContainer,
            isConfirmPasswordFocused && styles.inputContainerFocused,
            { borderColor: colors.border }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={isConfirmPasswordFocused ? colors.primary : 'rgba(255,255,255,0.5)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm Password"
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
              By registering, you agree to our <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text> and <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
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
                <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: 'rgba(255,255,255,0.7)' }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              const path = '/login';
              router.push(path as any);
            }}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
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
    width: 220,
    height: 220,
    marginBottom: 1,
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
  // Password Requirements Styles
  passwordRequirements: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  // Password Strength Meter Styles
  strengthMeter: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  strengthBarBackground: {
    width: '100%',
    height: '100%',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 4,
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