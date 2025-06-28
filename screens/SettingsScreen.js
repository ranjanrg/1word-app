import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationManager from '../utils/NotificationManager';

// Fallback auth hook if context not available
const useFallbackAuth = () => ({
  userName: 'User',
  userEmail: 'user@example.com',
  userLevel: 'Beginner',
  isGuest: false,
  isSignedIn: true,
  userData: null,
  updateUser: async () => ({ success: true }),
  signOut: async () => ({ success: true })
});

const SettingsScreen = ({ navigation }) => {
  // Try to use real auth context, fallback to mock if not available
  let authHook;
  try {
    const { useAuth } = require('../contexts/AuthContext');
    authHook = useAuth();
  } catch (error) {
    console.log('AuthContext not found, using fallback');
    authHook = useFallbackAuth();
  }

  const { 
    userName, 
    userEmail, 
    userLevel, 
    isGuest, 
    isSignedIn,
    userData,
    updateUser,
    signOut
  } = authHook;

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // State for settings
  const [reminderTime, setReminderTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(userLevel || 'Beginner');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Custom Alert Modal States
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    buttons: []
  });

  // Difficulty levels
  const difficultyLevels = [
    { 
      value: 'Beginner', 
      label: 'Beginner',
      description: 'Common words, basic vocabulary',
      emoji: '🌱',
      color: '#22c55e'
    },
    { 
      value: 'Intermediate', 
      label: 'Intermediate',
      description: 'Moderate complexity, business terms',
      emoji: '🌿',
      color: '#3b82f6'
    },
    { 
      value: 'Advanced', 
      label: 'Advanced',
      description: 'Complex words, academic vocabulary',
      emoji: '🌳',
      color: '#8b5cf6'
    },
    { 
      value: 'Expert', 
      label: 'Expert',
      description: 'Rare words, literary expressions',
      emoji: '🏆',
      color: '#f59e0b'
    }
  ];

  // Initialize settings on component mount
  useEffect(() => {
    initializeSettings();
    startAnimations();
  }, []);

  const startAnimations = () => {
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
  };

  const initializeSettings = async () => {
    // Set default reminder time to 9:00 AM
    setReminderTime('09:00');
    
    // Request notification permissions
    await NotificationManager.requestPermissions();
    console.log('Settings initialized');
  };

  const handleDifficultyChange = async (newDifficulty) => {
    try {
      setCurrentDifficulty(newDifficulty);
      setShowDifficultyModal(false);
      
      // Update user level in auth context
      const result = await updateUser({}, newDifficulty);
      
      if (result.success) {
        showCustomAlert(
          'Level Updated! 🎯',
          `Your learning level has been updated to ${newDifficulty}. You'll now receive ${newDifficulty.toLowerCase()} level words.`,
          'success'
        );
      } else {
        showCustomAlert('Error', 'Failed to update difficulty level. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating difficulty:', error);
      showCustomAlert('Error', 'Failed to update difficulty level.', 'error');
    }
  };

  // Format join date if available
  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently joined';
    }
  };

  const handleTimeSelect = async (hour, minute) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setReminderTime(timeString);
    setShowTimePicker(false);
    
    // Check if this is a test notification (1 minute from now)
    const currentTime = new Date();
    const isTestNotification = Math.abs((hour * 60 + minute) - (currentTime.getHours() * 60 + currentTime.getMinutes())) <= 2;
    
    if (isTestNotification) {
      // Schedule immediate test notification
      try {
        await NotificationManager.scheduleTestNotification();
        showCustomAlert(
          '🧪 Test Notification Scheduled',
          'A test notification will appear in about 1 minute. Make sure to minimize the app to see it!',
          'success'
        );
      } catch (error) {
        showCustomAlert(
          '❌ Test Failed',
          'Could not schedule test notification. Please check notification permissions.',
          'error'
        );
      }
    } else {
      // Schedule the daily reminder
      const success = await NotificationManager.scheduleDailyReminder(hour, minute);
      
      if (success) {
        showCustomAlert(
          '✅ Reminder Set',
          `Daily learning reminder set for ${timeString}`,
          'success'
        );
      } else {
        showCustomAlert(
          '❌ Permission Required',
          'Please enable notifications in your device settings to receive learning reminders.',
          'warning'
        );
      }
    }
  };

  // Enhanced Alert Buttons with Custom Modal
  const showCustomAlert = (title, message, type = 'info', buttons = [{ text: 'OK' }]) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      buttons
    });
  };

  const hideCustomAlert = () => {
    setCustomAlert({
      visible: false,
      title: '',
      message: '',
      type: 'info',
      buttons: []
    });
  };

  // ✅ FIXED: Removed manual navigation - AuthContext handles this automatically
  const handleSignOut = async () => {
    showCustomAlert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      'warning',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: hideCustomAlert
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            hideCustomAlert();
            console.log('🚪 User requested sign out');
            
            try {
              const result = await signOut();
              if (result.success) {
                console.log('✅ Sign out successful');
              } else {
                console.error('❌ Sign out failed:', result.error);
                showCustomAlert('Error', 'Failed to sign out. Please try again.', 'error');
              }
            } catch (error) {
              console.error('Sign out error:', error);
              showCustomAlert('Error', 'Failed to sign out. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleSignUp = () => {
    navigation.navigate('Assessment');
  };

  const handleAbout = () => {
    showCustomAlert(
      'About OneWord',
      'Expand your vocabulary, one word at a time.\n\nVersion 1.0.0\n\nBuilt with ❤️ for learners everywhere.',
      'info'
    );
  };

  const handleHelp = () => {
    showCustomAlert(
      'Help & Support',
      'Need help? Contact us at:\ntalkwithranjan19@gmail.com\n\nOr visit our FAQ section on the website for quick answers to common questions.',
      'info'
    );
  };

  const handlePrivacy = () => {
    showCustomAlert(
      'Privacy Policy',
      'Your privacy is important to us. We only collect data necessary to improve your learning experience.\n\nWe never share your personal information with third parties.',
      'info',
      [
        {
          text: 'View Full Policy',
          style: 'primary',
          onPress: async () => {
            hideCustomAlert();
            try {
              const { Linking } = require('react-native');
              const url = 'https://sites.google.com/view/one-word-privacy-policy/home';
              const supported = await Linking.canOpenURL(url);
              
              if (supported) {
                await Linking.openURL(url);
              } else {
                showCustomAlert(
                  'Error',
                  'Unable to open privacy policy page. Please visit:\n\nhttps://sites.google.com/view/one-word-privacy-policy/home',
                  'error'
                );
              }
            } catch (error) {
              console.error('Error opening privacy policy:', error);
              showCustomAlert(
                'Error',
                'Unable to open privacy policy page. Please try again later.',
                'error'
              );
            }
          }
        },
        {
          text: 'OK',
          style: 'cancel',
          onPress: hideCustomAlert
        }
      ]
    );
  };

  const getCurrentDifficultyData = () => {
    return difficultyLevels.find(level => level.value === currentDifficulty) || difficultyLevels[0];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Enhanced Profile Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <View style={styles.profileCard}>
            {/* User Avatar */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#000', '#2d3436']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            </View>
            
            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName || 'User'}</Text>
              <Text style={styles.userEmail}>{userEmail || 'user@example.com'}</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelEmoji}>{getCurrentDifficultyData().emoji}</Text>
                <Text style={styles.userLevel}>Level: {currentDifficulty}</Text>
              </View>
              {userData?.joinDate && (
                <Text style={styles.joinDate}>
                  Joined {formatJoinDate(userData.joinDate)}
                </Text>
              )}
              {isGuest && (
                <View style={styles.guestBadge}>
                  <Text style={styles.guestBadgeText}>Guest Account</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Learning Preferences */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Learning Preferences</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>⏰</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Daily Reminder</Text>
                  <Text style={styles.settingSubtitle}>{reminderTime}</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowDifficultyModal(true)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>{getCurrentDifficultyData().emoji}</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Difficulty Level</Text>
                  <Text style={styles.settingSubtitle}>{currentDifficulty}</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Support & Info */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Support & Information</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>💬</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Help & FAQ</Text>
                  <Text style={styles.settingSubtitle}>Get support</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>🔒</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                  <Text style={styles.settingSubtitle}>How we handle your data</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>ℹ️</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>About ONE WORD</Text>
                  <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Account Actions */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {isSignedIn ? (
            /* Enhanced Sign Out Button with styling like MainScreen */
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <View style={styles.actionButtonContent}>
                <View style={styles.actionButtonTextSection}>
                  <Text style={styles.actionButtonTitle}>Sign Out</Text>
                  <Text style={styles.actionButtonSubtitle}>Sign out of your account</Text>
                </View>
                <View style={styles.actionButtonIconContainer}>
                  <Text style={styles.actionButtonIcon}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <View style={styles.actionButtonContent}>
                <View style={styles.actionButtonTextSection}>
                  <Text style={styles.actionButtonTitle}>Create Account</Text>
                  <Text style={styles.actionButtonSubtitle}>Get the full OneWord experience</Text>
                </View>
                <View style={styles.actionButtonIconContainer}>
                  <Text style={styles.actionButtonIcon}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Set Daily Reminder</Text>
            
            <View style={styles.timeOptions}>
              {[
                { label: '8:00 AM', hour: 8, minute: 0 },
                { label: '12:00 PM', hour: 12, minute: 0 },
                { label: '6:00 PM', hour: 18, minute: 0 },
                { label: '7:00 PM', hour: 19, minute: 0 },
                { label: '8:00 PM', hour: 20, minute: 0 },
                { label: '9:00 PM', hour: 21, minute: 0 },
              ].map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeOption,
                    reminderTime === `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}` && styles.selectedTimeOption
                  ]}
                  onPress={() => handleTimeSelect(time.hour, time.minute)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    reminderTime === `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}` && styles.selectedTimeOptionText
                  ]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enhanced Difficulty Level Modal */}
      <Modal
        transparent={true}
        visible={showDifficultyModal}
        onRequestClose={() => setShowDifficultyModal(false)}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.difficultyContainer}>
            <Text style={styles.modalTitle}>Choose Your Level</Text>
            <Text style={styles.modalSubtitle}>Select the difficulty that matches your vocabulary skills</Text>
            
            {difficultyLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.difficultyOption,
                  currentDifficulty === level.value && [styles.selectedDifficulty, { borderColor: level.color }]
                ]}
                onPress={() => handleDifficultyChange(level.value)}
              >
                <View style={styles.difficultyLeft}>
                  <Text style={styles.difficultyEmoji}>{level.emoji}</Text>
                  <View style={styles.difficultyTextContainer}>
                    <Text style={[
                      styles.difficultyLabel,
                      currentDifficulty === level.value && { color: level.color }
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={[
                      styles.difficultyDescription,
                      currentDifficulty === level.value && { color: level.color }
                    ]}>
                      {level.description}
                    </Text>
                  </View>
                </View>
                {currentDifficulty === level.value && (
                  <View style={[styles.selectedIndicator, { backgroundColor: level.color }]}>
                    <Text style={styles.selectedCheck}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowDifficultyModal(false)}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        transparent={true}
        visible={customAlert.visible}
        animationType="fade"
        onRequestClose={hideCustomAlert}
      >
        <View style={styles.alertOverlay}>
          <Animated.View 
            style={[
              styles.alertContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 30], outputRange: [1, 0.9] }) }],
              },
            ]}
          >
            <View style={styles.alertContent}>
              {/* Alert Icon */}
              <View style={styles.alertIconContainer}>
                <View style={[
                  styles.alertIconCircle,
                  { backgroundColor: 
                    customAlert.type === 'success' ? '#22c55e' :
                    customAlert.type === 'warning' ? '#f59e0b' :
                    customAlert.type === 'error' ? '#ef4444' : '#3b82f6'
                  }
                ]}>
                  <Text style={styles.alertIcon}>
                    {customAlert.type === 'success' ? '✓' :
                     customAlert.type === 'warning' ? '⚠' :
                     customAlert.type === 'error' ? '✕' : 'ℹ'}
                  </Text>
                </View>
              </View>
              
              {/* Alert Title */}
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              
              {/* Alert Message */}
              <Text style={styles.alertMessage}>{customAlert.message}</Text>
              
              {/* Alert Buttons */}
              <View style={styles.alertButtonsContainer}>
                {customAlert.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.alertButton,
                      button.style === 'destructive' && styles.alertButtonDestructive,
                      button.style === 'cancel' && styles.alertButtonCancel,
                      button.style === 'primary' && styles.alertButtonPrimary,
                      customAlert.buttons.length === 1 && styles.alertButtonSingle
                    ]}
                    onPress={button.onPress || hideCustomAlert}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.alertButtonText,
                      button.style === 'destructive' && styles.alertButtonTextDestructive,
                      button.style === 'cancel' && styles.alertButtonTextCancel,
                      button.style === 'primary' && styles.alertButtonTextPrimary
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  guestBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingEmoji: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
  },
  // Enhanced Action Buttons (similar to MainScreen hero button)
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonTextSection: {
    flex: 1,
    marginRight: 16,
  },
  actionButtonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  actionButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionButtonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Time Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '85%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeOptions: {
    marginBottom: 20,
  },
  timeOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#000',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTimeOptionText: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  // Difficulty Modal Styles
  difficultyContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    maxWidth: 380,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  selectedDifficulty: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
  },
  difficultyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  difficultyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  difficultyTextContainer: {
    flex: 1,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelModalButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  cancelModalButtonText: {
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Custom Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  alertContent: {
    backgroundColor: '#fff',
    padding: 28,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 20,
  },
  alertIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  alertMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertButtonSingle: {
    backgroundColor: '#000',
  },
  alertButtonDestructive: {
    backgroundColor: '#ef4444',
  },
  alertButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  alertButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  alertButtonTextDestructive: {
    color: '#fff',
  },
  alertButtonTextCancel: {
    color: '#64748b',
  },
  alertButtonTextPrimary: {
    color: '#fff',
  },
});

export default SettingsScreen;