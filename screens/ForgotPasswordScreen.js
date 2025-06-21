import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase.config';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleMagicLinkLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      console.log('🔗 Sending magic link to:', email.trim());

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false, // Only send to existing users
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          Alert.alert(
            'Too Many Requests', 
            'Please wait a few minutes before requesting another link.'
          );
        } else if (error.message.includes('not found') || error.message.includes('invalid email')) {
          Alert.alert(
            'Email Not Found', 
            'No account found with this email address. Please check your email or create a new account.'
          );
        } else {
          Alert.alert(
            'Error', 
            'Failed to send login link. Please try again.'
          );
        }
      } else {
        console.log('✅ Magic link sent successfully');
        setEmailSent(true);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleTryDifferentEmail = () => {
    setEmail('');
    setEmailSent(false);
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <LinearGradient
          colors={['#000', '#2d3436']}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login Link Sent</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        {/* Success Content */}
        <View style={styles.content}>
          <View style={styles.successCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.successIcon}>🔗</Text>
            </View>
            
            <Text style={styles.successTitle}>Check Your Email!</Text>
            <Text style={styles.successSubtitle}>
              We've sent a magic login link to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>What to do next:</Text>
              <View style={styles.stepsList}>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Check your email inbox</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Click the login link</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>You'll be automatically signed in!</Text>
                </View>
              </View>
            </View>

            <View style={styles.helpNote}>
              <Text style={styles.helpText}>
                💡 Don't see the email? Check your spam folder or wait a few minutes for delivery.
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleBackToLogin}
            >
              <Text style={styles.primaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleTryDifferentEmail}
            >
              <Text style={styles.secondaryButtonText}>Try Different Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Magic Link Login</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>🔗</Text>
          </View>
          
          <Text style={styles.title}>Sign In With Magic Link</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a secure login link. No password needed!
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• We'll send a secure login link to your email</Text>
            <Text style={styles.infoItem}>• Click the link to sign in instantly</Text>
            <Text style={styles.infoItem}>• No password required - safer and easier!</Text>
          </View>
        </View>

        {/* Send Button */}
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.disabledButton]}
            onPress={handleMagicLinkLogin}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? 'Sending...' : 'Send Login Link'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={handleBackToLogin}>
          <Text style={styles.backToLoginText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    marginBottom: 20,
  },
  mainIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
    shadowOpacity: 0.1,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Success Screen Styles
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  helpNote: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;