const express = require('express');
const axios = require('axios');
const router = express.Router();

/* ======================
   1. STATUS ENDPOINT
   ====================== */
router.get('/status', (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  return res.json({
    success: true,
    provider: hasGeminiKey ? 'gemini' : 'fallback',
    configured: true,          // front-end always sees it as configured
    fallbackMode: !hasGeminiKey
  });
});

/* ======================
   2. SUGGESTIONS
   ====================== */
router.get('/suggestions', (req, res) => {
  const context = (req.query.context || 'general').toLowerCase();

  let suggestions = [
    'How can I improve system efficiency?',
    'What are the current system statistics?',
    'How do I manage user accounts?',
    'How many appointments are pending?',
  ];

  if (context === 'users') {
    suggestions = [
      'How to create a new user?',
      'How to delete or deactivate a user?',
      'Show a summary of all patients.',
    ];
  } else if (context === 'appointments') {
    suggestions = [
      'Show today’s appointments.',
      'How many appointments are pending or cancelled?',
      'How can I reduce no-shows?',
    ];
  } else if (context === 'reports') {
    suggestions = [
      'What reports should I generate this week?',
      'Summarise the appointment status distribution.',
      'Give me a summary of system performance.',
    ];
  }

  return res.json({
    success: true,
    suggestions,
  });
});

/* ======================
   3. CHAT (Gemini + fallback)
   ====================== */
router.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // If no key, use fallback text but still respond 200
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        provider: 'fallback',
        response:
          "Gemini API key isn't configured on the server, " +
          "so I'm answering from fallback mode. You can still ask anything about your admin dashboard.",
      });
    }

    const userMessage = req.body.message || req.body.prompt || '';
    const systemContext = req.body.systemContext || {};
    const history = req.body.conversationHistory || [];

    const contextText = `
System stats:
- Users: ${systemContext.stats?.totalUsers || 0}
- Doctors: ${systemContext.stats?.totalDoctors || 0}
- Appointments: ${systemContext.stats?.totalAppointments || 0}
- Clinics: ${systemContext.stats?.totalClinics || 0}
Current tab: ${systemContext.currentTab || 'overview'}
`;

    const historyText = history
      .map(h => `${h.role === 'assistant' ? 'AI' : 'Admin'}: ${h.content}`)
      .join('\n');

    const prompt = String(
      `${contextText}\nConversation:\n${historyText}\n\nAdmin question: ${userMessage}`
    ).slice(0, 8000);

    // ✅ IMPORTANT: use v1beta for Gemini 1.5 models
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await axios.post(url, payload, { timeout: 20000 });

    const candidates = response.data && response.data.candidates ? response.data.candidates : [];
    const text =
      candidates[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';

    if (!text) {
      return res.status(200).json({
        success: true,
        provider: 'gemini',
        response:
          "I couldn't get a detailed answer from Gemini just now, but you can try again or ask something simpler.",
      });
    }

    return res.json({
      success: true,
      provider: 'gemini',
      response: text,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;

    console.error('AI error:', status, data || error.message);
    return res.status(status).json({
      success: false,
      error: 'AI error',
      response:
        "I'm having trouble contacting the AI service right now. " +
        "You can still continue using the dashboard — please try again later.",
    });
  }
});
module.exports = router;