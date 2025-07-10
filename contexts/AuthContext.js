// contexts/AuthContext.js - FIXED VERSION
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabase.config';
import * as SecureStore from 'expo-secure-store';
import DataManager from '../utils/DataManager';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

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

// Auth reducer (same as before)
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

// Storage helpers
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
  }
};

// Create Auth Context
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

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configure Google Sign-In
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: '280064203476-5v7vflvcb7kpn6vqlvkj46oq0qia76uq.apps.googleusercontent.com', // Your Web Client ID
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });
      console.log('🔧 Google Sign-In configured');
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
    }
  }, []);

  // Apply pending assessment data after Google Sign-In
  const applyPendingAssessmentData = async (userData) => {
    try {
      const pendingData = await storage.getItem('pendingAssessmentData');
      if (pendingData) {
        const assessmentData = JSON.parse(pendingData);
        console.log('📊 Applying pending assessment data:', assessmentData);
        
        await storage.setItem(AUTH_STORAGE_KEYS.USER_LEVEL, assessmentData.userLevel);
        await storage.setItem('familiarWords', JSON.stringify(assessmentData.selectedWords));
        await storage.setItem('learningGoals', JSON.stringify(assessmentData.learningGoals));
        
        await storage.removeItem('pendingAssessmentData');
        
        console.log('✅ Assessment data applied successfully');
        return {
          ...userData,
          userLevel: assessmentData.userLevel,
          assessmentCompleted: true
        };
      }
      return userData;
    } catch (error) {
      console.error('❌ Error applying assessment data:', error);
      return userData;
    }
  };

  // 🔥 FIXED: Create or get user profile - no pre-check
  const createOrGetUserProfile = async (user) => {
    try {
      console.log('🔄 Creating or getting user profile for:', user.email);
      
      // First, try to get existing profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (existingProfile) {
        console.log('✅ Found existing profile for:', user.email);
        return existingProfile;
      }
      
      // If no existing profile, create new one
      if (selectError?.code === 'PGRST116') { // No rows found
        console.log('🆕 Creating new profile for:', user.email);
        
        // Get pending assessment data
        const pendingData = await storage.getItem('pendingAssessmentData');
        let assessmentData = null;
        
        if (pendingData) {
          try {
            assessmentData = JSON.parse(pendingData);
            console.log('📊 Found pending assessment data');
          } catch (error) {
            console.error('❌ Error parsing pending assessment data:', error);
          }
        }
        
        // Create profile with assessment data if available
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          username: user.email?.split('@')[0] || 'User',
          level: assessmentData?.userLevel || 'Beginner',
          learning_goals: assessmentData?.learningGoals || [],
          total_words: 0,
          current_streak: 0,
          is_new_user: !assessmentData // If they have assessment data, they're not "new"
        };
        
        const { data: createdProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
          throw insertError;
        }
        
        // Clean up pending assessment data
        if (assessmentData) {
          await storage.removeItem('pendingAssessmentData');
          console.log('🧹 Cleaned up pending assessment data');
        }
        
        console.log('✅ Created new profile for:', user.email);
        return createdProfile;
      } else {
        throw selectError;
      }
    } catch (error) {
      console.error('❌ Error in createOrGetUserProfile:', error);
      throw error;
    }
  };

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
            DataManager.handleAuthChange('guest_user');
            
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

    // Handle user session data
    const handleUserSession = async (user) => {
      try {
        if (!user) {
          console.warn('handleUserSession called with null user');
          return;
        }

        console.log('🔄 Handling user session for:', user.email);

        // Set up DataManager for this user
        await DataManager.handleAuthChange(user.id, {
          fullName: user.user_metadata?.name || '',
          email: user.email,
          username: user.email?.split('@')[0] || 'User'
        });

        // Get user data from local storage first
        const storedProfile = await storage.getItem(AUTH_STORAGE_KEYS.USER_PROFILE);
        const storedLevel = await storage.getItem(AUTH_STORAGE_KEYS.USER_LEVEL);
        const isFirstTime = await storage.getItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME);
        
        let userData = null;
        try {
          userData = storedProfile ? JSON.parse(storedProfile) : null;
        } catch (parseError) {
          console.error('Error parsing stored profile:', parseError);
          userData = null;
        }

        if (!userData) {
          userData = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            joinDate: user.created_at,
            authMethod: user.app_metadata?.provider || 'google'
          };
        }

        console.log('🔍 AUTHCONTEXT - userData before assessment:', userData);
        console.log('🔍 AUTHCONTEXT - storedLevel:', storedLevel);
        // Apply pending assessment data if available
        userData = await applyPendingAssessmentData(userData);

        console.log('🔍 AUTHCONTEXT - userData after assessment:', userData);
        console.log('🔍 AUTHCONTEXT - final userLevel for dispatch:', storedLevel || userData.userLevel || 'Beginner');
        
        const databaseProfile = await DataManager.getUserProfile();

        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          user: user,
          userData: userData,
          userLevel: databaseProfile.level || storedLevel || 'Beginner', // ← Database first!
          isFirstTime: isFirstTime === null,
          isGuest: false
        });
        
        console.log('✅ User session handled successfully');
        
      } catch (error) {
        console.error('❌ Error handling user session:', error);
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

    // Setup auth listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state changed:', event);
        
        if (!mounted) return;
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.email);
            await handleUserSession(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('✅ User logged out');
            DataManager.handleAuthChange('guest_user');
            dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log('🔄 Token refreshed');
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
        }
      });
      
      return subscription;
    };

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

  // 🔥 FIXED: Simplified Google Sign-In
  const signInWithGoogle = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: true });
      
      console.log('🔐 Starting Google sign in...');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google sign-in successful!', userInfo);
      
      // Sign in to Supabase with Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken || userInfo.data?.idToken,
      });
      
      if (error) {
        console.error('❌ Supabase Google auth error:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: 'Google sign-in failed. Please try again.' };
      }
      
      if (data.user) {
        console.log('✅ Supabase Google auth successful!');
        
        // Create or get user profile (this handles both new and existing users)
        try {
          await createOrGetUserProfile(data.user);
          console.log('✅ User profile ready');
        } catch (profileError) {
          console.error('❌ Error setting up user profile:', profileError);
          // Don't fail the sign-in for profile errors
        }
        
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: 'Google sign-in failed. Please try again.' };
      }
      
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      
      let errorMessage = 'Google sign-in failed';
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services not available';
      } else if (error.code === statusCodes.DEVELOPER_ERROR) {
        errorMessage = 'Developer error - please contact support';
        console.error('🔥 DEVELOPER_ERROR - Check SHA-1 certificates!', error);
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
      return { success: false, error: errorMessage };
    }
  };

  // Rest of the methods remain the same...
  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      
      try {
        await GoogleSignin.signOut();
        console.log('✅ Google sign out successful');
      } catch (googleError) {
        console.log('ℹ️ No Google session to sign out from');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
      }
      
      await storage.removeItem(AUTH_STORAGE_KEYS.USER_PROFILE);
      await storage.removeItem(AUTH_STORAGE_KEYS.USER_LEVEL);
      
      console.log('✅ Sign out successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      return { success: false, error: error.message };
    }
  };

  const setGuest = async () => {
    try {
      console.log('👤 Setting guest mode');
      
      DataManager.handleAuthChange('guest_user');
      
      await storage.setItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME, 'false');
      dispatch({ type: AUTH_ACTIONS.SET_GUEST });
      return { success: true };
    } catch (error) {
      console.error('Error setting guest mode:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (newUserData, newUserLevel) => {
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
  };

  // Context value
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
    signInWithGoogle,
    signOut,
    updateUser,
    
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