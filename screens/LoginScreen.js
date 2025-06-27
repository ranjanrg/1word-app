import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const navigation = useNavigation();
  const { signInWithGoogle, setGuest, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Sign-In Failed', result.error || 'Google Sign-In failed. Please try again.');
      }
      // If successful, navigation will happen automatically via AuthContext
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Sign-In failed. Please try again.');
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await setGuest();
      // Navigation will happen automatically
    } catch (error) {
      console.error('Guest mode error:', error);
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    }
  };

  const handleBackToWelcome = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToWelcome}
        >
          <Icon name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your vocabulary journey</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.illustration}>
          <Icon name="account-circle" size={120} color="#4285F4" />
        </View>

        <Text style={styles.welcomeText}>
          Sign in to sync your progress
        </Text>
        
        <Text style={styles.description}>
          Access your vocabulary progress, streak, and personalized lessons across all your devices.
        </Text>
      </View>

      {/* Auth Section */}
      <View style={styles.authSection}>
        {/* Google Sign-In Button */}
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Icon name="account-circle" size={24} color="#fff" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest Option */}
        <TouchableOpacity 
          style={[styles.guestButton, isLoading && styles.buttonDisabled]}
          onPress={handleContinueAsGuest}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Guest mode won't save your progress. Sign in to keep your data safe.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: height * 0.08,
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  authSection: {
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  guestButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default Login;