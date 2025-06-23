import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabase.config';
import * as SecureStore from 'expo-secure-store';
import DataManager from '../utils/DataManager';

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
  SET_LOADING: 'SET_LOADING',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT' // Added for account deletion
};

// Initial state - FIXED: All properties properly initialized
const initialState = {
  isLoading: true,
  isSignedIn: false,
  isGuest: false,
  user: null,
  userData: null,
  userLevel: null,
  isFirstTime: true
};

// Auth reducer - FIXED: Ensures all state properties are always defined
const authReducer = (prevState, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...prevState,
        user: action.user || null,
        userData: action.userData || null,
        userLevel: action.userLevel || null,
        isFirstTime: action.isFirstTime !== undefined ? action.isFirstTime : true,
        isSignedIn: !!action.user,
        isGuest: action.isGuest || false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_IN:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        user: action.user || null,
        userData: action.userData || null,
        userLevel: action.userLevel || prevState.userLevel,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_UP:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        user: action.user || null,
        userData: action.userData || null,
        userLevel: action.userLevel || 'Beginner',
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
    
    case AUTH_ACTIONS.DELETE_ACCOUNT:
      return {
        ...initialState, // Reset to initial state
        isLoading: false,
        isFirstTime: true, // They'll be treated as new user
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
        userData: { 
          ...(prevState.userData || {}), 
          ...(action.userData || {}) 
        },
        userLevel: action.userLevel || prevState.userLevel,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...prevState,
        isLoading: action.isLoading !== undefined ? action.isLoading : false,
      };
    
    default:
      return prevState;
  }
};

// Storage helpers - FIXED: Better error handling
const storage = {
  getItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      if (value === null || value === undefined) {
        console.warn(`Attempted to store null/undefined value for key: ${key}`);
        return false;
      }
      await SecureStore.setItemAsync(key, String(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },
  
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  },

  // Enhanced method to clear all auth-related storage
  clearAllAuthStorage: async () => {
    try {
      const keysToRemove = [
        AUTH_STORAGE_KEYS.USER_PROFILE,
        AUTH_STORAGE_KEYS.USER_LEVEL,
        AUTH_STORAGE_KEYS.IS_FIRST_TIME,
        'supabase.auth.token',
        'auth_token',
        'user_session',
        'user_preferences'
      ];

      const removePromises = keysToRemove.map(key => 
        SecureStore.deleteItemAsync(key).catch(error => 
          console.log(`Could not remove ${key}:`, error.message)
        )
      );

      await Promise.allSettled(removePromises);
      console.log('✅ All auth storage cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing auth storage:', error);
      return false;
    }
  }
};

// Create Auth Context with default values
const AuthContext = createContext({
  isLoading: true,
  isSignedIn: false,
  isGuest: false,
  user: null,
  userData: null,
  userLevel: null,
  isFirstTime: true,
  isAuthenticated: false,
  userName: 'User',
  userEmail: null
});

