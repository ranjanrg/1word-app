import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress',
  LEARNED_WORDS: 'learned_words',
  USER_PROFILE: 'user_profile'
};

// Simple way to get current user ID without importing Supabase
// We'll pass the userId from the AuthContext instead
let currentUserId = 'guest_user';

// Method to set current user (called from AuthContext)
const setCurrentUser = (userId) => {
  currentUserId = userId || 'guest_user';
  console.log('👤 DataManager: Current user set to:', currentUserId);
};

// Generate user-specific storage keys
const getUserStorageKey = (userId, keyType) => {
  return `user_${userId}_${keyType}`;
};

// Default data structure
const DEFAULT_PROGRESS = {
  wordsLearned: 0,
  currentStreak: 0,
  lastLearningDate: null,
  weeklyProgress: [
    { day: 'F', date: '13', completed: false },
    { day: 'S', date: '14', completed: false },
    { day: 'S', date: '15', completed: false },
    { day: 'M', date: '16', completed: false },
    { day: 'T', date: '17', completed: false },
    { day: 'W', date: '18', completed: false, isToday: true },
    { day: 'T', date: '19', completed: false },
  ]
};

const DEFAULT_PROFILE = {
  level: 'Beginner',
  learningGoals: [],
  joinDate: new Date().toISOString(),
  username: 'User',
  fullName: '',        // Added for full name storage
  email: '',
  totalWords: 0,
  streak: 0,
  isNewUser: true
};

class DataManager {
  
  // Set current user (called from AuthContext)
  static setCurrentUser(userId) {
    setCurrentUser(userId);
  }

  // Initialize fresh user data for new users with full name support
  static async initializeUserData(userId, fullName, email, username = null) {
    try {
      console.log('🔄 Initializing fresh data for new user:', { userId, fullName, email, username });
      
      // Use fullName if provided, otherwise fall back to username or email
      const displayName = fullName || username || (email ? email.split('@')[0] : 'User');
      const userUsername = username || (email ? email.split('@')[0] : 'User');
      
      const freshProfile = {
        ...DEFAULT_PROFILE,
        fullName: fullName || '',           // Store the actual full name
        username: userUsername,             // Store username separately
        email: email,
        joinDate: new Date().toISOString(),
        isNewUser: true
      };

      const freshProgress = {
        ...DEFAULT_PROGRESS,
        weeklyProgress: this.generateCurrentWeekProgress()
      };

      // Save fresh data with user-specific keys
      const profileKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROFILE);
      const progressKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROGRESS);
      const wordsKey = getUserStorageKey(userId, STORAGE_KEYS.LEARNED_WORDS);

      await Promise.all([
        SecureStore.setItemAsync(profileKey, JSON.stringify(freshProfile)),
        SecureStore.setItemAsync(progressKey, JSON.stringify(freshProgress)),
        SecureStore.setItemAsync(wordsKey, JSON.stringify([]))
      ]);
      
