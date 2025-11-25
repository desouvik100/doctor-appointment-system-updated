const express = require('express');
const router = express.Router();

console.log('🤖 Chatbot routes loading...');

// AI Providers
let openai, gemini;

// Initialize AI clients based on environment
const initializeAI = () => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  
  if (provider === 'openai' && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const OpenAI = require('openai');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error.message);
    }
  }
  
  if (provider === 'gemini' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      gemini = genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('✅ Gemini initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
    }
  }
  
  if (!openai && !gemini) {
    console.log('⚠️  No AI providers configured. Chatbot will use fallback responses.');
  }
};

// Initialize on startup
initializeAI();

console.log('🤖 Chatbot routes loaded - Updated');

// System prompt for HealthSync AI - General Purpose Assistant
const SYSTEM_PROMPT = `You are HealthSync AI, an intelligent and versatile AI assistant. You are knowledgeable, helpful, and can assist with a wide range of topics and questions.

Your capabilities include:
- Answering general knowledge questions on any topic
- Providing explanations on science, technology, history, culture, and more
- Helping with problem-solving and decision-making
- Offering creative ideas and suggestions
- Assisting with learning and education
- Providing coding and technical help
- Explaining complex concepts in simple terms
- Offering advice on various subjects (while noting you're an AI)
- Helping with writing, analysis, and research
- Discussing current events and trends (based on training data)

Special healthcare context awareness:
- You're integrated into the HealthSync Pro healthcare management system
- You can provide general healthcare information and wellness tips
- For medical diagnosis or treatment, always recommend consulting healthcare professionals
- You can help with healthcare administration questions when relevant
- You understand medical terminology and healthcare workflows

Guidelines:
- Be conversational, friendly, and engaging
- Provide accurate, helpful, and well-structured responses
- Ask clarifying questions when needed
- Admit when you don't know something or when information might be outdated
- Be respectful of all viewpoints and cultures
- Maintain a professional yet approachable tone
- Provide sources or suggest verification for important claims when possible
- Keep responses informative but appropriately concise
- Use examples and analogies to explain complex topics

Remember: You're a general-purpose AI assistant named HealthSync AI, not limited to healthcare topics, but with special awareness of the healthcare context you're operating in.`;

// Enhanced chat endpoint with multiple AI providers
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], systemContext = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const provider = process.env.AI_PROVIDER || 'gemini';
    let aiResponse;

    // Add system context to prompt if provided
    let contextualPrompt = SYSTEM_PROMPT;
    if (systemContext.stats) {
      contextualPrompt += `\n\nCurrent System Statistics:
- Total Users: ${systemContext.stats.totalUsers || 0}
- Total Doctors: ${systemContext.stats.totalDoctors || 0}
- Total Appointments: ${systemContext.stats.totalAppointments || 0}
- Total Clinics: ${systemContext.stats.totalClinics || 0}
- Pending Receptionists: ${systemContext.stats.pendingReceptionists || 0}`;
    }

    if (provider === 'openai' && openai) {
      aiResponse = await handleOpenAIRequest(message, conversationHistory, contextualPrompt);
    } else if (provider === 'gemini' && gemini) {
      aiResponse = await handleGeminiRequest(message, conversationHistory, contextualPrompt);
    } else {
      // Fallback response
      aiResponse = getFallbackResponse(message);
    }

    res.json({
      success: true,
      response: aiResponse,
      provider: provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot API Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.',
        fallback: true
      });
    }
    
    if (error.message?.includes('key') || error.message?.includes('auth')) {
      return res.status(401).json({ 
        error: 'Invalid API key configuration.',
        fallback: true
      });
    }

    res.status(500).json({ 
      error: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
      fallback: true,
      response: getFallbackResponse(req.body.message)
    });
  }
});

// OpenAI handler
async function handleOpenAIRequest(message, conversationHistory, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    max_tokens: 600,
    temperature: 0.7,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  });

  return completion.choices[0].message.content;
}

// Gemini handler
async function handleGeminiRequest(message, conversationHistory, systemPrompt) {
  // Build conversation context for Gemini
  let conversationText = systemPrompt + '\n\n';
  
  // Add recent conversation history
  conversationHistory.slice(-6).forEach(msg => {
    const role = msg.role === 'assistant' ? 'Assistant' : 'User';
    conversationText += `${role}: ${msg.content}\n`;
  });
  
  conversationText += `User: ${message}\nAssistant:`;

  const result = await gemini.generateContent(conversationText);
  const response = await result.response;
  return response.text();
}

