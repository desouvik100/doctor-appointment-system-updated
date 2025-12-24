/**
 * E-Prescribing Integration Service
 * Handles electronic prescription creation, validation, and transmission
 * Supports integration with pharmacy networks and drug databases
 */

const axios = require('axios');
const crypto = require('crypto');

// Prescription status enum
const PRESCRIPTION_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  TRANSMITTED: 'transmitted',
  RECEIVED: 'received',
  FILLED: 'filled',
  PARTIALLY_FILLED: 'partially_filled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  DENIED: 'denied'
};

// Controlled substance schedules
const CONTROLLED_SCHEDULES = {
  II: { requiresPhysicalSignature: true, noRefills: true, maxDays: 30 },
  III: { maxRefills: 5, maxDays: 90 },
  IV: { maxRefills: 5, maxDays: 90 },
  V: { maxRefills: 5, maxDays: 180 }
};

// Drug form codes (NCPDP standard)
const DRUG_FORMS = {
  TAB: 'Tablet',
  CAP: 'Capsule',
  SOL: 'Solution',
  SUS: 'Suspension',
  INJ: 'Injection',
  CRM: 'Cream',
  OIN: 'Ointment',
  GEL: 'Gel',
  DRP: 'Drops',
  INH: 'Inhaler',
  PAT: 'Patch',
  SUP: 'Suppository',
  PWD: 'Powder',
  SYR: 'Syrup'
};

// Frequency codes
const FREQUENCY_CODES = {
  QD: { code: 'QD', display: 'Once daily', timesPerDay: 1 },
  BID: { code: 'BID', display: 'Twice daily', timesPerDay: 2 },
  TID: { code: 'TID', display: 'Three times daily', timesPerDay: 3 },
  QID: { code: 'QID', display: 'Four times daily', timesPerDay: 4 },
  Q4H: { code: 'Q4H', display: 'Every 4 hours', timesPerDay: 6 },
  Q6H: { code: 'Q6H', display: 'Every 6 hours', timesPerDay: 4 },
  Q8H: { code: 'Q8H', display: 'Every 8 hours', timesPerDay: 3 },
  Q12H: { code: 'Q12H', display: 'Every 12 hours', timesPerDay: 2 },
  PRN: { code: 'PRN', display: 'As needed', timesPerDay: null },
  QHS: { code: 'QHS', display: 'At bedtime', timesPerDay: 1 },
  QAM: { code: 'QAM', display: 'Every morning', timesPerDay: 1 },
  QPM: { code: 'QPM', display: 'Every evening', timesPerDay: 1 },
  QOD: { code: 'QOD', display: 'Every other day', timesPerDay: 0.5 },
  QWK: { code: 'QWK', display: 'Once weekly', timesPerDay: 1/7 }
};

/**
 * Generate unique prescription ID
 */
function generatePrescriptionId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `RX-${timestamp}-${random}`.toUpperCase();
}

/**
 * Validate prescription data
 * @param {Object} prescription - Prescription data
 * @returns {Object} Validation result
 */
