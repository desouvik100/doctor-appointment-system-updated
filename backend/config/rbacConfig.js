/**
 * RBAC Configuration - Hospital-Grade Permission System
 * =====================================================
 * This is the single source of truth for all permissions.
 * Every API endpoint MUST check permissions through this config.
 */

// Permission definitions - granular actions
const PERMISSIONS = {
  // Patient Management
  'patients:create': 'Create new patient records',
  'patients:view_basic': 'View patient basic info (name, phone, demographics)',
  'patients:view_clinical': 'View clinical data (diagnosis, prescriptions, reports)',
  'patients:update': 'Update patient information',
  'patients:delete': 'Delete patient records',
  'patients:export': 'Export patient data',
  
  // Appointments
  'appointments:create': 'Create appointments',
  'appointments:view': 'View appointments',
  'appointments:view_all': 'View all appointments (not just own)',
  'appointments:update': 'Update appointment details',
  'appointments:cancel': 'Cancel appointments',
  'appointments:manage_queue': 'Manage queue (skip, call next)',
  
  // Prescriptions
  'prescriptions:create': 'Create prescriptions',
  'prescriptions:view': 'View prescriptions',
  'prescriptions:edit': 'Edit prescriptions',
  'prescriptions:delete': 'Delete prescriptions',
  'prescriptions:sign': 'Digitally sign prescriptions',
  
  // Billing
  'billing:create': 'Create bills/invoices',
  'billing:view': 'View billing information',
  'billing:update': 'Update billing records',
  'billing:refund': 'Process refunds',
  'billing:export': 'Export billing data',
  
  // Lab Reports
  'reports:upload': 'Upload lab reports',
  'reports:view': 'View lab reports',
  'reports:delete': 'Delete lab reports',
  
  // Staff Management
  'staff:create': 'Add new staff members',
  'staff:view': 'View staff list',
  'staff:update': 'Update staff details',
  'staff:delete': 'Remove staff members',
  'staff:manage_roles': 'Assign/change staff roles',
  
  // Clinic Settings
  'clinic:view': 'View clinic settings',
  'clinic:update': 'Update clinic settings',
  'clinic:manage_doctors': 'Add/remove doctors',
  
  // Audit & Security
  'audit:view': 'View audit logs',
  'audit:export': 'Export audit logs',
  'security:view_alerts': 'View security alerts',
  'security:manage': 'Manage security settings',
  
  // Analytics
  'analytics:view_basic': 'View basic analytics',
  'analytics:view_financial': 'View financial analytics',
  'analytics:export': 'Export analytics data',
  
  // IPD (Inpatient)
  'ipd:admit': 'Admit patients',
  'ipd:discharge': 'Discharge patients',
  'ipd:transfer': 'Transfer patients between beds/wards',
  'ipd:view': 'View IPD records',
  
  // Inventory/Pharmacy
  'inventory:view': 'View inventory',
  'inventory:manage': 'Manage inventory (add/update stock)',
  'inventory:order': 'Create purchase orders',
  
  // EMR Advanced
  'emr:vitals': 'Record patient vitals',
  'emr:notes': 'Create consultation notes',
  'emr:templates': 'Manage EMR templates'
};