      console.log('✅ Fresh user data initialized with full name:', fullName);
      return { profile: freshProfile, progress: freshProgress };
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      throw error;
    }
  }

  // Generate current week progress based on actual dates
  static generateCurrentWeekProgress() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Start from Monday (1) to Sunday (0)
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const progress = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + 1 + i); // Start from Monday
      
      progress.push({
        day: daysOfWeek[i],
        date: date.getDate().toString(),
        completed: false,
        isToday: i === (currentDay === 0 ? 6 : currentDay - 1) // Adjust for Sunday = 0
      });
    }
    
    return progress;
  }

  // Get user progress data with user isolation
  static async getUserProgress() {
    try {
      const userId = currentUserId;
      console.log('🔍 Getting progress for user:', userId);

      const progressKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROGRESS);
      const data = await SecureStore.getItemAsync(progressKey);
      
      if (data) {
        const progress = JSON.parse(data);
        console.log('✅ Retrieved user progress:', { userId, wordsLearned: progress.wordsLearned, streak: progress.currentStreak });
        return progress;
      }
      
      // No progress found - return fresh default
      console.log('⚠️ No progress found for user, returning default');
      const freshProgress = {
        ...DEFAULT_PROGRESS,
        weeklyProgress: this.generateCurrentWeekProgress()
      };
      
      // Save the fresh progress
      await this.saveUserProgress(freshProgress);
      return freshProgress;
    } catch (error) {
      console.error('❌ Error getting user progress:', error);
      return DEFAULT_PROGRESS;
    }
  }

  // Save user progress data with user isolation
  static async saveUserProgress(progressData) {
    try {
      const userId = currentUserId;
      console.log('💾 Saving progress for user:', userId);

      const progressKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROGRESS);
      await SecureStore.setItemAsync(progressKey, JSON.stringify(progressData));
      console.log('✅ User progress saved:', { userId, wordsLearned: progressData.wordsLearned, streak: progressData.currentStreak });
      return true;
    } catch (error) {
      console.error('❌ Error saving user progress:', error);
      return false;
    }
  }

  // Get learned words history with user isolation
  static async getLearnedWords() {
    try {
      const userId = currentUserId;

      const wordsKey = getUserStorageKey(userId, STORAGE_KEYS.LEARNED_WORDS);
      const data = await SecureStore.getItemAsync(wordsKey);
      
      const words = data ? JSON.parse(data) : [];
      console.log('✅ Retrieved learned words:', { userId, wordCount: words.length });
      return words;
    } catch (error) {
      console.error('❌ Error getting learned words:', error);
      return [];
    }
  }

  // Add a new learned word with user isolation
  static async addLearnedWord(word, meaning, emoji = '📖') {
    try {
      const userId = currentUserId;

      const existingWords = await this.getLearnedWords();
      
      // Check if word already exists for this user
      const wordExists = existingWords.some(w => w.word.toLowerCase() === word.toLowerCase());
      if (wordExists) {
        console.log('⚠️ Word already learned by this user:', word);
        return true; // Don't add duplicate, but return success
      }

      const newWord = {
        word: word,
        meaning: meaning,
        emoji: emoji,
        date: new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        }),
        timestamp: new Date().toISOString()
      };
      
      // Add to beginning of array (most recent first)
      const updatedWords = [newWord, ...existingWords];
      
      // Keep all words (removed the 10 word limit)
      const wordsKey = getUserStorageKey(userId, STORAGE_KEYS.LEARNED_WORDS);
      await SecureStore.setItemAsync(wordsKey, JSON.stringify(updatedWords));
      
      console.log('✅ Word added for user:', { userId, word, totalWords: updatedWords.length });
      return true;
    } catch (error) {
      console.error('❌ Error adding learned word:', error);
      return false;
    }
  }

  // Update progress after learning a word with user isolation
  static async updateProgressAfterLearning() {
    try {
      const userId = currentUserId;

      const currentProgress = await this.getUserProgress();
      const today = new Date().toDateString();
      const lastLearningDate = currentProgress.lastLearningDate;
      
      // Calculate new streak
      let newStreak = currentProgress.currentStreak;
      
      if (lastLearningDate !== today) {
        // Learning for the first time today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLearningDate === yesterday.toDateString()) {
          // Consecutive day - increase streak
          newStreak = currentProgress.currentStreak + 1;
        } else if (lastLearningDate === null || lastLearningDate === today) {
          // First ever learning or same day
          newStreak = 1;
        } else {
          // Streak broken - reset to 1
          newStreak = 1;
        }
      }
      
      // Update weekly progress (mark today as completed)
      const updatedWeeklyProgress = currentProgress.weeklyProgress.map(day => {
        if (day.isToday) {
          return { ...day, completed: true };
        }
        return day;
      });
      
      const updatedProgress = {
        ...currentProgress,
        wordsLearned: currentProgress.wordsLearned + 1,
        currentStreak: newStreak,
        lastLearningDate: today,
        weeklyProgress: updatedWeeklyProgress
      };
      
      await this.saveUserProgress(updatedProgress);
      
      // Also update the profile with latest counts
      await this.syncProfileWithProgress(updatedProgress);
      
      console.log('✅ Progress updated for user:', { 
        userId, 
        wordsLearned: updatedProgress.wordsLearned, 
        streak: updatedProgress.currentStreak 
      });
      
      return updatedProgress;
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      return null;
    }
  }

  // Sync profile data with progress data
  static async syncProfileWithProgress(progressData) {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        totalWords: progressData.wordsLearned,
        streak: progressData.currentStreak,
        isNewUser: false
      };
      await this.saveUserProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('❌ Error syncing profile with progress:', error);
      return false;
    }
  }

  // Get user profile with user isolation
  static async getUserProfile() {
    try {
      const userId = currentUserId;

      const profileKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROFILE);
      const data = await SecureStore.getItemAsync(profileKey);
      
      if (data) {
        const profile = JSON.parse(data);
        console.log('✅ Retrieved user profile:', { 
          userId, 
          fullName: profile.fullName, 
          level: profile.level, 
          totalWords: profile.totalWords 
        });
        return profile;
      }
      
      // No profile found - return fresh default
      console.log('⚠️ No profile found for user, returning default');
      const freshProfile = {
        ...DEFAULT_PROFILE,
        joinDate: new Date().toISOString()
      };
      
      // Save the fresh profile
      await this.saveUserProfile(freshProfile);
      return freshProfile;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return DEFAULT_PROFILE;
    }
  }

  // Save user profile with user isolation
  static async saveUserProfile(profileData) {
    try {
      const userId = currentUserId;

      const profileKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROFILE);
      await SecureStore.setItemAsync(profileKey, JSON.stringify(profileData));
      console.log('✅ User profile saved:', { userId, level: profileData.level, fullName: profileData.fullName });
      return true;
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      return false;
    }
  }

  // Update user level from assessment
  static async updateUserLevel(level) {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        level: level
      };
      await this.saveUserProfile(updatedProfile);
      console.log('✅ User level updated:', level);
      return true;
    } catch (error) {
      console.error('❌ Error updating user level:', error);
      return false;
    }
  }

  // Update learning goals
  static async updateLearningGoals(goals) {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        learningGoals: goals
      };
      await this.saveUserProfile(updatedProfile);
      console.log('✅ Learning goals updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating learning goals:', error);
      return false;
    }
  }

  // Update user's full name
  static async updateUserFullName(fullName) {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        fullName: fullName
      };
      await this.saveUserProfile(updatedProfile);
      console.log('✅ User full name updated:', fullName);
      return true;
    } catch (error) {
      console.error('❌ Error updating user full name:', error);
      return false;
    }
  }

  // Handle user authentication change (called from AuthContext)
  static async handleAuthChange(userId, userInfo = null) {
    try {
      if (userId && userId !== 'guest_user') {
        // User logged in - set current user and check if they need fresh data
        setCurrentUser(userId);
        
        const profileKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROFILE);
        const existingProfile = await SecureStore.getItemAsync(profileKey);
        
        if (!existingProfile) {
          // New user - initialize fresh data
          const fullName = userInfo?.fullName || userInfo?.name || '';
          const email = userInfo?.email || 'user@example.com';
          const username = userInfo?.username || email.split('@')[0];
          
          await this.initializeUserData(userId, fullName, email, username);
          console.log('✅ Fresh data created for new authenticated user');
        } else {
          console.log('✅ Existing user data found');
        }
      } else {
        // User logged out or guest
        setCurrentUser('guest_user');
        console.log('✅ User logged out or guest mode');
      }
    } catch (error) {
      console.error('❌ Error handling auth change:', error);
    }
  }

  // Clear user data (for current user only)
  static async clearUserData() {
    try {
      const userId = currentUserId;

      const profileKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROFILE);
      const progressKey = getUserStorageKey(userId, STORAGE_KEYS.USER_PROGRESS);
      const wordsKey = getUserStorageKey(userId, STORAGE_KEYS.LEARNED_WORDS);
      
      await Promise.all([
        SecureStore.deleteItemAsync(profileKey),
        SecureStore.deleteItemAsync(progressKey),
        SecureStore.deleteItemAsync(wordsKey)
      ]);
      
      console.log('✅ User data cleared for:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      return false;
    }
  }

  // Reset all data (for testing)
  static async resetAllData() {
    try {
      // Clear current user's data
      await this.clearUserData();
      return true;
    } catch (error) {
      console.error('❌ Error resetting data:', error);
      return false;
    }
  }

  // Add these methods to your DataManager class

