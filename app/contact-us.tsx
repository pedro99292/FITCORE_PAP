import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import * as MailComposer from 'expo-mail-composer';

export default function ContactUsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackToSettings = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Check if mail composer is available
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        setLoading(false);
        Alert.alert(
          'Email Not Available', 
          'No email app is configured on this device. Please set up an email account in your device settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Compose the email body with user information
      const emailBody = `
From: ${name}

${message}

---
Sent from FITCORE App
      `.trim();

      // Open mail composer
      const result = await MailComposer.composeAsync({
        recipients: ['fitcore.service@gmail.com'],
        subject: subject,
        body: emailBody,
        isHtml: false,
      });

      setLoading(false);

      if (result.status === 'sent') {
        Alert.alert(
          'Message Sent!', 
          'Thank you for contacting us. We\'ll get back to you as soon as possible.',
          [
            {
              text: 'OK',
              onPress: () => {
                setName('');
                setSubject('');
                setMessage('');
              }
            }
          ]
        );
      } else if (result.status === 'saved') {
        Alert.alert(
          'Message Saved!', 
          'Your message has been saved to drafts. You can send it later from your email app.',
          [
            {
              text: 'OK',
              onPress: () => {
                setName('');
                setSubject('');
                setMessage('');
              }
            }
          ]
        );
      } else {
        // User cancelled or dismissed
        Alert.alert(
          'Message Cancelled', 
          'Your message was not sent. You can try again anytime.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('Email composition error:', error);
      Alert.alert(
        'Error', 
        'There was an error opening the email composer. Please try again or contact us directly at fitcore.service@gmail.com',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Contact Us',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBackToSettings}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              Contact Us
            </Text>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <FontAwesome name="envelope" size={60} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Get in Touch</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.background }]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.text + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.background }]}
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this about?"
              placeholderTextColor={colors.text + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Message</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.background }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us more details..."
              placeholderTextColor={colors.text + '80'}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC']}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.submitGradient}
            >
              {loading ? (
                <Text style={styles.submitText}>Sending...</Text>
              ) : (
                <>
                  <FontAwesome name="send" size={16} color="#fff" style={styles.submitIcon} />
                  <Text style={styles.submitText}>Send Message</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.contactInfo}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Other Ways to Reach Us</Text>
          
          <View style={[styles.contactItem, { backgroundColor: colors.surface }]}>
            <FontAwesome name="envelope" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>fitcore.service@gmail.com</Text>
          </View>

          <View style={[styles.contactItem, { backgroundColor: colors.surface }]}>
            <FontAwesome name="phone" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>+351 912 345 678</Text>
          </View>

          <View style={[styles.contactItem, { backgroundColor: colors.surface }]}>
            <FontAwesome name="clock-o" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>Mon-Fri, 9 AM - 6 PM</Text>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  submitIcon: {
    marginRight: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contactInfo: {
    padding: 20,
    paddingTop: 10,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
}); 