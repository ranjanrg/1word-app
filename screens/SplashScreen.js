import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ navigation, checkUserStatus }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Start animations
    startAnimations();
    
    // Navigate after 3 seconds
    const timer = setTimeout(() => {
      handleNavigation();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const startAnimations = () => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNavigation = () => {
    // Check if user is new or returning
    const userStatus = checkUserStatus ? checkUserStatus() : 'new';
    
    if (userStatus === 'returning') {
      navigation.navigate('Main');
    } else {
      navigation.navigate('AuthWelcome'); // Skip onboarding, go straight to assessment
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.topText}>ONE</Text>
        <Text style={styles.bottomText}>WORD</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topText: {
    fontSize: 52,
    fontWeight: '200', // Ultra-light weight (like Cal.ai)
    color: '#1a1a1a',
    letterSpacing: 12,
    marginBottom: -10,
    textAlign: 'center',
    fontFamily: 'System', // Use system font for consistency
  },
  bottomText: {
    fontSize: 52,
    fontWeight: '800', // Extra bold weight
    color: '#1a1a1a',
    letterSpacing: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default SplashScreen;