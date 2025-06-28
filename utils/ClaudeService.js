import { supabase } from '../supabase.config.js';

// Helper functions (keep all the existing helper functions)
const generateSimilarWord = (targetWord) => {
  const prefixes = ['pre', 'un', 'dis', 'mis', 'over'];
  const suffixes = ['ing', 'ed', 'ly', 'tion', 'ness'];
  
  if (Math.random() > 0.5 && targetWord.length > 4) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return prefix + targetWord.slice(2);
  } else {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return targetWord.slice(0, -2) + suffix;
  }
};

const transformLessonData = (lesson) => {
  console.log('🔄 Transforming lesson data:', lesson);
  
  if (!lesson || !lesson.targetWord) {
    console.error('❌ Invalid lesson structure');
    return getFallbackTransformedData();
  }

  try {
    const steps = lesson.steps || {};
    const step1 = steps[1] || steps['1'] || {};
    const step2 = steps[2] || steps['2'] || {};
    const step3 = steps[3] || steps['3'] || {};
    const step4 = steps[4] || steps['4'] || {};

    const transformed = {
      targetWord: lesson.targetWord.toUpperCase(),
      emoji: lesson.emoji || '📚',
      story: lesson.story || step1.story || 'This is a story about learning new words.',
      
      storyOptions: (step1.options || [lesson.targetWord, 'option1', 'option2', 'option3']).map((option, index) => ({
        id: String.fromCharCode(65 + index), // A, B, C, D
        text: option || `option${index + 1}`,
        correct: option === (step1.correctAnswer || lesson.targetWord)
      })),
      
      meaningOptions: (() => {
        const correctAnswer = step2.correctAnswer || lesson.definition || 'A word to learn';
        const wrongAnswers = lesson.wrongAnswers || ['Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3'];
        const allOptions = step2.options || [correctAnswer, ...wrongAnswers];
        
        return allOptions.slice(0, 4).map((option, index) => ({
          id: String.fromCharCode(65 + index),
          text: option || `option${index + 1}`,
          correct: option === correctAnswer
        }));
      })(),
      
      spellingLetters: (() => {
        if (step3.letters && Array.isArray(step3.letters)) {
          return step3.letters;
        }
        return lesson.targetWord.toUpperCase().split('').sort(() => Math.random() - 0.5);
      })(),
      
      usageOptions: (() => {
        const correctUsage = step4.correctAnswer || (lesson.usageOptions && lesson.usageOptions[0]) || `This is how you use ${lesson.targetWord.toLowerCase()} correctly.`;
        const wrongUsages = lesson.usageOptions ? lesson.usageOptions.slice(1) : ['Wrong usage 1', 'Wrong usage 2', 'Wrong usage 3'];
        const allOptions = step4.options || [correctUsage, ...wrongUsages];
        
        return allOptions.slice(0, 4).map((option, index) => ({
          id: String.fromCharCode(65 + index),
          text: option || `usage${index + 1}`,
          correct: option === correctUsage
        }));
      })(),
      
      definition: lesson.definition || 'A vocabulary word'
    };

    console.log('✅ Transformed lesson data:', transformed);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming lesson data:', error);
    return getFallbackTransformedData();
  }
};

const getFallbackTransformedData = () => {
  return {
    targetWord: 'JOURNEY',
    emoji: '🚗',
    story: 'Yesterday, I packed snacks for a long drive. We sang songs and played games in the car during our adventure.',
    storyOptions: [
      { id: 'A', text: 'journey', correct: true },
      { id: 'B', text: 'story', correct: false },
      { id: 'C', text: 'adventure', correct: false },
      { id: 'D', text: 'travel', correct: false }
    ],
    meaningOptions: [
      { id: 'A', text: 'Travel from one place to another', correct: true },
      { id: 'B', text: 'A place to sleep', correct: false },
      { id: 'C', text: 'Something to eat', correct: false },
      { id: 'D', text: 'A type of music', correct: false }
    ],
    spellingLetters: ['J', 'O', 'U', 'R', 'N', 'E', 'Y'].sort(() => Math.random() - 0.5),
    usageOptions: [
      { id: 'A', text: 'We went on a journey to the mountains.', correct: true },
      { id: 'B', text: 'Let\'s have a picnic in a park.', correct: false },
      { id: 'C', text: 'We enjoyed shopping at a mall.', correct: false },
      { id: 'D', text: 'We watched a movie at home.', correct: false }
    ],
    definition: 'Travel from one place to another'
  };
};