// Auth Provider Component - FIXED: Better state management + DataManager integration
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state and listen for auth changes
  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

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
            // Tell DataManager we're in guest mode
            DataManager.handleAuthChange('guest_user');
            
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
          // Tell DataManager we're in guest mode
          DataManager.handleAuthChange('guest_user');
          
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

    // Handle user session data - FIXED: Better null handling + DataManager integration
    const handleUserSession = async (user) => {
      try {
        if (!user) {
          console.warn('handleUserSession called with null user');
          return;
        }

        console.log('🔄 Handling user session for:', user.email);

        // Tell DataManager about the current user FIRST
        await DataManager.handleAuthChange(user.id, {
          fullName: user.user_metadata?.name || '',
          email: user.email,
          username: user.email?.split('@')[0] || 'User'
        });

        // Get stored user profile and level
        const storedProfile = await storage.getItem(AUTH_STORAGE_KEYS.USER_PROFILE);
        const storedLevel = await storage.getItem(AUTH_STORAGE_KEYS.USER_LEVEL);
        const isFirstTime = await storage.getItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME);
        
        // Create user data object with proper fallbacks
        let userData = null;
        try {
          userData = storedProfile ? JSON.parse(storedProfile) : null;
        } catch (parseError) {
          console.error('Error parsing stored profile:', parseError);
          userData = null;
        }

        // Create default user data if none exists
        if (!userData) {
          userData = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            joinDate: user.created_at
          };
        }

        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          user: user,
          userData: userData,
          userLevel: storedLevel || 'Beginner',
          isFirstTime: isFirstTime === null,
          isGuest: false
        });
        
        console.log('✅ User session handled successfully');
        
      } catch (error) {
        console.error('❌ Error handling user session:', error);
        // Even on error, make sure we have a valid state
        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          user: user,
          userData: null,
          userLevel: 'Beginner',
          isFirstTime: true,
          isGuest: false
        });
      }
    };

    // Listen for auth changes - FIXED: Better subscription handling + DataManager integration
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state changed:', event);
        
        if (!mounted) return;
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.email);
            await handleUserSession(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('✅ User signed out');
            // Tell DataManager user logged out
            DataManager.handleAuthChange('guest_user');
            dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('🔄 Token refreshed');
            // No need to reinitialize, just update session
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
        }
      });
      
      return subscription;
    };

    // Initialize
    const initialize = async () => {
      await getInitialSession();
      if (mounted) {
        authSubscription = setupAuthListener();
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Auth actions - FIXED: Better error handling and state management + DataManager integration
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
          
          // Tell DataManager about the new user IMMEDIATELY
          await DataManager.handleAuthChange(data.user.id, {
            fullName: name || '',
            email: email,
            username: name || email.split('@')[0]
          });
          
          // Create user profile data
          const userData = {
            id: data.user.id,
            name: name || 'User',
            email: email || '',
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
          
          console.log('✅ New user fully initialized with fresh data');
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
          
          // Auth state change listener will handle the state update and DataManager
          // Just return success
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
        
        // DataManager will be notified via auth state change listener
        
        console.log('✅ Sign out successful');
        return { success: true };
        
      } catch (error) {
        console.error('❌ Sign out exception:', error);
        return { success: false, error: error.message };
      }
    },

    // DELETE ACCOUNT METHOD - NEW
    deleteAccount: async () => {
      try {
        console.log('🗑️ Starting account deletion process...');
        
        if (!state.user || !state.user.id) {
          console.log('❌ No user found to delete');
          return { success: false, error: 'No user session found' };
        }

        const userId = state.user.id;
        const userEmail = state.userData?.email || 'Unknown';
        console.log('🔍 Deleting account for user:', userId, userEmail);
        
        // Step 1: Create backup before deletion (optional)
        try {
          await DataManager.backupUserDataBeforeDeletion(userId);
        } catch (error) {
          console.log('⚠️ Could not create backup:', error.message);
          // Continue with deletion even if backup fails
        }
        
        // Step 2: Clear all local user data FIRST
        try {
          await DataManager.clearUserDataPermanently(userId);
          console.log('✅ Local user data cleared');
        } catch (error) {
          console.log('⚠️ Error clearing local data:', error);
          // Continue with deletion even if local cleanup fails
        }
        
        // Step 3: Sign out from Supabase (this will clear the session)
        try {
          await supabase.auth.signOut();
          console.log('✅ Supabase session cleared');
        } catch (error) {
          console.log('⚠️ Error clearing Supabase session:', error);
        }
        
        // Step 4: Delete user from Supabase Auth (if possible)
        // Note: Supabase doesn't allow users to delete themselves directly
        // This would need to be done via a server function or admin API
        // For now, we'll just clear the local data and session
        
        // Step 5: Clear all auth-related storage
        await storage.clearAllAuthStorage();
        
        // Step 6: Reset DataManager to guest mode
        DataManager.handleAuthChange('guest_user');
        
        // Step 7: Reset auth state completely
        dispatch({ type: AUTH_ACTIONS.DELETE_ACCOUNT });
        
        console.log('✅ Account deletion completed successfully');
        
        return { 
          success: true, 
          message: 'Account and all data deleted successfully' 
        };
        
      } catch (error) {
        console.error('💥 Account deletion failed:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to delete account' 
        };
      }
    },

    // Set guest mode
    setGuest: async () => {
      try {
        console.log('👤 Setting guest mode');
        
        // Tell DataManager we're in guest mode
        DataManager.handleAuthChange('guest_user');
        
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
        const updatedUserData = { 
          ...(state.userData || {}), 
          ...(newUserData || {}) 
        };
        
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

  // Context value - FIXED: Ensure all values are properly defined
  const contextValue = {
    // State
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    isGuest: state.isGuest,
    user: state.user,
    userData: state.userData,
    userLevel: state.userLevel,
    isFirstTime: state.isFirstTime,
    
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