function validatePrescription(prescription) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!prescription.patientId) errors.push('Patient ID is required');
  if (!prescription.prescriberId) errors.push('Prescriber ID is required');
  if (!prescription.medications || prescription.medications.length === 0) {
    errors.push('At least one medication is required');
  }

  // Validate each medication
  for (let i = 0; i < (prescription.medications || []).length; i++) {
    const med = prescription.medications[i];
    const prefix = `Medication ${i + 1}`;

    if (!med.drugName) errors.push(`${prefix}: Drug name is required`);
    if (!med.dosage) errors.push(`${prefix}: Dosage is required`);
    if (!med.quantity) errors.push(`${prefix}: Quantity is required`);
    if (!med.frequency) warnings.push(`${prefix}: Frequency not specified`);

    // Validate controlled substance rules
    if (med.controlledSchedule) {
      const schedule = CONTROLLED_SCHEDULES[med.controlledSchedule];
      if (schedule) {
        if (schedule.noRefills && med.refills > 0) {
          errors.push(`${prefix}: Schedule ${med.controlledSchedule} medications cannot have refills`);
        }
        if (schedule.maxRefills && med.refills > schedule.maxRefills) {
          errors.push(`${prefix}: Maximum ${schedule.maxRefills} refills for Schedule ${med.controlledSchedule}`);
        }
        if (schedule.maxDays && med.daysSupply > schedule.maxDays) {
          errors.push(`${prefix}: Maximum ${schedule.maxDays} days supply for Schedule ${med.controlledSchedule}`);
        }
      }
    }

    // Validate quantity calculations
    if (med.frequency && med.daysSupply && med.quantity) {
      const freqInfo = FREQUENCY_CODES[med.frequency];
      if (freqInfo && freqInfo.timesPerDay) {
        const expectedQty = freqInfo.timesPerDay * med.daysSupply * (med.doseQuantity || 1);
        if (Math.abs(med.quantity - expectedQty) > expectedQty * 0.1) {
          warnings.push(`${prefix}: Quantity (${med.quantity}) may not match frequency and days supply (expected ~${Math.round(expectedQty)})`);
        }
      }
    }
  }

  // Validate prescriber
  if (prescription.prescriber) {
    if (!prescription.prescriber.npi) warnings.push('Prescriber NPI not provided');
    if (!prescription.prescriber.deaNumber && prescription.medications?.some(m => m.controlledSchedule)) {
      errors.push('DEA number required for controlled substances');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    canTransmit: errors.length === 0
  };
}

/**
 * Create a new e-prescription
 * @param {Object} data - Prescription data
 * @returns {Object} Created prescription
 */
async function createPrescription(data) {
  const prescriptionId = generatePrescriptionId();
  
  // Validate
  const validation = validatePrescription(data);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Build prescription object
  const prescription = {
    prescriptionId,
    status: PRESCRIPTION_STATUS.DRAFT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
    // Patient info
    patient: {
      id: data.patientId,
      name: data.patient?.name,
      dateOfBirth: data.patient?.dateOfBirth,
      gender: data.patient?.gender,
      phone: data.patient?.phone,
      address: data.patient?.address,
      allergies: data.patient?.allergies || []
    },
    
    // Prescriber info
    prescriber: {
      id: data.prescriberId,
      name: data.prescriber?.name,
      npi: data.prescriber?.npi,
      deaNumber: data.prescriber?.deaNumber,
      stateLicense: data.prescriber?.stateLicense,
      specialty: data.prescriber?.specialty,
      phone: data.prescriber?.phone,
      clinic: data.prescriber?.clinic
    },
    
    // Medications
    medications: data.medications.map((med, index) => ({
      lineNumber: index + 1,
      drugName: med.drugName,
      genericName: med.genericName,
      ndc: med.ndc, // National Drug Code
      rxcui: med.rxcui, // RxNorm Concept ID
      strength: med.strength,
      strengthUnit: med.strengthUnit,
      form: med.form,
      formCode: med.formCode,
      route: med.route || 'oral',
      dosage: med.dosage,
      doseQuantity: med.doseQuantity || 1,
      frequency: med.frequency,
      frequencyDisplay: FREQUENCY_CODES[med.frequency]?.display || med.frequency,
      duration: med.duration,
      daysSupply: med.daysSupply,
      quantity: med.quantity,
      quantityUnit: med.quantityUnit || 'EA',
      refills: med.refills || 0,
      dispenseAsWritten: med.dispenseAsWritten || false,
      substitutionAllowed: med.substitutionAllowed !== false,
      controlledSchedule: med.controlledSchedule,
      instructions: med.instructions || buildInstructions(med),
      notes: med.notes,
      priorAuthRequired: med.priorAuthRequired || false,
      priorAuthNumber: med.priorAuthNumber
    })),
    
    // Pharmacy
    pharmacy: data.pharmacy ? {
      id: data.pharmacy.id,
      name: data.pharmacy.name,
      ncpdpId: data.pharmacy.ncpdpId,
      npi: data.pharmacy.npi,
      phone: data.pharmacy.phone,
      fax: data.pharmacy.fax,
      address: data.pharmacy.address,
      isMailOrder: data.pharmacy.isMailOrder || false
    } : null,
    
    // Clinical info
    diagnosis: data.diagnosis,
    icdCodes: data.icdCodes || [],
    clinicalNotes: data.clinicalNotes,
    
    // Validation results
    validation: {
      ...validation,
      checkedAt: new Date().toISOString()
    },
    
    // Tracking
    transmissionHistory: [],
    auditLog: [{
      action: 'created',
      timestamp: new Date().toISOString(),
      userId: data.prescriberId,
      details: 'Prescription created'
    }]
  };

  return prescription;
}

