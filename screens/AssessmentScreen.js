import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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

const AssessmentScreen = ({ navigation }) => {
  const [selectedWords, setSelectedWords] = useState([]);
  const [vocabularyOptions, setVocabularyOptions] = useState([]);

  useEffect(() => {
    // Shuffle vocabulary and take first 24 words for assessment
    const shuffledVocab = shuffleArray(ASSESSMENT_VOCABULARY).slice(0, 24);
    setVocabularyOptions(shuffledVocab);
  }, []);

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
    const totalWords = vocabularyOptions.length; // 24
    const score = Math.round((correctAnswers / totalWords) * 100);
    
    // Calculate percentile based on performance (you can make this more sophisticated later)
    let percentile = 50; // default
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
    
    // Navigate to PostAssessmentAuth with results
    navigation.navigate('PostAssessmentAuth', {
      userLevel,
      score,
      totalWords,
      correctAnswers,
      percentile
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Which words are you familiar with?</Text>
        <Text style={styles.subtitle}>Select all the words you know well</Text>
        <Text style={styles.counter}>{selectedWords.length} words selected</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.wordsContainer}>
          {vocabularyOptions.map((wordObj, index) => {
            if (index % 2 === 0) {
              const nextWordObj = vocabularyOptions[index + 1];
              return (
                <View key={index} style={styles.wordRow}>
                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      selectedWords.includes(wordObj.word) && styles.selectedWordButton
                    ]}
                    onPress={() => toggleWord(wordObj)}
                  >
                    <Text style={[
                      styles.wordText,
                      selectedWords.includes(wordObj.word) && styles.selectedWordText
                    ]}>
                      {wordObj.word}
                    </Text>
                  </TouchableOpacity>
                  
                  {nextWordObj && (
                    <TouchableOpacity
                      style={[
                        styles.wordButton,
                        selectedWords.includes(nextWordObj.word) && styles.selectedWordButton
                      ]}
                      onPress={() => toggleWord(nextWordObj)}
                    >
                      <Text style={[
                        styles.wordText,
                        selectedWords.includes(nextWordObj.word) && styles.selectedWordText
                      ]}>
                        {nextWordObj.word}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
            return null;
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  counter: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  wordsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  wordRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  wordButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  selectedWordButton: {
    backgroundColor: '#000',
  },
  wordText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedWordText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssessmentScreen;