import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const OnboardingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Transform Your Vocabulary</Text>
        <Text style={styles.subtitle}>
          Learn one powerful word every day through engaging stories and smart practice
        </Text>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate('Assessment')}
        >
          <Text style={styles.nextButtonText}>Start Learning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 30,
    alignItems: 'center',
    maxWidth: 350,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;