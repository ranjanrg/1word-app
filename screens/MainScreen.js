import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DataManager from '../utils/DataManager';

const { width } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
  const [wordsLearned, setWordsLearned] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyGoal] = useState(7);
  const [wordsThisWeek, setWordsThisWeek] = useState(0);
  const [weekDays, setWeekDays] = useState([]);
  const [recentWords, setRecentWords] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLearnToday = () => {
    navigation.navigate('LearnWord');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  // Calculate progress percentage
  const progressPercentage = (wordsThisWeek / weeklyGoal) * 100;

  const loadUserData = async () => {
    try {
      const progress = await DataManager.getUserProgress();
      const learnedWordsHistory = await DataManager.getLearnedWords();
      
      setWordsLearned(progress.wordsLearned);
      setCurrentStreak(progress.currentStreak);
      setWeekDays(progress.weeklyProgress);
      setRecentWords(learnedWordsHistory);
      
      // Calculate words this week
      const completedThisWeek = progress.weeklyProgress.filter(day => day.completed).length;
      setWordsThisWeek(completedThisWeek);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUserData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>📚</Text>
          <Text style={styles.logoText}>1Word</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Week Progress Bar */}
        <View style={styles.weekContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayItem}>
              <View style={[
                styles.dayCircle,
                day.completed && styles.completedCircle,
                day.isToday && styles.todayCircle
              ]}>
                {day.completed ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[styles.dayLetter, day.isToday && styles.todayLetter]}>{day.day}</Text>
                )}
              </View>
              <Text style={[
                styles.dayDate,
                day.isToday && styles.todayDate
              ]}>{day.date}</Text>
            </View>
          ))}
        </View>

        {/* Main Words Learned Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <View style={styles.leftSection}>
              <Text style={styles.mainNumber}>{wordsLearned}</Text>
              <Text style={styles.mainLabel}>Words learned</Text>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.progressRing}>
                <View style={[styles.progressFill, { 
                  transform: [{ rotate: `${(progressPercentage * 3.6)}deg` }] 
                }]} />
                <View style={styles.progressInner}>
                  <Text style={styles.progressIcon}>📖</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Learn Today Button - MAIN FOCUS */}
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.heroButton} onPress={handleLearnToday}>
            <View style={styles.heroButtonContent}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroEmoji}>🌟</Text>
              </View>
              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Learn Today's Word</Text>
                <Text style={styles.heroSubtitle}>
                  {currentStreak > 0 ? `Continue your ${currentStreak}-day streak!` : 'Start your learning streak!'}
                </Text>
              </View>
              <View style={styles.heroArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </View>
            <View style={styles.heroGlow} />
          </TouchableOpacity>
        </View>

        {/* Recent Words Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently learned</Text>
          
          {recentWords.length > 0 ? (
            recentWords.map((item, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <Text style={styles.recentEmoji}>{item.emoji}</Text>
                  <View style={styles.recentText}>
                    <Text style={styles.recentWord}>{item.word}</Text>
                    <Text style={styles.recentMeaning}>{item.meaning}</Text>
                    <Text style={styles.recentDate}>{item.date}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>You haven't learned any words yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your vocabulary journey by learning your first word today
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleLearnToday}>
          <Text style={styles.navIcon}>📖</Text>
          <Text style={styles.navLabel}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleSettings}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  dayItem: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  completedCircle: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
  },
  todayCircle: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
  },
  dayLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  todayLetter: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  dayDate: {
    fontSize: 12,
    color: '#999',
  },
  todayDate: {
    color: '#007AFF',
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  mainNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  mainLabel: {
    fontSize: 16,
    color: '#666',
  },
  rightSection: {
    alignItems: 'center',
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  progressFill: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#6b7280',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressIcon: {
    fontSize: 20,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  heroButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  heroEmoji: {
    fontSize: 28,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  recentText: {
    flex: 1,
  },
  recentWord: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  recentMeaning: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
  },
  activeNavLabel: {
    color: '#000',
    fontWeight: '600',
  },
});