/**
 * EMR Configuration
 * Defines screens, plans, pricing, and access control
 */

// Plan hierarchy for access control
const PLAN_HIERARCHY = {
  basic: 1,
  standard: 2,
  advanced: 3
};

// EMR Screens with plan requirements and role access
const EMR_SCREENS = {
  // ===== BASIC PLAN SCREENS =====
  PATIENT_REGISTRATION: {
    id: 'patient_registration',
    name: 'Patient Registration',
    description: 'Register walk-in and new patients',
    plan: 'basic',
    roles: ['admin', 'staff', 'doctor'],
    icon: 'fa-user-plus',
    route: '/emr/patients/register'
  },
  VISIT_HISTORY: {
    id: 'visit_history',
    name: 'Visit History',
    description: 'View all patient visits and appointments',
    plan: 'basic',
    roles: ['admin', 'staff', 'doctor'],
    icon: 'fa-history',
    route: '/emr/visits'
  },
  SYSTEMATIC_HISTORY: {
    id: 'systematic_history',
    name: 'Systematic History',
    description: 'Structured symptom collection by body system',
    plan: 'basic',
    roles: ['admin', 'doctor'],
    icon: 'fa-clipboard-list',
    route: '/emr/systematic-history'
  },
  BASIC_PRESCRIPTION: {
    id: 'basic_prescription',
    name: 'Prescription',
    description: 'Create and print prescriptions',
    plan: 'basic',
    roles: ['doctor'],
    icon: 'fa-prescription',
    route: '/emr/prescription'
  },
  UPLOADED_REPORTS: {
    id: 'uploaded_reports',
    name: 'Patient Reports',
    description: 'View uploaded lab reports and documents',
    plan: 'basic',
    roles: ['admin', 'staff', 'doctor'],
    icon: 'fa-file-medical',
    route: '/emr/reports'
  },
  
  // ===== STANDARD PLAN SCREENS =====
  DOCTOR_NOTES: {
    id: 'doctor_notes',
    name: 'Clinical Notes',
    description: 'Doctor notes and diagnosis documentation',
    plan: 'standard',
    roles: ['doctor'],
    icon: 'fa-notes-medical',
    route: '/emr/notes'
  },
  FOLLOW_UP_SCHEDULING: {
    id: 'follow_up_scheduling',
    name: 'Follow-up Scheduling',
    description: 'Schedule and manage follow-up visits',
    plan: 'standard',
    roles: ['admin', 'staff', 'doctor'],
    icon: 'fa-calendar-check',
    route: '/emr/follow-ups'
  },
  MEDICATION_HISTORY: {
    id: 'medication_history',
    name: 'Medication History',
    description: 'Complete medication history for patients',
    plan: 'standard',
    roles: ['doctor'],
    icon: 'fa-pills',
    route: '/emr/medications'
  },
  PATIENT_TIMELINE: {
    id: 'patient_timeline',
    name: 'Patient Timeline',
    description: 'Chronological view of patient health events',
    plan: 'standard',
    roles: ['admin', 'doctor'],
    icon: 'fa-stream',
    route: '/emr/timeline'
  },
  
  // ===== ADVANCED PLAN SCREENS =====
  EMR_DASHBOARD: {
    id: 'emr_dashboard',
    name: 'EMR Dashboard',
    description: 'Clinic overview with key metrics',
    plan: 'advanced',
    roles: ['admin'],
    icon: 'fa-chart-line',
    route: '/emr/dashboard'
  },
  ANALYTICS_REPORTS: {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Clinic statistics and performance reports',
    plan: 'advanced',
    roles: ['admin'],
    icon: 'fa-chart-bar',
    route: '/emr/analytics'
  },
  AUDIT_LOGS: {
    id: 'audit_logs',
    name: 'Audit Logs',
    description: 'Track who edited what and when',
    plan: 'advanced',
    roles: ['admin'],
    icon: 'fa-shield-alt',
    route: '/emr/audit'
  },
  STAFF_MANAGEMENT: {
    id: 'staff_management',
    name: 'Staff Management',
    description: 'Manage doctors and staff access',
    plan: 'advanced',
    roles: ['admin'],
    icon: 'fa-users-cog',
    route: '/emr/staff'
  },
  DATA_EXPORT: {
    id: 'data_export',
    name: 'Data Export',
    description: 'Export patient records as PDF',
    plan: 'advanced',
    roles: ['admin'],
    icon: 'fa-file-export',
    route: '/emr/export'
  }
};

