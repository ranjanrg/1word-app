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
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState(userLevel || 'Beginner');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setReminderTime(defaultTime);
    
    // Skip notification setup for now to avoid errors
    console.log('Settings initialized');
  };

  const handleDifficultyChange = async (newDifficulty) => {
    try {
      setCurrentDifficulty(newDifficulty);
      setShowDifficultyModal(false);
      
      // Update user level in auth context
      const result = await updateUser({}, newDifficulty);
      
      if (result.success) {
        Alert.alert(
          'Level Updated! 🎯',
          `Your learning level has been updated to ${newDifficulty}. You'll now receive ${newDifficulty.toLowerCase()} level words.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to update difficulty level. Please try again.');
      }
    } catch (error) {
      console.error('Error updating difficulty:', error);
      Alert.alert('Error', 'Failed to update difficulty level.');
    }
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 User requested sign out');
            
            try {
              const result = await signOut();
              if (result.success) {
                console.log('✅ Sign out successful');
                // Navigate back or to login screen
                navigation.navigate('AuthWelcome');
              } else {
                console.error('❌ Sign out failed:', result.error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
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
    Alert.alert(
      'About ONE WORD',
      'Expand your vocabulary, one word at a time.\n\nVersion 1.0.0\n\nBuilt with ❤️ for learners everywhere.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at talkwithranjan19@gmail.com\n\nOr visit our FAQ section on the website.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We only collect data necessary to improve your learning experience.',
      [{ text: 'OK' }]
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
              onPress={() => {
                Alert.alert(
                  'Daily Reminder ⏰',
                  'Notification features will be available in the next update!',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>⏰</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Daily Reminder</Text>
                  <Text style={styles.settingSubtitle}>{formatTime(reminderTime)}</Text>
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
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.buttonGradient}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.buttonGradient}
              >
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        <View style={{ height: 50 }} />
      </ScrollView>

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
  signOutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});

export default SettingsScreen;