/**
 * Build patient instructions from medication data
 */
function buildInstructions(med) {
  const parts = [];
  
  if (med.dosage) parts.push(`Take ${med.dosage}`);
  if (med.frequency) {
    const freq = FREQUENCY_CODES[med.frequency];
    parts.push(freq ? freq.display.toLowerCase() : med.frequency);
  }
  if (med.route && med.route !== 'oral') parts.push(`by ${med.route}`);
  if (med.duration) parts.push(`for ${med.duration}`);
  if (med.timing) parts.push(med.timing);
  if (med.withFood) parts.push('with food');
  
  return parts.join(' ') || 'Take as directed';
}

/**
 * Check drug formulary coverage
 * @param {Object} params - Drug and insurance info
 * @returns {Object} Formulary status
 */
async function checkFormulary(params) {
  const { drugName, rxcui, ndc, insurancePlan } = params;

  // Simulated formulary check (would integrate with real PBM/insurance APIs)
  // In production, this would call Surescripts, CoverMyMeds, or similar
  
  const formularyStatus = {
    covered: true,
    tier: 2,
    tierName: 'Preferred Brand',
    copay: 25,
    priorAuthRequired: false,
    stepTherapyRequired: false,
    quantityLimits: null,
    alternatives: []
  };

  // Simulate some drugs requiring prior auth
  const priorAuthDrugs = ['humira', 'enbrel', 'ozempic', 'wegovy', 'mounjaro'];
  if (priorAuthDrugs.some(d => drugName?.toLowerCase().includes(d))) {
    formularyStatus.priorAuthRequired = true;
    formularyStatus.tier = 4;
    formularyStatus.tierName = 'Specialty';
    formularyStatus.copay = 150;
  }

  // Simulate step therapy requirements
  const stepTherapyDrugs = ['lyrica', 'celebrex', 'nexium'];
  if (stepTherapyDrugs.some(d => drugName?.toLowerCase().includes(d))) {
    formularyStatus.stepTherapyRequired = true;
    formularyStatus.alternatives = [
      { name: 'Generic alternative available', tier: 1, copay: 10 }
    ];
  }

  return {
    drugName,
    rxcui,
    ndc,
    insurancePlan,
    ...formularyStatus,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Search for pharmacies
 * @param {Object} params - Search parameters
 * @returns {Array} Matching pharmacies
 */
async function searchPharmacies(params) {
  const { zipCode, radius = 10, name, type } = params;

  // Simulated pharmacy search (would integrate with Surescripts pharmacy directory)
  const pharmacies = [
    {
      id: 'PHM001',
      ncpdpId: '1234567',
      npi: '1234567890',
      name: 'CVS Pharmacy',
      type: 'retail',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210'
      },
      phone: '555-123-4567',
      fax: '555-123-4568',
      hours: 'Mon-Sat 9AM-9PM, Sun 10AM-6PM',
      services: ['drive-thru', '24-hour', 'delivery'],
      acceptsEPrescriptions: true,
      acceptsControlled: true,
      distance: 0.5
    },
    {
      id: 'PHM002',
      ncpdpId: '2345678',
      npi: '2345678901',
      name: 'Walgreens',
      type: 'retail',
      address: {
        street: '456 Oak Ave',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210'
      },
      phone: '555-234-5678',
      fax: '555-234-5679',
      hours: 'Open 24 hours',
      services: ['24-hour', 'immunizations'],
      acceptsEPrescriptions: true,
      acceptsControlled: true,
      distance: 1.2
    },
    {
      id: 'PHM003',
      ncpdpId: '3456789',
      npi: '3456789012',
      name: 'Express Scripts Mail Order',
      type: 'mail_order',
      address: {
        street: 'PO Box 12345',
        city: 'St. Louis',
        state: 'MO',
        zipCode: '63101'
      },
      phone: '800-555-1234',
      services: ['mail-order', '90-day-supply'],
      acceptsEPrescriptions: true,
      acceptsControlled: false,
      isMailOrder: true
    }
  ];

  // Filter by type if specified
  let filtered = pharmacies;
  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  if (name) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
  }

  return filtered;
}

