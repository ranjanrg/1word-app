import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase.config';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = ({ navigation }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔄 Starting Google Sign-In...');
      
      // Button animation
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
      
      // Use Supabase Google auth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
        return;
      }

      console.log('✅ Google sign-in initiated:', data);
      
    } catch (error) {
      console.error('💥 Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('Assessment');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Centered Content */}
      <View style={styles.centerContainer}>
        
        {/* Google Sign-In Button */}
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity 
            style={[styles.googleButton, isGoogleLoading && styles.disabledButton]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.googleGradient}
            >
              <View style={styles.googleContent}>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>🔍</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Create Account Prompt */}
        <View style={styles.createPrompt}>
          <Text style={styles.createPromptText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleCreateAccount} disabled={isGoogleLoading}>
            <Text style={[styles.createLink, isGoogleLoading && { color: '#ccc' }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  googleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
    width: 280,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleGradient: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 24,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  createPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPromptText: {
    fontSize: 16,
    color: '#666',
  },
  createLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;