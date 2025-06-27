import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AuthWelcome = () => {
  const navigation = useNavigation();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // Navigate to Assessment for new users
    navigation.navigate('Assessment');
  };

  const handleExistingUser = () => {
    // Navigate to Google Login for returning users
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>OneWord</Text>
        <Text style={styles.subtitle}>Master vocabulary, one word at a time</Text>
      </Animated.View>

      {/* Animated Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.messageContainer}>
          <Text style={styles.welcomeMessage}>
            Welcome to your vocabulary journey!
          </Text>
          <Text style={styles.descriptionText}>
            Join thousands of learners improving their vocabulary daily with personalized lessons.
          </Text>
        </View>
      </Animated.View>

      {/* Animated Buttons */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: buttonFadeAnim,
          },
        ]}
      >
        {/* Get Started Button - Goes to Assessment */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Already Have Account Button - Goes to Google Login */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleExistingUser}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Already have an account?</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeMessage: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    paddingBottom: 50,
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthWelcome;