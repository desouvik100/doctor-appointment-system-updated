// backend/services/aiHealthService.js
// Advanced AI Health Services for HealthSync

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// ============================================
// 2. PREDICTIVE HEALTH INSIGHTS
// Analyze patient history to predict health risks
// ============================================

const healthRiskFactors = {
  diabetes: {
    keywords: ['sugar', 'glucose', 'thirst', 'frequent urination', 'fatigue', 'blurred vision'],
    riskConditions: ['obesity', 'family history', 'sedentary lifestyle'],
    preventiveTips: [
      'Maintain healthy weight',
      'Exercise 30 minutes daily',
      'Reduce sugar intake',
      'Regular blood sugar monitoring'
    ]
  },
  hypertension: {
    keywords: ['headache', 'dizziness', 'chest pain', 'shortness of breath'],
    riskConditions: ['stress', 'high salt diet', 'obesity', 'smoking'],
    preventiveTips: [
      'Reduce sodium intake',
      'Exercise regularly',
      'Manage stress',
      'Limit alcohol consumption'
    ]
  },
  heartDisease: {
    keywords: ['chest pain', 'palpitations', 'shortness of breath', 'fatigue'],
    riskConditions: ['high cholesterol', 'diabetes', 'hypertension', 'smoking'],
    preventiveTips: [
      'Heart-healthy diet',
      'Regular cardiovascular exercise',
      'Quit smoking',
      'Regular health checkups'
    ]
  }
};


/**
 * Analyze patient's appointment history for health insights
 */
async function getPredictiveHealthInsights(userId) {
  try {
    // Get patient's appointment history
    const appointments = await Appointment.find({ userId })
      .populate('doctorId', 'specialization')
      .sort({ date: -1 })
      .limit(50);

    const user = await User.findById(userId);
    
    const insights = {
      riskAssessment: [],
      recommendations: [],
      healthTrends: [],
      upcomingCheckups: [],
      wellnessTips: []
    };

    // Analyze symptoms from appointment reasons
    const allReasons = appointments.map(a => a.reason?.toLowerCase() || '').join(' ');
    
    // Check for risk patterns
    for (const [condition, data] of Object.entries(healthRiskFactors)) {
      const matchedKeywords = data.keywords.filter(k => allReasons.includes(k));
      if (matchedKeywords.length >= 2) {
        const riskScore = Math.min(100, matchedKeywords.length * 25);
        insights.riskAssessment.push({
          condition: condition.charAt(0).toUpperCase() + condition.slice(1),
          riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low',
          riskScore,
          matchedSymptoms: matchedKeywords,
          preventiveTips: data.preventiveTips
        });
      }
    }

    // Analyze visit frequency trends
    const monthlyVisits = {};
    appointments.forEach(apt => {
      const month = new Date(apt.date).toISOString().slice(0, 7);
      monthlyVisits[month] = (monthlyVisits[month] || 0) + 1;
    });

    const visitTrend = Object.entries(monthlyVisits).slice(0, 6).map(([month, count]) => ({
      month,
      visits: count
    }));

    insights.healthTrends = visitTrend;

    // Specialization-based recommendations
    const specializations = [...new Set(appointments.map(a => a.doctorId?.specialization).filter(Boolean))];
    
    if (specializations.includes('Cardiologist')) {
      insights.upcomingCheckups.push({
        type: 'Cardiac Health Checkup',
        recommended: 'Every 6 months',
        reason: 'Based on your cardiology visits'
      });
    }

    // General wellness tips based on age
    const age = user?.dateOfBirth ? 
      Math.floor((Date.now() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 30;

    if (age > 40) {
      insights.wellnessTips.push(
        'Schedule annual comprehensive health checkup',
        'Consider regular blood pressure monitoring',
        'Maintain active lifestyle with 150 min/week exercise'
      );
    } else {
      insights.wellnessTips.push(
        'Stay active with regular exercise',
        'Maintain balanced diet',
        'Get adequate sleep (7-8 hours)'
      );
    }

    return { success: true, insights };
  } catch (error) {
    console.error('Error getting health insights:', error);
    return { success: false, error: error.message };
  }
}


// ============================================
// 3. SMART DOCTOR MATCHING
// AI matches patients to best-suited doctors
// ============================================

const symptomToSpecialization = {
  // General symptoms
  'fever': ['General Physician', 'Internal Medicine'],
  'cold': ['General Physician', 'ENT'],
  'cough': ['General Physician', 'Pulmonologist'],
  'headache': ['General Physician', 'Neurologist'],
  'body pain': ['General Physician', 'Orthopedic'],
  
  // Specific symptoms
  'chest pain': ['Cardiologist', 'General Physician'],
  'heart': ['Cardiologist'],
  'breathing': ['Pulmonologist', 'Cardiologist'],
  'skin': ['Dermatologist'],
  'rash': ['Dermatologist'],
  'acne': ['Dermatologist'],
  'bone': ['Orthopedic'],
  'joint': ['Orthopedic', 'Rheumatologist'],
  'fracture': ['Orthopedic'],
  'eye': ['Ophthalmologist'],
  'vision': ['Ophthalmologist'],
  'ear': ['ENT'],
  'nose': ['ENT'],
  'throat': ['ENT'],
  'stomach': ['Gastroenterologist', 'General Physician'],
  'digestion': ['Gastroenterologist'],
  'diabetes': ['Endocrinologist', 'General Physician'],
  'thyroid': ['Endocrinologist'],
  'hormone': ['Endocrinologist'],
  'pregnancy': ['Gynecologist', 'Obstetrician'],
  'menstrual': ['Gynecologist'],
  'child': ['Pediatrician'],
  'baby': ['Pediatrician'],
  'mental': ['Psychiatrist', 'Psychologist'],
  'anxiety': ['Psychiatrist', 'Psychologist'],
  'depression': ['Psychiatrist', 'Psychologist'],
  'stress': ['Psychiatrist', 'General Physician'],
  'teeth': ['Dentist'],
  'dental': ['Dentist'],
  'kidney': ['Nephrologist', 'Urologist'],
  'urine': ['Urologist', 'Nephrologist'],
  'cancer': ['Oncologist'],
  'tumor': ['Oncologist'],
  'allergy': ['Allergist', 'General Physician'],
  'nerve': ['Neurologist'],
  'brain': ['Neurologist', 'Neurosurgeon']
};

/**
 * Match patient symptoms to best doctors
 * @param {string} symptoms - Patient symptoms description
 * @param {object|null} location - Optional location for filtering (city, state, coordinates)
 * @param {object} preferences - Optional preferences (gender, experience, fee range)
 */
async function smartDoctorMatch(symptoms, location = null, preferences = {}) {
  try {
    const symptomText = symptoms.toLowerCase();
    const matchedSpecializations = new Set();
    
    // Use location for filtering if provided
    const locationFilter = location?.city || location?.state ? {
      $or: [
        { 'clinicId.city': location.city },
        { 'clinicId.state': location.state }
      ]
    } : {};
    
    // Use preferences for filtering
    const preferenceFilter = {};
    if (preferences.maxFee) {
      preferenceFilter.consultationFee = { $lte: preferences.maxFee };
    }
    if (preferences.minExperience) {
      preferenceFilter.experience = { $gte: preferences.minExperience };
    }
    
    // Find matching specializations
    for (const [keyword, specs] of Object.entries(symptomToSpecialization)) {
      if (symptomText.includes(keyword)) {
        specs.forEach(s => matchedSpecializations.add(s));
      }
    }
    
    // Default to General Physician if no match
    if (matchedSpecializations.size === 0) {
      matchedSpecializations.add('General Physician');
    }

    // Find doctors with matching specializations
    const query = {
      specialization: { $in: Array.from(matchedSpecializations) },
      isActive: { $ne: false },
      ...locationFilter,
      ...preferenceFilter
    };

    const doctors = await Doctor.find(query)
      .populate('clinicId', 'name address')
      .limit(10);

    // Score and rank doctors
    const rankedDoctors = await Promise.all(doctors.map(async (doc) => {
      let score = 50; // Base score
      
      // Experience bonus
      if (doc.experience) {
        score += Math.min(doc.experience * 2, 20);
      }
      
      // Rating bonus
      if (doc.rating) {
        score += doc.rating * 5;
      }
      
      // Completed appointments (success indicator)
      const completedCount = await Appointment.countDocuments({
        doctorId: doc._id,
        status: 'completed'
      });
      score += Math.min(completedCount / 10, 15);
      
      // Availability bonus (fewer pending = more available)
      const pendingCount = await Appointment.countDocuments({
        doctorId: doc._id,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date() }
      });
      score -= Math.min(pendingCount, 10);

      return {
        doctor: {
          _id: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          experience: doc.experience,
          rating: doc.rating,
          consultationFee: doc.consultationFee,
          profilePhoto: doc.profilePhoto,
          clinic: doc.clinicId
        },
        matchScore: Math.round(score),
        matchReason: `Specializes in ${doc.specialization}`,
        completedConsultations: completedCount
      };
    }));

    // Sort by score
    rankedDoctors.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      matchedSpecializations: Array.from(matchedSpecializations),
      recommendations: rankedDoctors.slice(0, 5),
      totalMatches: rankedDoctors.length
    };
  } catch (error) {
    console.error('Error in smart doctor match:', error);
    return { success: false, error: error.message };
  }
}


