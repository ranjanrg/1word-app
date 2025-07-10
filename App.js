import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import screens
import SplashScreen from './screens/SplashScreen';
import AuthWelcomeScreen from './screens/AuthWelcomeScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import Login from './screens/LoginScreen';
import LearningGoalsScreen from './screens/LearningGoalsScreen';
import MainScreen from './screens/MainScreen';
import LearnWordScreen from './screens/LearnWordScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createStackNavigator();

// Loading Component
const LoadingNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
  </Stack.Navigator>
);

// Auth Stack Component
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="AuthWelcome"
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
    }}
  >
    <Stack.Screen name="AuthWelcome" component={AuthWelcomeScreen} />
    <Stack.Screen name="Assessment" component={AssessmentScreen} />
    <Stack.Screen name="LearningGoals" component={LearningGoalsScreen} />
    <Stack.Screen name="Login" component={Login} />
  </Stack.Navigator>
);

// Main App Stack Component
const MainStack = () => (
  <Stack.Navigator 
    initialRouteName="MainScreen"
    screenOptions={{
      headerShown: false,
      gestureEnabled: true,
    }}
  >
    <Stack.Screen name="MainScreen" component={MainScreen} />
    <Stack.Screen name="LearnWord" component={LearnWordScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="LearningGoals" component={LearningGoalsScreen} />
  </Stack.Navigator>
);

// Navigation component that uses auth state
function AppNavigator() {
  const { isLoading, isSignedIn, isGuest } = useAuth();

  console.log('🔍 Navigation State:', { isLoading, isSignedIn, isGuest });

  // Show loading screen while checking auth state
  if (isLoading) {
    console.log('🔄 App is loading...');
    return <LoadingNavigator />;
  }

  // Show main app if authenticated
  if (isSignedIn || isGuest) {
    console.log('🏠 Showing Main app - User is authenticated');
    return <MainStack />;
  }

  // Show auth flow if not authenticated
  console.log('🔐 Showing Auth flow - User not authenticated');
  return <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}