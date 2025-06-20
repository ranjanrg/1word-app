import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROGRESS: 'user_progress',
  LEARNED_WORDS: 'learned_words',
  USER_PROFILE: 'user_profile'
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
  joinDate: new Date().toISOString()
};

class DataManager {
  
  // Get user progress data
  static async getUserProgress() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
      if (data) {
        return JSON.parse(data);
      }
      // Return default if no data exists
      await this.saveUserProgress(DEFAULT_PROGRESS);
      return DEFAULT_PROGRESS;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return DEFAULT_PROGRESS;
    }
  }

  // Save user progress data
  static async saveUserProgress(progressData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Error saving user progress:', error);
      return false;
    }
  }

  // Get learned words history
  static async getLearnedWords() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNED_WORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting learned words:', error);
      return [];
    }
  }

  // Add a new learned word
  static async addLearnedWord(word, meaning, emoji = '📖') {
    try {
      const existingWords = await this.getLearnedWords();
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
      
      // Keep only last 10 words for performance
      const limitedWords = updatedWords.slice(0, 10);
      
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNED_WORDS, JSON.stringify(limitedWords));
      return true;
    } catch (error) {
      console.error('Error adding learned word:', error);
      return false;
    }
  }

  // Update progress after learning a word
  static async updateProgressAfterLearning() {
    try {
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
      return updatedProgress;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  }

  // Get user profile
  static async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
      await this.saveUserProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return DEFAULT_PROFILE;
    }
  }

  // Save user profile
  static async saveUserProfile(profileData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileData));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
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
      return true;
    } catch (error) {
      console.error('Error updating user level:', error);
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
      return true;
    } catch (error) {
      console.error('Error updating learning goals:', error);
      return false;
    }
  }

  // Reset all data (for testing)
  static async resetAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PROGRESS,
        STORAGE_KEYS.LEARNED_WORDS,
        STORAGE_KEYS.USER_PROFILE
      ]);
      return true;
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  }
}

export default DataManager;