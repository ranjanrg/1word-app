import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function LearningGoalsScreen({ navigation }) {
  const [selectedGoals, setSelectedGoals] = useState([]);

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

  const toggleGoal = (goalId) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    console.log("Selected Goals:", selectedGoals);
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>What would you like to achieve?</Text>
        <Text style={styles.subtitle}>
          Choose your learning goals to personalize your experience
        </Text>
      </View>

      <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.goalsGrid}>
          {learningGoals.map((goal) => (
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
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((dot) => (
            <View
              key={dot}
              style={[
                styles.progressDot,
                { backgroundColor: dot === 2 ? '#000' : '#ddd' }
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

        {/* Next Button */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            selectedGoals.length === 0 && styles.disabledButton
          ]} 
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.nextButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    width: (width - 60) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 140,
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
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});