// Enhanced method to completely clear user data for account deletion
static async clearUserDataPermanently(userId = null) {
  try {
    const targetUserId = userId || currentUserId;
    console.log('🗑️ Permanently clearing all data for user:', targetUserId);

    // Get all storage keys for this user
    const profileKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROFILE);
    const progressKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROGRESS);
    const wordsKey = getUserStorageKey(targetUserId, STORAGE_KEYS.LEARNED_WORDS);
    
    // Additional keys that might exist
    const additionalKeys = [
      `user_${targetUserId}_preferences`,
      `user_${targetUserId}_settings`,
      `user_${targetUserId}_achievements`,
      `user_${targetUserId}_backup`,
      `user_${targetUserId}_cache`
    ];

    // Combine all keys
    const allKeys = [profileKey, progressKey, wordsKey, ...additionalKeys];
    
    // Delete all data
    const deletePromises = allKeys.map(async (key) => {
      try {
        await SecureStore.deleteItemAsync(key);
        console.log(`✅ Deleted: ${key}`);
      } catch (error) {
        console.log(`⚠️ Could not delete ${key}:`, error.message);
        // Continue with other deletions even if one fails
      }
    });
    
    await Promise.allSettled(deletePromises);
    
    console.log('✅ User data permanently cleared for:', targetUserId);
    return true;
  } catch (error) {
    console.error('❌ Error permanently clearing user data:', error);
    return false;
  }
}

