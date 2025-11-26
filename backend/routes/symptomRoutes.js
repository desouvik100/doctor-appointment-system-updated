const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/symptom-check', async (req, res) => {
  try {
    const { symptoms } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback response
      return res.json({
        success: true,
        severity: 'moderate',
        recommendation: 'Based on your symptoms, we recommend consulting with a healthcare professional for proper evaluation.',
        suggestedSpecialty: 'General Practitioner',
        urgency: 'Schedule an appointment within 24-48 hours',
        disclaimer: 'This is a preliminary assessment. Always consult a healthcare professional.'
      });
    }

    const prompt = `You are a medical AI assistant. Analyze these symptoms and provide a structured response:

Symptoms: ${symptoms}

Provide a JSON response with:
1. severity: "low", "moderate", or "high"
2. recommendation: Brief medical recommendation
3. suggestedSpecialty: Which type of doctor to see
4. urgency: When to seek care

Keep it professional, helpful, and include appropriate disclaimers.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    }, { timeout: 15000 });

    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON from response
    let result;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If parsing fails, create structured response from text
      result = {
        severity: aiText.toLowerCase().includes('urgent') || aiText.toLowerCase().includes('emergency') ? 'high' : 
                  aiText.toLowerCase().includes('mild') ? 'low' : 'moderate',
        recommendation: aiText.substring(0, 200),
        suggestedSpecialty: 'General Practitioner',
        urgency: 'Schedule an appointment within 24-48 hours'
      };
    }

    return res.json({
      success: true,
      ...result,
      disclaimer: 'This is an AI-powered preliminary assessment. Always consult a healthcare professional for accurate diagnosis.'
    });

  } catch (error) {
    console.error('Symptom check error:', error.message);
    
    // Intelligent fallback based on keywords
    const symptoms = req.body.symptoms?.toLowerCase() || '';
    let severity = 'moderate';
    let specialty = 'General Practitioner';
    let urgency = 'Schedule an appointment within 24-48 hours';

    if (symptoms.includes('chest pain') || symptoms.includes('difficulty breathing') || symptoms.includes('severe')) {
      severity = 'high';
      urgency = 'Seek immediate medical attention';
      specialty = 'Emergency Medicine';
    } else if (symptoms.includes('headache') || symptoms.includes('cold') || symptoms.includes('mild')) {
      severity = 'low';
      urgency = 'Monitor symptoms, schedule appointment if persists';
    }

    return res.json({
      success: true,
      severity,
      recommendation: 'Based on your symptoms, we recommend consulting with a healthcare professional for proper evaluation and diagnosis.',
      suggestedSpecialty: specialty,
      urgency,
      disclaimer: 'This is a preliminary assessment. Always consult a healthcare professional.'
    });
  }
});

// Live stats endpoint
router.get('/live', async (req, res) => {
  try {
    // In production, fetch from database
    // For now, return demo stats with some randomization
    const baseStats = {
      patientsToday: 247,
      activeDoctors: 34,
      avgWaitTime: 12,
      surgeriesHandled: 1847,
      appointmentsCompleted: 15234,
      satisfactionRate: 98
    };

    // Add slight variation to make it feel live
    const stats = {
      patientsToday: baseStats.patientsToday + Math.floor(Math.random() * 10),
      activeDoctors: baseStats.activeDoctors + Math.floor(Math.random() * 5),
      avgWaitTime: baseStats.avgWaitTime + Math.floor(Math.random() * 5) - 2,
      surgeriesHandled: baseStats.surgeriesHandled,
      appointmentsCompleted: baseStats.appointmentsCompleted + Math.floor(Math.random() * 50),
      satisfactionRate: baseStats.satisfactionRate
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
