import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import * as Linking from 'expo-linking';

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

// Navigation component that uses auth state
function AppNavigator() {
  const { isLoading, isSignedIn, isGuest, isFirstTime } = useAuth();

  useEffect(() => {
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

  // Show splash screen while loading
  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // Determine initial route based on auth state
  let initialRouteName = 'AuthWelcome';
  
  if (isSignedIn || isGuest) {
    initialRouteName = 'Main';
    console.log('🏠 Navigating to Main screen - User is authenticated');
  } else if (isFirstTime) {
    initialRouteName = 'AuthWelcome';
    console.log('👋 Navigating to AuthWelcome - First time user');
  } else {
    initialRouteName = 'AuthWelcome';
    console.log('🔄 Navigating to AuthWelcome - Returning user');
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}