// Method to get all storage keys for a user (useful for debugging)
static async getUserStorageKeys(userId = null) {
  try {
    const targetUserId = userId || currentUserId;
    
    const possibleKeys = [
      getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROFILE),
      getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROGRESS),
      getUserStorageKey(targetUserId, STORAGE_KEYS.LEARNED_WORDS),
      `user_${targetUserId}_preferences`,
      `user_${targetUserId}_settings`,
      `user_${targetUserId}_achievements`,
      `user_${targetUserId}_backup`,
      `user_${targetUserId}_cache`
    ];
    
    const existingKeys = [];
    
    for (const key of possibleKeys) {
      try {
        const data = await SecureStore.getItemAsync(key);
        if (data !== null) {
          existingKeys.push(key);
        }
      } catch (error) {
        // Key doesn't exist or can't be read
      }
    }
    
    console.log('📋 Existing storage keys for user:', targetUserId, existingKeys);
    return existingKeys;
  } catch (error) {
    console.error('❌ Error getting user storage keys:', error);
    return [];
  }
}

// Method to check if user data exists (useful before deletion)
static async checkUserDataExists(userId = null) {
  try {
    const targetUserId = userId || currentUserId;
    
    const profileKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROFILE);
    const progressKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROGRESS);
    const wordsKey = getUserStorageKey(targetUserId, STORAGE_KEYS.LEARNED_WORDS);
    
    const checks = await Promise.allSettled([
      SecureStore.getItemAsync(profileKey),
      SecureStore.getItemAsync(progressKey),
      SecureStore.getItemAsync(wordsKey)
    ]);
    
    const dataExists = {
      profile: checks[0].status === 'fulfilled' && checks[0].value !== null,
      progress: checks[1].status === 'fulfilled' && checks[1].value !== null,
      words: checks[2].status === 'fulfilled' && checks[2].value !== null,
      hasAnyData: false
    };
    
    dataExists.hasAnyData = dataExists.profile || dataExists.progress || dataExists.words;
    
    console.log('🔍 User data existence check:', targetUserId, dataExists);
    return dataExists;
  } catch (error) {
    console.error('❌ Error checking user data existence:', error);
    return { profile: false, progress: false, words: false, hasAnyData: false };
  }
}

