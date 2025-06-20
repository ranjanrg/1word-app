import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DataManager from '../utils/DataManager';

const { width } = Dimensions.get('window');

export default function LearnWordScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    discoveredWord: '',
    meaningCorrect: false,
    spellingCorrect: false,
    usageCorrect: false
  });

  // Mock data - Will be replaced with Claude API
  const [wordData] = useState({
    targetWord: 'SERENDIPITY',
    story: 'Sarah walked into the old bookstore looking for a cookbook, but stumbled upon a rare first-edition novel instead. This beautiful unexpected discovery was pure _______.',
    storyOptions: [
      { id: 'A', text: 'Accident', correct: false },
      { id: 'B', text: 'Serendipity', correct: true },
      { id: 'C', text: 'Mistake', correct: false },
      { id: 'D', text: 'Planning', correct: false }
    ],
    meaningOptions: [
      { id: 'A', text: 'A planned meeting', correct: false },
      { id: 'B', text: 'A pleasant surprise or discovery', correct: true },
      { id: 'C', text: 'A feeling of sadness', correct: false },
      { id: 'D', text: 'A type of music', correct: false }
    ],
    spellingLetters: ['S', 'E', 'R', 'E', 'N', 'D', 'I', 'P', 'I', 'T', 'Y'],
    usageOptions: [
      { id: 'A', text: 'Planning a surprise party for weeks', correct: false },
      { id: 'B', text: 'Accidentally discovering a great restaurant', correct: true },
      { id: 'C', text: 'Getting angry about traffic', correct: false },
      { id: 'D', text: 'Studying hard for an exam', correct: false }
    ]
  });

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Spelling state
  const [spellingAnswer, setSpellingAnswer] = useState([]);
  const [availableLetters, setAvailableLetters] = useState(wordData.spellingLetters);

  const handleStoryAnswer = (option) => {
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, discoveredWord: wordData.targetWord }));
    }
  };

  const handleMeaningAnswer = (option) => {
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, meaningCorrect: true }));
    }
  };

  const handleUsageAnswer = (option) => {
    setSelectedAnswer(option.id);
    setIsCorrect(option.correct);
    setShowResult(true);
    
    if (option.correct) {
      setAnswers(prev => ({ ...prev, usageCorrect: true }));
    }
  };

  const handleLetterPress = (letter, index) => {
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
      }
    }
  };

  const resetSpelling = () => {
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
        // Add learned word to history
        await DataManager.addLearnedWord(
          wordData.targetWord, 
          'A pleasant surprise or discovery', 
          '✨'
        );
        
        // Update overall progress
        await DataManager.updateProgressAfterLearning();
        
        // Show success and return to main
        alert('🎉 Word Mastered! Great job learning ' + wordData.targetWord + '!');
        navigation.navigate('Main');
      } catch (error) {
        console.error('Error saving progress:', error);
        alert('Word learned but failed to save progress');
        navigation.navigate('Main');
      }
    }
  };

  const renderStoryStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Discover Today's Word</Text>
        <Text style={styles.stepSubtitle}>Read the story and choose the missing word</Text>
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.storyText}>{wordData.story}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {wordData.storyOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
            ]}
            onPress={() => handleStoryAnswer(option)}
            disabled={showResult}
          >
            <Text style={styles.optionId}>{option.id}</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.wrongText]}>
            {isCorrect ? '🎉 Perfect! You discovered: SERENDIPITY' : '❌ Not quite right. Try again!'}
          </Text>
          {isCorrect ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Continue Learning →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => {
              setShowResult(false);
              setSelectedAnswer('');
            }}>
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderMeaningStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What does SERENDIPITY mean?</Text>
        <Text style={styles.stepSubtitle}>Choose the correct definition</Text>
      </View>

      <View style={styles.wordDisplay}>
        <Text style={styles.currentWord}>SERENDIPITY</Text>
      </View>

      <View style={styles.optionsContainer}>
        {wordData.meaningOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
            ]}
            onPress={() => handleMeaningAnswer(option)}
            disabled={showResult}
          >
            <Text style={styles.optionId}>{option.id}</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.wrongText]}>
            {isCorrect ? '✅ Exactly! You understand the meaning!' : '❌ Not quite. Try again!'}
          </Text>
          {isCorrect ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Continue Learning →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => {
              setShowResult(false);
              setSelectedAnswer('');
            }}>
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderSpellingStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Spell the Word</Text>
        <Text style={styles.stepSubtitle}>Arrange the letters to spell SERENDIPITY</Text>
      </View>

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
          <Text style={styles.bankTitle}>Letter Bank:</Text>
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

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.wrongText]}>
            {isCorrect ? '🎯 Perfect spelling!' : '❌ Try again!'}
          </Text>
          {isCorrect && (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Continue Learning →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderUsageStep = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>When to use SERENDIPITY?</Text>
        <Text style={styles.stepSubtitle}>Choose the best situation</Text>
      </View>

      <View style={styles.wordDisplay}>
        <Text style={styles.currentWord}>SERENDIPITY</Text>
      </View>

      <View style={styles.optionsContainer}>
        {wordData.usageOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedAnswer === option.id && (isCorrect ? styles.correctOption : styles.wrongOption)
            ]}
            onPress={() => handleUsageAnswer(option)}
            disabled={showResult}
          >
            <Text style={styles.optionId}>{option.id}</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.wrongText]}>
            {isCorrect ? '🌟 Excellent! You can use this word perfectly!' : '❌ Think about happy accidents. Try again!'}
          </Text>
          {isCorrect ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Complete Learning! 🎉</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => {
              setShowResult(false);
              setSelectedAnswer('');
            }}>
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Progress Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step {currentStep} of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
        </View>
      </View>

      {/* Step Content */}
      {currentStep === 1 && renderStoryStep()}
      {currentStep === 2 && renderMeaningStep()}
      {currentStep === 3 && renderSpellingStep()}
      {currentStep === 4 && renderUsageStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 20,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storyText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#000',
    textAlign: 'center',
  },
  wordDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  currentWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  wrongOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
    width: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  spellingContainer: {
    alignItems: 'center',
  },
  wordSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  letterSlot: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    backgroundColor: '#fff',
  },
  slotLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  letterBank: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  letterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  letterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  correctText: {
    color: '#22c55e',
  },
  wrongText: {
    color: '#ef4444',
  },
  nextButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tryAgainButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tryAgainButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});