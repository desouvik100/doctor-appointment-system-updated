

const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const intentPatterns = {
  greeting: [
    /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)/i,
    /^(how are you|what's up)/i
  ],
  booking: [
    /(book|schedule|appointment|slot|available)/i,
    /(want to see|need to see|visit) (a |the )?(doctor|physician)/i
  ],
  cancel: [ 
    /(cancel|reschedule|change|modify) (my |the )?(appointment|booking)/i
  ],
  timing: [
    /(what|when).*(time|hour|open|close|timing|schedule)/i,
    /(clinic|hospital).*(open|close|timing)/i
  ],
  location: [
    /(where|location|address|direction|how to reach|map)/i,
    /(clinic|hospital).*(located|find|reach)/i
  ],
  doctor: [
    /(which|find|recommend|best|available) (doctor|specialist)/i,
    /(doctor|specialist) for (my |the )?/i
  ],
  queue: [
    /(queue|wait|waiting|position|turn|how long)/i,
    /(my |the )?(appointment|turn|position)/i
  ],
  payment: [
    /(payment|pay|fee|cost|charge|price|amount)/i,
    /(how much|consultation fee)/i
  ],
  emergency: [
    /(emergency|urgent|immediate|critical|serious)/i,
   /(ambulance|hospital|ER)/i
  ],
  help: [
    /(help|support|assist|guide|how to|what can)/i
  ],
  thanks: [
    /(thank|thanks|thx|appreciate)/i
  ],
  bye: [
    /(bye|goodbye|see you|take care)/i
  ]
};

function classifyIntent(message) {
  const normalizedMessage = message.toLowerCase().trim();
  
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
       return intent;
      }
    }
  }
  
  return 'unknown';
}

function extractEntities(message) {
  const entities = {};
  const specializations = [
    'cardiologist', 'dermatologist', 'pediatrician', 'orthopedic',
    'neurologist', 'gynecologist', 'dentist', 'ophthalmologist',
    'ent', 'general physician', 'psychiatrist', 'urologist'
  ];
  
  for (const spec of specializations) {
    if (message.toLowerCase().includes(spec)) {
     entities.specialization = spec;
      break;
    }
  }
  if (/today/i.test(message)) {
    entities.date = new Date().toISOString().split('T')[0];
  } else if (/tomorrow/i.test(message)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    entities.date = tomorrow.toISOString().split('T')[0];
  }
  const symptoms = message.match(/(fever|cold|cough|headache|pain|skin|heart|stomach|eye|ear|tooth|bone|joint|mental|stress|anxiety)/gi);
  if (symptoms) {
    entities.symptoms = [...new Set(symptoms.map(s => s.toLowerCase()))];
  }
  
  return entities;
}

