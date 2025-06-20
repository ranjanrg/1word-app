import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const SettingsScreen = ({ navigation }) => {
  const [username, setUsername] = useState('User');
  const [habitView, setHabitView] = useState('Month'); // Month, Year
  const [habitData, setHabitData] = useState([]);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userRanking, setUserRanking] = useState(85); // Percentage better than others

  useEffect(() => {
    loadUserData();
    generateHabitData();
  }, [habitView]);

  const loadUserData = async () => {
    try {
      const savedUsername = await SecureStore.getItemAsync('username');
      const savedWordsLearned = await SecureStore.getItemAsync('totalWordsLearned');
      const savedStreak = await SecureStore.getItemAsync('currentStreak');
      
      setUsername(savedUsername || 'User');
      setWordsLearned(savedWordsLearned ? parseInt(savedWordsLearned) : 0);
      setCurrentStreak(savedStreak ? parseInt(savedStreak) : 0);
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const generateHabitData = () => {
    // Generate habit tracking data based on view (Month/Year)
    const today = new Date();
    let days = [];
    
    if (habitView === 'Month') {
      // Generate 30 days for current month
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const completed = Math.random() > 0.3; // 70% completion rate for demo
        days.push({
          date: date.toISOString().split('T')[0],
          completed,
          day: date.getDate()
        });
      }
    } else {
      // Generate 365 days for year
      for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const completed = Math.random() > 0.3; // 70% completion rate for demo
        days.push({
          date: date.toISOString().split('T')[0],
          completed,
          month: date.getMonth(),
          day: date.getDate()
        });
      }
    }
    
    setHabitData(days);
  };

  const renderHabitGrid = () => {
    const dotsPerRow = habitView === 'Month' ? 7 : 15; // 7 for month, 15 for year
    const dotSize = habitView === 'Month' ? 16 : 8;
    const spacing = habitView === 'Month' ? 4 : 2;
    
    return (
      <View style={styles.habitGrid}>
        {habitData.map((day, index) => (
          <View
            key={index}
            style={[
              styles.habitDot,
              {
                width: dotSize,
                height: dotSize,
                marginRight: spacing,
                marginBottom: spacing,
                backgroundColor: day.completed ? '#000' : '#e0e0e0',
                borderRadius: dotSize / 2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Username Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.usernameCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.usernameInfo}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.userSubtitle}>Vocabulary Learner</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Habit Tracker Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learning Consistency</Text>
            <View style={styles.habitToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, habitView === 'Month' && styles.activeToggle]}
                onPress={() => setHabitView('Month')}
              >
                <Text style={[styles.toggleText, habitView === 'Month' && styles.activeToggleText]}>
                  Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, habitView === 'Year' && styles.activeToggle]}
                onPress={() => setHabitView('Year')}
              >
                <Text style={[styles.toggleText, habitView === 'Year' && styles.activeToggleText]}>
                  Year
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.habitCard}>
            <Text style={styles.habitTitle}>Daily Learning Streak</Text>
            <Text style={styles.habitSubtitle}>
              {habitView === 'Month' ? 'Last 30 days' : 'Last 365 days'}
            </Text>
            {renderHabitGrid()}
            <View style={styles.habitStats}>
              <View style={styles.habitStat}>
                <Text style={styles.habitStatNumber}>{currentStreak}</Text>
                <Text style={styles.habitStatLabel}>Current Streak</Text>
              </View>
              <View style={styles.habitStat}>
                <Text style={styles.habitStatNumber}>
                  {Math.floor((habitData.filter(d => d.completed).length / habitData.length) * 100)}%
                </Text>
                <Text style={styles.habitStatLabel}>Consistency</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Words Learned Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Words Mastered</Text>
              <Text style={styles.progressNumber}>{wordsLearned}</Text>
            </View>
            <Text style={styles.progressSubtitle}>
              You're doing better than {userRanking}% of learners! 🎉
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${userRanking}%` }]} />
            </View>
            <View style={styles.milestones}>
              <View style={styles.milestone}>
                <Text style={styles.milestoneNumber}>50</Text>
                <Text style={styles.milestoneLabel}>Beginner</Text>
              </View>
              <View style={styles.milestone}>
                <Text style={styles.milestoneNumber}>200</Text>
                <Text style={styles.milestoneLabel}>Intermediate</Text>
              </View>
              <View style={styles.milestone}>
                <Text style={styles.milestoneNumber}>500</Text>
                <Text style={styles.milestoneLabel}>Advanced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            <TouchableOpacity style={styles.accountItem}>
              <Text style={styles.deleteAccountText}>Delete Account</Text>
              <Text style={styles.accountItemArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  // Username Section
  usernameCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  usernameInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Habit Tracker Section
  habitToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#000',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  activeToggleText: {
    color: '#fff',
  },
  habitCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  habitSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  habitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  habitDot: {
    // Dynamic styles applied inline
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  habitStatLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Progress Section
  progressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  milestoneLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Account Section
  accountCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  accountItemText: {
    fontSize: 16,
    color: '#000',
  },
  deleteAccountText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  accountItemArrow: {
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
});

export default SettingsScreen;