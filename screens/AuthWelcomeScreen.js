import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AuthWelcome = () => {
  const navigation = useNavigation();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Typing animation state
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'Welcome to your\nvocabulary journey!';
  
  useEffect(() => {
    // Start fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start typing animation after a short delay
    setTimeout(() => {
      startTypingAnimation();
    }, 800);

    // Start cursor blinking
    startCursorBlinking();
  }, []);

  const startCursorBlinking = () => {
    setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500); // Blink every 500ms
  };

  const startTypingAnimation = () => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Show buttons after typing is complete
        setTimeout(() => {
          Animated.timing(buttonFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 300);
      }
    }, 40); // Slightly faster typing
  };

  const handleGetStarted = () => {
    navigation.navigate('Assessment');
  };

  const handleExistingUser = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Welcome Text with Typing Animation */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>
            {displayedText}
            {showCursor && <Text style={styles.cursor}>|</Text>}
          </Text>
        </View>
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View 
        style={[
          styles.bottomSection,
          {
            opacity: buttonFadeAnim,
          },
        ]}
      >
        {/* Get Started Button */}
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Already Have Account Button */}
        <TouchableOpacity 
          style={styles.existingUserButton}
          onPress={handleExistingUser}
          activeOpacity={0.8}
        >
          <Text style={styles.existingUserButtonText}>I Already Have an Account</Text>
        </TouchableOpacity>

        {/* Description Text */}
        <Text style={styles.descriptionText}>
          New users will take a quick assessment to personalize their experience
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.8,
    fontFamily: 'System',
  },
  cursor: {
    opacity: 1,
    fontSize: 32,
    fontWeight: '200',
    color: '#000000',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: width - 64,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  existingUserButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    width: width - 64,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  existingUserButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
    paddingHorizontal: 40,
    fontWeight: '400',
  },
  // Removed bottomIndicator style completely
});

export default AuthWelcome;