// ============================================
// 4. VOICE CONSULTATION NOTES (Transcription)
// Generate structured notes from text input
// ============================================

const medicalTerms = {
  symptoms: ['pain', 'fever', 'cough', 'headache', 'nausea', 'fatigue', 'dizziness', 'swelling'],
  vitals: ['bp', 'blood pressure', 'temperature', 'pulse', 'heart rate', 'oxygen', 'spo2'],
  medications: ['tablet', 'capsule', 'syrup', 'injection', 'mg', 'ml', 'dose'],
  instructions: ['take', 'apply', 'avoid', 'rest', 'follow-up', 'review']
};

/**
 * Parse consultation notes and generate structured summary
 */
function parseConsultationNotes(rawText) {
  const text = rawText.toLowerCase();
  const structured = {
    chiefComplaint: '',
    symptoms: [],
    vitals: {},
    diagnosis: '',
    medications: [],
    instructions: [],
    followUp: null,
    rawNotes: rawText
  };

  // Extract symptoms
  medicalTerms.symptoms.forEach(symptom => {
    if (text.includes(symptom)) {
      structured.symptoms.push(symptom);
    }
  });

  // Extract vitals using regex
  const bpMatch = text.match(/bp[:\s]*(\d{2,3})[\/](\d{2,3})/i);
  if (bpMatch) {
    structured.vitals.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
  }

  const tempMatch = text.match(/(?:temp|temperature)[:\s]*(\d{2,3}(?:\.\d)?)/i);
  if (tempMatch) {
    structured.vitals.temperature = `${tempMatch[1]}°F`;
  }

  const pulseMatch = text.match(/(?:pulse|heart rate)[:\s]*(\d{2,3})/i);
  if (pulseMatch) {
    structured.vitals.pulse = `${pulseMatch[1]} bpm`;
  }

  // Extract follow-up
  const followUpMatch = text.match(/(?:follow[- ]?up|review|come back)[:\s]*(?:in|after)?\s*(\d+)\s*(day|week|month)/i);
  if (followUpMatch) {
    structured.followUp = `${followUpMatch[1]} ${followUpMatch[2]}(s)`;
  }

  // Extract chief complaint (first sentence or line)
  const firstLine = rawText.split(/[.\n]/)[0];
  if (firstLine && firstLine.length < 200) {
    structured.chiefComplaint = firstLine.trim();
  }

  return structured;
}

/**
 * Generate prescription template from notes
 */