/**
 * Transmit prescription to pharmacy
 * @param {Object} prescription - Prescription to transmit
 * @returns {Object} Transmission result
 */
async function transmitPrescription(prescription) {
  if (!prescription.pharmacy) {
    throw new Error('Pharmacy must be selected before transmission');
  }

  const validation = validatePrescription(prescription);
  if (!validation.canTransmit) {
    throw new Error(`Cannot transmit: ${validation.errors.join(', ')}`);
  }

  // Generate transmission record
  const transmissionId = `TX-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
  
  const transmission = {
    transmissionId,
    prescriptionId: prescription.prescriptionId,
    pharmacyId: prescription.pharmacy.id,
    pharmacyNcpdpId: prescription.pharmacy.ncpdpId,
    method: 'NCPDP_SCRIPT', // NCPDP SCRIPT standard
    version: '2017071',
    sentAt: new Date().toISOString(),
    status: 'pending'
  };

  // Simulate transmission (in production, would use Surescripts or similar)
  try {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate success (95% success rate)
    if (Math.random() > 0.05) {
      transmission.status = 'accepted';
      transmission.acceptedAt = new Date().toISOString();
      transmission.pharmacyConfirmation = `CONF-${Date.now()}`;
      
      return {
        success: true,
        transmission,
        message: 'Prescription successfully transmitted to pharmacy',
        estimatedFillTime: '1-2 hours',
        newStatus: PRESCRIPTION_STATUS.TRANSMITTED
      };
    } else {
      transmission.status = 'rejected';
      transmission.rejectionReason = 'Pharmacy system temporarily unavailable';
      
      return {
        success: false,
        transmission,
        message: 'Transmission failed - pharmacy system unavailable',
        retryable: true,
        newStatus: PRESCRIPTION_STATUS.PENDING_REVIEW
      };
    }
  } catch (error) {
    transmission.status = 'error';
    transmission.error = error.message;
    
    return {
      success: false,
      transmission,
      message: `Transmission error: ${error.message}`,
      retryable: true
    };
  }
}

/**
 * Cancel a prescription
 * @param {Object} prescription - Prescription to cancel
 * @param {string} reason - Cancellation reason
 * @returns {Object} Cancellation result
 */
async function cancelPrescription(prescription, reason, cancelledBy) {
  const allowedStatuses = [
    PRESCRIPTION_STATUS.DRAFT,
    PRESCRIPTION_STATUS.PENDING_REVIEW,
    PRESCRIPTION_STATUS.APPROVED,
    PRESCRIPTION_STATUS.TRANSMITTED
  ];

  if (!allowedStatuses.includes(prescription.status)) {
    throw new Error(`Cannot cancel prescription in ${prescription.status} status`);
  }

  const cancellation = {
    cancelledAt: new Date().toISOString(),
    cancelledBy,
    reason,
    previousStatus: prescription.status
  };

  // If already transmitted, need to send cancellation to pharmacy
  if (prescription.status === PRESCRIPTION_STATUS.TRANSMITTED) {
    cancellation.pharmacyNotified = true;
    cancellation.pharmacyNotificationId = `CXL-${Date.now()}`;
  }

  return {
    success: true,
    cancellation,
    newStatus: PRESCRIPTION_STATUS.CANCELLED,
    message: 'Prescription cancelled successfully'
  };
}

/**
 * Request prescription refill
 * @param {Object} prescription - Original prescription
 * @returns {Object} Refill result
 */
async function requestRefill(prescription, requestedBy) {
  // Check if refills available
  const totalRefillsUsed = prescription.refillHistory?.length || 0;
  const maxRefills = prescription.medications.reduce((max, med) => 
    Math.max(max, med.refills || 0), 0);

  if (totalRefillsUsed >= maxRefills) {
    return {
      success: false,
      message: 'No refills remaining',
      refillsUsed: totalRefillsUsed,
      refillsAllowed: maxRefills,
      requiresNewPrescription: true
    };
  }

  // Check expiration (typically 1 year for non-controlled)
  const createdDate = new Date(prescription.createdAt);
  const expirationDate = new Date(createdDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  if (new Date() > expirationDate) {
    return {
      success: false,
      message: 'Prescription has expired',
      expiredAt: expirationDate.toISOString(),
      requiresNewPrescription: true
    };
  }

  // Create refill request
  const refillRequest = {
    refillId: `RF-${Date.now().toString(36)}`.toUpperCase(),
    prescriptionId: prescription.prescriptionId,
    requestedAt: new Date().toISOString(),
    requestedBy,
    refillNumber: totalRefillsUsed + 1,
    status: 'pending'
  };

  return {
    success: true,
    refillRequest,
    message: 'Refill request submitted',
    refillsRemaining: maxRefills - totalRefillsUsed - 1
  };
}

/**
 * Get prescription history for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} options - Query options
 * @returns {Array} Prescription history
 */
async function getPrescriptionHistory(patientId, options = {}) {
  const { 
    status, 
    startDate, 
    endDate, 
    medicationName,
    limit = 50,
    includeExpired = false 
  } = options;

  // This would query the database in production
  // Returning structure for reference
  return {
    patientId,
    prescriptions: [],
    totalCount: 0,
    filters: { status, startDate, endDate, medicationName },
    pagination: { limit, offset: 0 }
  };
}

/**
 * Check for therapeutic duplicates
 * @param {Array} newMedications - New medications being prescribed
 * @param {Array} currentMedications - Patient's current medications
 * @returns {Array} Duplicate warnings
 */
function checkTherapeuticDuplicates(newMedications, currentMedications) {
  const duplicates = [];

  // Drug class mappings for duplicate detection
  const drugClasses = {
    'ace_inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'benazepril'],
    'arb': ['losartan', 'valsartan', 'irbesartan', 'olmesartan'],
    'statin': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'],
    'ppi': ['omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole'],
    'ssri': ['sertraline', 'fluoxetine', 'escitalopram', 'paroxetine', 'citalopram'],
    'nsaid': ['ibuprofen', 'naproxen', 'meloxicam', 'diclofenac', 'celecoxib'],
    'benzodiazepine': ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam'],
    'opioid': ['oxycodone', 'hydrocodone', 'morphine', 'tramadol', 'codeine'],
    'beta_blocker': ['metoprolol', 'atenolol', 'carvedilol', 'propranolol'],
    'thiazide': ['hydrochlorothiazide', 'chlorthalidone', 'indapamide']
  };

  for (const newMed of newMedications) {
    const newName = newMed.drugName?.toLowerCase() || '';
    
    // Find which class the new medication belongs to
    for (const [className, drugs] of Object.entries(drugClasses)) {
      if (drugs.some(d => newName.includes(d))) {
        // Check if patient already on a drug from same class
        for (const currentMed of currentMedications) {
          const currentName = (currentMed.drugName || currentMed.name || '').toLowerCase();
          if (drugs.some(d => currentName.includes(d)) && currentName !== newName) {
            duplicates.push({
              type: 'therapeutic_duplicate',
              severity: 'warning',
              newDrug: newMed.drugName,
              existingDrug: currentMed.drugName || currentMed.name,
              drugClass: className.replace('_', ' '),
              message: `Patient already on ${currentMed.drugName || currentMed.name} (same class: ${className.replace('_', ' ')})`
            });
          }
        }
      }
    }
  }

  return duplicates;
}

module.exports = {
  createPrescription,
  validatePrescription,
  transmitPrescription,
  cancelPrescription,
  requestRefill,
  checkFormulary,
  searchPharmacies,
  getPrescriptionHistory,
  checkTherapeuticDuplicates,
  generatePrescriptionId,
  buildInstructions,
  PRESCRIPTION_STATUS,
  CONTROLLED_SCHEDULES,
  DRUG_FORMS,
  FREQUENCY_CODES
};
