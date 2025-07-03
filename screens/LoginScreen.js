import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const navigation = useNavigation();
  const { signInWithGoogle, setGuest, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        if (result.requiresAssessment) {
          // Better UX message - user thinks they have account but don't
          Alert.alert(
            'Account Not Found',
            'You don\'t have an account yet. Please create an account first. ',
            [
              {
                text: 'Create Account',
                onPress: () => navigation.navigate('AuthWelcome') // Go to welcome/assessment flow
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        } else {
          Alert.alert('Sign-In Failed', result.error || 'Google Sign-In failed. Please try again.');
        }
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create an account</Text>
      </View>

      {/* Content - Centered Google Button */}
      <View style={styles.content}>
        {/* Google Sign-In Button */}
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {/* Google G Logo SVG */}
          <View style={styles.googleIcon}>
            <View style={styles.googleG}>
              <View style={[styles.googleSegment, styles.googleBlue]} />
              <View style={[styles.googleSegment, styles.googleGreen]} />
              <View style={[styles.googleSegment, styles.googleYellow]} />
              <View style={[styles.googleSegment, styles.googleRed]} />
            </View>
          </View>
          
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Section - Empty */}
      <View style={styles.bottomSection}>
        {/* Intentionally empty */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: height * 0.1,
    paddingHorizontal: 32,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
    lineHeight: 42,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bottomSection: {
    paddingBottom: height * 0.15,
    // Empty space at bottom
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 50,
    width: width - 64,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  googleSegment: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  googleBlue: {
    backgroundColor: '#4285F4',
    top: 0,
    right: 0,
    borderTopRightRadius: 10,
  },
  googleRed: {
    backgroundColor: '#EA4335',
    top: 0,
    left: 0,
    borderTopLeftRadius: 10,
  },
  googleYellow: {
    backgroundColor: '#FBBC05',
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 10,
  },
  googleGreen: {
    backgroundColor: '#34A853',
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 10,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default Login;