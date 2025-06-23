import config from '../config.js';

// ⚠️ IMPORTANT: Add your OpenAI API key to config.js
const OPENAI_API_KEY = config.OPENAI_API_KEY || 'your-openai-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Generate similar-looking words for discovery options
const generateSimilarWord = (targetWord) => {
  const prefixes = ['pre', 'un', 'dis', 'mis', 'over'];
  const suffixes = ['ing', 'ed', 'ly', 'tion', 'ness'];
  
  // Sometimes add prefix/suffix, sometimes just similar word
  if (Math.random() > 0.5 && targetWord.length > 4) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return prefix + targetWord.slice(2);
  } else {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return targetWord.slice(0, -2) + suffix;
  }
};

// Generate the 4-step learning flow from the lesson data
const generateStepsFromLesson = (lesson) => {
  console.log('🔧 Generating steps from lesson:', lesson);
  
  // Ensure lesson object has all required properties
  const safeLesson = {
    word: lesson.word || 'journey',
    emoji: lesson.emoji || '📚',
    story: lesson.story || 'This is a story about learning new words.',
    definition: lesson.definition || 'A word to learn',
    wrongAnswers: lesson.wrongAnswers || ['Wrong 1', 'Wrong 2', 'Wrong 3'],
    spellingHint: lesson.spellingHint || 'Think about the spelling',
    usageOptions: lesson.usageOptions || [
      'This is correct usage',
      'This is wrong usage 1',
      'This is wrong usage 2', 
      'This is wrong usage 3'
    ]
  };

  const steps = {
    1: {
      type: 'discovery',
      story: safeLesson.story,
      options: [
        safeLesson.word,
        generateSimilarWord(safeLesson.word),
        generateSimilarWord(safeLesson.word),
        generateSimilarWord(safeLesson.word)
      ].sort(() => Math.random() - 0.5), // Shuffle options
      correctAnswer: safeLesson.word
    },
    2: {
      type: 'meaning',
      question: `What does "${safeLesson.word}" mean?`,
      options: [
        safeLesson.definition,
        ...safeLesson.wrongAnswers.slice(0, 3)
      ].sort(() => Math.random() - 0.5),
      correctAnswer: safeLesson.definition
    },
    3: {
      type: 'spelling',
      hint: safeLesson.spellingHint,
      letters: safeLesson.word.toUpperCase().split('').sort(() => Math.random() - 0.5),
      correctWord: safeLesson.word.toUpperCase()
    },
    4: {
      type: 'usage',
      question: `Which sentence uses "${safeLesson.word}" correctly?`,
      options: safeLesson.usageOptions.slice(0, 4),
      correctAnswer: safeLesson.usageOptions[0] // First option is correct
    }
  };

  console.log('✅ Generated steps:', steps);
  return steps;
};