// Subscription Plans with pricing
const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Clinic EMR',
    description: 'Essential patient management for small clinics',
    tagline: 'Get started with digital records',
    features: [
      'Patient Registration (Walk-in & Online)',
      'Visit History & Records',
      'Systematic History Collection',
      'Basic Prescription Writing',
      'View Uploaded Reports'
    ],
    pricing: {
      '6_months': { amount: 4999, currency: 'INR', perMonth: 833 },
      '1_year': { amount: 8999, currency: 'INR', perMonth: 750, savings: 999 }
    },
    limits: {
      maxDoctors: 2,
      maxStaff: 3,
      maxPatientsPerMonth: 500
    },
    color: '#10b981',
    recommended: false
  },
  standard: {
    id: 'standard',
    name: 'Standard Clinic EMR',
    description: 'Complete clinical documentation for growing clinics',
    tagline: 'Most popular for clinics',
    features: [
      'All Basic features',
      'Doctor Notes & Diagnosis',
      'Follow-up Scheduling',
      'Complete Medication History',
      'Patient Timeline View'
    ],
    pricing: {
      '6_months': { amount: 9999, currency: 'INR', perMonth: 1666 },
      '1_year': { amount: 17999, currency: 'INR', perMonth: 1500, savings: 1999 }
    },
    limits: {
      maxDoctors: 5,
      maxStaff: 10,
      maxPatientsPerMonth: 2000
    },
    color: '#3b82f6',
    recommended: true
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced Clinic EMR',
    description: 'Full EMR with analytics for hospitals & multi-doctor clinics',
    tagline: 'Enterprise-grade features',
    features: [
      'All Standard features',
      'EMR Dashboard with Metrics',
      'Analytics & Reports',
      'Audit Logs (Who edited what)',
      'Multi-staff Access Control',
      'PDF Data Export'
    ],
    pricing: {
      '6_months': { amount: 19999, currency: 'INR', perMonth: 3333 },
      '1_year': { amount: 35999, currency: 'INR', perMonth: 3000, savings: 3999 }
    },
    limits: {
      maxDoctors: -1, // unlimited
      maxStaff: -1,   // unlimited
      maxPatientsPerMonth: -1 // unlimited
    },
    color: '#8b5cf6',
    recommended: false
  }
};

// Role definitions
const EMR_ROLES = {
  admin: {
    id: 'admin',
    name: 'Clinic Admin',
    description: 'Full access to all EMR features and settings',
    canManageStaff: true,
    canManageSubscription: true,
    canViewBilling: true
  },
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    description: 'Access to clinical screens only',
    canManageStaff: false,
    canManageSubscription: false,
    canViewBilling: false
  },
  staff: {
    id: 'staff',
    name: 'Staff',
    description: 'Access to registration and appointment screens',
    canManageStaff: false,
    canManageSubscription: false,
    canViewBilling: false
  }
};

// Helper functions
const getScreensForPlan = (plan) => {
  const planLevel = PLAN_HIERARCHY[plan] || 0;
  return Object.values(EMR_SCREENS).filter(
    screen => PLAN_HIERARCHY[screen.plan] <= planLevel
  );
};

const getScreensForRole = (role, plan) => {
  const planScreens = getScreensForPlan(plan);
  return planScreens.filter(screen => screen.roles.includes(role));
};

const canAccessScreen = (screenId, plan, role) => {
  const screen = Object.values(EMR_SCREENS).find(s => s.id === screenId);
  if (!screen) return false;
  
  const planLevel = PLAN_HIERARCHY[plan] || 0;
  const screenPlanLevel = PLAN_HIERARCHY[screen.plan] || 0;
  
  return planLevel >= screenPlanLevel && screen.roles.includes(role);
};

const getPlanDetails = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || null;
};

const calculateExpiryDate = (startDate, duration) => {
  const expiry = new Date(startDate);
  const months = duration === '6_months' ? 6 : 12;
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
};

module.exports = {
  PLAN_HIERARCHY,
  EMR_SCREENS,
  SUBSCRIPTION_PLANS,
  EMR_ROLES,
  getScreensForPlan,
  getScreensForRole,
  canAccessScreen,
  getPlanDetails,
  calculateExpiryDate
};