// Fallback responses for when AI is unavailable
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
    return 'That\'s a great question! While I\'m currently in fallback mode, I\'d love to help you explore that topic. For the best experience, please ensure the AI service is properly configured.';
  }
  
  if (lowerMessage.includes('learn') || lowerMessage.includes('explain') || lowerMessage.includes('understand')) {
    return 'I\'d be happy to help you learn about that! I can explain concepts, provide insights, and help with understanding complex topics once the AI service is configured.';
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
    return 'I\'m here to assist you with any questions or topics you\'d like to explore! I can help with learning, problem-solving, creative ideas, and much more.';
  }
  
  if (lowerMessage.includes('technology') || lowerMessage.includes('science') || lowerMessage.includes('ai')) {
    return 'Technology and science are fascinating topics! I can discuss AI, machine learning, programming, scientific concepts, and the latest tech trends.';
  }
  
  if (lowerMessage.includes('creative') || lowerMessage.includes('idea') || lowerMessage.includes('project')) {
    return 'I love helping with creative projects and brainstorming ideas! Whether it\'s writing, design, coding projects, or innovative solutions, I\'m here to help.';
  }
  
  if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor') || lowerMessage.includes('clinic')) {
    return 'I can help with healthcare-related questions too! While I can discuss general healthcare topics, for specific medical advice, always consult with healthcare professionals.';
  }
  
  return 'Hello! I\'m HealthSync AI, your intelligent assistant. I can help with a wide range of topics - from answering questions and explaining concepts to helping with creative projects and problem-solving. What would you like to explore today?';
}

// Get suggested questions based on context
router.get('/suggestions', (req, res) => {
  const { context } = req.query;
  
  const allSuggestions = {
    general: [
      "What's the latest in artificial intelligence and machine learning?",
      "Can you explain quantum computing in simple terms?",
      "What are some creative project ideas I could work on?",
      "How do I improve my problem-solving skills?",
      "What are the current trends in technology?",
      "Can you help me understand blockchain technology?",
      "What are some effective learning strategies?",
      "How can I stay productive and organized?"
    ],
    users: [
      "How do user management systems work?",
      "What are best practices for user authentication?",
      "Can you explain database design for user systems?",
      "What are modern approaches to user experience design?"
    ],
    doctors: [
      "What's the future of telemedicine and digital health?",
      "How is AI being used in medical diagnosis?",
      "What are the latest developments in medical technology?",
      "Can you explain how electronic health records work?"
    ],
    appointments: [
      "How do scheduling algorithms work?",
      "What are efficient ways to manage time and schedules?",
      "Can you explain calendar synchronization technologies?",
      "What are best practices for appointment reminder systems?"
    ],
    clinics: [
      "How do healthcare management systems work?",
      "What are the principles of operations management?",
      "Can you explain healthcare data analytics?",
      "What technologies are transforming healthcare?"
    ],
    reports: [
      "How do I create effective data visualizations?",
      "What are the principles of good report design?",
      "Can you explain business intelligence concepts?",
      "What are modern approaches to data analysis?"
    ]
  };

  const contextSuggestions = allSuggestions[context] || allSuggestions.general;
  const randomSuggestions = contextSuggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  res.json({
    success: true,
    suggestions: randomSuggestions,
    context: context || 'general'
  });
});

// Get AI provider status
router.get('/status', (req, res) => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const hasOpenAI = hasOpenAIKey && !!openai;
  const hasGemini = hasGeminiKey && !!gemini;
  
  res.json({
    success: true,
    provider: provider,
    available: {
      openai: hasOpenAI,
      gemini: hasGemini
    },
    configured: {
      openai: hasOpenAIKey,
      gemini: hasGeminiKey
    },
    status: 'ready', // Always show as ready - fallback mode provides intelligent responses
    fallbackMode: !((provider === 'openai' && hasOpenAI) || (provider === 'gemini' && hasGemini))
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const provider = process.env.AI_PROVIDER || 'gemini';
  const isConfigured = (provider === 'openai' && openai) || (provider === 'gemini' && gemini);
  
  res.json({
    success: true,
    status: 'Chatbot API is running',
    provider: provider,
    configured: isConfigured,
    fallbackMode: !isConfigured,
    timestamp: new Date().toISOString()
  });
});

console.log('🤖 Chatbot routes configured successfully');
module.exports = router;