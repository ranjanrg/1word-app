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
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase.config';

const SignupScreen = ({ navigation, route }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Get assessment results from previous screen
  const { 
    userLevel = 'Intermediate',
    score = 67,
    percentile = 73 
  } = route?.params || {};

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔄 Starting Google Sign-Up...');

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
      
      // Use Supabase Google auth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        console.error('❌ Google sign-up error:', error);
        Alert.alert('Error', 'Failed to sign up with Google. Please try again.');
        return;
      }

      console.log('✅ Google sign-up initiated:', data);
      
    } catch (error) {
      console.error('💥 Google Sign-Up error:', error);
      Alert.alert('Error', 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Centered Content */}
      <View style={styles.centerContainer}>
        
        {/* Google Sign-Up Button */}
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity 
            style={[styles.googleButton, isGoogleLoading && styles.disabledButton]}
            onPress={handleGoogleSignUp}
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
                  {isGoogleLoading ? 'Creating Account...' : 'Continue with Google'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Login Prompt */}
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={isGoogleLoading}>
            <Text style={[styles.loginLink, isGoogleLoading && { color: '#ccc' }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </View>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default SignupScreen;