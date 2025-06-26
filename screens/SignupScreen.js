import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

const SignupScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { signUp } = useAuth();

  // Get assessment and goals data from previous screens
  const {
    userLevel = 'Beginner',
    score = 0,
    totalWords = 24,
    correctAnswers = 0,
    percentile = 50,
    selectedWords = [],
    learningGoals = []
  } = route?.params || {};

  useEffect(() => {
    // Start animations
    Animated.parallel([
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
    ]).start();
  }, []);

  const handleSignUp = async () => {
    // Validation with haptic feedback
    if (!name || !email || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log('🚀 Creating account for:', { name, email, userLevel, learningGoals });

    try {
      // Pass the full name to signUp method
      const result = await signUp(name, email, password, userLevel, learningGoals);
      
      if (result.success) {
        console.log('✅ Signup successful!');
        
        // Save additional assessment and goals data
        try {
          const DataManager = require('../utils/DataManager').default;
          await DataManager.updateUserLevel(userLevel);
          await DataManager.updateLearningGoals(learningGoals);
          
          // Ensure the full name is saved
          if (name && name.trim()) {
            await DataManager.updateUserFullName(name.trim());
            console.log('✅ Full name saved:', name.trim());
          }
          
          console.log('✅ Assessment and goals data saved');
        } catch (error) {
          console.log('⚠️ Could not save additional data:', error);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show custom welcome modal instead of Alert.alert
        setShowWelcomeModal(true);
        
        // Navigation will be handled automatically by AuthContext
      } else {
        console.error('❌ Signup failed:', result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Signup Failed', result.error);
      }
    } catch (error) {
      console.error('💥 Signup error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const getLevelEmoji = () => {
    switch (userLevel) {
      case 'Beginner': return '🌱';
      case 'Intermediate': return '🌿';
      case 'Advanced': return '🌳';
      default: return '📚';
    }
  };

  const getLevelColor = () => {
    switch (userLevel) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#3b82f6';
      case 'Advanced': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      
      {/* Header with Black Gradient */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 25],
                })
              }]
            }
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Assessment Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
                <Text style={styles.levelEmoji}>{getLevelEmoji()}</Text>
                <Text style={styles.levelText}>{userLevel}</Text>
              </View>
              <Text style={styles.summaryText}>
                {correctAnswers}/{totalWords} words • {learningGoals.length} goals
              </Text>
            </View>
          </View>

          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Save your progress and start learning</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Form Container */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [25, 0],
                })
              }]
            }
          ]}
        >
          {/* Full Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>👤</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              Used in your personalized learning stories
            </Text>
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <View style={styles.inputIcon}>
                <Text style={styles.iconText}>📧</Text>
              </View>
            </View>
          </View>
          
          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <TouchableOpacity 
                style={styles.inputIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.iconText}>{showPassword ? '👁️' : '🔒'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                placeholderTextColor="#9CA3AF"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity 
                style={styles.inputIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.iconText}>{showConfirmPassword ? '👁️' : '🔒'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Create Account Button */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Create Account & Start Learning'}
            </Text>
          </TouchableOpacity>
          
          {/* Secondary Button */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={goToLogin}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Your personalized learning profile will be saved, including your {userLevel} level and {learningGoals.length} selected goals. 
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Custom Welcome Modal */}
      <Modal
        transparent={true}
        visible={showWelcomeModal}
        animationType="fade"
        onRequestClose={() => setShowWelcomeModal(false)}
      >
        <View style={welcomeModalStyles.overlay}>
          <Animated.View 
            style={[
              welcomeModalStyles.container,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [1, 0.8] }) }],
              },
            ]}
          >
            <LinearGradient
              colors={['#000', '#2d3436']}
              style={welcomeModalStyles.gradient}
            >
              {/* Celebration Icon */}
              <View style={welcomeModalStyles.iconContainer}>
                <Text style={welcomeModalStyles.celebrationIcon}>🎉</Text>
              </View>
              
              {/* Welcome Message */}
              <Text style={welcomeModalStyles.title}>
                Welcome to OneWord!
              </Text>
              
              <Text style={welcomeModalStyles.greeting}>
                Hi {name.split(' ')[0]}! 👋
              </Text>
              
              <Text style={welcomeModalStyles.message}>
                Your account has been created successfully!
              </Text>
              
              {/* User Stats */}
              <View style={welcomeModalStyles.statsContainer}>
                <View style={welcomeModalStyles.statItem}>
                  <Text style={welcomeModalStyles.statEmoji}>📚</Text>
                  <Text style={welcomeModalStyles.statLabel}>Level</Text>
                  <Text style={welcomeModalStyles.statValue}>{userLevel}</Text>
                </View>
                
                <View style={welcomeModalStyles.divider} />
                
                <View style={welcomeModalStyles.statItem}>
                  <Text style={welcomeModalStyles.statEmoji}>🎯</Text>
                  <Text style={welcomeModalStyles.statLabel}>Goals</Text>
                  <Text style={welcomeModalStyles.statValue}>{learningGoals.length} selected</Text>
                </View>
              </View>
              
              <Text style={welcomeModalStyles.subtitle}>
                You're all set to start learning!
              </Text>
              
              {/* Action Button */}
              <TouchableOpacity 
                style={welcomeModalStyles.button}
                onPress={() => {
                  setShowWelcomeModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={welcomeModalStyles.buttonText}>
                  Start Learning! ✨
                </Text>
              </TouchableOpacity>
              
              {/* Floating Dots for Animation */}
              <View style={welcomeModalStyles.floatingDot1} />
              <View style={welcomeModalStyles.floatingDot2} />
              <View style={welcomeModalStyles.floatingDot3} />
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryHeader: {
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  levelEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    paddingRight: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1f2937',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

// Welcome Modal Styles
const welcomeModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 20,
  },
  celebrationIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Floating animation dots
  floatingDot1: {
    position: 'absolute',
    top: 30,
    right: 40,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingDot2: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingDot3: {
    position: 'absolute',
    top: 120,
    left: 50,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default SignupScreen;