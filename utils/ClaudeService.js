import config from '../config.js';

// ⚠️ IMPORTANT: Replace with your actual API key
const CLAUDE_API_KEY = config.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

class ClaudeService {
  
  // Generate a new word with story, meaning, and usage based on user level
  static async generateWordLesson(userLevel = 'Beginner', previousWords = []) {
    try {
      const prompt = this.createWordGenerationPrompt(userLevel, previousWords);
      
      console.log('🔑 Making API request to Claude...');
      console.log('🔍 API Key length:', CLAUDE_API_KEY ? CLAUDE_API_KEY.length : 'undefined');
      console.log('🔍 API Key starts with:', CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 10) + '...' : 'undefined');
      
      const requestBody = {
        model: 'claude-3-sonnet-20240229', // Updated to working model
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      // Replace axios with fetch
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        // Get detailed error info
        const errorText = await response.text();
        console.error('❌ API Error Details:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Got response from Claude!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      const content = data.content[0].text;
      return this.parseWordLesson(content);
      
    } catch (error) {
      console.error('❌ Error generating word lesson:', error.message);
      console.error('🔍 Full error:', error);
      return this.getFallbackLesson();
    }
  }

  // Create the prompt for Claude to generate vocabulary lessons
  static createWordGenerationPrompt(userLevel, previousWords) {
    const excludeWords = previousWords.length > 0 
      ? `\nDo not use these previously learned words: ${previousWords.join(', ')}`
      : '';

    return `You are a vocabulary learning app. Generate a complete word lesson for a ${userLevel} level English learner.

${excludeWords}

Please provide your response in exactly this JSON format:

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

Generate the lesson now:`;
  }

  // Parse Claude's response into structured data
  static parseWordLesson(content) {
    try {
      console.log('🔍 Parsing content:', content);
      
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
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
      return this.getFallbackLesson();
    }
  }

  // Generate the 4-step learning flow from the lesson data
  static generateStepsFromLesson(lesson) {
    console.log('🔧 Generating steps from lesson:', lesson);
    
    return {
      1: {
        type: 'discovery',
        story: lesson.story,
        options: [
          lesson.word,
          this.generateSimilarWord(lesson.word),
          this.generateSimilarWord(lesson.word),
          this.generateSimilarWord(lesson.word)
        ].sort(() => Math.random() - 0.5), // Shuffle options
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
        correctAnswer: lesson.usageOptions[0] // First option is correct
      }
    };
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

  // Fallback lesson when API fails
  static getFallbackLesson() {
    console.log('📚 Using fallback lesson');
    return {
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
      ],
      steps: {
        1: {
          type: 'discovery',
          story: 'Maya was looking for a coffee shop when she stumbled upon a tiny bookstore. Inside, she found the exact rare novel she had been searching for months. This unexpected discovery filled her with joy.',
          options: ['serendipity', 'melancholy', 'perseverance', 'hypothesis'],
          correctAnswer: 'serendipity'
        },
        2: {
          type: 'meaning',
          question: 'What does "serendipity" mean?',
          options: [
            'A pleasant surprise or discovery',
            'A feeling of deep sadness',
            'A planned achievement',
            'A difficult challenge'
          ],
          correctAnswer: 'A pleasant surprise or discovery'
        },
        3: {
          type: 'spelling',
          hint: 'Starts with "ser" and ends with "ity"',
          letters: ['S', 'E', 'R', 'E', 'N', 'D', 'I', 'P', 'I', 'T', 'Y'].sort(() => Math.random() - 0.5),
          correctWord: 'SERENDIPITY'
        },
        4: {
          type: 'usage',
          question: 'Which sentence uses "serendipity" correctly?',
          options: [
            'Finding my soulmate at a random coffee shop was pure serendipity',
            'I serendipity my homework every night',
            'The serendipity weather ruined our picnic',
            'She serendipity walked to the store yesterday'
          ],
          correctAnswer: 'Finding my soulmate at a random coffee shop was pure serendipity'
        }
      }
    };
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
      
      return await this.generateWordLesson(userLevel, previousWords);
    } catch (error) {
      console.error('❌ Error getting new lesson:', error);
      return this.getFallbackLesson();
    }
  }

  // Test the API connection with simpler request
  static async testConnection() {
    try {
      console.log('🧪 Testing API connection...');
      console.log('🔍 API Key check:', CLAUDE_API_KEY ? 'Present' : 'Missing');
      
      if (!CLAUDE_API_KEY) {
        throw new Error('API key is missing');
      }

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 50,
          messages: [{
            role: 'user',
            content: 'Respond with just "API connection successful"'
          }]
        })
      });

      console.log('🧪 Test response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API test failed:', errorText);
        throw new Error(`API test failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Test successful:', data);
      return data.content[0].text.includes('successful');
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      return false;
    }
  }
}

export default ClaudeService;