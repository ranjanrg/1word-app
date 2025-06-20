import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen = ({ navigation }) => {
  const { 
    userName, 
    userEmail, 
    userLevel, 
    isGuest, 
    isSignedIn,
    userData,
    updateUser,
    signOut 
  } = useAuth();

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
      description: 'Common words, basic vocabulary'
    },
    { 
      value: 'Intermediate', 
      label: 'Intermediate',
      description: 'Moderate complexity, business terms'
    },
    { 
      value: 'Advanced', 
      label: 'Advanced',
      description: 'Complex words, academic vocabulary'
    },
    { 
      value: 'Expert', 
      label: 'Expert',
      description: 'Rare words, literary expressions'
    }
  ];

  // Initialize settings on component mount
  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    // Set default reminder time to 9:00 AM
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setReminderTime(defaultTime);
    
    // Request notification permissions
    await requestNotificationPermissions();
    
    // Schedule daily notification
    await scheduleDailyNotification(defaultTime);
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        setNotificationsEnabled(false);
      } else {
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const scheduleDailyNotification = async (time) => {
    try {
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (!notificationsEnabled) return;

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚 Time to learn!",
          body: "Ready to discover your word of the day?",
          sound: 'default',
        },
        trigger: {
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
        },
      });

      console.log(`✅ Daily notification scheduled for ${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`);
      
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const handleTimeChange = async (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      setReminderTime(selectedTime);
      await scheduleDailyNotification(selectedTime);
      
      Alert.alert(
        'Reminder Updated',
        `Daily reminder set for ${selectedTime.getHours()}:${selectedTime.getMinutes().toString().padStart(2, '0')}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDifficultyChange = async (newDifficulty) => {
    try {
      setCurrentDifficulty(newDifficulty);
      setShowDifficultyModal(false);
      
      // Update user level in auth context
      const result = await updateUser({}, newDifficulty);
      
      if (result.success) {
        Alert.alert(
          'Difficulty Updated',
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
            // Cancel all notifications
            await Notifications.cancelAllScheduledNotificationsAsync();
            
            const result = await signOut();
            if (result.success) {
              console.log('✅ Sign out successful - staying on Settings screen');
              // No navigation needed - user stays on Settings
              // The button will automatically change to "Sign Up" due to auth state change
            } else {
              console.error('❌ Sign out failed:', result.error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignUp = () => {
    // Navigate to sign up screen
    navigation.navigate('SignUpScreen'); // Change this to your actual signup screen name
  };

  const handleAbout = () => {
    Alert.alert(
      'About 1Word',
      'Expand your vocabulary, one word at a time.\n\nVersion 1.0.0\n\nBuilt with ❤️ for learners everywhere.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at support@1word.app\n\nOr visit our FAQ section on the website.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We only collect data necessary to improve your learning experience.\n\nFor full details, visit our privacy policy on the website.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <View style={styles.profileCard}>
            {/* User Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            </View>
            
            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userName || 'User'}</Text>
              <Text style={styles.userEmail}>{userEmail || 'user@example.com'}</Text>
              <Text style={styles.userLevel}>Level: {currentDifficulty}</Text>
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
        </View>

        {/* Learning Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning</Text>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowTimePicker(true)}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reminder Time</Text>
              <Text style={styles.settingSubtitle}>{formatTime(reminderTime)}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowDifficultyModal(true)}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Difficulty Level</Text>
              <Text style={styles.settingSubtitle}>{currentDifficulty}</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & FAQ</Text>
              <Text style={styles.settingSubtitle}>Get support</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>How we handle your data</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About 1Word</Text>
              <Text style={styles.settingSubtitle}>Version 1.0.0</Text>
            </View>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          {isSignedIn ? (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          transparent={true}
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              
              <DateTimePicker
                value={reminderTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
              
              {Platform.OS === 'ios' && (
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      setShowTimePicker(false);
                      scheduleDailyNotification(reminderTime);
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Set Reminder</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Difficulty Level Modal */}
      <Modal
        transparent={true}
        visible={showDifficultyModal}
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.difficultyContainer}>
            <Text style={styles.modalTitle}>Choose Difficulty Level</Text>
            
            {difficultyLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.difficultyOption,
                  currentDifficulty === level.value && styles.selectedDifficulty
                ]}
                onPress={() => handleDifficultyChange(level.value)}
              >
                <Text style={[
                  styles.difficultyLabel,
                  currentDifficulty === level.value && styles.selectedDifficultyText
                ]}>
                  {level.label}
                </Text>
                <Text style={[
                  styles.difficultyDescription,
                  currentDifficulty === level.value && styles.selectedDifficultyText
                ]}>
                  {level.description}
                </Text>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  guestBadge: {
    backgroundColor: '#ffeaa7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d63031',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 10,
  },
  signOutButton: {
    backgroundColor: '#2d3436',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#00b894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  difficultyContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  timePicker: {
    height: 150,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#000',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  difficultyOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  selectedDifficulty: {
    borderColor: '#000',
    backgroundColor: '#000',
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
  },
  selectedDifficultyText: {
    color: '#fff',
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelModalButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SettingsScreen;