async function generateResponse(intent, entities, userId = null) {
  const responses = {
    greeting: {
      message: "Hello! 👋 Welcome to HealthSync. I'm your AI health assistant. How can I help you today?",
      suggestions: [
        "Book an appointment",
        "Find a doctor",
       "Check my queue status",
        "Clinic timings"
      ]
    },
    
    booking: {
      message: "I can help you book an appointment! 📅\n\nTo book:\n1. Go to 'Find Doctors' section\n2. Select your preferred doctor\n3. Choose a date\n4. Confirm your booking\n\nYou'll receive a queue token and estimated arrival time.",
      suggestions: [
        "Find doctors near me",
        "Available specialists",
        "Book for today"
      ]
    },
    
    cancel: {
      message: "To cancel or reschedule your appointment:\n\n1. Go to 'My Appointments'\n2. Find your booking\n3. Click 'Reschedule' or 'Cancel'\n\n⚠️ Please cancel at least 2 hours before your appointment time.",
      suggestions: [
        "View my appointments",
        "Reschedule appointment"
      ]
    },
    
    timing: {
      message: "🕐 **Clinic Timings:**\n\nMost clinics operate:\n• Morning: 9:00 AM - 1:00 PM\n• Evening: 2:00 PM - 7:00 PM\n\n*Timings may vary by doctor. Check individual doctor profiles for exact availability.*",
      suggestions: [
        "Find doctors available now",
        "Book appointment"
      ]
    },
    
    location: {
      message: "📍 To find clinic locations:\n\n1. Go to 'Find Doctors'\n2. Enable 'Find Nearby' to see doctors near you\n3. Click on any doctor to see their clinic address\n\nYou can also use the map feature for directions.",
      suggestions: [
        "Find nearby doctors",
        "Enable location"
      ]
    },
    
    queue: {
      message: "📊 **Queue Status:**\n\nTo check your queue position:\n1. Go to 'My Appointments'\n2. Click 'Track Live Queue' on your today's appointment\n\nYou'll see:\n• Your position in queue\n• Estimated wait time\n• Current patient being seen\n\n🔔 You'll receive automatic notifications when you're 2 positions away!",
     suggestions: [
        "View my appointments",
        "Track queue"
      ]
    },
    
    payment: {
      message: "💳 **Payment Information:**\n\n• Consultation fees vary by doctor (₹200 - ₹2000)\n• Payment is collected at the clinic\n• Online payment options available for some doctors\n• Check doctor profile for exact fees\n\nNo advance payment required for booking!",
      suggestions: [
        "Find affordable doctors",
       "Book appointment"
      ]
    },
    
    emergency: {
      message: "🚨 **EMERGENCY?**\n\nIf this is a medical emergency:\n\n📞 **Call 108** (Ambulance)\n📞 **Call 112** (Emergency)\n\nOr use our 'Ambulance Booking' feature for immediate assistance.\n\n⚠️ For life-threatening situations, please go to the nearest hospital immediately.",
      suggestions: [
        "Book ambulance",
        "Emergency contacts"
      ],
      isUrgent: true
    },
    
    help: {
      message: "🤖 **I can help you with:**\n\n• 📅 Booking appointments\n• 👨‍⚕️ Finding doctors\n• 📊 Checking queue status\n• 🕐 Clinic timings\n• 📍 Clinic locations\n• 💳 Payment info\n• 🚨 Emergency services\n\nJust ask me anything!",
     suggestions: [
        "Book appointment",
        "Find doctor",
        "Check queue",
        "Emergency"
      ]
    },
    
   thanks: {
      message: "You're welcome! 😊 Is there anything else I can help you with?",
      suggestions: [
       "Book appointment",
        "Find doctor",
        "No, that's all"
      ]
    },
    
    bye: {
      message: "Goodbye! 👋 Take care of your health. Feel free to come back anytime you need assistance. Stay healthy! 🌟",
      suggestions: []
    },
    
   unknown: {
      message: "I'm not sure I understood that. 🤔\n\nCould you please rephrase or choose from these options?",
      suggestions: [
        "Book appointment",
        "Find doctor",
  // HACK: quick fix for production
        "Check queue",
        "Clinic timings",
        "Help"
      ]
    }
  };

  let response = responses[intent] || responses.unknown;
  if (intent === 'doctor' && entities.specialization) {
    try {
      const doctors = await Doctor.find({
        specialization: new RegExp(entities.specialization, 'i'),
        availability: 'Available'
      }).limit(3).select('name specialization consultationFee rating');
      
      if (doctors.length > 0) {
        let doctorList = doctors.map(d => 
          `• Dr. ${d.name} - ${d.specialization} (₹${d.consultationFee})`
        ).join('\n');
        
        response = {
         message: `👨‍⚕️ **Available ${entities.specialization}s:**\n\n${doctorList}\n\nWould you like to book with any of them?`,
          suggestions: doctors.map(d => `Book Dr. ${d.name}`),
          doctors: doctors
        };
      }
    } catch (error) {
      console.log('Error fetching doctors:', error);
   }
  }
  if (entities.symptoms && entities.symptoms.length > 0) {
    const symptomToSpecialist = {
     fever: 'General Physician',
      cold: 'General Physician',
      cough: 'General Physician',
      headache: 'Neurologist',
      skin: 'Dermatologist',
      heart: 'Cardiologist',
      stomach: 'Gastroenterologist',
      eye: 'Ophthalmologist',
      ear: 'ENT Specialist',
      tooth: 'Dentist',
      bone: 'Orthopedic',
      joint: 'Orthopedic', 
      mental: 'Psychiatrist',
      stress: 'Psychiatrist',
      anxiety: 'Psychiatrist'
    };
    
    const recommendedSpecialists = [...new Set(
      entities.symptoms.map(s => symptomToSpecialist[s]).filter(Boolean)
    )];
    
    if (recommendedSpecialists.length > 0) {
      response = {
        message: `Based on your symptoms (${entities.symptoms.join(', ')}), I recommend consulting:\n\n${recommendedSpecialists.map(s => `• ${s}`).join('\n')}\n\nWould you like me to find available doctors?`,
        suggestions: recommendedSpecialists.map(s => `Find ${s}`),
        recommendedSpecialists
      };
    }
  }
  if (intent === 'queue' && userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayAppointment = await Appointment.findOne({ 
        userId,
        date: {
          $gte: new Date(today),
          $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
        },
        status: { $in: ['pending', 'confirmed'] }
      }).populate('doctorId', 'name');
      
      if (todayAppointment) {
        response.message += `\n\n📋 **Your Today's Appointment:**\nDr. ${todayAppointment.doctorId?.name}\nToken: #${todayAppointment.queueNumber || todayAppointment.tokenNumber}`;
      }
    } catch (error) {
      console.error('Error fetching user appointment:', error);
    }
  }
  
  return response;
}

async function processMessage(message, userId = null, conversationHistory = []) {
  try {
    const intent = classifyIntent(message);
    const entities = extractEntities(message);
    const response = await generateResponse(intent, entities, userId);
    return {
      success: true,
      intent,
      entities,
      response: response.message,
      suggestions: response.suggestions || [],
      isUrgent: response.isUrgent || false,
      data: {
        doctors: response.doctors,
       recommendedSpecialists: response.recommendedSpecialists
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      success: false,
      response: "I'm having trouble processing your request. Please try again or contact support.",
      suggestions: ["Try again", "Contact support"],
      error: error.message
    };
  }
}

function getQuickReplies() {
  return [
    { id: 'book', text: '📅 Book Appointment', intent: 'booking' },
    { id: 'doctor', text: '👨‍⚕️ Find Doctor', intent: 'doctor' },
    { id: 'queue', text: '📊 Check Queue', intent: 'queue' },
    { id: 'timing', text: '🕐 Clinic Timings', intent: 'timing' },
    { id: 'emergency', text: '🚨 Emergency', intent: 'emergency' },
    { id: 'help', text: '❓ Help', intent: 'help' }
  ];
}

module.exports = {
  processMessage,
  classifyIntent,
  extractEntities,
  getQuickReplies
};
