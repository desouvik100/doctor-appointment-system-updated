/**
 * Systematic History Configuration
 * Shared constants for body systems, symptoms, and AI recommendation rules
 */

// Body Systems with their symptoms
const BODY_SYSTEMS = {
  general: {
    name: 'General',
    icon: '🌡️',
    order: 1,
    symptoms: [
      'Fever',
      'Weight Loss',
      'Weight Gain',
      'Fatigue',
      'Weakness',
      'Appetite Changes',
      'Night Sweats',
      'Chills',
      'Malaise'
    ]
  },
  respiratory: {
    name: 'Respiratory',
    icon: '🫁',
    order: 2,
    symptoms: [
      'Cough',
      'Breathlessness',
      'Wheezing',
      'Chest Tightness',
      'Sputum Production',
      'Hemoptysis',
      'Snoring',
      'Sleep Apnea',
      'Nasal Congestion'
    ]
  },
  cardiovascular: {
    name: 'Cardiovascular',
    icon: '❤️',
    order: 3,
    symptoms: [
      'Chest Pain',
      'Palpitations',
      'Leg Swelling',
      'Dizziness',
      'Fainting',
      'Shortness of Breath on Exertion',
      'Orthopnea',
      'Claudication'
    ]
  },
  gastrointestinal: {
    name: 'Gastrointestinal',
    icon: '🫃',
    order: 4,
    symptoms: [
      'Nausea',
      'Vomiting',
      'Abdominal Pain',
      'Diarrhea',
      'Constipation',
      'Bloating',
      'Heartburn',
      'Difficulty Swallowing',
      'Blood in Stool',
      'Loss of Appetite'
    ]
  },
  genitourinary: {
    name: 'Genitourinary',
    icon: '🚿',
    order: 5,
    symptoms: [
      'Painful Urination',
      'Frequent Urination',
      'Blood in Urine',
      'Incontinence',
      'Urgency',
      'Nocturia',
      'Flank Pain',
      'Discharge'
    ]
  },
  neurological: {
    name: 'Neurological',
    icon: '🧠',
    order: 6,
    symptoms: [
      'Headache',
      'Dizziness',
      'Numbness',
      'Tingling',
      'Vision Changes',
      'Memory Issues',
      'Seizures',
      'Tremors',
      'Balance Problems',
      'Speech Difficulties'
    ]
  },
  musculoskeletal: {
    name: 'Musculoskeletal',
    icon: '🦴',
    order: 7,
    symptoms: [
      'Joint Pain',
      'Muscle Pain',
      'Stiffness',
      'Swelling',
      'Limited Movement',
      'Back Pain',
      'Neck Pain',
      'Muscle Weakness',
      'Cramps'
    ]
  },
  skin: {
    name: 'Skin',
    icon: '🖐️',
    order: 8,
    symptoms: [
      'Rash',
      'Itching',
      'Dryness',
      'Discoloration',
      'Lumps',
      'Hair Loss',
      'Nail Changes',
      'Bruising',
      'Wounds Not Healing'
    ]
  },
  endocrine: {
    name: 'Endocrine',
    icon: '⚖️',
    order: 9,
    symptoms: [
      'Excessive Thirst',
      'Frequent Urination',
      'Heat Intolerance',
      'Cold Intolerance',
      'Tremors',
      'Mood Changes',
      'Excessive Sweating',
      'Fatigue',
      'Unexplained Weight Changes'
    ]
  }
};

// Common past medical conditions for quick selection
const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Thyroid Disorder',
  'Arthritis',
  'COPD',
  'Kidney Disease',
  'Liver Disease',
  'Cancer',
  'Stroke',
  'Epilepsy',
  'Depression',
  'Anxiety',
  'Migraine',
  'GERD',
  'Anemia',
  'Osteoporosis'
];

// Common medications for auto-suggestions
const COMMON_MEDICATIONS = [
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Omeprazole',
  'Paracetamol',
  'Ibuprofen',
  'Aspirin',
  'Metoprolol',
  'Losartan',
  'Levothyroxine',
  'Pantoprazole',
  'Cetirizine',
  'Montelukast',
  'Salbutamol',
  'Insulin'
];