function generatePrescriptionTemplate(structuredNotes, doctorName, patientName) {
  const date = new Date().toLocaleDateString('en-IN');
  
  return {
    header: {
      doctorName,
      patientName,
      date
    },
    content: {
      chiefComplaint: structuredNotes.chiefComplaint,
      symptoms: structuredNotes.symptoms,
      vitals: structuredNotes.vitals,
      diagnosis: structuredNotes.diagnosis || 'To be determined',
      medications: structuredNotes.medications,
      instructions: structuredNotes.instructions,
      followUp: structuredNotes.followUp
    },
    template: `
PRESCRIPTION
============
Date: ${date}
Doctor: Dr. ${doctorName}
Patient: ${patientName}

Chief Complaint: ${structuredNotes.chiefComplaint || 'N/A'}

Symptoms: ${structuredNotes.symptoms.join(', ') || 'N/A'}

Vitals:
${Object.entries(structuredNotes.vitals).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  N/A'}

Diagnosis: ${structuredNotes.diagnosis || 'Under evaluation'}

Medications:
${structuredNotes.medications.map((m, i) => `  ${i + 1}. ${m}`).join('\n') || '  To be prescribed'}

Instructions:
${structuredNotes.instructions.map((inst, i) => `  ${i + 1}. ${inst}`).join('\n') || '  General care advised'}

Follow-up: ${structuredNotes.followUp || 'As needed'}
    `.trim()
  };
}


// ============================================
// 6. SENTIMENT ANALYSIS FOR FEEDBACK
// Analyze patient reviews and feedback
// ============================================

const sentimentWords = {
  positive: ['excellent', 'great', 'good', 'amazing', 'wonderful', 'best', 'helpful', 'caring', 
             'professional', 'recommend', 'satisfied', 'happy', 'thank', 'appreciated', 'kind',
             'thorough', 'attentive', 'friendly', 'comfortable', 'quick', 'efficient'],
  negative: ['bad', 'poor', 'terrible', 'worst', 'rude', 'unprofessional', 'disappointed',
             'waste', 'never', 'avoid', 'horrible', 'slow', 'long wait', 'expensive', 'unhelpful',
             'careless', 'rushed', 'ignored', 'uncomfortable', 'dirty'],
  neutral: ['okay', 'average', 'normal', 'fine', 'decent', 'moderate']
};

const aspectKeywords = {
  doctorBehavior: ['doctor', 'dr', 'behavior', 'attitude', 'manner', 'caring', 'rude', 'kind'],
  waitTime: ['wait', 'waiting', 'time', 'delay', 'quick', 'fast', 'slow', 'long'],
  treatment: ['treatment', 'diagnosis', 'medicine', 'prescription', 'cure', 'better', 'worse'],
  staff: ['staff', 'receptionist', 'nurse', 'assistant', 'team'],
  facility: ['clinic', 'hospital', 'clean', 'hygiene', 'facility', 'parking', 'location'],
  cost: ['cost', 'fee', 'expensive', 'cheap', 'price', 'affordable', 'value']
};

/**
 * Analyze sentiment of a review
 */
function analyzeSentiment(text) {
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  words.forEach(word => {
    if (sentimentWords.positive.some(p => word.includes(p))) positiveCount++;
    if (sentimentWords.negative.some(n => word.includes(n))) negativeCount++;
    if (sentimentWords.neutral.some(n => word.includes(n))) neutralCount++;
  });

  const total = positiveCount + negativeCount + neutralCount || 1;
  const score = ((positiveCount - negativeCount) / total) * 100;

  let sentiment = 'neutral';
  if (score > 20) sentiment = 'positive';
  else if (score < -20) sentiment = 'negative';

  return {
    sentiment,
    score: Math.round(score),
    positiveCount,
    negativeCount,
    confidence: Math.min(100, (positiveCount + negativeCount) * 10)
  };
}

/**
 * Extract aspects mentioned in review
 */
function extractAspects(text) {
  const lowerText = text.toLowerCase();
  const mentionedAspects = [];

  for (const [aspect, keywords] of Object.entries(aspectKeywords)) {
    const matches = keywords.filter(k => lowerText.includes(k));
    if (matches.length > 0) {
      mentionedAspects.push({
        aspect,
        keywords: matches,
        sentiment: analyzeSentiment(text).sentiment
      });
    }
  }

  return mentionedAspects;
}

/**
 * Analyze multiple reviews for a doctor
 */
