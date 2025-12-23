/**
 * EMR Feature Flags Configuration
 * Defines which clinical features are available per subscription tier
 * Requirements: Task 16.1 - Subscription tier gating
 */

// Feature definitions with subscription tier requirements
export const EMR_FEATURES = {
  // Basic Plan Features
  vitals: {
    id: 'vitals',
    name: 'Vitals Recording',
    description: 'Record patient vital signs',
    requiredPlan: 'basic',
    icon: '❤️'
  },
  labOrders: {
    id: 'labOrders',
    name: 'Lab Orders',
    description: 'Order and track lab tests',
    requiredPlan: 'basic',
    icon: '🧪'
  },
  medicalHistory: {
    id: 'medicalHistory',
    name: 'Medical History',
    description: 'Record patient medical history',
    requiredPlan: 'basic',
    icon: '📋'
  },
  basicPrescription: {
    id: 'basicPrescription',
    name: 'Basic Prescription',
    description: 'Create prescriptions',
    requiredPlan: 'basic',
    icon: '💊'
  },
  patientRegistration: {
    id: 'patientRegistration',
    name: 'Patient Registration',
    description: 'Register new patients',
    requiredPlan: 'basic',
    icon: '👤'
  },
  visitHistory: {
    id: 'visitHistory',
    name: 'Visit History',
    description: 'View patient visit history',
    requiredPlan: 'basic',
    icon: '📅'
  },
  uploadedReports: {
    id: 'uploadedReports',
    name: 'Report Viewing',
    description: 'View uploaded reports',
    requiredPlan: 'basic',
    icon: '📄'
  },

  // Standard Plan Features
  icd10Coding: {
    id: 'icd10Coding',
    name: 'ICD-10 Diagnosis Coding',
    description: 'Search and add ICD-10 diagnosis codes',
    requiredPlan: 'standard',
    icon: '🏥'
  },
  drugInteractions: {
    id: 'drugInteractions',
    name: 'Drug Interaction Checking',
    description: 'Check for drug-drug and drug-allergy interactions',
    requiredPlan: 'standard',
    icon: '⚠️'
  },
  vitalsTrends: {
    id: 'vitalsTrends',
    name: 'Vitals Trends',
    description: 'View vital signs trends over time',
    requiredPlan: 'standard',
    icon: '📈'
  },
  doctorNotes: {
    id: 'doctorNotes',
    name: 'Doctor Notes',
    description: 'Add clinical notes and observations',
    requiredPlan: 'standard',
    icon: '📝'
  },
  followUpScheduling: {
    id: 'followUpScheduling',
    name: 'Follow-up Scheduling',
    description: 'Schedule patient follow-ups',
    requiredPlan: 'standard',
    icon: '🗓️'
  },
  medicationHistory: {
    id: 'medicationHistory',
    name: 'Medication History',
    description: 'View patient medication history',
    requiredPlan: 'standard',
    icon: '💉'
  },
  patientTimeline: {
    id: 'patientTimeline',
    name: 'Patient Timeline',
    description: 'View patient care timeline',
    requiredPlan: 'standard',
    icon: '⏱️'
  },

  // Advanced Plan Features
  customPanels: {
    id: 'customPanels',
    name: 'Custom Lab Panels',
    description: 'Create and manage custom lab test panels',
    requiredPlan: 'advanced',
    icon: '🔬'
  },
  interactionAudit: {
    id: 'interactionAudit',
    name: 'Interaction Audit Log',
    description: 'View drug interaction override audit trail',
    requiredPlan: 'advanced',
    icon: '📊'
  },
  emrDashboard: {
    id: 'emrDashboard',
    name: 'EMR Dashboard',
    description: 'Advanced EMR dashboard with analytics',
    requiredPlan: 'advanced',
    icon: '📱'
  },
  analyticsReports: {
    id: 'analyticsReports',
    name: 'Analytics & Reports',
    description: 'View clinic analytics and reports',
    requiredPlan: 'advanced',
    icon: '📉'
  },
  auditLogs: {
    id: 'auditLogs',
    name: 'Audit Logs',
    description: 'View system audit logs',
    requiredPlan: 'advanced',
    icon: '🔍'
  },
  staffManagement: {
    id: 'staffManagement',
    name: 'Staff Management',
    description: 'Manage clinic staff and permissions',
    requiredPlan: 'advanced',
    icon: '👥'
  },
  dataExport: {
    id: 'dataExport',
    name: 'Data Export',
    description: 'Export patient data to PDF/CSV',
    requiredPlan: 'advanced',
    icon: '📤'
  }
};

// Plan hierarchy for comparison
export const PLAN_HIERARCHY = {
  basic: 1,
  standard: 2,
  advanced: 3
};

// Plan display names
export const PLAN_NAMES = {
  basic: 'Basic Clinic EMR',
  standard: 'Standard Clinic EMR',
  advanced: 'Advanced Clinic EMR'
};

// Plan pricing info
export const PLAN_PRICING = {
  basic: { price: '₹4,999', period: '6 months' },
  standard: { price: '₹9,999', period: '6 months' },
  advanced: { price: '₹19,999', period: '6 months' }
};

/**
 * Check if a feature is available for a given subscription plan
 * @param {string} featureId - The feature ID to check
 * @param {string} currentPlan - The user's current subscription plan
 * @returns {boolean} - Whether the feature is available
 */
export const isFeatureAvailable = (featureId, currentPlan) => {
  if (!currentPlan) return false;
  
  const feature = EMR_FEATURES[featureId];
  if (!feature) return false;
  
  const requiredLevel = PLAN_HIERARCHY[feature.requiredPlan] || 0;
  const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;
  
  return currentLevel >= requiredLevel;
};

/**
 * Get all features available for a given plan
 * @param {string} plan - The subscription plan
 * @returns {Array} - Array of available feature objects
 */
export const getFeaturesForPlan = (plan) => {
  const planLevel = PLAN_HIERARCHY[plan] || 0;
  
  return Object.values(EMR_FEATURES).filter(feature => {
    const requiredLevel = PLAN_HIERARCHY[feature.requiredPlan] || 0;
    return planLevel >= requiredLevel;
  });
};

/**
 * Get features that require upgrade from current plan
 * @param {string} currentPlan - The user's current subscription plan
 * @returns {Array} - Array of locked feature objects
 */
export const getLockedFeatures = (currentPlan) => {
  const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;
  
  return Object.values(EMR_FEATURES).filter(feature => {
    const requiredLevel = PLAN_HIERARCHY[feature.requiredPlan] || 0;
    return requiredLevel > currentLevel;
  });
};

/**
 * Get the minimum plan required for a feature
 * @param {string} featureId - The feature ID
 * @returns {object|null} - Plan info or null if feature not found
 */
export const getRequiredPlanForFeature = (featureId) => {
  const feature = EMR_FEATURES[featureId];
  if (!feature) return null;
  
  return {
    plan: feature.requiredPlan,
    name: PLAN_NAMES[feature.requiredPlan],
    pricing: PLAN_PRICING[feature.requiredPlan]
  };
};

export default EMR_FEATURES;
