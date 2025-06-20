import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabase.config';
import * as SecureStore from 'expo-secure-store';

// Helper function to convert Supabase errors to user-friendly messages
const getErrorMessage = (error) => {
  console.log('🐛 Raw Supabase error:', error);
  
  // Handle specific Supabase error codes
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Invalid password
    if (message.includes('invalid login credentials') || 
        message.includes('email not confirmed') ||
        message.includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    
    // User not found / wrong email
    if (message.includes('user not found') || 
        message.includes('invalid email')) {
      return 'No account found with this email address.';
    }
    
    // Account already exists during signup
    if (message.includes('user already registered') ||
        message.includes('email already in use') ||
        message.includes('already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    
    // Weak password
    if (message.includes('password') && message.includes('weak')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    
    // Invalid email format
    if (message.includes('invalid email format') ||
        message.includes('email is invalid')) {
      return 'Please enter a valid email address.';
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your internet connection.';
    }
  }
  
  // Fallback to original message or generic error
  return error?.message || 'Something went wrong. Please try again.';
};

// Storage keys
const AUTH_STORAGE_KEYS = {
  USER_LEVEL: 'user_level',
  IS_FIRST_TIME: 'is_first_time',
  USER_PROFILE: 'user_profile'
};

// Auth actions
const AUTH_ACTIONS = {
  RESTORE_SESSION: 'RESTORE_SESSION',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
  SIGN_UP: 'SIGN_UP',
  SET_GUEST: 'SET_GUEST',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING'
};

// Initial state
const initialState = {
  isLoading: true,
  isSignedIn: false,
  isGuest: false,
  user: null,
  userData: null,
  userLevel: null,
  isFirstTime: true
};

// Auth reducer
const authReducer = (prevState, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...prevState,
        user: action.user,
        userData: action.userData,
        userLevel: action.userLevel,
        isFirstTime: action.isFirstTime,
        isSignedIn: !!action.user,
        isGuest: action.isGuest || false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_IN:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        user: action.user,
        userData: action.userData,
        userLevel: action.userLevel,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_UP:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        user: action.user,
        userData: action.userData,
        userLevel: action.userLevel,
        isFirstTime: false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_OUT:
      return {
        ...prevState,
        isSignedIn: false,
        isGuest: false,
        user: null,
        userData: null,
        userLevel: null,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SET_GUEST:
      return {
        ...prevState,
        isGuest: true,
        isSignedIn: false,
        user: null,
        userData: { name: 'Guest', email: null },
        isFirstTime: false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...prevState,
        userData: { ...prevState.userData, ...action.userData },
        userLevel: action.userLevel || prevState.userLevel,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...prevState,
        isLoading: action.isLoading,
      };
    
    default:
      return prevState;
  }
};

// Storage helpers
const storage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error('Error setting item in storage:', error);
      return false;
    }
  },
  
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  }
};

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state and listen for auth changes
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Checking for existing Supabase session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        }

        if (mounted) {
          if (session?.user) {
            console.log('✅ Found existing session for:', session.user.email);
            await handleUserSession(session.user);
          } else {
            console.log('ℹ️ No existing session found');
            // Check if user has been here before
            const isFirstTime = await storage.getItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME);
            
            dispatch({
              type: AUTH_ACTIONS.RESTORE_SESSION,
              user: null,
              userData: null,
              userLevel: null,
              isFirstTime: isFirstTime === null,
              isGuest: false
            });
          }
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        if (mounted) {
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            user: null,
            userData: null,
            userLevel: null,
            isFirstTime: true,
            isGuest: false
          });
        }
      }
    };

    // Handle user session data
    const handleUserSession = async (user) => {
      try {
        // Get stored user profile and level
        const storedProfile = await storage.getItem(AUTH_STORAGE_KEYS.USER_PROFILE);
        const storedLevel = await storage.getItem(AUTH_STORAGE_KEYS.USER_LEVEL);
        const isFirstTime = await storage.getItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME);
        
        // Create user data object
        const userData = storedProfile ? JSON.parse(storedProfile) : {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          joinDate: user.created_at
        };

        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          user: user,
          userData: userData,
          userLevel: storedLevel || 'Beginner',
          isFirstTime: isFirstTime === null,
          isGuest: false
        });
        
      } catch (error) {
        console.error('❌ Error handling user session:', error);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);
      
      if (mounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
        }
      }
    });

    getInitialSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth actions
  const authActions = {
    // Sign up user with Supabase
    signUp: async (name, email, password, userLevel = 'Beginner') => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: true });
        
        console.log('🚀 Starting Supabase signup...');
        console.log('📧 Email:', email);
        console.log('👤 Name:', name);
        console.log('🎯 Level:', userLevel);
        
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              name: name,
              user_level: userLevel
            }
          }
        });
        
        if (error) {
          console.error('❌ Supabase signup error:', error);
          const userFriendlyError = getErrorMessage(error);
          console.log('📝 User-friendly error:', userFriendlyError);
          
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
          return { success: false, error: userFriendlyError };
        }
        
        if (data.user) {
          console.log('✅ Supabase signup successful!');
          console.log('👤 User ID:', data.user.id);
          
          // Create user profile data
          const userData = {
            id: data.user.id,
            name: name,
            email: email,
            joinDate: data.user.created_at
          };
          
          // Save user data locally
          await storage.setItem(AUTH_STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
          await storage.setItem(AUTH_STORAGE_KEYS.USER_LEVEL, userLevel);
          await storage.setItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME, 'false');
          
          // Update state
          dispatch({
            type: AUTH_ACTIONS.SIGN_UP,
            user: data.user,
            userData: userData,
            userLevel: userLevel
          });
          
          return { success: true };
          
        } else {
          console.log('⚠️ Signup successful but no user data returned');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
          return { success: false, error: 'Account creation failed. Please try again.' };
        }
        
      } catch (error) {
        console.error('❌ Signup exception:', error);
        const userFriendlyError = getErrorMessage(error);
        
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: userFriendlyError };
      }
    },

    // Sign in user with Supabase
    signIn: async (email, password) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: true });
        
        console.log('🔐 Starting Supabase sign in...');
        console.log('📧 Email:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (error) {
          console.error('❌ Supabase sign in error:', error);
          const userFriendlyError = getErrorMessage(error);
          console.log('📝 User-friendly error:', userFriendlyError);
          
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
          return { success: false, error: userFriendlyError };
        }
        
        if (data.user) {
          console.log('✅ Supabase sign in successful!');
          console.log('👤 User ID:', data.user.id);
          
          // Get stored user data
          const storedProfile = await storage.getItem(AUTH_STORAGE_KEYS.USER_PROFILE);
          const storedLevel = await storage.getItem(AUTH_STORAGE_KEYS.USER_LEVEL);
          
          const userData = storedProfile ? JSON.parse(storedProfile) : {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: email,
            joinDate: data.user.created_at
          };
          
          // Update state - auth state change listener will handle this
          // But we'll return success immediately
          return { success: true };
          
        } else {
          console.log('⚠️ Sign in successful but no user data returned');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
          return { success: false, error: 'Sign in failed. Please try again.' };
        }
        
      } catch (error) {
        console.error('❌ Sign in exception:', error);
        const userFriendlyError = getErrorMessage(error);
        
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: userFriendlyError };
      }
    },

    // Sign out user
    signOut: async () => {
      try {
        console.log('🚪 Signing out...');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('❌ Sign out error:', error);
          return { success: false, error: error.message };
        }
        
        // Clear local storage
        await storage.removeItem(AUTH_STORAGE_KEYS.USER_PROFILE);
        await storage.removeItem(AUTH_STORAGE_KEYS.USER_LEVEL);
        
        console.log('✅ Sign out successful');
        return { success: true };
        
      } catch (error) {
        console.error('❌ Sign out exception:', error);
        return { success: false, error: error.message };
      }
    },

    // Set guest mode
    setGuest: async () => {
      try {
        await storage.setItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME, 'false');
        dispatch({ type: AUTH_ACTIONS.SET_GUEST });
        return { success: true };
      } catch (error) {
        console.error('Error setting guest mode:', error);
        return { success: false, error: error.message };
      }
    },

    // Update user data
    updateUser: async (newUserData, newUserLevel) => {
      try {
        const updatedUserData = { ...state.userData, ...newUserData };
        
        await storage.setItem(AUTH_STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUserData));
        if (newUserLevel) {
          await storage.setItem(AUTH_STORAGE_KEYS.USER_LEVEL, newUserLevel);
        }
        
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          userData: newUserData,
          userLevel: newUserLevel
        });
        
        return { success: true };
      } catch (error) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
      }
    }
  };

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    ...authActions,
    
    // Computed values
    isAuthenticated: state.isSignedIn || state.isGuest,
    userName: state.userData?.name || 'User',
    userEmail: state.userData?.email || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};