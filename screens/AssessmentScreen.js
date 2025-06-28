import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(wordObj);
  };

  const getDifficultyColor = () => {
    switch (wordObj.difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
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
        {/* Difficulty indicator */}
        <View style={[styles.difficultyIndicator, { backgroundColor: getDifficultyColor() }]} />
        
        {/* Word text */}
        <Text style={[
          styles.wordText,
          isSelected && styles.selectedWordText,
        ]}>
          {wordObj.word}
        </Text>
        
        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const AssessmentScreen = ({ navigation }) => {
  const [selectedWords, setSelectedWords] = useState([]);
  const [vocabularyOptions, setVocabularyOptions] = useState([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Shuffle vocabulary and take first 24 words for assessment
    const shuffledVocab = shuffleArray(ASSESSMENT_VOCABULARY).slice(0, 24);
    setVocabularyOptions(shuffledVocab);

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

  useEffect(() => {
    // Progress bar animation
    const progress = vocabularyOptions.length > 0 ? selectedWords.length / vocabularyOptions.length : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [selectedWords, vocabularyOptions]);

  const toggleWord = (wordObj) => {
    const word = wordObj.word;
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
      // Haptic feedback for selection
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    
    // Navigate to LearningGoals with assessment data
    navigation.navigate('LearningGoals', {
      userLevel,
      score,
      totalWords,
      correctAnswers,
      percentile,
      selectedWords
    });
  };

  const clearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedWords([]);
  };

  const getStats = () => {
    const easy = selectedWords.filter(w => vocabularyOptions.find(v => v.word === w && v.difficulty === 'easy')).length;
    const medium = selectedWords.filter(w => vocabularyOptions.find(v => v.word === w && v.difficulty === 'medium')).length;
    const hard = selectedWords.filter(w => vocabularyOptions.find(v => v.word === w && v.difficulty === 'hard')).length;
    return { easy, medium, hard };
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Reduced Header with Black Gradient */}
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
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.subtitle}>
              Show us <Text style={styles.highlightedText}>what you know</Text>
            </Text>
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{selectedWords.length} of {vocabularyOptions.length} words selected</Text>
              <TouchableOpacity onPress={clearAll} style={styles.resetButton}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            {/* Progress Bar */}
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

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.statText}>Easy: {stats.easy}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.statText}>Medium: {stats.medium}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.statText}>Hard: {stats.hard}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Words Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.wordsGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {vocabularyOptions.map((wordObj, index) => (
            <WordCard
              key={wordObj.word}
              wordObj={wordObj}
              isSelected={selectedWords.includes(wordObj.word)}
              onPress={toggleWord}
              index={index}
            />
          ))}
        </Animated.View>
        
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
            {selectedWords.length > 0 ? 'Continue to Learning Goals' : 'Select words to continue'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          Don't worry about being perfect - this helps us understand your level!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 32,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  highlightedText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  resetText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordCardContainer: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  wordCard: {
    backgroundColor: '#fff',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedWordCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 8,
  },
  difficultyIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedWordText: {
    color: '#000',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  continueButtonTextDisabled: {
    color: '#9ca3af',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AssessmentScreen;