// Validate if a string looks like a real human name
const isValidHumanName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Remove whitespace and convert to lowercase for checking
  const cleanName = name.trim().toLowerCase();
  
  // Basic validation rules
  const validationRules = {
    // Should be between 2-30 characters
    validLength: cleanName.length >= 2 && cleanName.length <= 30,
    
    // Should contain only letters, spaces, hyphens, and apostrophes
    validCharacters: /^[a-z\s\-']+$/.test(cleanName),
    
    // Should not be mostly numbers or special characters
    notMostlyNumbers: !/^\d+$/.test(cleanName),
    
    // Should not contain common username patterns
    notUsernamePattern: !(/\d{3,}|[_@#$%^&*()+=\[\]{}|\\:";'<>?,./]/.test(cleanName)),
    
    // Should not be email-like
    notEmailLike: !cleanName.includes('@') && !cleanName.includes('.com'),
    
    // Should start with a letter
    startsWithLetter: /^[a-z]/.test(cleanName)
  };
  
  // Must pass all validation rules
  const isValid = Object.values(validationRules).every(rule => rule === true);
  
  console.log('🔍 Name validation for:', name);
  console.log('📋 Validation results:', validationRules);
  console.log('✅ Is valid human name:', isValid);
  
  return isValid;
};

// Get user's full name from profile with smart validation
const getUserName = async () => {
  try {
    const DataManager = require('./DataManager').default;
    const profile = await DataManager.getUserProfile();
    
    // Priority order: fullName -> name -> username -> email username (only if valid)
    const potentialNames = [
      profile.fullName,     // NEW: Full name from signup
      profile.name,
      profile.username,
      profile.email ? profile.email.split('@')[0] : null
    ].filter(Boolean); // Remove null/undefined values
    
    console.log('🔍 Checking potential names:', potentialNames);
    
    // Find the first valid human name
    for (const name of potentialNames) {
      if (isValidHumanName(name)) {
        console.log('👤 Using validated name:', name);
        return name.trim();
      }
    }
    
    // If no valid human name found, use generic 'User'
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

// Enhanced word generation prompt with personalization
const createWordGenerationPrompt = (userLevel, previousWords, learningGoals = [], userName = 'User') => {
  const excludeWords = previousWords.length > 0 
    ? `\nDo not use these previously learned words: ${previousWords.join(', ')}`
    : '';

  // Create learning goals context for story themes
  const goalsContext = learningGoals.length > 0 
    ? `\nUser's learning goals: ${learningGoals.join(', ')}. Create stories that relate to these interests when possible.`
    : '';

  // Level-specific word criteria
  const levelCriteria = {
    'Beginner': 'Use common, everyday words (4-7 letters) that appear frequently in daily conversation. Focus on practical, useful vocabulary.',
    'Intermediate': 'Use moderately challenging words (6-10 letters) that are useful in professional and academic contexts. Include some nuanced vocabulary.',
    'Advanced': 'Use sophisticated vocabulary (8-15 letters) including academic, professional, and nuanced terms. Challenge the learner with complex concepts.'
  };

  const wordCriteria = levelCriteria[userLevel] || levelCriteria['Beginner'];

  // Story themes based on learning goals
  const storyThemes = {
    'Business': 'workplace scenarios, meetings, networking events, career growth',
    'Travel': 'exploring new places, cultural experiences, adventures, local interactions',
    'Technology': 'daily tech use, social media, apps, digital life scenarios',
    'Health': 'fitness routines, healthy habits, medical visits, wellness activities',
    'Education': 'learning experiences, school/college life, studying, academic achievements',
    'Relationships': 'family time, friendships, dating, social gatherings',
    'Entertainment': 'movies, music, games, hobbies, creative activities',
    'Food': 'cooking, restaurants, cultural cuisines, family meals'
  };

  const relevantThemes = learningGoals.map(goal => storyThemes[goal]).filter(Boolean).join(', ');
  const themeGuidance = relevantThemes 
    ? `Story themes to consider: ${relevantThemes}.` 
    : 'Use relatable daily life scenarios.';

  return `You are a vocabulary learning app. Generate a complete word lesson for a ${userLevel} level English learner named ${userName}.

${excludeWords}${goalsContext}

Word Selection Criteria:
- ${wordCriteria}
- Choose words that are genuinely useful and relevant to the learner's level
- Ensure the word matches the user's learning goals when applicable

STORY GENERATION RULES (VERY IMPORTANT):
- ${userName === 'User' ? 'DO NOT use any names in the story. Use pronouns like "someone", "a person", "they", "he/she" instead.' : `Use the name "${userName}" in the story when naturally possible.`}
- Create a REAL STORY with characters, actions, and events - NOT an explanation or definition
- The story must show the word in ACTION through what characters DO, not what they feel or think
- Use ONLY simple, common words in the story (avoid complex vocabulary)
- Make the story relatable and engaging for a ${userLevel} learner
- ${themeGuidance}
- Story should be 2-3 sentences that flow naturally
- The target word should appear naturally in context WITHOUT being defined or explained
- Create realistic, everyday scenarios with specific actions and events
- Use present tense or simple past tense for clarity
- Avoid complex sentence structures - keep it conversational
- NEVER explain what the word means - just show it happening in the story

Please provide your response in exactly this JSON format (no additional text):

{
  "word": "the target word in lowercase",
  "emoji": "single relevant emoji",
  "story": "${userName === 'User' ? 'A 2-3 sentence REAL STORY with characters and actions (NOT explanations). Use simple language without any names. Show the word happening through actions and events, never explain what it means. Use pronouns and general terms like "someone", "a person", "they" instead of names.' : `A 2-3 sentence REAL STORY with characters and actions (NOT explanations). Use simple language that includes ${userName}'s name when natural. Show the word happening through actions and events, never explain what it means.`}",
  "definition": "Clear, simple definition (max 6 words)",
  "wrongAnswers": [
    "plausible wrong definition 1",
    "plausible wrong definition 2", 
    "plausible wrong definition 3"
  ],
  "spellingHint": "A helpful hint for spelling (max 8 words)",
  "usageOptions": [
    "correct usage example appropriate for ${userLevel} level",
    "wrong usage example 1",
    "wrong usage example 2",
    "wrong usage example 3"
  ]
}

Requirements:
- Word must be appropriate for ${userLevel} level vocabulary
- Story MUST use simple, easy-to-understand language regardless of target word complexity
- ${userName === 'User' ? 'DO NOT include any names in the story. Use natural pronouns and terms like "someone", "a person", "they", "he/she"' : `Include ${userName}'s name naturally when it makes sense`}
- Connect story to user's interests: ${learningGoals.join(', ') || 'general daily life'}
- Wrong answers should be believable but clearly different
- Usage examples should be realistic scenarios suitable for this level
- Keep everything concise and clear
- Respond with ONLY the JSON object, no extra text

Generate the lesson now:`;
};

// Parse OpenAI's response into structured data
const parseWordLesson = (content) => {
  try {
    console.log('🔍 Parsing content:', content);
    
    // Clean the content - remove any markdown formatting or extra text
    let cleanContent = content.trim();
    
    // Remove markdown code blocks if present
    cleanContent = cleanContent.replace(/```json\n?/g, '');
    cleanContent = cleanContent.replace(/```\n?/g, '');
    
    // Extract JSON from the response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response');
      console.error('📄 Raw content:', content);
      throw new Error('No valid JSON found in API response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed JSON:', parsed);
    
    // Validate required fields
    if (!parsed.word || !parsed.story || !parsed.definition) {
      console.error('❌ Missing required fields in parsed data');
      throw new Error('Invalid lesson structure from API');
    }

    // Ensure arrays exist and have correct length
    if (!parsed.wrongAnswers || !Array.isArray(parsed.wrongAnswers) || parsed.wrongAnswers.length < 3) {
      parsed.wrongAnswers = ['Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3'];
    }

    if (!parsed.usageOptions || !Array.isArray(parsed.usageOptions) || parsed.usageOptions.length < 4) {
      parsed.usageOptions = [
        `This is how you use ${parsed.word} correctly.`,
        'This is wrong usage 1',
        'This is wrong usage 2',
        'This is wrong usage 3'
      ];
    }

    const result = {
      targetWord: parsed.word.toLowerCase(),
      emoji: parsed.emoji || '📚',
      story: parsed.story,
      definition: parsed.definition,
      wrongAnswers: parsed.wrongAnswers.slice(0, 3),
      spellingHint: parsed.spellingHint || 'Think about the sounds',
      usageOptions: parsed.usageOptions.slice(0, 4),
      // Generate step data for the learning flow
      steps: generateStepsFromLesson(parsed)
    };

    console.log('✅ Final lesson result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error parsing word lesson:', error);
    console.error('📄 Original content:', content);
    throw new Error(`Failed to parse lesson data: ${error.message}`);
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
    },
    {
      targetWord: 'wisdom',
      emoji: '🦉',
      story: `When ${userName} had a difficult decision to make, they asked their grandmother for advice. She listened carefully and then shared a helpful story from her own life. Her thoughtful guidance helped ${userName} see the situation more clearly.`,
      definition: 'Good judgment and knowledge',
      wrongAnswers: ['Lack of understanding', 'Quick decision making', 'Following others blindly'],
      spellingHint: 'Starts with "wis", ends with "dom"',
      usageOptions: [
        `${userName}'s grandmother shared her wisdom about life.`,
        'The wisdom rain fell all day.',
        'He wisdom his lunch quickly.',
        'They wisdom walked to school.'
      ]
    }
  ];

  // Pick a random fallback word
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
    
    // Get ALL words the user has learned (not just last 10)
    const allLearnedWords = learnedWords.map(item => item.word.toLowerCase());
    
    console.log(`📚 User has learned ${allLearnedWords.length} words total`);
    console.log('🚫 Excluding these words:', allLearnedWords);
    
    return allLearnedWords;
  } catch (error) {
    console.log('⚠️ No previous words found');
    return [];
  }
};