// Duration options
const DURATION_OPTIONS = [
  { value: 'days', label: '1-3 days' },
  { value: 'week', label: 'About 1 week' },
  { value: 'weeks', label: '2-3 weeks' },
  { value: 'month', label: 'About 1 month' },
  { value: 'months', label: 'More than 1 month' }
];

// Severity labels
const SEVERITY_LABELS = {
  1: 'Mild',
  2: 'Mild-Moderate',
  3: 'Moderate',
  4: 'Moderate-Severe',
  5: 'Severe'
};

// AI Specialization Rules for doctor matching
const SPECIALIZATION_RULES = [
  {
    id: 'respiratory',
    symptoms: ['Cough', 'Breathlessness', 'Wheezing', 'Chest Tightness', 'Sputum Production'],
    systems: ['respiratory'],
    recommendations: [
      { specialization: 'Pulmonologist', confidence: 0.85 },
      { specialization: 'General Physician', confidence: 0.7 }
    ],
    reason: 'Respiratory symptoms detected'
  },
  {
    id: 'cardiac',
    symptoms: ['Chest Pain', 'Palpitations', 'Leg Swelling', 'Shortness of Breath on Exertion'],
    systems: ['cardiovascular'],
    recommendations: [
      { specialization: 'Cardiologist', confidence: 0.9 },
      { specialization: 'General Physician', confidence: 0.6 }
    ],
    reason: 'Cardiovascular symptoms detected'
  },
  {
    id: 'orthopedic',
    symptoms: ['Joint Pain', 'Stiffness', 'Swelling', 'Limited Movement', 'Back Pain'],
    systems: ['musculoskeletal'],
    recommendations: [
      { specialization: 'Orthopedic', confidence: 0.85 },
      { specialization: 'Rheumatologist', confidence: 0.75 }
    ],
    reason: 'Musculoskeletal symptoms detected'
  },
  {
    id: 'neurological',
    symptoms: ['Headache', 'Dizziness', 'Numbness', 'Vision Changes', 'Seizures', 'Memory Issues'],
    systems: ['neurological'],
    recommendations: [
      { specialization: 'Neurologist', confidence: 0.85 },
      { specialization: 'General Physician', confidence: 0.6 }
    ],
    reason: 'Neurological symptoms detected'
  },
  {
    id: 'gastro',
    symptoms: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Heartburn', 'Blood in Stool'],
    systems: ['gastrointestinal'],
    recommendations: [
      { specialization: 'Gastroenterologist', confidence: 0.85 },
      { specialization: 'General Physician', confidence: 0.65 }
    ],
    reason: 'Gastrointestinal symptoms detected'
  },
  {
    id: 'dermatology',
    symptoms: ['Rash', 'Itching', 'Discoloration', 'Hair Loss', 'Lumps'],
    systems: ['skin'],
    recommendations: [
      { specialization: 'Dermatologist', confidence: 0.9 }
    ],
    reason: 'Skin symptoms detected'
  },
  {
    id: 'endocrine',
    symptoms: ['Excessive Thirst', 'Frequent Urination', 'Heat Intolerance', 'Cold Intolerance', 'Unexplained Weight Changes'],
    systems: ['endocrine'],
    recommendations: [
      { specialization: 'Endocrinologist', confidence: 0.85 },
      { specialization: 'General Physician', confidence: 0.6 }
    ],
    reason: 'Endocrine symptoms detected'
  },
  {
    id: 'urology',
    symptoms: ['Painful Urination', 'Blood in Urine', 'Incontinence', 'Urgency'],
    systems: ['genitourinary'],
    recommendations: [
      { specialization: 'Urologist', confidence: 0.85 },
      { specialization: 'General Physician', confidence: 0.6 }
    ],
    reason: 'Urinary symptoms detected'
  },
  {
    id: 'multiSystem',
    multiSystem: true,
    minSystems: 3,
    recommendations: [
      { specialization: 'General Physician', confidence: 0.95 },
      { specialization: 'Internal Medicine', confidence: 0.85 }
    ],
    reason: 'Multiple body systems affected - comprehensive evaluation recommended'
  }
];

module.exports = {
  BODY_SYSTEMS,
  COMMON_CONDITIONS,
  COMMON_MEDICATIONS,
  DURATION_OPTIONS,
  SEVERITY_LABELS,
  SPECIALIZATION_RULES
};