// Validate if a string looks like a real human name
const isValidHumanName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const cleanName = name.trim().toLowerCase();
  
  const validationRules = {
    validLength: cleanName.length >= 2 && cleanName.length <= 30,
    validCharacters: /^[a-z\s\-']+$/.test(cleanName),
    notMostlyNumbers: !/^\d+$/.test(cleanName),
    notUsernamePattern: !(/\d{3,}|[_@#$%^&*()+=\[\]{}|\\:";'<>?,./]/.test(cleanName)),
    notEmailLike: !cleanName.includes('@') && !cleanName.includes('.com'),
    startsWithLetter: /^[a-z]/.test(cleanName)
  };
  
  const isValid = Object.values(validationRules).every(rule => rule === true);
  
  console.log('🔍 Name validation for:', name);
  console.log('✅ Is valid human name:', isValid);
  
  return isValid;
};

// Get user's full name from profile with smart validation
const getUserName = async () => {
  try {
    const DataManager = require('./DataManager').default;
    const profile = await DataManager.getUserProfile();
    
    const potentialNames = [
      profile.fullName,
      profile.name,
      profile.username,
      profile.email ? profile.email.split('@')[0] : null
    ].filter(Boolean);
    
    console.log('🔍 Checking potential names:', potentialNames);
    
    for (const name of potentialNames) {
      if (isValidHumanName(name)) {
        console.log('👤 Using validated name:', name);
        return name.trim();
      }
    }
    
    console.log('⚠️ No valid human name found, using default: User');
    return 'User';
    
  } catch (error) {
    console.log('⚠️ Error getting user name, using default: User');
    return 'User';
  }
};

// Get user's learning goals from assessment
const getUserLearningGoals = async () => {
  try {
    const DataManager = require('./DataManager').default;
    const profile = await DataManager.getUserProfile();
    const goals = profile.learningGoals || [];
    
    console.log('🎯 Retrieved learning goals:', goals);
    return goals;
  } catch (error) {
    console.log('⚠️ No learning goals found');
    return [];
  }
};

// Get user's learning level from storage
const getUserLevel = async () => {
  try {
    const DataManager = require('./DataManager').default;
    const profile = await DataManager.getUserProfile();
    return profile.level || 'Beginner';
  } catch (error) {
    console.log('⚠️ Using default level: Beginner');
    return 'Beginner';
  }
};

// Get ALL previously learned words to avoid repetition
const getPreviousWords = async () => {
  try {
    const DataManager = require('./DataManager').default;
    const learnedWords = await DataManager.getLearnedWords();
    
    const allLearnedWords = learnedWords.map(item => item.word.toLowerCase());
    
    console.log(`📚 User has learned ${allLearnedWords.length} words total`);
    console.log('🚫 Excluding these words:', allLearnedWords);
    
    return allLearnedWords;
  } catch (error) {
    console.log('⚠️ No previous words found');
    return [];
  }
};

// Enhanced fallback lesson with personalization
const getFallbackLesson = async () => {
  console.log('📚 Using enhanced fallback lesson');
  
  const userName = await getUserName();
  const learningGoals = await getUserLearningGoals();
  
  const fallbackWords = [
    {
      targetWord: 'journey',
      emoji: '🚗',
      story: `${userName} was excited about the long road trip ahead. The family packed snacks and games for their adventure to the mountains. Everyone was looking forward to the fun experience together.`,
      definition: 'Travel from one place to another',
      wrongAnswers: ['A place to sleep', 'Something to eat', 'A type of music'],
      spellingHint: 'Starts with "jou", ends with "ney"',
      usageOptions: [
        `${userName} went on a journey to the mountains.`,
        'Let\'s have a picnic in a park.',
        'We enjoyed shopping at a mall.',
        'We watched a movie at home.'
      ]
    },
    {
      targetWord: 'courage',
      emoji: '🦁',
      story: `${userName} was nervous about speaking in front of the class. When the teacher called on them, they took a deep breath and stood up. Despite feeling scared, ${userName} shared their ideas with confidence.`,
      definition: 'Bravery in difficult situations',
      wrongAnswers: ['Fear of danger', 'Anger at others', 'Confusion about choices'],
      spellingHint: 'Sounds like "care-age"',
      usageOptions: [
        `It took courage for ${userName} to speak up.`,
        'She courage her way through traffic.',
        'The courage weather was perfect today.',
        'He courage his homework before dinner.'
      ]
    }
  ];

  const randomFallback = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
  
  const lesson = {
    ...randomFallback,
    steps: generateStepsFromLesson({
      word: randomFallback.targetWord,
      emoji: randomFallback.emoji,
      story: randomFallback.story,
      definition: randomFallback.definition,
      wrongAnswers: randomFallback.wrongAnswers,
      spellingHint: randomFallback.spellingHint,
      usageOptions: randomFallback.usageOptions
    })
  };

  console.log('✅ Personalized fallback lesson ready:', lesson.targetWord);
  return lesson;
};

// 🚀 NEW: Main method using Supabase Edge Function
const getNewLesson = async () => {
  try {
    console.log('🎯 Getting personalized lesson via Edge Function...');
    
    // Get all user data
    const [userLevel, previousWords, learningGoals, userName] = await Promise.all([
      getUserLevel(),
      getPreviousWords(),
      getUserLearningGoals(),
      getUserName()
    ]);
    
    console.log('👤 User level:', userLevel);
    console.log('👤 User name:', userName);
    console.log('📝 Total learned words:', previousWords.length);
    console.log('🎯 Learning goals:', learningGoals);
    
    // 🔥 Call the secure Edge Function instead of OpenAI directly
    const { data, error } = await supabase.functions.invoke('generate-word-lesson', {
      body: {
        userLevel,
        previousWords,
        learningGoals,
        userName
      }
    });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      throw new Error(`Edge Function failed: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('❌ Invalid response from Edge Function');
      throw new Error('Invalid response from Edge Function');
    }
    
    const lesson = data.lesson;
    
    // Validate lesson structure before returning
    if (!lesson || !lesson.targetWord) {
      console.error('❌ Invalid lesson structure, using fallback');
      return getFallbackLesson();
    }

    console.log('✅ Lesson generated via Edge Function:', lesson.targetWord);
    
    if (data.fallback) {
      console.log('⚠️ Used fallback lesson due to API issues');
    }
    
    return lesson;
  } catch (error) {
    console.error('❌ Error getting lesson from Edge Function:', error);
    console.log('🔄 Falling back to local fallback lesson');
    return getFallbackLesson();
  }
};

// Test the Edge Function connection
const testConnection = async () => {
  try {
    console.log('🧪 Testing Edge Function connection...');
    
    const { data, error } = await supabase.functions.invoke('generate-word-lesson', {
      body: {
        userLevel: 'Beginner',
        previousWords: [],
        learningGoals: [],
        userName: 'Test User'
      }
    });

    if (error) {
      console.error('❌ Edge Function test failed:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Edge Function test successful:', data.lesson?.targetWord);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Edge Function connection test failed:', error.message);
    return false;
  }
};

// Check if API is configured (now checks Edge Function)
const isApiConfigured = async () => {
  try {
    return await testConnection();
  } catch (error) {
    return false;
  }
};

// Get API status
const getApiStatus = () => {
  return {
    provider: 'Supabase Edge Function + OpenAI',
    isConfigured: true, // Edge Function handles the API key
    security: 'API key secured in Supabase Edge Function',
    model: 'gpt-3.5-turbo'
  };
};

// Generate steps from lesson (keep existing function)
const generateStepsFromLesson = (lesson) => {
  const steps = {
    1: {
      type: 'discovery',
      story: lesson.story,
      options: [
        lesson.word,
        generateSimilarWord(lesson.word),
        generateSimilarWord(lesson.word),
        generateSimilarWord(lesson.word)
      ].sort(() => Math.random() - 0.5),
      correctAnswer: lesson.word
    },
    2: {
      type: 'meaning',
      question: `What does "${lesson.word}" mean?`,
      options: [
        lesson.definition,
        ...lesson.wrongAnswers.slice(0, 3)
      ].sort(() => Math.random() - 0.5),
      correctAnswer: lesson.definition
    },
    3: {
      type: 'spelling',
      hint: lesson.spellingHint,
      letters: lesson.word.toUpperCase().split('').sort(() => Math.random() - 0.5),
      correctWord: lesson.word.toUpperCase()
    },
    4: {
      type: 'usage',
      question: `Which sentence uses "${lesson.word}" correctly?`,
      options: lesson.usageOptions.slice(0, 4),
      correctAnswer: lesson.usageOptions[0]
    }
  };

  return steps;
};

// Cost tracking utility
const getUsageEstimate = () => {
  return {
    tokensPerLesson: 450,
    costPerLesson: 0.0025, // Approximate cost in USD
    lessonsWithFiveDollars: 2000,
    message: 'Your $5 credit should last for approximately 2000 lessons!',
    security: '🔒 API key is now secure in Edge Function'
  };
};

// API health check (now checks Edge Function)
const checkApiHealth = async () => {
  try {
    console.log('🔍 Checking Edge Function health...');
    
    const isWorking = await testConnection();
    
    if (isWorking) {
      return {
        status: 'healthy',
        message: 'Edge Function is working correctly',
        canGenerate: true,
        security: '🔒 API key secured server-side'
      };
    } else {
      return {
        status: 'error',
        message: 'Edge Function is not responding',
        canGenerate: false,
        fallback: 'Using local fallback lessons'
      };
    }
  } catch (error) {
    return {
      status: 'network_error',
      message: 'Network connection failed',
      error: error.message,
      canGenerate: false,
      fallback: 'Using local fallback lessons'
    };
  }
};

// Export as an object with all methods
const ClaudeService = {
  // 🔥 SECURE METHODS (using Edge Function)
  getNewLesson,
  testConnection,
  checkApiHealth,
  
  // Helper methods
  transformLessonData,
  generateStepsFromLesson,
  generateSimilarWord,
  getFallbackLesson,
  getUserLevel,
  getUserName,
  getUserLearningGoals,
  getPreviousWords,
  isApiConfigured,
  getApiStatus,
  getUsageEstimate,
  
  // 🚫 REMOVED INSECURE METHODS
  // generateWordLesson, - moved to Edge Function
  // createWordGenerationPrompt, - moved to Edge Function
  // parseWordLesson, - moved to Edge Function
};

export default ClaudeService;