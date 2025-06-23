import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import DataManager from '../utils/DataManager';

const { width } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
  const [wordsLearned, setWordsLearned] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentWords, setRecentWords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const handleLearnToday = () => {
    navigation.navigate('LearnWord');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const loadUserData = async () => {
    try {
      const progress = await DataManager.getUserProgress();
      const learnedWordsHistory = await DataManager.getLearnedWords();
      
      setWordsLearned(progress.wordsLearned);
      setCurrentStreak(progress.currentStreak);
      setRecentWords(learnedWordsHistory);
      
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
                    <Text style={styles.heroTitle}>Learn Today's Word</Text>
                    <Text style={styles.heroSubtitle}>
                      {currentStreak > 0 ? `Continue your ${currentStreak}-day streak!` : 'Start your learning journey!'}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroArrow}>
                  <Text style={styles.arrowText}>→</Text>
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