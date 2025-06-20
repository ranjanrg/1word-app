import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './contexts/AuthContext';

// Import all your screens
import SplashScreen from './screens/SplashScreen';
import AuthWelcomeScreen from './screens/AuthWelcomeScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import PostAssessmentAuthScreen from './screens/PostAssessmentAuthScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen'; // Your new login screen
import LearningGoalsScreen from './screens/LearningGoalsScreen';
import MainScreen from './screens/MainScreen';
import LearnWordScreen from './screens/LearnWordScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
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