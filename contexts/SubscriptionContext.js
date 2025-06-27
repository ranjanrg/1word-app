import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE_TRIAL: 'free_trial',
  BASIC: 'basic',
  PRO: 'pro',
  EXPIRED: 'expired'
};

// Plan configurations
export const PLAN_CONFIG = {
  [SUBSCRIPTION_PLANS.FREE_TRIAL]: {
    name: 'Free Trial',
    price: 0,
    duration: 7, // days
    wordsPerDay: 5,
    features: ['5 words per day', 'All premium features', 'Hindi translations', 'Audio pronunciations']
  },
  [SUBSCRIPTION_PLANS.BASIC]: {
    name: 'Basic Plan',
    price: 29,
    duration: 30, // days
    wordsPerDay: 1,
    features: ['1 word per day', 'Basic flashcards', 'Hindi translations', 'Progress tracking']
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    name: 'Pro Plan',
    price: 99,
    duration: 30, // days
    wordsPerDay: 5,
    features: ['5 words per day', 'All premium features', 'Advanced analytics', 'Audio pronunciations', 'Offline mode']
  }
};

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(SUBSCRIPTION_PLANS.FREE_TRIAL);
  const [planExpiry, setPlanExpiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyWordsUsed, setDailyWordsUsed] = useState(0);

  // Storage keys
  const STORAGE_KEYS = {
    SUBSCRIPTION_PLAN: 'subscription_plan',
    PLAN_EXPIRY: 'plan_expiry',
    TRIAL_START: 'trial_start_date',
    DAILY_WORDS_USED: 'daily_words_used',
    LAST_RESET_DATE: 'last_reset_date'
  };

  // Initialize subscription state
  useEffect(() => {
    if (isAuthenticated) {
      initializeSubscription();
    }
  }, [isAuthenticated, user]);

  const initializeSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has existing subscription
      const storedPlan = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PLAN);
      const storedExpiry = await AsyncStorage.getItem(STORAGE_KEYS.PLAN_EXPIRY);
      const trialStart = await AsyncStorage.getItem(STORAGE_KEYS.TRIAL_START);
      
      if (storedPlan && storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        const now = new Date();
        
        if (now > expiryDate) {
          // Plan expired
          await handlePlanExpiry();
        } else {
          // Valid plan
          setCurrentPlan(storedPlan);
          setPlanExpiry(expiryDate);
        }
      } else if (!trialStart) {
        // New user - start free trial
        await startFreeTrial();
      } else {
        // Check if trial expired
        const trialDate = new Date(trialStart);
        const now = new Date();
        const daysDiff = Math.floor((now - trialDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 7) {
          // Trial expired
          await handlePlanExpiry();
        } else {
          // Trial still active
          setCurrentPlan(SUBSCRIPTION_PLANS.FREE_TRIAL);
          const trialExpiry = new Date(trialDate);
          trialExpiry.setDate(trialExpiry.getDate() + 7);
          setPlanExpiry(trialExpiry);
        }
      }
      
      // Load daily usage
      await loadDailyUsage();
      
    } catch (error) {
      console.error('Error initializing subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startFreeTrial = async () => {
    try {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      await AsyncStorage.setItem(STORAGE_KEYS.TRIAL_START, now.toISOString());
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, SUBSCRIPTION_PLANS.FREE_TRIAL);
      await AsyncStorage.setItem(STORAGE_KEYS.PLAN_EXPIRY, expiryDate.toISOString());
      
      setCurrentPlan(SUBSCRIPTION_PLANS.FREE_TRIAL);
      setPlanExpiry(expiryDate);
      
      console.log('✅ Free trial started');
    } catch (error) {
      console.error('Error starting free trial:', error);
    }
  };

  const handlePlanExpiry = async () => {
    try {
      setCurrentPlan(SUBSCRIPTION_PLANS.EXPIRED);
      setPlanExpiry(null);
      
      // Clear expired plan data
      await AsyncStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_PLAN);
      await AsyncStorage.removeItem(STORAGE_KEYS.PLAN_EXPIRY);
      
      console.log('❌ Plan expired');
    } catch (error) {
      console.error('Error handling plan expiry:', error);
    }
  };

  const loadDailyUsage = async () => {
    try {
      const today = new Date().toDateString();
      const lastResetDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
      const storedUsage = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_WORDS_USED);
      
      if (lastResetDate !== today) {
        // New day - reset usage
        setDailyWordsUsed(0);
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_WORDS_USED, '0');
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      } else {
        // Same day - use stored usage
        setDailyWordsUsed(parseInt(storedUsage || '0'));
      }
    } catch (error) {
      console.error('Error loading daily usage:', error);
    }
  };

  const incrementDailyUsage = async () => {
    try {
      const newUsage = dailyWordsUsed + 1;
      setDailyWordsUsed(newUsage);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_WORDS_USED, newUsage.toString());
      return newUsage;
    } catch (error) {
      console.error('Error incrementing daily usage:', error);
      return dailyWordsUsed;
    }
  };

  const canLearnWord = () => {
    if (currentPlan === SUBSCRIPTION_PLANS.EXPIRED) {
      return { canLearn: false, reason: 'subscription_expired' };
    }
    
    const planConfig = PLAN_CONFIG[currentPlan];
    if (!planConfig) {
      return { canLearn: false, reason: 'invalid_plan' };
    }
    
    if (dailyWordsUsed >= planConfig.wordsPerDay) {
      return { canLearn: false, reason: 'daily_limit_reached' };
    }
    
    return { canLearn: true, wordsRemaining: planConfig.wordsPerDay - dailyWordsUsed };
  };

  const subscribeToPlan = async (planType) => {
    try {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + PLAN_CONFIG[planType].duration);
      
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLAN, planType);
      await AsyncStorage.setItem(STORAGE_KEYS.PLAN_EXPIRY, expiryDate.toISOString());
      
      setCurrentPlan(planType);
      setPlanExpiry(expiryDate);
      
      console.log(`✅ Subscribed to ${planType} plan`);
      return { success: true };
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return { success: false, error: error.message };
    }
  };

  const getDaysRemaining = () => {
    if (!planExpiry) return 0;
    
    const now = new Date();
    const diffTime = planExpiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getPlanInfo = () => {
    return {
      currentPlan,
      planConfig: PLAN_CONFIG[currentPlan],
      planExpiry,
      daysRemaining: getDaysRemaining(),
      dailyWordsUsed,
      dailyLimit: PLAN_CONFIG[currentPlan]?.wordsPerDay || 0,
      isTrialActive: currentPlan === SUBSCRIPTION_PLANS.FREE_TRIAL,
      isPlanExpired: currentPlan === SUBSCRIPTION_PLANS.EXPIRED
    };
  };

  const contextValue = {
    // State
    currentPlan,
    planExpiry,
    dailyWordsUsed,
    isLoading,
    
    // Plan info
    getPlanInfo,
    canLearnWord,
    getDaysRemaining,
    
    // Actions
    subscribeToPlan,
    incrementDailyUsage,
    startFreeTrial,
    
    // Utils
    SUBSCRIPTION_PLANS,
    PLAN_CONFIG
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};