// Role definitions with permissions
const ROLES = {
  superadmin: {
    name: 'Super Admin',
    description: 'Platform administrator with full access',
    level: 100,
    permissions: Object.keys(PERMISSIONS) // All permissions
  },
  
  clinic_admin: {
    name: 'Clinic Admin',
    description: 'Clinic owner/administrator',
    level: 80,
    permissions: [
      'patients:create', 'patients:view_basic', 'patients:view_clinical', 'patients:update', 'patients:export',
      'appointments:create', 'appointments:view', 'appointments:view_all', 'appointments:update', 'appointments:cancel', 'appointments:manage_queue',
      'prescriptions:view',
      'billing:create', 'billing:view', 'billing:update', 'billing:refund', 'billing:export',
      'reports:upload', 'reports:view',
      'staff:create', 'staff:view', 'staff:update', 'staff:delete', 'staff:manage_roles',
      'clinic:view', 'clinic:update', 'clinic:manage_doctors',
      'audit:view', 'audit:export',
      'security:view_alerts',
      'analytics:view_basic', 'analytics:view_financial', 'analytics:export',
      'ipd:admit', 'ipd:discharge', 'ipd:transfer', 'ipd:view',
      'inventory:view', 'inventory:manage', 'inventory:order',
      'emr:vitals', 'emr:notes', 'emr:templates'
    ]
  },
  
  doctor: {
    name: 'Doctor',
    description: 'Medical practitioner',
    level: 60,
    permissions: [
      'patients:view_basic', 'patients:view_clinical', 'patients:update',
      'appointments:view', 'appointments:update', 'appointments:manage_queue',
      'prescriptions:create', 'prescriptions:view', 'prescriptions:edit', 'prescriptions:sign',
      'reports:view',
      'analytics:view_basic',
      'ipd:view',
      'emr:vitals', 'emr:notes', 'emr:templates'
    ],
    // Doctors can only see their own patients by default
    dataScope: 'own_patients'
  },
  
  nurse: {
    name: 'Nurse',
    description: 'Nursing staff',
    level: 45,
    permissions: [
      'patients:view_basic', 'patients:view_clinical',
      'appointments:view',
      'prescriptions:view',
      'reports:view',
      'ipd:view',
      'emr:vitals'
    ],
    dataScope: 'assigned_department'
  },
  
  receptionist: {
    name: 'Receptionist',
    description: 'Front desk staff',
    level: 40,
    permissions: [
      'patients:create', 'patients:view_basic', 'patients:update',
      'appointments:create', 'appointments:view', 'appointments:update', 'appointments:cancel', 'appointments:manage_queue',
      'billing:create', 'billing:view'
    ],
    // Receptionists cannot see clinical data
    dataScope: 'clinic'
  },
  
  billing_staff: {
    name: 'Billing Staff',
    description: 'Billing and accounts',
    level: 35,
    permissions: [
      'patients:view_basic',
      'appointments:view',
      'billing:create', 'billing:view', 'billing:update', 'billing:refund',
      'analytics:view_financial'
    ],
    dataScope: 'clinic'
  },
  
  lab_staff: {
    name: 'Lab Staff',
    description: 'Laboratory technician',
    level: 35,
    permissions: [
      'patients:view_basic',
      'reports:upload', 'reports:view'
    ],
    dataScope: 'clinic'
  },
  
  pharmacy_staff: {
    name: 'Pharmacy Staff',
    description: 'Pharmacy/dispensary staff',
    level: 35,
    permissions: [
      'patients:view_basic',
      'prescriptions:view',
      'inventory:view', 'inventory:manage'
    ],
    dataScope: 'clinic'
  },
  
  patient: {
    name: 'Patient',
    description: 'Registered patient',
    level: 10,
    permissions: [
      'appointments:create', 'appointments:view', 'appointments:cancel',
      'prescriptions:view',
      'reports:view',
      'billing:view'
    ],
    // Patients can only see their own data
    dataScope: 'self'
  }
};

// Data scope definitions
const DATA_SCOPES = {
  all: 'Access all data across all clinics',
  clinic: 'Access data within own clinic only',
  assigned_department: 'Access data within assigned department',
  own_patients: 'Access only assigned/own patients',
  self: 'Access only own data'
};

// Sensitive fields that require special handling
const SENSITIVE_FIELDS = {
  patient: ['phone', 'email', 'address', 'aadhaar', 'pan', 'emergencyContact'],
  clinical: ['diagnosis', 'allergies', 'chronicConditions', 'medications', 'labResults'],
  financial: ['bankAccount', 'upi', 'cardDetails']
};

// Actions that require audit logging
const AUDITABLE_ACTIONS = [
  'create', 'update', 'delete', 'view', 'export', 'print',
  'sign', 'admit', 'discharge', 'transfer', 'refund'
];

// High-risk actions requiring additional verification
const HIGH_RISK_ACTIONS = [
  'patients:delete',
  'prescriptions:delete',
  'billing:refund',
  'staff:delete',
  'staff:manage_roles',
  'audit:export',
  'ipd:discharge'
];

/**
 * Check if a role has a specific permission
 */
function hasPermission(role, permission) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
function getPermissions(role) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return [];
  return roleConfig.permissions;
}

/**
 * Check if role level is sufficient
 */
function hasMinimumLevel(role, requiredLevel) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return false;
  return roleConfig.level >= requiredLevel;
}

/**
 * Get data scope for a role
 */
function getDataScope(role) {
  const roleConfig = ROLES[role];
  if (!roleConfig) return 'self';
  return roleConfig.dataScope || 'clinic';
}

/**
 * Check if action is high-risk
 */
function isHighRiskAction(permission) {
  return HIGH_RISK_ACTIONS.includes(permission);
}

/**
 * Check if action requires audit
 */
function requiresAudit(action) {
  return AUDITABLE_ACTIONS.includes(action);
}

module.exports = {
  PERMISSIONS,
  ROLES,
  DATA_SCOPES,
  SENSITIVE_FIELDS,
  AUDITABLE_ACTIONS,
  HIGH_RISK_ACTIONS,
  hasPermission,
  getPermissions,
  hasMinimumLevel,
  getDataScope,
  isHighRiskAction,
  requiresAudit
};