// Generate a new word with story, meaning, and usage based on user level
const generateWordLesson = async (userLevel = 'Beginner', previousWords = [], learningGoals = [], userName = 'User') => {
  try {
    const prompt = createWordGenerationPrompt(userLevel, previousWords, learningGoals, userName);
    
    console.log('🔑 Making API request to OpenAI...');
    console.log('🔍 API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 'undefined');
    console.log('🔍 API Key starts with:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');
    
    const requestBody = {
      model: 'gpt-3.5-turbo', // Cost-effective model
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are an expert vocabulary teacher creating engaging word lessons. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    console.log('📤 Request sent to OpenAI');
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      // Get detailed error info
      const errorData = await response.json();
      console.error('❌ API Error Details:', errorData);
      
      // Handle specific errors
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      } else {
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    console.log('✅ Got response from OpenAI!');
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    return parseWordLesson(content);
    
  } catch (error) {
    console.error('❌ Error generating word lesson:', error.message);
    console.error('🔍 Full error:', error);
    throw error; // Re-throw to be handled by caller
  }
};

// Enhanced API health check
const checkApiHealth = async () => {
  try {
    console.log('🔍 Checking OpenAI API health...');
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      return {
        status: 'error',
        message: 'API key not configured',
        canGenerate: false
      };
    }

    // Test with minimal request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    const data = await response.json();

    if (response.status === 429) {
      return {
        status: 'quota_exceeded',
        message: 'API quota exceeded. Please add credits to your OpenAI account.',
        error: data.error,
        canGenerate: false,
        action: 'Add billing at https://platform.openai.com/account/billing'
      };
    }

    if (response.status === 401) {
      return {
        status: 'invalid_key',
        message: 'Invalid API key',
        canGenerate: false,
        action: 'Check your API key in config.js'
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: `API Error: ${response.status}`,
        error: data.error,
        canGenerate: false
      };
    }

    return {
      status: 'healthy',
      message: 'API is working correctly',
      canGenerate: true,
      tokensUsed: data.usage?.total_tokens || 0
    };

  } catch (error) {
    return {
      status: 'network_error',
      message: 'Network connection failed',
      error: error.message,
      canGenerate: false
    };
  }
};

// Enhanced main method to get a complete lesson with personalization
const getNewLesson = async () => {
  try {
    console.log('🎯 Getting personalized lesson...');
    
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
    
    const lesson = await generateWordLesson(userLevel, previousWords, learningGoals, userName);
    
    // Validate lesson structure before returning
    if (!lesson || !lesson.targetWord || !lesson.steps) {
      console.error('❌ Invalid lesson structure, using fallback');
      return getFallbackLesson();
    }

    console.log('✅ Personalized lesson generated:', lesson.targetWord);
    return lesson;
  } catch (error) {
    console.error('❌ Error getting new lesson:', error);
    return getFallbackLesson();
  }
};

// Test the API connection with simpler request
const testConnection = async () => {
  try {
    console.log('🧪 Testing OpenAI API connection...');
    console.log('🔍 API Key check:', OPENAI_API_KEY ? 'Present' : 'Missing');
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key is missing or not configured');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: 'Respond with just "API connection successful"'
        }]
      })
    });

    console.log('🧪 Test response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API test failed:', errorData);
      throw new Error(`API test failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Test successful:', data);
    return data.choices[0]?.message?.content?.includes('successful') || false;
  } catch (error) {
    console.error('❌ OpenAI API connection test failed:', error.message);
    return false;
  }
};

// Helper method to check if API is configured
const isApiConfigured = () => {
  return OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here';
};

// Get API status
const getApiStatus = () => {
  return {
    provider: 'OpenAI',
    isConfigured: isApiConfigured(),
    keyPreview: OPENAI_API_KEY 
      ? `${OPENAI_API_KEY.substring(0, 8)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`
      : 'Not configured',
    model: 'gpt-3.5-turbo'
  };
};

// Cost tracking utility
const getUsageEstimate = () => {
  return {
    tokensPerLesson: 450,
    costPerLesson: 0.0025, // Approximate cost in USD
    lessonsWithFiveDollars: 2000,
    message: 'Your $5 credit should last for approximately 2000 lessons!'
  };
};

// Export as an object with all methods
const ClaudeService = {
  checkApiHealth,
  generateWordLesson,
  createWordGenerationPrompt,
  parseWordLesson,
  generateStepsFromLesson,
  generateSimilarWord,
  getFallbackLesson,
  getUserLevel,
  getUserName,
  getUserLearningGoals,
  getPreviousWords,
  getNewLesson,
  testConnection,
  isApiConfigured,
  getApiStatus,
  getUsageEstimate
};

export default ClaudeService;