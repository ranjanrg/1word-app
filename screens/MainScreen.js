import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import DataManager from '../utils/DataManager';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
  const [wordsLearned, setWordsLearned] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentWords, setRecentWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyStatus, setDailyStatus] = useState({ canLearn: true, wordsToday: 0 });
  const [showDailyCompleteModal, setShowDailyCompleteModal] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Update timer every second when modal is visible
  useEffect(() => {
    let interval = null;
    
    if (showDailyCompleteModal) {
      // Update immediately
      const updateTimer = () => {
        const timeUntil = DataManager.getTimeUntilNextWord();
        setTimeUntilNext(timeUntil);
      };
      
      updateTimer(); // Initial update
      
      // Set interval to update every second
      interval = setInterval(updateTimer, 1000);
    }
    
    // Cleanup interval when modal closes
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showDailyCompleteModal]);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const handleLearnToday = async () => {
    // Check daily limit before navigating
    const limitStatus = await DataManager.canLearnWordToday();
    
    if (!limitStatus.canLearn) {
      // Don't set timeUntilNext here anymore - let the useEffect handle it
      setShowDailyCompleteModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    navigation.navigate('LearnWord');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const loadUserData = async () => {
    try {
      const progress = await DataManager.getUserProgress();
      const learnedWordsHistory = await DataManager.getLearnedWords();
      const limitStatus = await DataManager.canLearnWordToday();
      
      setWordsLearned(progress.wordsLearned);
      setCurrentStreak(progress.currentStreak);
      setRecentWords(learnedWordsHistory);
      setDailyStatus(limitStatus);
      
      setLoading(false);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 MainScreen focused - refreshing data...');
      loadUserData();
    }, [])
  );
  
  const refreshData = async () => {
    console.log('🔄 Manually refreshing data...');
    setLoading(true);
    await loadUserData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>📚</Text>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logoIcon}>📚</Text>
            <Text style={styles.logoText}>1Word</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>BETA</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Enhanced Stats Cards */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{wordsLearned}</Text>
              <Text style={styles.statLabel}>Words Learned</Text>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>📖</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>🔥</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Hero CTA */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.heroButton} onPress={handleLearnToday}>
            <LinearGradient
              colors={['#000', '#2d3436', '#636e72']}
              style={styles.heroGradient}
            >
              <View style={styles.heroButtonContent}>
                <View style={styles.heroLeft}>
                  <View style={styles.heroIconContainer}>
                    <Text style={styles.heroEmoji}>✨</Text>
                  </View>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>
                      {dailyStatus.canLearn ? "Learn Today's Word" : "Daily Goal Complete!"}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      {dailyStatus.canLearn 
                        ? (currentStreak > 0 ? `Continue your ${currentStreak}-day streak!` : 'Start your learning journey!')
                        : 'Come back tomorrow for your next word'
                      }
                    </Text>
                  </View>
                </View>
                <View style={styles.heroArrow}>
                  <Text style={styles.arrowText}>
                    {dailyStatus.canLearn ? "→" : "✓"}
                  </Text>
                </View>
              </View>
              
              {/* Floating elements */}
              <View style={styles.floatingDot1} />
              <View style={styles.floatingDot2} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Recent Words */}
        <Animated.View 
          style={[
            styles.recentSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Learned</Text>
            {recentWords.length > 3 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentWords.length > 0 ? (
            recentWords.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <View style={styles.recentEmojiContainer}>
                    <Text style={styles.recentEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.recentTextContainer}>
                    <Text style={styles.recentWord}>{item.word}</Text>
                    <Text style={styles.recentMeaning}>{item.meaning}</Text>
                    <Text style={styles.recentDate}>{item.date}</Text>
                  </View>
                </View>
                <View style={styles.recentBadge}>
                  <Text style={styles.recentBadgeText}>✓</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌟</Text>
              <Text style={styles.emptyTitle}>Ready to start learning?</Text>
              <Text style={styles.emptySubtitle}>
                Learn your first word today and begin your vocabulary journey
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleLearnToday}>
                <Text style={styles.emptyButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Enhanced Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🏠</Text>
          </View>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleLearnToday}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>📖</Text>
          </View>
          <Text style={styles.navLabel}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleSettings}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>⚙️</Text>
          </View>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Daily Goal Complete Modal */}
      <Modal
        transparent={true}
        visible={showDailyCompleteModal}
        animationType="fade"
        onRequestClose={() => setShowDailyCompleteModal(false)}
      >
        <View style={dailyCompleteModalStyles.overlay}>
          <Animated.View 
            style={[
              dailyCompleteModalStyles.container,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [1, 0.8] }) }],
              },
            ]}
          >
            <LinearGradient
              colors={['#000', '#2d3436']}
              style={dailyCompleteModalStyles.gradient}
            >
              {/* Success Icon */}
              <View style={dailyCompleteModalStyles.iconContainer}>
                <Text style={dailyCompleteModalStyles.successIcon}>🎯</Text>
              </View>
              
              {/* Title */}
              <Text style={dailyCompleteModalStyles.title}>
                Daily Goal Complete!
              </Text>
              
              {/* Message */}
              <Text style={dailyCompleteModalStyles.message}>
                You've already learned your word for today!
              </Text>
              
              {/* Countdown */}
              <View style={dailyCompleteModalStyles.countdownContainer}>
                <Text style={dailyCompleteModalStyles.countdownLabel}>
                  Next word available in:
                </Text>
                <View style={dailyCompleteModalStyles.timeContainer}>
                  <View style={dailyCompleteModalStyles.timeBox}>
                    <Text style={dailyCompleteModalStyles.timeNumber}>
                      {timeUntilNext.hours}
                    </Text>
                    <Text style={dailyCompleteModalStyles.timeUnit}>hours</Text>
                  </View>
                  <Text style={dailyCompleteModalStyles.timeSeparator}>:</Text>
                  <View style={dailyCompleteModalStyles.timeBox}>
                    <Text style={dailyCompleteModalStyles.timeNumber}>
                      {timeUntilNext.minutes}
                    </Text>
                    <Text style={dailyCompleteModalStyles.timeUnit}>mins</Text>
                  </View>
                  <Text style={dailyCompleteModalStyles.timeSeparator}>:</Text>
                  <View style={dailyCompleteModalStyles.timeBox}>
                    <Text style={dailyCompleteModalStyles.timeNumber}>
                      {timeUntilNext.seconds}
                    </Text>
                    <Text style={dailyCompleteModalStyles.timeUnit}>secs</Text>
                  </View>
                </View>
              </View>
              
              {/* Encouragement */}
              <Text style={dailyCompleteModalStyles.encouragement}>
                Great job on maintaining your learning streak! 🔥
              </Text>
              
              {/* Action Button */}
              <View style={dailyCompleteModalStyles.buttonWrapper}>
                <TouchableOpacity 
                  style={dailyCompleteModalStyles.primaryButton}
                  onPress={() => {
                    setShowDailyCompleteModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={dailyCompleteModalStyles.primaryButtonText}>
                    Got it! ✨
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Floating Dots */}
              <View style={dailyCompleteModalStyles.floatingDot1} />
              <View style={dailyCompleteModalStyles.floatingDot2} />
              <View style={dailyCompleteModalStyles.floatingDot3} />
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -1,
  },
  betaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  betaText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  streakIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 16,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  heroButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heroGradient: {
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroEmoji: {
    fontSize: 28,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    lineHeight: 22,
  },
  heroArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  floatingDot1: {
    position: 'absolute',
    top: 20,
    right: 80,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  floatingDot2: {
    position: 'absolute',
    bottom: 30,
    right: 120,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentWord: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  recentMeaning: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    lineHeight: 18,
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  recentBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingVertical: 12,
  },
  navIconContainer: {
    marginBottom: 4,
  },
  navIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#000',
    fontWeight: '700',
  },
});

// Daily Goal Complete Modal Styles
const dailyCompleteModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  countdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBox: {
    alignItems: 'center',
    minWidth: 40,
  },
  timeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  timeUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  encouragement: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Floating animation dots
  floatingDot1: {
    position: 'absolute',
    top: 30,
    right: 40,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingDot2: {
    position: 'absolute',
    bottom: 60,
    left: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingDot3: {
    position: 'absolute',
    top: 120,
    left: 50,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});