// Enhanced clear method that also handles account deletion
static async clearUserData(userId = null) {
  try {
    const targetUserId = userId || currentUserId;
    console.log('🔄 Clearing user data for:', targetUserId);

    // Check if this is for account deletion (when userId is explicitly provided)
    const isAccountDeletion = userId !== null && userId !== currentUserId;
    
    if (isAccountDeletion) {
      console.log('🗑️ Account deletion mode - using permanent clear');
      return await this.clearUserDataPermanently(targetUserId);
    }
    
    // Regular data clear (keep the existing logic)
    const profileKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROFILE);
    const progressKey = getUserStorageKey(targetUserId, STORAGE_KEYS.USER_PROGRESS);
    const wordsKey = getUserStorageKey(targetUserId, STORAGE_KEYS.LEARNED_WORDS);
    
    await Promise.all([
      SecureStore.deleteItemAsync(profileKey),
      SecureStore.deleteItemAsync(progressKey),
      SecureStore.deleteItemAsync(wordsKey)
    ]);
    
    console.log('✅ User data cleared for:', targetUserId);
    return true;
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    return false;
  }
}

// Method to backup user data before deletion (optional safety feature)
static async backupUserDataBeforeDeletion(userId = null) {
  try {
    const targetUserId = userId || currentUserId;
    console.log('💾 Creating backup before deletion for:', targetUserId);
    
    const profile = await this.getUserProfile();
    const progress = await this.getUserProgress();
    const words = await this.getLearnedWords();
    
    const backup = {
      userId: targetUserId,
      timestamp: new Date().toISOString(),
      profile,
      progress,
      words,
      metadata: {
        version: '1.0.0',
        totalWords: words.length,
        level: profile.level,
        joinDate: profile.joinDate
      }
    };
    
    // Store backup temporarily (could be used for data export)
    const backupKey = `user_${targetUserId}_deletion_backup_${Date.now()}`;
    await SecureStore.setItemAsync(backupKey, JSON.stringify(backup));
    
    console.log('✅ Backup created:', backupKey);
    return { success: true, backupKey, backup };
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return { success: false, error: error.message };
  }
}

// Method to completely reset app data (nuclear option)
static async resetAllAppData() {
  try {
    console.log('💥 NUCLEAR RESET: Clearing ALL app data');
    
    // This is a nuclear option - clears everything
    // Use with extreme caution
    
    const allKeys = await SecureStore.getAllKeysAsync?.() || [];
    const userDataKeys = allKeys.filter(key => key.startsWith('user_'));
    
    if (userDataKeys.length > 0) {
      const deletePromises = userDataKeys.map(key => 
        SecureStore.deleteItemAsync(key).catch(error => 
          console.log(`Could not delete ${key}:`, error.message)
        )
      );
      
      await Promise.allSettled(deletePromises);
      console.log(`✅ Deleted ${userDataKeys.length} user data keys`);
    }
    
    // Reset current user to guest
    setCurrentUser('guest_user');
    
    console.log('✅ Complete app data reset completed');
    return true;
  } catch (error) {
    console.error('❌ Error during complete reset:', error);
    return false;
  }
}

  // Get user statistics
  static async getUserStats() {
    try {
      const profile = await this.getUserProfile();
      const progress = await this.getUserProgress();
      const learnedWords = await this.getLearnedWords();
      
      return {
        totalWords: progress.wordsLearned || learnedWords.length,
        streak: progress.currentStreak || 0,
        level: profile.level || 'Beginner',
        fullName: profile.fullName || '',
        joinDate: profile.joinDate,
        lastLearningDate: progress.lastLearningDate,
        recentWords: learnedWords.slice(0, 5) // Last 5 words learned
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return {
        totalWords: 0,
        streak: 0,
        level: 'Beginner',
        fullName: '',
        joinDate: new Date().toISOString(),
        lastLearningDate: null,
        recentWords: []
      };
    }
  }
}

export default DataManager;