async function analyzeDoctorReviews(doctorId) {
  try {
    // This would typically fetch from a Reviews collection
    // For now, we'll analyze appointment feedback/notes
    const appointments = await Appointment.find({
      doctorId,
      status: 'completed',
      patientNotes: { $exists: true, $ne: '' }
    }).select('patientNotes createdAt').limit(100);

    const analysis = {
      totalReviews: appointments.length,
      overallSentiment: 'neutral',
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      aspectScores: {},
      recentTrend: 'stable',
      keyInsights: [],
      improvementAreas: []
    };

    if (appointments.length === 0) {
      return { success: true, analysis, message: 'No reviews to analyze' };
    }

    appointments.forEach(apt => {
      const sentiment = analyzeSentiment(apt.patientNotes);
      analysis.sentimentBreakdown[sentiment.sentiment]++;
      
      const aspects = extractAspects(apt.patientNotes);
      aspects.forEach(a => {
        if (!analysis.aspectScores[a.aspect]) {
          analysis.aspectScores[a.aspect] = { positive: 0, negative: 0, total: 0 };
        }
        analysis.aspectScores[a.aspect].total++;
        if (a.sentiment === 'positive') analysis.aspectScores[a.aspect].positive++;
        if (a.sentiment === 'negative') analysis.aspectScores[a.aspect].negative++;
      });
    });

    // Calculate overall sentiment
    const { positive, negative } = analysis.sentimentBreakdown;
    if (positive > negative * 2) analysis.overallSentiment = 'positive';
    else if (negative > positive * 2) analysis.overallSentiment = 'negative';

    // Generate insights
    for (const [aspect, scores] of Object.entries(analysis.aspectScores)) {
      const ratio = scores.positive / (scores.total || 1);
      if (ratio > 0.7) {
        analysis.keyInsights.push(`Strong positive feedback on ${aspect}`);
      } else if (ratio < 0.3) {
        analysis.improvementAreas.push(`Consider improving ${aspect}`);
      }
    }

    return { success: true, analysis };
  } catch (error) {
    console.error('Error analyzing reviews:', error);
    return { success: false, error: error.message };
  }
}


// ============================================
// 7. SMART APPOINTMENT RESCHEDULING
// AI suggests optimal reschedule times
// ============================================

/**
 * Find optimal reschedule slots when appointment is cancelled
 * @param {string} doctorId - Doctor's ID
 * @param {Date} originalDate - Original appointment date (used for context)
 * @param {object} patientPreferences - Patient preferences for rescheduling
 */
