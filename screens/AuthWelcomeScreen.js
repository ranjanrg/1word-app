import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const AuthWelcomeScreen = ({ navigation }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "Welcome to your vocabulary journey!";

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80); // Adjust speed here (lower = faster)

    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Assessment');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Welcome Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {displayedText}
            {showCursor && <Text style={styles.cursor}>|</Text>}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {/* Primary Button - New Users */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        {/* Secondary Button - Existing Users */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
          <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
        </TouchableOpacity>
        
        {/* Helper Text */}
        <Text style={styles.helperText}>
          New users will take a quick assessment to personalize their experience
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 20,
    minHeight: 80, // Prevents layout jump during typing
  },
  cursor: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  actionSection: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

export default AuthWelcomeScreen;