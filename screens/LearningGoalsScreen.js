import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function LearningGoalsScreen({ navigation, route }) {
  const [selectedGoals, setSelectedGoals] = useState([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get assessment data from previous screen
  const {
    userLevel = 'Beginner',
    score = 0,
    totalWords = 24,
    correctAnswers = 0,
    percentile = 50,
    selectedWords = []
  } = route?.params || {};

  const learningGoals = [
    {
      id: 'vocabulary',
      title: 'Expand Vocabulary',
      description: 'Discover new words daily',
      icon: '📚',
      color: '#4F46E5'
    },
    {
      id: 'emotions',
      title: 'Express Emotions',
      description: 'Find words for feelings',
      icon: '💭',
      color: '#EC4899'
    },
    {
      id: 'professional',
      title: 'Professional Communication',
      description: 'Improve work conversations',
      icon: '💼',
      color: '#059669'
    },
    {
      id: 'creative',
      title: 'Creative Writing',
      description: 'Enhance storytelling',
      icon: '✍️',
      color: '#DC2626'
    },
    {
      id: 'confidence',
      title: 'Build Confidence',
      description: 'Speak with clarity',
      icon: '💪',
      color: '#7C2D12'
    },
    {
      id: 'daily',
      title: 'Daily Inspiration',
      description: 'Words for motivation',
      icon: '✨',
      color: '#B45309'
    }
  ];

  useEffect(() => {
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
  }, []);

  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveGoalsData = async () => {
    try {
      // Save the assessment and goals data for later use after Google Sign-In
      const assessmentData = {
        userLevel,
        score,
        totalWords,
        correctAnswers,
        percentile,
        selectedWords,
        learningGoals: selectedGoals
      };
      
      await SecureStore.setItemAsync('pendingAssessmentData', JSON.stringify(assessmentData));
      console.log("Selected Goals:", selectedGoals);
      console.log("Assessment Data:", assessmentData);
    } catch (error) {
      console.error('Error saving goals data:', error);
    }
  };

  const handleNext = async () => {
    await saveGoalsData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate to Google Login instead of Signup
    navigation.navigate('Login');
  };

  const handleSkip = async () => {
    // Save data even when skipping (with empty goals)
    const assessmentDataWithEmptyGoals = {
      userLevel,
      score,
      totalWords,
      correctAnswers,
      percentile,
      selectedWords,
      learningGoals: []
    };
    
    try {
      await SecureStore.setItemAsync('pendingAssessmentData', JSON.stringify(assessmentDataWithEmptyGoals));
    } catch (error) {
      console.error('Error saving assessment data:', error);
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Navigate to Google Login
    navigation.navigate('Login');
  };

  const getLevelEmoji = () => {
    switch (userLevel) {
      case 'Beginner': return '🌱';
      case 'Intermediate': return '🌿';
      case 'Advanced': return '🌳';
      default: return '📚';
    }
  };

  const getLevelColor = () => {
    switch (userLevel) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#3b82f6';
      case 'Advanced': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Black Gradient */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 25],
                })
              }]
            }
          ]}
        >
          {/* Assessment Results Summary */}
          <View style={styles.resultsSummary}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
              <Text style={styles.levelEmoji}>{getLevelEmoji()}</Text>
              <Text style={styles.levelText}>{userLevel}</Text>
            </View>
            <Text style={styles.assessmentText}>
              You know {correctAnswers} out of {totalWords} words
            </Text>
          </View>

          <Text style={styles.title}>What would you like to achieve?</Text>
          <Text style={styles.subtitle}>
            Choose your learning goals to personalize your experience
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.goalsGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {learningGoals.map((goal, index) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.id) && [
                  styles.selectedGoalCard,
                  { borderColor: goal.color }
                ]
              ]}
              onPress={() => toggleGoal(goal.id)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                {selectedGoals.includes(goal.id) && (
                  <View style={[styles.checkmark, { backgroundColor: goal.color }]}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomSection}>
        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((dot) => (
            <View
              key={dot}
              style={[
                styles.progressDot,
                { backgroundColor: dot <= 1 ? '#000' : '#ddd' }
              ]}
            />
          ))}
        </View>

        {/* Selected count */}
        {selectedGoals.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''} selected
          </Text>
        )}

        {/* Next Button - Updated text */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            selectedGoals.length === 0 && styles.disabledButton
          ]} 
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.nextButtonText}>Continue to Sign In</Text>
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    marginHorizontal: -24,
    marginTop: -60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  resultsSummary: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  levelEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  levelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  assessmentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  goalsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    width: (width - 60) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedGoalCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    lineHeight: 20,
  },
  goalDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  progressDots: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    width: width * 0.85,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});