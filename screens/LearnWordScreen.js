import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DataManager from '../utils/DataManager';
import ClaudeService from '../utils/ClaudeService'; // Import Claude service

const { width } = Dimensions.get('window');

export default function LearnWordScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    discoveredWord: '',
    meaningCorrect: false,
    spellingCorrect: false,
    usageCorrect: false
  });

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Loading and word data states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [wordData, setWordData] = useState(null);

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Spelling state
  const [spellingAnswer, setSpellingAnswer] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);

  // Load word lesson on component mount
  useEffect(() => {
    loadWordLesson();
  }, []);

  useEffect(() => {
    if (wordData) {
      startStepAnimation();
      // Initialize spelling letters when wordData is available
      if (currentStep === 3) {
        setAvailableLetters([...wordData.steps[3].letters]);
      }
    }
  }, [currentStep, wordData]);

  const loadWordLesson = async () => {
    try {
      setIsLoading(true);
      setLoadingError(null);
      
      console.log('🔄 Loading new word lesson...');
      
      // Get lesson from Claude API
      const lesson = await ClaudeService.getNewLesson();
      
      if (!lesson || !lesson.targetWord) {
        throw new Error('Invalid lesson data received');
      }
      
      console.log('✅ Lesson loaded:', lesson.targetWord);
      
      // Transform lesson data to match component structure
      const transformedData = transformLessonData(lesson);
      setWordData(transformedData);
      
      // Initialize spelling letters
      setAvailableLetters([...lesson.steps[3].letters]);
      
    } catch (error) {
      console.error('❌ Error loading word lesson:', error);
      setLoadingError(error.message);
      
      // Show error alert with retry option
      Alert.alert(
        'Connection Issue',
        'Unable to load new word. Check your internet connection.',
        [
          { 
            text: 'Try Again', 
            onPress: () => loadWordLesson() 
          },
          { 
            text: 'Use Offline Word', 
            onPress: () => loadFallbackLesson() 
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Transform Claude lesson data to component format
// Replace your transformLessonData function in LearnWordScreen.js with this:

const transformLessonData = (lesson) => {
  console.log('🔄 Transforming lesson data:', lesson);
  
  // Ensure lesson and steps exist
  if (!lesson || !lesson.steps) {
    console.error('❌ Invalid lesson structure');
    // Return a safe fallback structure
    return {
      targetWord: 'SERENDIPITY',
      emoji: '✨',
      story: 'Maya was looking for a coffee shop when she stumbled upon a tiny bookstore. Inside, she found the exact rare novel she had been searching for months. This unexpected discovery filled her with joy.',
      storyOptions: [
        { id: 'A', text: 'serendipity', correct: true },
        { id: 'B', text: 'melancholy', correct: false },
        { id: 'C', text: 'perseverance', correct: false },
        { id: 'D', text: 'hypothesis', correct: false }
      ],
      meaningOptions: [
        { id: 'A', text: 'A pleasant surprise or discovery', correct: true },
        { id: 'B', text: 'A feeling of deep sadness', correct: false },
        { id: 'C', text: 'A planned achievement', correct: false },
        { id: 'D', text: 'A difficult challenge', correct: false }
      ],
      spellingLetters: ['S', 'E', 'R', 'E', 'N', 'D', 'I', 'P', 'I', 'T', 'Y'].sort(() => Math.random() - 0.5),
      usageOptions: [
        { id: 'A', text: 'Finding my soulmate at a random coffee shop was pure serendipity', correct: true },
        { id: 'B', text: 'I serendipity my homework every night', correct: false },
        { id: 'C', text: 'The serendipity weather ruined our picnic', correct: false },
        { id: 'D', text: 'She serendipity walked to the store yesterday', correct: false }
      ],
      definition: 'A pleasant surprise or discovery'
    };
  }

  try {
    const transformed = {
      targetWord: lesson.targetWord?.toUpperCase() || 'SERENDIPITY',
      emoji: lesson.emoji || '📚',
      story: lesson.story || 'This is a story about learning new words.',
      
      // Story options (Step 1) - Safe access with fallbacks
      storyOptions: (lesson.steps[1]?.options || ['serendipity', 'melancholy', 'perseverance', 'hypothesis']).map((option, index) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D
        text: option,
        correct: option === (lesson.steps[1]?.correctAnswer || 'serendipity')
      })),
      
      // Meaning options (Step 2) - Safe access with fallbacks
      meaningOptions: (lesson.steps[2]?.options || [
        'A pleasant surprise or discovery',
        'A feeling of deep sadness',
        'A planned achievement',
        'A difficult challenge'
      ]).map((option, index) => ({
        id: String.fromCharCode(65 + index),
        text: option,
        correct: option === (lesson.steps[2]?.correctAnswer || 'A pleasant surprise or discovery')
      })),
      
      // Spelling letters (Step 3) - Safe access with fallback
      spellingLetters: lesson.steps[3]?.letters || 
        (lesson.targetWord?.toUpperCase().split('').sort(() => Math.random() - 0.5)) ||
        ['S', 'E', 'R', 'E', 'N', 'D', 'I', 'P', 'I', 'T', 'Y'].sort(() => Math.random() - 0.5),
      
      // Usage options (Step 4) - Safe access with fallbacks
      usageOptions: (lesson.steps[4]?.options || [
        'Finding my soulmate at a random coffee shop was pure serendipity',
        'I serendipity my homework every night',
        'The serendipity weather ruined our picnic',
        'She serendipity walked to the store yesterday'
      ]).map((option, index) => ({
        id: String.fromCharCode(65 + index),
        text: option,
        correct: option === (lesson.steps[4]?.correctAnswer || lesson.steps[4]?.options?.[0])
      })),
      
      definition: lesson.definition || 'A pleasant surprise or discovery'
    };

    console.log('✅ Transformed lesson data:', transformed);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming lesson data:', error);
    // Return safe fallback if transformation fails
    return {
      targetWord: 'SERENDIPITY',
      emoji: '✨',
      story: 'Maya was looking for a coffee shop when she stumbled upon a tiny bookstore. Inside, she found the exact rare novel she had been searching for months. This unexpected discovery filled her with joy.',
      storyOptions: [
        { id: 'A', text: 'serendipity', correct: true },
        { id: 'B', text: 'melancholy', correct: false },
        { id: 'C', text: 'perseverance', correct: false },
        { id: 'D', text: 'hypothesis', correct: false }
      ],
      meaningOptions: [
        { id: 'A', text: 'A pleasant surprise or discovery', correct: true },
        { id: 'B', text: 'A feeling of deep sadness', correct: false },
        { id: 'C', text: 'A planned achievement', correct: false },
        { id: 'D', text: 'A difficult challenge', correct: false }
      ],
      spellingLetters: ['S', 'E', 'R', 'E', 'N', 'D', 'I', 'P', 'I', 'T', 'Y'].sort(() => Math.random() - 0.5),
      usageOptions: [
        { id: 'A', text: 'Finding my soulmate at a random coffee shop was pure serendipity', correct: true },
        { id: 'B', text: 'I serendipity my homework every night', correct: false },
        { id: 'C', text: 'The serendipity weather ruined our picnic', correct: false },
        { id: 'D', text: 'She serendipity walked to the store yesterday', correct: false }
      ],
      definition: 'A pleasant surprise or discovery'
    };
  }
};

  // Fallback to offline lesson if API fails
  const loadFallbackLesson = () => {
    console.log('📚 Loading fallback lesson...');
    const fallback = ClaudeService.getFallbackLesson();
    const transformedData = transformLessonData(fallback);
    setWordData(transformedData);
    setAvailableLetters([...fallback.steps[3].letters]);
    setLoadingError(null);
  };

  const startStepAnimation = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.9);

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStoryAnswer = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, discoveredWord: wordData.targetWord }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleMeaningAnswer = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, meaningCorrect: true }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleUsageAnswer = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, usageCorrect: true }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleLetterPress = (letter, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newSpelling = [...spellingAnswer, letter];
    const newAvailable = availableLetters.filter((_, i) => i !== index);
    
    setSpellingAnswer(newSpelling);
    setAvailableLetters(newAvailable);
    
    // Check if word is complete
    if (newSpelling.length === wordData.targetWord.length) {
      const isSpellingCorrect = newSpelling.join('') === wordData.targetWord;
      setIsCorrect(isSpellingCorrect);
      setShowResult(true);
      
      if (isSpellingCorrect) {
        setAnswers(prev => ({ ...prev, spellingCorrect: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const resetSpelling = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpellingAnswer([]);
    setAvailableLetters(wordData.spellingLetters);
    setShowResult(false);
  };

  const nextStep = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // All steps complete - save progress!
      try {
        await DataManager.addLearnedWord(
          wordData.targetWord.toLowerCase(), 
          wordData.definition || 'A vocabulary word', 
          wordData.emoji || '📚'
        );
        
        await DataManager.updateProgressAfterLearning();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate back with success notification
        navigation.navigate('Main', { wordLearned: true });
      } catch (error) {
        console.error('Error saving progress:', error);
        navigation.navigate('Main');
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Discover the Word";
      case 2: return "Learn the Meaning";
      case 3: return "Master the Spelling";
      case 4: return "Practice Usage";
      default: return "Learn";
    }
  };

  const getStepEmoji = () => {
    switch (currentStep) {
      case 1: return "🔍";
      case 2: return "💡";
      case 3: return "✏️";
      case 4: return "🎯";
      default: return "📚";
    }
  };

  // Show loading screen while fetching word
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#000', '#2d3436']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>Loading Word...</Text>
            <View style={styles.stepIndicator} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Generating your personalized word...</Text>
          <Text style={styles.loadingSubtext}>✨ Powered by Claude AI</Text>
        </View>
      </View>
    );
  }

  // Show error screen if loading failed and no fallback
  if (loadingError && !wordData) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#000', '#2d3436']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>Connection Issue</Text>
            <View style={styles.stepIndicator} />
          </View>
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🔌</Text>
          <Text style={styles.errorText}>Unable to load new word</Text>
          <Text style={styles.errorSubtext}>Check your internet connection</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={loadWordLesson}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.offlineButton} onPress={loadFallbackLesson}>
            <Text style={styles.offlineButtonText}>Use Offline Word</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render main learning interface (rest of your existing render methods stay the same)
  const renderStoryStep = () => (
    <Animated.ScrollView 
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.storyCard}>
          <Text style={styles.storyText}>{wordData.story}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {wordData.storyOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 10)],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
                ]}
                onPress={() => handleStoryAnswer(option)}
                disabled={showResult}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionBadge, selectedAnswer === option.id && isCorrect && styles.correctBadge]}>
                    <Text style={[styles.optionId, selectedAnswer === option.id && isCorrect && styles.correctBadgeText]}>{option.id}</Text>
                  </View>
                  <Text style={[styles.optionText, selectedAnswer === option.id && isCorrect && styles.correctOptionText]}>{option.text}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );

  const renderMeaningStep = () => (
    <Animated.ScrollView 
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.wordDisplayCard}>
          <Text style={styles.currentWord}>{wordData.targetWord}</Text>
          <Text style={styles.wordQuestion}>What does this word mean?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {wordData.meaningOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 10)],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
                ]}
                onPress={() => handleMeaningAnswer(option)}
                disabled={showResult}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionBadge, selectedAnswer === option.id && isCorrect && styles.correctBadge]}>
                    <Text style={[styles.optionId, selectedAnswer === option.id && isCorrect && styles.correctBadgeText]}>{option.id}</Text>
                  </View>
                  <Text style={[styles.optionText, selectedAnswer === option.id && isCorrect && styles.correctOptionText]}>{option.text}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );

  const renderSpellingStep = () => (
    <Animated.ScrollView 
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.spellingContainer}>
          <View style={styles.wordSlots}>
            {Array(wordData.targetWord.length).fill().map((_, index) => (
              <View key={index} style={styles.letterSlot}>
                <Text style={styles.slotLetter}>
                  {spellingAnswer[index] || ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.letterBank}>
            <Text style={styles.bankTitle}>Tap letters to spell the word</Text>
            <View style={styles.letterGrid}>
              {availableLetters.map((letter, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.letterButton}
                  onPress={() => handleLetterPress(letter, index)}
                >
                  <Text style={styles.letterText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={resetSpelling}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );

  const renderUsageStep = () => (
    <Animated.ScrollView 
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.wordDisplayCard}>
          <Text style={styles.currentWord}>{wordData.targetWord}</Text>
          <Text style={styles.wordQuestion}>Which sentence uses this word correctly?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {wordData.usageOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrapper,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 10)],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
                ]}
                onPress={() => handleUsageAnswer(option)}
                disabled={showResult}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionBadge, selectedAnswer === option.id && isCorrect && styles.correctBadge]}>
                    <Text style={[styles.optionId, selectedAnswer === option.id && isCorrect && styles.correctBadgeText]}>{option.id}</Text>
                  </View>
                  <Text style={[styles.optionText, selectedAnswer === option.id && isCorrect && styles.correctOptionText]}>{option.text}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );

  const renderResultSection = () => {
    if (!showResult) return null;

    return (
      <Animated.View 
        style={[
          styles.resultContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={isCorrect ? ['#22c55e', '#16a34a'] : ['#ef4444', '#dc2626']}
          style={styles.resultGradient}
        >
          <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '💪'}</Text>
          <Text style={styles.resultText}>
            {isCorrect ? 
              (currentStep === 1 ? `Perfect! You discovered: ${wordData.targetWord}` :
               currentStep === 2 ? 'Excellent! You understand the meaning!' :
               currentStep === 3 ? 'Amazing spelling!' :
               'Perfect usage!') :
              'Not quite right. Try again!'
            }
          </Text>
          
          {isCorrect ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>
                {currentStep === 4 ? 'Complete! 🎊' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => {
              setShowResult(false);
              setSelectedAnswer('');
            }}>
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#000', '#2d3436']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.stepEmoji}>{getStepEmoji()}</Text>
            <Text style={styles.stepTitle}>{getStepTitle()}</Text>
          </View>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{currentStep}/4</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / 4) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>

      {/* Step Content */}
      <View style={styles.contentWrapper}>
        {currentStep === 1 && renderStoryStep()}
        {currentStep === 2 && renderMeaningStep()}
        {currentStep === 3 && renderSpellingStep()}
        {currentStep === 4 && renderUsageStep()}
      </View>

      {/* Result Section */}
      {renderResultSection()}
    </View>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepIndicator: {
    width: 40,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  contentWrapper: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  contentContainer: {
    flex: 1,
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  offlineButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  // ... (rest of your existing styles remain the same)
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  storyText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  wordDisplayCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  currentWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
    marginBottom: 12,
  },
  wordQuestion: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  optionWrapper: {
    // Container for animation
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  wrongOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  correctBadge: {
    backgroundColor: '#22c55e',
  },
  optionId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  correctBadgeText: {
    color: '#fff',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#166534',
    fontWeight: '600',
  },
  spellingContainer: {
    alignItems: 'center',
  },
  wordSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  letterSlot: {
    width: 44,
    height: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  slotLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  letterBank: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 20,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  letterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  resultEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tryAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});