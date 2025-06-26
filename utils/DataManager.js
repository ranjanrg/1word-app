import { supabase } from '../supabase.config.js';

// Current user management
let currentUserId = null;

// Method to set current user (called from AuthContext)
const setCurrentUser = (userId) => {
  currentUserId = userId;
  console.log('👤 DataManager: Current user set to:', currentUserId);
};

// Default data structure for fallback (keeping your exact structure)
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
  fullName: '',
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

  // Get current authenticated user from Supabase
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        setCurrentUser(user.id);
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Initialize fresh user data for new users (Supabase version)
  static async initializeUserData(userId, fullName, email, username = null) {
    try {
      console.log('🔄 Initializing fresh data for new user:', { userId, fullName, email, username });
      
      const displayName = fullName || username || (email ? email.split('@')[0] : 'User');
      const userUsername = username || (email ? email.split('@')[0] : 'User');
      
      const freshProfile = {
        ...DEFAULT_PROFILE,
        fullName: fullName || '',
        username: userUsername,
        email: email,
        joinDate: new Date().toISOString(),
        isNewUser: true
      };

      const freshProgress = {
        ...DEFAULT_PROGRESS,
        weeklyProgress: this.generateCurrentWeekProgress()
      };

      // Save to Supabase tables
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: freshProfile.fullName,
          username: freshProfile.username,
          email: freshProfile.email,
          level: freshProfile.level,
          learning_goals: freshProfile.learningGoals,
          total_words: freshProfile.totalWords,
          current_streak: freshProfile.streak,
          is_new_user: freshProfile.isNewUser
        });

      if (profileError) throw profileError;

      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          words_learned: freshProgress.wordsLearned,
          current_streak: freshProgress.currentStreak,
          last_learning_date: freshProgress.lastLearningDate,
          weekly_progress: freshProgress.weeklyProgress
        });

      // Ignore duplicate key errors (trigger already created the record)
      if (progressError && progressError.code !== '23505') {
        throw progressError;
      }
      
      console.log('✅ Fresh user data initialized in Supabase:', fullName);
      return { profile: freshProfile, progress: freshProgress };
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      throw error;
    }
  }

  // Generate current week progress (keeping your exact logic)
  static generateCurrentWeekProgress() {
    const today = new Date();
    const currentDay = today.getDay();
    
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const progress = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + 1 + i);
      
      progress.push({
        day: daysOfWeek[i],
        date: date.getDate().toString(),
        completed: false,
        isToday: i === (currentDay === 0 ? 6 : currentDay - 1)
      });
    }
    
    return progress;
  }

  // Get user progress from Supabase with real-time streak checking
  static async getUserProgress() {
    try {
      const userId = currentUserId;
      console.log('🔍 Getting progress for user:', userId);

      if (!userId) {
        console.log('⚠️ No user ID, returning default progress');
        return DEFAULT_PROGRESS;
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      if (data) {
        const progress = {
          wordsLearned: data.words_learned || 0,
          currentStreak: data.current_streak || 0,
          lastLearningDate: data.last_learning_date,
          weeklyProgress: data.weekly_progress || this.generateCurrentWeekProgress()
        };

        // Check if streak should be reset to 0 due to missed days
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const lastLearningDate = progress.lastLearningDate;
        
        if (lastLearningDate && progress.currentStreak > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');
          
          // If last learning was not yesterday or today, streak is broken
          if (lastLearningDate !== yesterdayStr && lastLearningDate !== today) {
            console.log('💔 Streak expired - last learning:', lastLearningDate, 'yesterday:', yesterdayStr);
            progress.currentStreak = 0;
            
            // Update database to reflect broken streak
            await this.saveUserProgress({
              wordsLearned: progress.wordsLearned,
              currentStreak: 0,
              lastLearningDate: progress.lastLearningDate,
              weeklyProgress: progress.weeklyProgress
            });
          }
        }

        console.log('✅ Retrieved user progress from Supabase:', { userId, wordsLearned: progress.wordsLearned, streak: progress.currentStreak });
        return progress;
      }
      
      // No progress found - create fresh default
      console.log('⚠️ No progress found for user, creating default');
      const freshProgress = {
        ...DEFAULT_PROGRESS,
        weeklyProgress: this.generateCurrentWeekProgress()
      };
      
      await this.saveUserProgress(freshProgress);
      return freshProgress;
    } catch (error) {
      console.error('❌ Error getting user progress:', error);
      return DEFAULT_PROGRESS;
    }
  }

  // Save user progress to Supabase (fixed version)
  static async saveUserProgress(progressData) {
    try {
      const userId = currentUserId;
      console.log('💾 Saving progress for user:', userId);

      if (!userId) {
        console.log('⚠️ No user ID, cannot save progress');
        return false;
      }

      // Use upsert with conflict resolution
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          words_learned: progressData.wordsLearned,
          current_streak: progressData.currentStreak,
          last_learning_date: progressData.lastLearningDate,
          weekly_progress: progressData.weeklyProgress
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('❌ Upsert error:', error);
        
        // If upsert fails, try regular update
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            words_learned: progressData.wordsLearned,
            current_streak: progressData.currentStreak,
            last_learning_date: progressData.lastLearningDate,
            weekly_progress: progressData.weeklyProgress
          })
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      }
      
      console.log('✅ User progress saved to Supabase:', { userId, wordsLearned: progressData.wordsLearned, streak: progressData.currentStreak });
      return true;
    } catch (error) {
      console.error('❌ Error saving user progress:', error);
      return false;
    }
  }

  // Get learned words from Supabase
  static async getLearnedWords() {
    try {
      const userId = currentUserId;

      if (!userId) {
        console.log('⚠️ No user ID, returning empty words array');
        return [];
      }

      const { data, error } = await supabase
        .from('learned_words')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform Supabase data to match your existing format
      const words = (data || []).map(item => ({
        word: item.word,
        meaning: item.meaning,
        emoji: item.emoji || '📖',
        date: new Date(item.learned_date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        }),
        timestamp: item.created_at
      }));
      
      console.log('✅ Retrieved learned words from Supabase:', { userId, wordCount: words.length });
      return words;
    } catch (error) {
      console.error('❌ Error getting learned words:', error);
      return [];
    }
  }

  // Check daily limit (keeping your exact logic)
  static async canLearnWordToday() {
    try {
      const userId = currentUserId;
      const today = new Date().toDateString();
      
      const learnedWords = await this.getLearnedWords();
      const todayWords = learnedWords.filter(word => {
        const wordDate = new Date(word.timestamp).toDateString();
        return wordDate === today;
      });
      
      console.log('📅 Words learned today:', todayWords.length);
      
      const dailyLimit = 1;
      const canLearn = todayWords.length < dailyLimit;
      
      return {
        canLearn,
        wordsToday: todayWords.length,
        dailyLimit,
        nextWordAvailable: canLearn ? null : this.getNextDayTime()
      };
    } catch (error) {
      console.error('❌ Error checking daily limit:', error);
      return { canLearn: true, wordsToday: 0, dailyLimit: 1 };
    }
  }

  // Get next day time (keeping your exact logic)
  static getNextDayTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  // Get time until next word (keeping your exact logic with seconds)
  static getTimeUntilNextWord() {
    const now = new Date();
    const tomorrow = this.getNextDayTime();
    const diff = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }

  // Add learned word to Supabase
  static async addLearnedWord(word, meaning, emoji = '📖') {
    try {
      const userId = currentUserId;

      if (!userId) {
        console.log('⚠️ No user ID, cannot add word');
        return { success: false, error: 'no_user' };
      }

      // Check daily limit first (keeping your logic)
      const limitCheck = await this.canLearnWordToday();
      if (!limitCheck.canLearn) {
        console.log('❌ Daily word limit reached');
        return { 
          success: false, 
          error: 'daily_limit_reached',
          timeUntilNext: this.getTimeUntilNextWord()
        };
      }

      // Check if word already exists (Supabase will handle this with UNIQUE constraint)
      const { data, error } = await supabase
        .from('learned_words')
        .insert({
          user_id: userId,
          word: word.toLowerCase(), // Store lowercase for consistency
          meaning: meaning,
          emoji: emoji,
          learned_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        })
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log('⚠️ Word already learned by this user:', word);
          return { success: true, alreadyLearned: true };
        }
        throw error;
      }
      
      // Get updated word count
      const allWords = await this.getLearnedWords();
      
      console.log('✅ Word added to Supabase:', { userId, word, totalWords: allWords.length });
      return { success: true, wordCount: allWords.length };
    } catch (error) {
      console.error('❌ Error adding learned word:', error);
      return { success: false, error: 'storage_error' };
    }
  }

  // Update progress after learning with proper streak logic
  static async updateProgressAfterLearning() {
    try {
      const userId = currentUserId;

      const currentProgress = await this.getUserProgress();
      
      // Proper streak calculation with timezone handling
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      const lastLearningDate = currentProgress.lastLearningDate;
      
      console.log('📅 Streak calculation:', { today, lastLearningDate, currentStreak: currentProgress.currentStreak });
      
      let newStreak = 1;
      
      if (!lastLearningDate) {
        // First time learning - start streak at 1
        newStreak = 1;
        console.log('🎯 First time learning, streak = 1');
      } else if (lastLearningDate === today) {
        // Already learned today - don't increment
        newStreak = currentProgress.currentStreak || 1;
        console.log('📚 Already learned today, keeping streak:', newStreak);
      } else {
        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        
        if (lastLearningDate === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak = (currentProgress.currentStreak || 0) + 1;
          console.log('🔥 Consecutive day! New streak:', newStreak);
        } else {
          // Missed days - streak was broken (was 0), starting fresh at 1
          newStreak = 1;
          console.log('💔 Streak was broken (was 0), now starting fresh at 1');
        }
      }

      // Update weekly progress
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
      await this.syncProfileWithProgress(updatedProgress);
      
      console.log('✅ Progress updated in Supabase:', { 
        userId, 
        wordsLearned: updatedProgress.wordsLearned, 
        streak: updatedProgress.currentStreak,
        date: today
      });
      
      return updatedProgress;
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      return null;
    }
  }

  // Sync profile with progress (Supabase version)
  static async syncProfileWithProgress(progressData) {
    try {
      const userId = currentUserId;
      
      if (!userId) return false;

      const { error } = await supabase
        .from('profiles')
        .update({
          total_words: progressData.wordsLearned,
          current_streak: progressData.currentStreak,
          is_new_user: false
        })
        .eq('id', userId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('❌ Error syncing profile with progress:', error);
      return false;
    }
  }

  // Get user profile from Supabase
  static async getUserProfile() {
    try {
      const userId = currentUserId;

      if (!userId) {
        console.log('⚠️ No user ID, returning default profile');
        return DEFAULT_PROFILE;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        const profile = {
          level: data.level || 'Beginner',
          learningGoals: data.learning_goals || [],
          joinDate: data.created_at,
          username: data.username || 'User',
          fullName: data.full_name || '',
          email: data.email || '',
          totalWords: data.total_words || 0,
          streak: data.current_streak || 0,
          isNewUser: data.is_new_user !== false
        };
        
        console.log('✅ Retrieved user profile from Supabase:', { 
          userId, 
          fullName: profile.fullName, 
          level: profile.level, 
          totalWords: profile.totalWords 
        });
        return profile;
      }
      
      // No profile found - this shouldn't happen with triggers, but just in case
      console.log('⚠️ No profile found for user, returning default');
      return DEFAULT_PROFILE;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return DEFAULT_PROFILE;
    }
  }

  // Save user profile to Supabase
  static async saveUserProfile(profileData) {
    try {
      const userId = currentUserId;

      if (!userId) {
        console.log('⚠️ No user ID, cannot save profile');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          level: profileData.level,
          learning_goals: profileData.learningGoals,
          username: profileData.username,
          full_name: profileData.fullName,
          email: profileData.email,
          total_words: profileData.totalWords,
          current_streak: profileData.streak,
          is_new_user: profileData.isNewUser
        })
        .eq('id', userId);

      if (error) throw error;
      
      console.log('✅ User profile saved to Supabase:', { userId, level: profileData.level, fullName: profileData.fullName });
      return true;
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      return false;
    }
  }

  // Update user level (keeping your exact logic)
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

  // Update learning goals (keeping your exact logic)
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

  // Update user's full name (keeping your exact logic)
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

  // Handle auth change (modified for Supabase with better error handling)
  static async handleAuthChange(userId, userInfo = null) {
    try {
      if (userId && userId !== 'guest_user') {
        setCurrentUser(userId);
        
        // Check if profile exists (trigger should have created it)
        const profile = await this.getUserProfile();
        
        if (profile === DEFAULT_PROFILE || profile.isNewUser) {
          // Initialize data if needed, but handle duplicates gracefully
          const fullName = userInfo?.fullName || userInfo?.name || '';
          const email = userInfo?.email || 'user@example.com';
          const username = userInfo?.username || email.split('@')[0];
          
          try {
            await this.initializeUserData(userId, fullName, email, username);
            console.log('✅ Fresh data created for new authenticated user');
          } catch (error) {
            // If it's a duplicate key error, that's fine - data already exists
            if (error.code === '23505') {
              console.log('✅ User data already exists (created by trigger)');
            } else {
              throw error; // Re-throw other errors
            }
          }
        } else {
          console.log('✅ Existing user data found');
        }
      } else {
        setCurrentUser(null);
        console.log('✅ User logged out or guest mode');
      }
    } catch (error) {
      // Don't throw errors that would break auth flow
      console.error('❌ Error handling auth change:', error);
      
      // Still set the user even if there are data errors
      if (userId && userId !== 'guest_user') {
        setCurrentUser(userId);
        console.log('✅ User set despite data initialization error');
      }
    }
  }

  // Clear user data (Supabase version)
  static async clearUserData() {
    try {
      const userId = currentUserId;

      if (!userId) {
        console.log('⚠️ No user ID, cannot clear data');
        return false;
      }

      // Delete from all tables (cascading delete should handle this)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      console.log('✅ User data cleared from Supabase:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      return false;
    }
  }

  // Reset all data (for testing)
  static async resetAllData() {
    try {
      await this.clearUserData();
      return true;
    } catch (error) {
      console.error('❌ Error resetting data:', error);
      return false;
    }
  }

  // Get user statistics (keeping your exact logic)
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
        recentWords: learnedWords.slice(0, 5)
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