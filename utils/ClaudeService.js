import config from '../config.js';

// ⚠️ IMPORTANT: Add your OpenAI API key to config.js
const OPENAI_API_KEY = config.OPENAI_API_KEY || 'your-openai-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class ClaudeService {
  
  // Generate a new word with story, meaning, and usage based on user level
  static async generateWordLesson(userLevel = 'Beginner', previousWords = []) {
    try {
      const prompt = this.createWordGenerationPrompt(userLevel, previousWords);
      
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

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));

      if (!response.ok) {
        // Get detailed error info
        const errorData = await response.json();
        console.error('❌ API Error Details:', errorData);
        throw new Error(`API request failed: ${response.status}  - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ Got response from OpenAI!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      return this.parseWordLesson(content);
      
    } catch (error) {
      console.error('❌ Error generating word lesson:', error.message);
      console.error('🔍 Full error:', error);
      return this.getFallbackLesson();
    }
  }

  // Create the prompt for OpenAI to generate vocabulary lessons
  static createWordGenerationPrompt(userLevel, previousWords) {
    const excludeWords = previousWords.length > 0 
      ? `\nDo not use these previously learned words: ${previousWords.join(', ')}`
      : '';

    return `You are a vocabulary learning app. Generate a complete word lesson for a ${userLevel} level English learner.

${excludeWords}

Please provide your response in exactly this JSON format (no additional text):

{
  "word": "the target word in lowercase",
  "emoji": "single relevant emoji",
  "story": "A 2-3 sentence engaging story that naturally uses the word WITHOUT explicitly defining it. Make it relatable and interesting.",
  "definition": "Clear, simple definition (max 6 words)",
  "wrongAnswers": [
    "plausible wrong definition 1",
    "plausible wrong definition 2", 
    "plausible wrong definition 3"
  ],
  "spellingHint": "A helpful hint for spelling (max 8 words)",
  "usageOptions": [
    "correct usage example",
    "wrong usage example 1",
    "wrong usage example 2",
    "wrong usage example 3"
  ]
}

Requirements:
- ${userLevel === 'Beginner' ? 'Use common, everyday words (5-8 letters)' : 'Use more sophisticated vocabulary (6-12 letters)'}
- Story should be engaging and help deduce the word meaning
- Wrong answers should be believable but clearly different
- Usage examples should be realistic scenarios
- Keep everything concise and clear
- Respond with ONLY the JSON object, no extra text

Generate the lesson now:`;
  }

  // Parse OpenAI's response into structured data
  static parseWordLesson(content) {
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
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed JSON:', parsed);
      
      // Validate required fields
      if (!parsed.word || !parsed.story || !parsed.definition) {
        console.error('❌ Missing required fields in parsed data');
        throw new Error('Missing required fields');
      }

      const result = {
        targetWord: parsed.word.toLowerCase(),
        emoji: parsed.emoji || '📚',
        story: parsed.story,
        definition: parsed.definition,
        wrongAnswers: parsed.wrongAnswers || [],
        spellingHint: parsed.spellingHint || 'Think about the sounds',
        usageOptions: parsed.usageOptions || [],
        // Generate step data for the learning flow
        steps: this.generateStepsFromLesson(parsed)
      };

      console.log('✅ Final lesson result:', result);
      return result;

    } catch (error) {
      console.error('❌ Error parsing word lesson:', error);
      console.error('📄 Original content:', content);
      return this.getFallbackLesson();
    }
  }

  // Generate the 4-step learning flow from the lesson data
  static generateStepsFromLesson(lesson) {
    console.log('🔧 Generating steps from lesson:', lesson);
    
    // Ensure lesson object has all required properties
    const safeLesson = {
      word: lesson.word || 'serendipity',
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
          this.generateSimilarWord(safeLesson.word),
          this.generateSimilarWord(safeLesson.word),
          this.generateSimilarWord(safeLesson.word)
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

    console.log('✅ Generated steps:', JSON.stringify(steps, null, 2));
    return steps;
  }

  // Generate similar-looking words for discovery options
  static generateSimilarWord(targetWord) {
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
  }

  // Enhanced fallback lesson when API fails
  static getFallbackLesson() {
    console.log('📚 Using fallback lesson');
    
    const fallbackData = {
      targetWord: 'serendipity',
      emoji: '✨',
      story: 'Maya was looking for a coffee shop when she stumbled upon a tiny bookstore. Inside, she found the exact rare novel she had been searching for months. This unexpected discovery filled her with joy.',
      definition: 'A pleasant surprise or discovery',
      wrongAnswers: [
        'A feeling of deep sadness',
        'A planned achievement',
        'A difficult challenge'
      ],
      spellingHint: 'Starts with "ser" and ends with "ity"',
      usageOptions: [
        'Finding my soulmate at a random coffee shop was pure serendipity',
        'I serendipity my homework every night',
        'The serendipity weather ruined our picnic',
        'She serendipity walked to the store yesterday'
      ]
    };

    // Generate complete lesson structure
    const lesson = {
      ...fallbackData,
      steps: this.generateStepsFromLesson({
        word: fallbackData.targetWord,
        emoji: fallbackData.emoji,
        story: fallbackData.story,
        definition: fallbackData.definition,
        wrongAnswers: fallbackData.wrongAnswers,
        spellingHint: fallbackData.spellingHint,
        usageOptions: fallbackData.usageOptions
      })
    };

    console.log('✅ Fallback lesson structure:', JSON.stringify(lesson, null, 2));
    return lesson;
  }

  // Get user's learning level from storage
  static async getUserLevel() {
    try {
      const DataManager = require('./DataManager').default;
      const profile = await DataManager.getUserProfile();
      return profile.level || 'Beginner';
    } catch (error) {
      console.log('⚠️ Using default level: Beginner');
      return 'Beginner';
    }
  }

  // Get previously learned words to avoid repetition
  static async getPreviousWords() {
    try {
      const DataManager = require('./DataManager').default;
      const learnedWords = await DataManager.getLearnedWords();
      return learnedWords.map(item => item.word).slice(0, 10); // Last 10 words
    } catch (error) {
      console.log('⚠️ No previous words found');
      return [];
    }
  }

  // Main method to get a complete lesson
  static async getNewLesson() {
    try {
      console.log('🎯 Getting new lesson...');
      const userLevel = await this.getUserLevel();
      const previousWords = await this.getPreviousWords();
      
      console.log('👤 User level:', userLevel);
      console.log('📝 Previous words:', previousWords);
      
      const lesson = await this.generateWordLesson(userLevel, previousWords);
      
      // Validate lesson structure before returning
      if (!lesson || !lesson.targetWord || !lesson.steps) {
        console.error('❌ Invalid lesson structure, using fallback');
        return this.getFallbackLesson();
      }

      console.log('✅ Valid lesson generated:', lesson.targetWord);
      return lesson;
    } catch (error) {
      console.error('❌ Error getting new lesson:', error);
      return this.getFallbackLesson();
    }
  }

  // Test the API connection with simpler request
  static async testConnection() {
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
  }

  // Helper method to check if API is configured
  static isApiConfigured() {
    return OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here';
  }

  // Get API status
  static getApiStatus() {
    return {
      provider: 'OpenAI',
      isConfigured: this.isApiConfigured(),
      keyPreview: OPENAI_API_KEY 
        ? `${OPENAI_API_KEY.substring(0, 8)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`
        : 'Not configured',
      model: 'gpt-3.5-turbo'
    };
  }
}

export default ClaudeService;