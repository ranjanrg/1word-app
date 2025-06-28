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

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Update timer every second when modal is visible
  useEffect(() => {
    let interval = null;
    
    if (showDailyCompleteModal) {
      const updateTimer = () => {
        const timeUntil = DataManager.getTimeUntilNextWord();
        setTimeUntilNext(timeUntil);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showDailyCompleteModal]);

  const handleLearnToday = async () => {
    // Check daily limit before navigating (keep it simple - 1 word per day)
    const limitStatus = await DataManager.canLearnWordToday();
    
    if (!limitStatus.canLearn) {
      setShowDailyCompleteModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    navigation.navigate('LearnWord');
  };

  const handleWordLearned = async () => {
    // Call this when user successfully learns a word
    await incrementDailyUsage();
    loadUserData(); // Refresh the UI
  };

  const handleUpgradePlan = async (planType) => {
    try {
      // In real app, integrate with Razorpay here
      const result = await subscribeToPlan(planType);
      
      if (result.success) {
        setShowUpgradeModal(false);
        Alert.alert('Success!', `Successfully upgraded to ${planType} plan!`);
        loadUserData();
      } else {
        Alert.alert('Error', 'Failed to upgrade plan. Please try again.');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
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

  // Helper function to get word color
  const getWordColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
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
      
      {/* Simplified Header with Gradient */}
      <LinearGradient colors={['#000', '#2d3436']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>OneWord</Text>
          </View>
          <View style={styles.streakContainer}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Enhanced Stats Cards */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.95}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              {/* Subtle gradient background */}
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.02)']}
                style={styles.statCardGradient}
              />
              {/* Top accent line */}
              <View style={[styles.statCardAccent, { backgroundColor: '#3b82f6' }]} />
              
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{wordsLearned}</Text>
                <Text style={styles.statLabel}>Words Learned</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.95}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              {/* Subtle gradient background */}
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.05)', 'rgba(245, 158, 11, 0.02)']}
                style={styles.statCardGradient}
              />
              {/* Top accent line */}
              <View style={[styles.statCardAccent, { backgroundColor: '#f59e0b' }]} />
              
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Simplified Hero CTA */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity 
            style={styles.heroButton} 
            onPress={handleLearnToday}
            activeOpacity={0.95}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextSection}>
                <Text style={styles.heroTitle}>
                  {dailyStatus.canLearn ? "Learn Today's Word" : "Daily Goal Complete"}
                </Text>
                <Text style={styles.heroSubtitle}>
                  {dailyStatus.canLearn 
                    ? (currentStreak > 0 ? `Continue your ${currentStreak}-day streak` : 'Start your learning journey')
                    : 'Come back tomorrow for your next word'
                  }
                </Text>
              </View>
              <View style={styles.heroArrowContainer}>
                <Text style={styles.heroArrow}>
                  {dailyStatus.canLearn ? "→" : "✓"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Recent Words Section */}
        <Animated.View style={[styles.recentSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Learned</Text>
            {recentWords.length > 3 && (
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
                <Text style={styles.seeAllArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentWords.length > 0 ? (
            recentWords.slice(0, 3).map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.recentItem,
                  { 
                    transform: [{ 
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0]
                      })
                    }]
                  }
                ]}
                activeOpacity={0.95}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <View style={styles.recentContent}>
                  <View style={styles.recentLeft}>
                    <View style={[styles.wordInitial, { backgroundColor: getWordColor(index) }]}>
                      <Text style={styles.wordInitialText}>
                        {item.word.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.recentTextContent}>
                      <View style={styles.wordHeader}>
                        <Text style={styles.recentWord}>{item.word}</Text>
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>✓</Text>
                        </View>
                      </View>
                      <Text style={styles.recentMeaning} numberOfLines={2}>
                        {item.meaning}
                      </Text>
                      <View style={styles.wordFooter}>
                        <Text style={styles.recentDate}>{item.date}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <View style={styles.emptyIconOuter}>
                  <View style={styles.emptyIconInner} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Ready to start learning?</Text>
              <Text style={styles.emptySubtitle}>
                Learn your first word today and begin building your vocabulary
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleLearnToday}>
                <Text style={styles.emptyButtonText}>Start Learning</Text>
                <Text style={styles.emptyButtonArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modern Bottom Navigation with Improved Learn Icon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <View style={styles.navIconContainer}>
            {/* House Icon */}
            <View style={styles.houseIcon}>
              <View style={styles.houseRoof} />
              <View style={styles.houseBase} />
              <View style={styles.houseDoor} />
            </View>
          </View>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleLearnToday}>
          <View style={styles.navIconContainer}>
            {/* Improved Learn Icon - Brain/Lightbulb style */}
            <View style={styles.learnIcon}>
              <View style={styles.learnIconBulb} />
              <View style={styles.learnIconBase} />
              <View style={styles.learnIconSparkle1} />
              <View style={styles.learnIconSparkle2} />
            </View>
          </View>
          <Text style={styles.navLabel}>Learn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
          <View style={styles.navIconContainer}>
            {/* Gear Icon */}
            <View style={styles.gearIcon}>
              <View style={styles.gearOuter} />
              <View style={styles.gearInner} />
            </View>
          </View>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Simplified Daily Goal Complete Modal */}
      <Modal
        transparent={true}
        visible={showDailyCompleteModal}
        animationType="fade"
        onRequestClose={() => setShowDailyCompleteModal(false)}
      >
        <View style={modalStyles.overlay}>
          <Animated.View 
            style={[
              modalStyles.container,
              {
                opacity: fadeAnim,
                transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 50], outputRange: [1, 0.8] }) }],
              },
            ]}
          >
            <View style={modalStyles.modalContent}>
              {/* Success Icon */}
              <View style={modalStyles.iconContainer}>
                <View style={modalStyles.successIconCircle}>
                  <Text style={modalStyles.successIcon}>✓</Text>
                </View>
              </View>
              
              {/* Title */}
              <Text style={modalStyles.title}>Daily Goal Complete!</Text>
              
              {/* Message */}
              <Text style={modalStyles.message}>
                You've learned your word for today. Come back tomorrow to continue your streak.
              </Text>
              
              {/* Simplified Countdown */}
              <View style={modalStyles.countdownContainer}>
                <Text style={modalStyles.countdownLabel}>Next word available in</Text>
                <View style={modalStyles.timeDisplay}>
                  <Text style={modalStyles.timeText}>
                    {timeUntilNext.hours}h {timeUntilNext.minutes}m {timeUntilNext.seconds}s
                  </Text>
                </View>
              </View>
              
              {/* Action Button */}
              <TouchableOpacity 
                style={modalStyles.primaryButton}
                onPress={() => {
                  setShowDailyCompleteModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.primaryButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
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
    flex: 1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -1.2,
  },
  streakContainer: {
    alignItems: 'flex-end',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f8f9fa',
    position: 'relative',
    overflow: 'hidden',
  },
  statContent: {
    alignItems: 'flex-start',
    zIndex: 2,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000',
    marginBottom: 6,
    letterSpacing: -1,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  // Add decorative elements for the cards
  statCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  statCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  heroButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextSection: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  heroArrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
    marginRight: 4,
  },
  seeAllArrow: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  recentContent: {
    // Container for recent item content
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  wordInitial: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    // REMOVED: All shadow properties for cleaner look
  },
  wordInitialText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    // REMOVED: textShadow properties for cleaner look
  },
  recentTextContent: {
    flex: 1,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentWord: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textTransform: 'capitalize',
    letterSpacing: -0.3,
    flex: 1,
  },
  completedBadge: {
    backgroundColor: '#22c55e',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentMeaning: {
    fontSize: 14,
    color: '#666',
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 10,
  },
  wordFooter: {
    // Just contains the date now
  },
  recentDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  emptyIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  emptyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
  emptyButtonArrow: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
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
    borderRadius: 12,
    paddingVertical: 12,
  },
  navIconContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // House Icon (Home)
  houseIcon: {
    width: 22,
    height: 20,
    position: 'relative',
  },
  houseRoof: {
    width: 22,
    height: 10,
    backgroundColor: '#64748b',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    transform: [{ rotate: '0deg' }],
    borderWidth: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#64748b',
    backgroundColor: 'transparent',
  },
  houseBase: {
    width: 16,
    height: 12,
    backgroundColor: '#64748b',
    marginTop: -2,
    marginLeft: 3,
    borderRadius: 2,
  },
  houseDoor: {
    width: 4,
    height: 6,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 0,
    left: 9,
    borderRadius: 1,
  },
  // NEW: Improved Learn Icon (Lightbulb/Brain style)
  learnIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnIconBulb: {
    width: 14,
    height: 14,
    backgroundColor: '#64748b',
    borderRadius: 7,
    position: 'relative',
  },
  learnIconBase: {
    width: 8,
    height: 4,
    backgroundColor: '#64748b',
    marginTop: 1,
    borderRadius: 2,
  },
  learnIconSparkle1: {
    width: 3,
    height: 3,
    backgroundColor: '#64748b',
    borderRadius: 1.5,
    position: 'absolute',
    top: 2,
    right: 1,
  },
  learnIconSparkle2: {
    width: 2,
    height: 2,
    backgroundColor: '#64748b',
    borderRadius: 1,
    position: 'absolute',
    top: 6,
    left: 2,
  },
  // Gear Icon (Settings)
  gearIcon: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#64748b',
    position: 'relative',
  },
  gearInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 6,
    left: 6,
  },
  navLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  activeNavLabel: {
    color: '#000',
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: '500',
  },
  countdownContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  timeDisplay: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});