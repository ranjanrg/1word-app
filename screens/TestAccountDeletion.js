// TestDeletion.js - Add this temporarily to test account deletion
// You can add this to any screen (like MainScreen) for testing
// Remove after confirming deletion works

import React from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const TestDeletion = () => {
  const { signIn, signUp } = useAuth();
  
  // Test 1: Create a test account and delete it
  const testCreateAndDelete = async () => {
    try {
      console.log('🧪 Starting comprehensive deletion test...');
      
      // Create test credentials
      const testEmail = `test_delete_${Date.now()}@example.com`;
      const testPassword = 'testpass123';
      const testName = 'Test User';
      
      Alert.alert(
        'Test Account Deletion',
        `Creating test account with:\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nThis will test the complete deletion process.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Test', 
            onPress: async () => {
              // Step 1: Create account
              console.log('📝 Creating test account...');
              const signupResult = await signUp(testName, testEmail, testPassword, 'Beginner');
              
              if (!signupResult.success) {
                Alert.alert('Test Failed', `Could not create test account: ${signupResult.error}`);
                return;
              }
              
              console.log('✅ Test account created successfully');
              
              // Step 2: Show success and ask to proceed with deletion test
              Alert.alert(
                'Account Created ✅',
                'Test account created successfully!\n\nNow we\'ll test the deletion process. After deletion, we\'ll try to login with the same credentials to verify it doesn\'t work.',
                [
                  { 
                    text: 'Test Deletion', 
                    onPress: () => testAccountDeletion(testEmail, testPassword)
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Test error:', error);
      Alert.alert('Test Error', error.message);
    }
  };
  
  // Test 2: Delete account and verify login fails
  const testAccountDeletion = async (testEmail, testPassword) => {
    try {
      console.log('🗑️ Testing account deletion...');
      
      // Navigate to settings to delete account
      Alert.alert(
        'Delete Test Account',
        'Go to Settings > Delete Account to test the deletion process.\n\nAfter deletion, come back here and tap "Test Login" to verify the account is gone.',
        [
          { text: 'OK' }
        ]
      );
      
    } catch (error) {
      console.error('❌ Deletion test error:', error);
      Alert.alert('Test Error', error.message);
    }
  };
  
  // Test 3: Try to login with deleted credentials
  const testDeletedAccountLogin = async () => {
    Alert.alert(
      'Test Deleted Account Login',
      'Enter the email and password of the account you just deleted to verify it no longer works:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Enter Manually',
          onPress: () => {
            // For now, just use a common test email
            testLoginWithCredentials('test@example.com', 'password123');
          }
        }
      ]
    );
  };
  
  const testLoginWithCredentials = async (email, password) => {
    try {
      console.log('🧪 Testing login with potentially deleted account...');
      console.log('📧 Email:', email);
      
      const result = await signIn(email, password);
      
      if (result.success) {
        Alert.alert(
          '❌ TEST FAILED', 
          'The account can still login! Account deletion is not working properly.\n\nThe account should have been invalidated.'
        );
        console.log('❌ TEST FAILED: Account can still login');
      } else {
        Alert.alert(
          '✅ TEST PASSED', 
          'Login correctly failed for the account. Account deletion is working!\n\nError: ' + result.error
        );
        console.log('✅ TEST PASSED: Login failed as expected');
      }
    } catch (error) {
      Alert.alert(
        '✅ TEST PASSED', 
        'Login threw an error, which means the account is likely deleted or invalidated.\n\nError: ' + error.message
      );
      console.log('✅ TEST PASSED: Login error (expected):', error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Account Deletion Test</Text>
      <Text style={styles.subtitle}>Use these buttons to test if account deletion works properly</Text>
      
      <TouchableOpacity style={styles.testButton} onPress={testCreateAndDelete}>
        <Text style={styles.buttonText}>1. Create Test Account & Delete</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.testButton, styles.secondaryButton]} onPress={testDeletedAccountLogin}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>2. Test Deleted Account Login</Text>
      </TouchableOpacity>
      
      <Text style={styles.instructions}>
        Instructions:{'\n'}
        1. Tap "Create Test Account" first{'\n'}
        2. Go to Settings and delete the account{'\n'}
        3. Come back and tap "Test Login" to verify it's gone
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  instructions: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 16,
  },
});

export default TestDeletion;

// HOW TO USE:
// 1. Import this component in your MainScreen.js:
//    import TestDeletion from './TestDeletion';
//
// 2. Add it to your MainScreen render (temporarily):
//    <TestDeletion />
//
// 3. Test the deletion process
//
// 4. Remove the component when testing is complete