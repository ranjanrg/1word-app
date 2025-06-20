import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const AUTH_STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  IS_FIRST_TIME: 'is_first_time',
  USER_LEVEL: 'user_level'
};

// Auth actions
const AUTH_ACTIONS = {
  RESTORE_TOKEN: 'RESTORE_TOKEN',
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
  userToken: null,
  userData: null,
  userLevel: null,
  isFirstTime: true
};

// Auth reducer
const authReducer = (prevState, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...prevState,
        userToken: action.token,
        userData: action.userData,
        userLevel: action.userLevel,
        isFirstTime: action.isFirstTime,
        isSignedIn: !!action.token,
        isGuest: action.isGuest || false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_IN:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        userToken: action.token,
        userData: action.userData,
        userLevel: action.userLevel,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SIGN_UP:
      return {
        ...prevState,
        isSignedIn: true,
        isGuest: false,
        userToken: action.token,
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
        userToken: null,
        userData: null,
        userLevel: null,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SET_GUEST:
      return {
        ...prevState,
        isGuest: true,
        isSignedIn: false,
        userToken: null,
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
  },
  
  multiRemove: async (keys) => {
    try {
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
      return true;
    } catch (error) {
      console.error('Error removing multiple items from storage:', error);
      return false;
    }
  }
};

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authentication state on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const isFirstTime = await storage.getItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME);
        const userToken = await storage.getItem(AUTH_STORAGE_KEYS.USER_TOKEN);
        const userData = await storage.getItem(AUTH_STORAGE_KEYS.USER_DATA);
        const userLevel = await storage.getItem(AUTH_STORAGE_KEYS.USER_LEVEL);
        
        dispatch({
          type: AUTH_ACTIONS.RESTORE_TOKEN,
          token: userToken,
          userData: userData ? JSON.parse(userData) : null,
          userLevel: userLevel,
          isFirstTime: isFirstTime === null,
          isGuest: false
        });
      } catch (error) {
        console.error('Error restoring auth state:', error);
        dispatch({
          type: AUTH_ACTIONS.RESTORE_TOKEN,
          token: null,
          userData: null,
          userLevel: null,
          isFirstTime: true,
          isGuest: false
        });
      }
    };

    bootstrapAsync();
  }, []);

  // Auth actions
  const authActions = {
    // Sign in user
    signIn: async (email, password) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: true });
        
        console.log('Signing in:', email, password);
        
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock validation
        if (email === 'test@example.com' && password === 'password') {
          const mockToken = 'mock-jwt-token-' + Date.now();
          const mockUserData = {
            id: '1',
            name: 'Test User',
            email: email,
            joinDate: new Date().toISOString()
          };
          const mockUserLevel = 'Intermediate';
          
          // Store in SecureStore
          await storage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, mockToken);
          await storage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(mockUserData));
          await storage.setItem(AUTH_STORAGE_KEYS.USER_LEVEL, mockUserLevel);
          await storage.setItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME, 'false');
          
          dispatch({
            type: AUTH_ACTIONS.SIGN_IN,
            token: mockToken,
            userData: mockUserData,
            userLevel: mockUserLevel
          });
          
          return { success: true };
        } else {
          throw new Error('Invalid credentials');
        }
      } catch (error) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: error.message };
      }
    },

    // Sign up user
    signUp: async (name, email, password, userLevel = 'Beginner') => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: true });
        
        console.log('Signing up:', name, email, password, userLevel);
        
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        const mockUserData = {
          id: Date.now().toString(),
          name: name,
          email: email,
          joinDate: new Date().toISOString()
        };
        
        // Store in SecureStore
        await storage.setItem(AUTH_STORAGE_KEYS.USER_TOKEN, mockToken);
        await storage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(mockUserData));
        await storage.setItem(AUTH_STORAGE_KEYS.USER_LEVEL, userLevel);
        await storage.setItem(AUTH_STORAGE_KEYS.IS_FIRST_TIME, 'false');
        
        dispatch({
          type: AUTH_ACTIONS.SIGN_UP,
          token: mockToken,
          userData: mockUserData,
          userLevel: userLevel
        });
        
        return { success: true };
      } catch (error) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, isLoading: false });
        return { success: false, error: error.message };
      }
    },

    // Sign out user
    signOut: async () => {
      try {
        await storage.multiRemove([
          AUTH_STORAGE_KEYS.USER_TOKEN,
          AUTH_STORAGE_KEYS.USER_DATA,
          AUTH_STORAGE_KEYS.USER_LEVEL
        ]);
        
        dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
        return { success: true };
      } catch (error) {
        console.error('Error signing out:', error);
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
        
        await storage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUserData));
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