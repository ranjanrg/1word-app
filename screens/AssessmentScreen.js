import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Dimensions,
  PanGestureHandler,
  State
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Expanded mixed vocabulary set (easy, medium, hard all mixed)
const ASSESSMENT_VOCABULARY = [
  // Easy words
  { word: 'happy', difficulty: 'easy' },
  { word: 'book', difficulty: 'easy' },
  { word: 'water', difficulty: 'easy' },
  { word: 'friend', difficulty: 'easy' },
  { word: 'house', difficulty: 'easy' },
  { word: 'learn', difficulty: 'easy' },
  { word: 'smile', difficulty: 'easy' },
  { word: 'bright', difficulty: 'easy' },
  
  // Medium words
  { word: 'adventure', difficulty: 'medium' },
  { word: 'mysterious', difficulty: 'medium' },
  { word: 'accomplish', difficulty: 'medium' },
  { word: 'graceful', difficulty: 'medium' },
  { word: 'discover', difficulty: 'medium' },
  { word: 'confident', difficulty: 'medium' },
  { word: 'ambitious', difficulty: 'medium' },
  { word: 'creative', difficulty: 'medium' },
  { word: 'elegant', difficulty: 'medium' },
  { word: 'flourish', difficulty: 'medium' },
  { word: 'genuine', difficulty: 'medium' },
  { word: 'harmony', difficulty: 'medium' },
  { word: 'inspire', difficulty: 'medium' },
  { word: 'jovial', difficulty: 'medium' },
  { word: 'knowledge', difficulty: 'medium' },
  { word: 'liberty', difficulty: 'medium' },
  
  // Hard words
  { word: 'serendipity', difficulty: 'hard' },
  { word: 'ephemeral', difficulty: 'hard' },
  { word: 'eloquent', difficulty: 'hard' },
  { word: 'pristine', difficulty: 'hard' },
  { word: 'ubiquitous', difficulty: 'hard' },
  { word: 'resilient', difficulty: 'hard' },
  { word: 'meticulous', difficulty: 'hard' },
  { word: 'inquisitive', difficulty: 'hard' },
  { word: 'perseverance', difficulty: 'hard' },
  { word: 'benevolent', difficulty: 'hard' },
  { word: 'contemplative', difficulty: 'hard' },
  { word: 'audacious', difficulty: 'hard' },
  { word: 'pragmatic', difficulty: 'hard' },
  { word: 'vindicate', difficulty: 'hard' },
  { word: 'exemplary', difficulty: 'hard' },
  { word: 'intrinsic', difficulty: 'hard' },
];

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const WordCard = ({ wordObj, isSelected, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(wordObj);
  };

  return (
    <Animated.View
      style={[
        styles.wordCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.wordCard,
          isSelected && styles.selectedWordCard,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.wordText,
          isSelected && styles.selectedWordText,
        ]}>
          {wordObj.word}
        </Text>
        
        {/* Selection indicator */}
        {isSelected && (
          <Animated.View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const AssessmentScreen = ({ navigation }) => {
  const [selectedWords, setSelectedWords] = useState([]);
  const [vocabularyOptions, setVocabularyOptions] = useState([]);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shuffle vocabulary and take first 24 words for assessment
    const shuffledVocab = shuffleArray(ASSESSMENT_VOCABULARY).slice(0, 24);
    setVocabularyOptions(shuffledVocab);
  }, []);

  useEffect(() => {
    // Animate progress bar
    const progress = selectedWords.length / vocabularyOptions.length;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedWords, vocabularyOptions]);

  const toggleWord = (wordObj) => {
    const word = wordObj.word;
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const calculateUserLevel = () => {
    const selectedWordObjs = vocabularyOptions.filter(w => selectedWords.includes(w.word));
    const difficultyScores = {
      easy: 1,
      medium: 2,
      hard: 3
    };

    const totalScore = selectedWordObjs.reduce((sum, word) => {
      return sum + difficultyScores[word.difficulty];
    }, 0);

    const averageScore = selectedWords.length > 0 ? totalScore / selectedWords.length : 0;

    if (averageScore < 1.5) return 'Beginner';
    if (averageScore < 2.5) return 'Intermediate';
    return 'Advanced';
  };

  const handleContinue = async () => {
    const userLevel = calculateUserLevel();
    const correctAnswers = selectedWords.length;
    const totalWords = vocabularyOptions.length;
    const score = Math.round((correctAnswers / totalWords) * 100);
    
    let percentile = 50;
    if (score >= 80) percentile = 85 + Math.floor(Math.random() * 10);
    else if (score >= 60) percentile = 70 + Math.floor(Math.random() * 15);
    else if (score >= 40) percentile = 50 + Math.floor(Math.random() * 20);
    else percentile = 25 + Math.floor(Math.random() * 25);
    
    try {
      await SecureStore.setItemAsync('userLevel', userLevel);
      await SecureStore.setItemAsync('familiarWords', JSON.stringify(selectedWords));
      console.log(`✅ User Level: ${userLevel}`);
      console.log(`📚 Familiar Words: ${selectedWords.length}`);
    } catch (error) {
      console.log('Error saving assessment:', error);
    }
    
    // Haptic feedback for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    navigation.navigate('PostAssessmentAuth', {
      userLevel,
      score,
      totalWords,
      correctAnswers,
      percentile
    });
  };

  const clearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedWords([]);
  };

  const getProgressText = () => {
    const progress = Math.round((selectedWords.length / vocabularyOptions.length) * 100);
    if (progress === 0) return "Let's get started";
    if (progress < 50) return "Keep going";
    if (progress < 80) return "Great progress";
    return "Almost done";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Which words do you know?</Text>
          <Text style={styles.subtitle}>Tap the words you're familiar with</Text>
        </View>
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{getProgressText()}</Text>
            <Text style={styles.counter}>{selectedWords.length} of {vocabularyOptions.length}</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]} 
            />
          </View>
        </View>
        
        {/* Quick Actions */}
        {selectedWords.length > 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Words Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.wordsGrid}>
          {vocabularyOptions.map((wordObj, index) => (
            <WordCard
              key={wordObj.word}
              wordObj={wordObj}
              isSelected={selectedWords.includes(wordObj.word)}
              onPress={toggleWord}
              index={index}
            />
          ))}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            selectedWords.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedWords.length === 0}
        >
          <Text style={[
            styles.continueButtonText,
            selectedWords.length === 0 && styles.continueButtonTextDisabled
          ]}>
            Continue Assessment
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          Don't worry if you don't know some words - that's how we learn!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  counter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  quickActions: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordCardContainer: {
    width: (width - 60) / 2, // Account for padding and gap
    marginBottom: 12,
  },
  wordCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedWordCard: {
    backgroundColor: '#000',
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedWordText: {
    color: '#fff',
    fontWeight: '700',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  bottomSpacing: {
    height: 40,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
  helpText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AssessmentScreen;