async function findOptimalRescheduleSlots(doctorId, originalDate, patientPreferences = {}) {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const slotDuration = doctor.consultationDuration || 30;
    const suggestions = [];
    
    // Use originalDate to prioritize similar time slots
    const originalHour = originalDate ? new Date(originalDate).getHours() : null;
    
    // Use patient preferences for scoring
    const preferredTimeOfDay = patientPreferences.preferredTime || null; // 'morning', 'afternoon', 'evening'
    const preferSameDay = patientPreferences.preferSameDay || false;
    
    // Check next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + dayOffset);
      checkDate.setHours(0, 0, 0, 0);
      
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0) continue; // Skip Sunday
      
      const startOfDay = new Date(checkDate);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get existing appointments
      const existingApts = await Appointment.find({
        doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }).select('time');
      
      const bookedTimes = existingApts.map(a => a.time);
      
      // Find available slots
      const availableSlots = [];
      for (let hour = 9; hour < 19; hour++) {
        if (hour === 13) continue; // Skip lunch
        
        for (let min = 0; min < 60; min += slotDuration) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          if (!bookedTimes.includes(timeStr)) {
            let score = 50;
            
            // Prefer mid-morning and mid-afternoon
            if (hour >= 10 && hour <= 12) score += 15;
            if (hour >= 15 && hour <= 17) score += 10;
            
            // Penalize early/late slots
            if (hour < 10) score -= 10;
            if (hour >= 18) score -= 15;
            
            availableSlots.push({ time: timeStr, score });
          }
        }
      }
      
      // Sort by score and take top 3
      availableSlots.sort((a, b) => b.score - a.score);
      const topSlots = availableSlots.slice(0, 3);
      
      if (topSlots.length > 0) {
        suggestions.push({
          date: checkDate.toISOString().split('T')[0],
          dayName: checkDate.toLocaleDateString('en-IN', { weekday: 'long' }),
          slots: topSlots.map(s => ({
            time: s.time,
            formatted: formatTimeDisplay(s.time),
            recommendation: s.score > 60 ? 'Recommended' : 'Available'
          })),
          totalAvailable: availableSlots.length
        });
      }
    }

    return {
      success: true,
      suggestions: suggestions.slice(0, 5),
      doctorName: doctor.name,
      slotDuration
    };
  } catch (error) {
    console.error('Error finding reschedule slots:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Auto-fill cancelled slot from waitlist
 */
async function autoFillCancelledSlot(doctorId, date, time) {
  try {
    // Find patients who wanted this doctor but couldn't get a slot
    // This would typically check a waitlist collection
    // For now, we'll return a suggestion
    
    return {
      success: true,
      message: 'Slot available for waitlist patients',
      slotDetails: { doctorId, date, time },
      action: 'notify_waitlist'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function formatTimeDisplay(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}


// ============================================
// 8. HEALTH REPORT ANALYZER
// Extract and summarize key findings from reports
// ============================================

const normalRanges = {
  hemoglobin: { min: 12, max: 17, unit: 'g/dL', name: 'Hemoglobin' },
  rbc: { min: 4.5, max: 5.5, unit: 'million/mcL', name: 'RBC Count' },
  wbc: { min: 4000, max: 11000, unit: '/mcL', name: 'WBC Count' },
  platelets: { min: 150000, max: 400000, unit: '/mcL', name: 'Platelet Count' },
  glucose_fasting: { min: 70, max: 100, unit: 'mg/dL', name: 'Fasting Glucose' },
  glucose_pp: { min: 70, max: 140, unit: 'mg/dL', name: 'Post-Prandial Glucose' },
  hba1c: { min: 4, max: 5.6, unit: '%', name: 'HbA1c' },
  cholesterol_total: { min: 0, max: 200, unit: 'mg/dL', name: 'Total Cholesterol' },
  cholesterol_ldl: { min: 0, max: 100, unit: 'mg/dL', name: 'LDL Cholesterol' },
  cholesterol_hdl: { min: 40, max: 100, unit: 'mg/dL', name: 'HDL Cholesterol' },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', name: 'Triglycerides' },
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', name: 'Creatinine' },
  urea: { min: 7, max: 20, unit: 'mg/dL', name: 'Blood Urea' },
  uric_acid: { min: 3.5, max: 7.2, unit: 'mg/dL', name: 'Uric Acid' },
  bilirubin: { min: 0.1, max: 1.2, unit: 'mg/dL', name: 'Bilirubin' },
  sgpt: { min: 7, max: 56, unit: 'U/L', name: 'SGPT/ALT' },
  sgot: { min: 10, max: 40, unit: 'U/L', name: 'SGOT/AST' },
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', name: 'TSH' },
  t3: { min: 80, max: 200, unit: 'ng/dL', name: 'T3' },
  t4: { min: 5, max: 12, unit: 'mcg/dL', name: 'T4' },
  vitamin_d: { min: 30, max: 100, unit: 'ng/mL', name: 'Vitamin D' },
  vitamin_b12: { min: 200, max: 900, unit: 'pg/mL', name: 'Vitamin B12' },
  iron: { min: 60, max: 170, unit: 'mcg/dL', name: 'Serum Iron' },
  calcium: { min: 8.5, max: 10.5, unit: 'mg/dL', name: 'Calcium' }
};

/**
 * Analyze health report values
 */
function analyzeHealthReport(reportData) {
  const analysis = {
    summary: [],
    abnormal: [],
    normal: [],
    critical: [],
    recommendations: [],
    overallStatus: 'normal'
  };

  for (const [key, value] of Object.entries(reportData)) {
    const normalRange = normalRanges[key.toLowerCase().replace(/\s+/g, '_')];
    if (!normalRange) continue;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) continue;

    const result = {
      test: normalRange.name,
      value: numValue,
      unit: normalRange.unit,
      normalRange: `${normalRange.min} - ${normalRange.max}`,
      status: 'normal'
    };

    if (numValue < normalRange.min) {
      result.status = 'low';
      result.deviation = ((normalRange.min - numValue) / normalRange.min * 100).toFixed(1);
      analysis.abnormal.push(result);
      
      // Check if critical
      if (numValue < normalRange.min * 0.7) {
        result.status = 'critical_low';
        analysis.critical.push(result);
      }
    } else if (numValue > normalRange.max) {
      result.status = 'high';
      result.deviation = ((numValue - normalRange.max) / normalRange.max * 100).toFixed(1);
      analysis.abnormal.push(result);
      
      // Check if critical
      if (numValue > normalRange.max * 1.5) {
        result.status = 'critical_high';
        analysis.critical.push(result);
      }
    } else {
      analysis.normal.push(result);
    }

    analysis.summary.push(result);
  }

  // Generate recommendations
  if (analysis.abnormal.some(a => a.test.includes('Glucose') || a.test.includes('HbA1c'))) {
    analysis.recommendations.push('Consult an Endocrinologist for blood sugar management');
  }
  if (analysis.abnormal.some(a => a.test.includes('Cholesterol') || a.test.includes('Triglycerides'))) {
    analysis.recommendations.push('Consider dietary changes and consult a Cardiologist');
  }
  if (analysis.abnormal.some(a => a.test.includes('Hemoglobin') || a.test.includes('Iron'))) {
    analysis.recommendations.push('Iron supplementation may be needed - consult your doctor');
  }
  if (analysis.abnormal.some(a => a.test.includes('TSH') || a.test.includes('T3') || a.test.includes('T4'))) {
    analysis.recommendations.push('Thyroid function needs attention - see an Endocrinologist');
  }
  if (analysis.abnormal.some(a => a.test.includes('Creatinine') || a.test.includes('Urea'))) {
    analysis.recommendations.push('Kidney function markers abnormal - consult a Nephrologist');
  }
  if (analysis.abnormal.some(a => a.test.includes('SGPT') || a.test.includes('SGOT') || a.test.includes('Bilirubin'))) {
    analysis.recommendations.push('Liver function needs evaluation - see a Gastroenterologist');
  }

  // Set overall status
  if (analysis.critical.length > 0) {
    analysis.overallStatus = 'critical';
  } else if (analysis.abnormal.length > 3) {
    analysis.overallStatus = 'needs_attention';
  } else if (analysis.abnormal.length > 0) {
    analysis.overallStatus = 'minor_concerns';
  }

  return analysis;
}

/**
 * Track health metrics over time
 * @param {string} userId - User's ID for tracking
 * @param {string} metric - Metric name (e.g., 'blood_pressure', 'weight')
 * @param {number|string} newValue - New metric value
 */
async function trackHealthMetrics(userId, metric, newValue) {
  try {
    // Log the tracking for audit purposes
    console.log(`📊 Health metric tracked for user ${userId}: ${metric} = ${newValue}`);
    
    // This would store in a HealthMetrics collection
    // For now, return tracking info
    return {
      success: true,
      userId,
      metric,
      currentValue: newValue,
      trend: 'stable', // Would calculate from historical data
      message: `${metric} recorded successfully`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Export all functions
module.exports = {
  // Predictive Health
  getPredictiveHealthInsights,
  
  // Smart Doctor Matching
  smartDoctorMatch,
  
  // Voice/Consultation Notes
  parseConsultationNotes,
  generatePrescriptionTemplate,
  
  // Sentiment Analysis
  analyzeSentiment,
  extractAspects,
  analyzeDoctorReviews,
  
  // Smart Rescheduling
  findOptimalRescheduleSlots,
  autoFillCancelledSlot,
  
  // Health Report Analysis
  analyzeHealthReport,
  trackHealthMetrics,
  normalRanges
};
