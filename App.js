import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './contexts/AuthContext';
import * as Linking from 'expo-linking';

// Google Sign-In Configuration
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import config from './config';

// Import all your screens
import SplashScreen from './screens/SplashScreen';
import AuthWelcomeScreen from './screens/AuthWelcomeScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import PostAssessmentAuthScreen from './screens/PostAssessmentAuthScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import LearningGoalsScreen from './screens/LearningGoalsScreen';
import MainScreen from './screens/MainScreen';
import LearnWordScreen from './screens/LearnWordScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createStackNavigator();

// Configure deep linking
const linking = {
  prefixes: ['oneword://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: config.GOOGLE_CLIENT_ID,// Replace with your actual Client ID
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });

    // Handle deep links when app is already running
    const handleDeepLink = (url) => {
      console.log('🔗 Deep link received:', url);
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          {/* Auth Flow */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="AuthWelcome" component={AuthWelcomeScreen} />
          <Stack.Screen name="Assessment" component={AssessmentScreen} />
          <Stack.Screen name="PostAssessmentAuth" component={PostAssessmentAuthScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          
          {/* Onboarding */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="LearningGoals" component={LearningGoalsScreen} />
          
          {/* Main App */}
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="LearnWord" component={LearnWordScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}