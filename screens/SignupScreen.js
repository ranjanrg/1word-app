import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import AuthContext

const SignupScreen = ({ navigation, route }) => {
  const { signUp, isLoading } = useAuth(); // ✅ Use AuthContext
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get assessment results from previous screen
  const { 
    userLevel = 'Intermediate',
    score = 67,
    percentile = 73 
  } = route?.params || {};

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    console.log('🚀 DEBUG: handleSignup called');
    console.log('📋 Form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    console.log('✅ Form validation passed');
    console.log('🔑 About to call signUp with:', {
      name: formData.name,
      email: formData.email,
      passwordLength: formData.password.length,
      userLevel
    });

    try {
      console.log('📞 Calling signUp function...');
      const result = await signUp(formData.name, formData.email, formData.password, userLevel);
      console.log('📋 SignUp result:', result);
      
      if (result.success) {
        console.log('✅ Signup successful, navigating to Main');
        navigation.navigate('Main', {
          isNewUser: true,
          userLevel,
          userName: formData.name
        });
      } else {
        console.log('❌ Signup failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.log('💥 Exception in handleSignup:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>You're {userLevel}! 🎉</Text>
          <Text style={styles.welcomeSubtitle}>
            Create your account to save your progress and start your vocabulary journey
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading} // ✅ Disable when loading
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading} // ✅ Disable when loading
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading} // ✅ Disable when loading
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={isLoading} // ✅ Disable when loading
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading} // ✅ Disable when loading
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                disabled={isLoading} // ✅ Disable when loading
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.signupButton, isLoading && styles.disabledButton]} // ✅ Use AuthContext loading
          onPress={handleSignup}
          disabled={isLoading} // ✅ Use AuthContext loading
        >
          <Text style={styles.signupButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'} {/* ✅ Use AuthContext loading */}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
            <Text style={[styles.loginLink, isLoading && { color: '#ccc' }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  welcomeSection: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeText: {
    fontSize: 18,
  },
  actionSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  signupButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;