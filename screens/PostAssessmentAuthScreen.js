import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const PostAssessmentAuthScreen = ({ navigation, route }) => {
  // Get assessment results from navigation params
  const { 
    userLevel = 'Intermediate',
    score = 67,
    totalWords = 24,
    correctAnswers = 16,
    percentile = 73
  } = route?.params || {};

  const handleSignup = () => {
    navigation.navigate('Signup', { 
      userLevel, 
      score, 
      totalWords, 
      correctAnswers,
      percentile 
    });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSkip = () => {
    // Go to main as guest with limited features
    navigation.navigate('Main', { isGuest: true });
  };

  // Dynamic messaging based on performance
  const getMotivationalMessage = () => {
    if (percentile >= 80) {
      return "Impressive! You're in the top 20% of learners!";
    } else if (percentile >= 60) {
      return "Great job! You're above average!";
    } else if (percentile >= 40) {
      return "Good start! Ready to level up?";
    } else {
      return "Everyone starts somewhere. Let's build your vocabulary!";
    }
  };

  const getLevelColor = () => {
    switch (userLevel.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Results Section */}
      <View style={styles.resultsSection}>
        <View style={styles.scoreCard}>
          <Text style={styles.congratsText}>Assessment Complete! 🎉</Text>
          
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
            <Text style={styles.levelText}>{userLevel}</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{correctAnswers}/{totalWords}</Text>
              <Text style={styles.scoreLabel}>Correct Answers</Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{percentile}%</Text>
              <Text style={styles.scoreLabel}>Better Than Others</Text>
            </View>
          </View>
          
          <Text style={styles.motivationalText}>
            {getMotivationalMessage()}
          </Text>
        </View>
      </View>

      {/* Auth Prompt */}
      <View style={styles.authSection}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptTitle}>Save Your Progress</Text>
          <Text style={styles.promptSubtitle}>
            Create an account to track your learning journey and compete with friends!
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  scoreCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 24,
  },
  levelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  scoreRow: {
    flex: 1,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  motivationalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  authSection: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  authPrompt: {
    alignItems: 'center',
    marginBottom: 30,
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  promptSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostAssessmentAuthScreen;