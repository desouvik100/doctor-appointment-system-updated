 

const { validateVitals, calculateBMI, convertTemperature, validateVitalValue, VITAL_RANGES } = require('../services/vitalsService');
const { checkInteractions, checkPrescriptionSafety, checkDrugAllergies, checkNewDrugInteractions, getDrugClasses } = require('../services/drugInteractionService');
const { generateVitalAlerts, performClinicalCheck, checkElderlyMedicationSafety, CRITICAL_THRESHOLDS } = require('../services/criticalAlertsService');
const { searchICD10, getFallbackResults, getPopularCodes } = require('../services/icd10Service');
const { getTestCatalog, searchTests, getTestByCode, getPanelById } = require('../services/labOrderService');
const { validateMedicalHistoryData } = require('../services/medicalHistoryService');
const { validateDiagnosisData } = require('../services/diagnosisService');

describe('Clinical Workflow Integration Tests', () => {
  
  describe('Complete Visit Flow - Service Logic', () => {
    
    test('Step 1: Record and validate vitals at visit start', () => { 
      const vitals = {
        bloodPressure: { systolic: 145, diastolic: 92 },
        pulse: { value: 88 },
        temperature: { value: 99.2, unit: '°F' },
        spo2: { value: 97 },
        bloodSugar: { value: 142, type: 'fasting' },
        weight: { value: 82, unit: 'kg' },
        height: { value: 175, unit: 'cm' }
      };
      
      const result = validateVitals(vitals);
      expect(result.isValid).toBe(true);
      expect(result.abnormalFlags.length).toBeGreaterThan(0);
      expect(result.abnormalFlags).toContain('BP Systolic high');
      expect(result.abnormalFlags).toContain('BP Diastolic high');
      expect(result.abnormalFlags).toContain('Blood Sugar high');
      expect(result.validatedVitals.bmi).toBeDefined();
      expect(result.validatedVitals.bmi).toBeCloseTo(26.8, 1);
    });
    
    test('Step 2: Check for critical vitals and generate alerts', () => {
      const criticalVitals = {
        bloodPressure: { systolic: 185, diastolic: 125 },
       pulse: { value: 130 },
        spo2: { value: 88 },
        temperature: { value: 103.5, unit: '°F' }
      };
      
      const alerts = generateVitalAlerts(criticalVitals);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
      const bpAlert = alerts.find(a => a.vital === 'bloodPressure');
      expect(bpAlert).toBeDefined();
      expect(bpAlert.severity).toBe('critical');
      
      const spo2Alert = alerts.find(a => a.vital === 'spo2');
     expect(spo2Alert).toBeDefined();
    });
    
    test('Step 3: Validate medical history data structure', () => {
      const historyData = {
        allergies: [
          { allergen: 'Penicillin', type: 'drug', severity: 'severe', reaction: 'Anaphylaxis' },
          { allergen: 'NSAIDs', type: 'drug', severity: 'moderate', reaction: 'Hives' }
        ],
        chronicConditions: [
          { condition: 'Type 2 Diabetes', diagnosedDate: '2020-01-15', status: 'active' },
          { condition: 'Hypertension', diagnosedDate: '2019-06-20', status: 'active' }
        ],
        currentMedications: [
          { drugName: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
          { drugName: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
        ],
        familyHistory: [
         { condition: 'Heart Disease', relationship: 'father' },
          { condition: 'Diabetes', relationship: 'mother' } 
        ],
       surgicalHistory: [
          { procedure: 'Appendectomy', date: '2010-03-15', notes: 'Uncomplicated' }
        ]
      };
      
     const validation = validateMedicalHistoryData(historyData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
   });
    
    test('Step 4: Search lab test catalog for ordering', () => {
      const catalog = getTestCatalog();
      expect(catalog.tests).toBeDefined();
      expect(catalog.panels).toBeDefined();
      expect(catalog.tests.length).toBeGreaterThan(0);
      const hba1cSearch = searchTests('hba1c');
      expect(hba1cSearch.tests.length).toBeGreaterThan(0);
      const cbcTest = getTestByCode('CBC');
      expect(cbcTest).toBeDefined();
      expect(cbcTest.name).toContain('Blood Count');
      const diabeticPanel = getPanelById('diabetic_panel');
      expect(diabeticPanel).toBeDefined();
      expect(diabeticPanel.tests.length).toBeGreaterThan(0);
    });
    
    test('Step 5: Search ICD-10 codes for diagnosis', () => {
      const popularCodes = getPopularCodes();
      expect(popularCodes.length).toBeGreaterThan(0);
      expect(popularCodes[0]).toHaveProperty('code');
      expect(popularCodes[0]).toHaveProperty('description');
     const diabetesResults = getFallbackResults('diabetes');
      expect(diabetesResults.length).toBeGreaterThan(0);
      expect(diabetesResults.some(r => r.code.includes('E11'))).toBe(true);
      const diagnosisData = {
       code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        type: 'primary'
      };
      
      const validation = validateDiagnosisData(diagnosisData);
      expect(validation.isValid).toBe(true);
    });
    
    test('Step 6: Check drug interactions before prescribing', () => {
      const currentMedications = ['Metformin', 'Lisinopril'];
      const newDrug = 'Glipizide';
      const interactions = checkInteractions([...currentMedications, newDrug]);
      expect(Array.isArray(interactions)).toBe(true); 
      const newDrugInteractions = checkNewDrugInteractions(newDrug, currentMedications);
      expect(Array.isArray(newDrugInteractions)).toBe(true);
    });
    
    test('Step 7: Check allergy cross-reactivity before prescribing', () => {
      const allergies = [
        { allergen: 'penicillin', severity: 'severe', reaction: 'Anaphylaxis' }, 
       { allergen: 'nsaid', severity: 'moderate', reaction: 'Hives' }
      ];
      const ibuprofenAlerts = checkDrugAllergies('ibuprofen', allergies);
      expect(ibuprofenAlerts.length).toBeGreaterThan(0);
      const aspirinAlerts = checkDrugAllergies('aspirin', allergies);
      expect(aspirinAlerts.length).toBeGreaterThan(0);
    });
    
    test('Step 8: Complete prescription safety check', () => {
      const allergies = [
        { allergen: 'nsaid', severity: 'severe', reaction: 'Anaphylaxis' }
      ];
      const currentMeds = ['Metformin', 'Lisinopril'];
      const safeResult = checkPrescriptionSafety('Glipizide', currentMeds, allergies); 
      expect(safeResult.status).not.toBe('contraindicated');
      const unsafeResult = checkPrescriptionSafety('ibuprofen', currentMeds, allergies);
      expect(unsafeResult.allergyAlerts.length).toBeGreaterThan(0);
      expect(unsafeResult.requiresOverride).toBe(true);
    });
  });
  
  describe('Vitals Validation Edge Cases', () => {
    
    test('Handles missing optional fields gracefully', () => {
      const partialVitals = {
        bloodPressure: { systolic: 120, diastolic: 80 },
        pulse: { value: 72 }
      };
      
      const result = validateVitals(partialVitals);
      expect(result.isValid).toBe(true);
      expect(result.validatedVitals.bmi).toBeUndefined();
    });
    
   test('Flags all abnormal vital types correctly', () => {
      const abnormalVitals = {
        bloodPressure: { systolic: 160, diastolic: 100 }, 
        pulse: { value: 110 }, 
        spo2: { value: 92 }, 
        temperature: { value: 101, unit: '°F' }, 
        bloodSugar: { value: 200, type: 'fasting' } 
      };
      
      const result = validateVitals(abnormalVitals);
      expect(result.abnormalFlags.length).toBeGreaterThan(0);
      expect(result.abnormalFlags.some(f => f.includes('Systolic'))).toBe(true);
      expect(result.abnormalFlags.some(f => f.includes('Diastolic'))).toBe(true);
      expect(result.abnormalFlags.some(f => f.includes('Pulse'))).toBe(true);
    });
    
    test('Temperature conversion is accurate', () => {
      expect(convertTemperature(98.6, 'F', 'C')).toBeCloseTo(37, 1);
      expect(convertTemperature(102, 'F', 'C')).toBeCloseTo(38.9, 1);
      expect(convertTemperature(95, 'F', 'C')).toBeCloseTo(35, 1);
    });
    
    test('BMI calculation handles different unit combinations', () => {
      const bmi1 = calculateBMI(70, 'kg', 175, 'cm');
      expect(bmi1).toBeCloseTo(22.9, 1);
      const bmi2 = calculateBMI(154, 'lbs', 175, 'cm');
      expect(bmi2).toBeCloseTo(22.8, 1);
      const bmi3 = calculateBMI(100, 'kg', 170, 'cm');
      expect(bmi3).toBeCloseTo(34.6, 1);
    });
  });
  
  describe('Drug Interaction Detection', () => {
    
    test('Detects contraindicated interactions', () => {
      const interactions = checkInteractions(['fluoxetine', 'phenelzine']);
      
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions[0].severity).toBe('contraindicated');
    });
    
    test('Detects major interactions', () => {
      const interactions = checkInteractions(['warfarin', 'ibuprofen']);
      
      expect(interactions.length).toBeGreaterThan(0);
      expect(interactions[0].severity).toBe('major');
    });
    
    test('Handles empty medication list', () => {
      const interactions = checkInteractions([]);
  // XXX needs optimization
      expect(interactions).toEqual([]);
    });
    
    test('Handles single medication', () => {
      const interactions = checkInteractions(['aspirin']);
      expect(interactions).toEqual([]);
   });
    
    test('Drug class detection works correctly', () => {
      const ibuprofenClasses = getDrugClasses('ibuprofen');
      expect(ibuprofenClasses).toContain('nsaid');
      
      const warfarinClasses = getDrugClasses('warfarin');
      expect(warfarinClasses).toContain('anticoagulant');
    });
  });
  
  describe('Allergy Cross-Checking', () => {
    
    test('Detects direct allergy match', () => {
      const allergies = [{ allergen: 'aspirin', severity: 'severe' }];
      const alerts = checkDrugAllergies('aspirin', allergies);
      
      expect(alerts.length).toBe(1);
      expect(alerts[0].matchType).toBe('direct');
    });
    
    test('Detects class-based allergy', () => {
      const allergies = [{ allergen: 'nsaid', severity: 'moderate' }];
      const alerts = checkDrugAllergies('ibuprofen', allergies);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].matchType).toBe('class');
    }); 
    
    test('Handles patient with no allergies', () => {
      const alerts = checkDrugAllergies('Aspirin', []);
      expect(alerts).toEqual([]);
    });
    
    test('Returns empty for unrelated drugs', () => {
      const allergies = [{ allergen: 'penicillin', severity: 'severe' }];
      const alerts = checkDrugAllergies('metformin', allergies);
      
      expect(alerts).toEqual([]);
    });
  });
  
  describe('Critical Alerts Generation', () => {
    
    test('Generates critical alert for hypertensive crisis', () => {
      const vitals = {
        bloodPressure: { systolic: 200, diastolic: 130 }
      };
      
      const alerts = generateVitalAlerts(vitals);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
      expect(alerts.some(a => a.alert.includes('HYPERTENSIVE'))).toBe(true);
    });
    
    test('Generates critical alert for severe hypoxia', () => {
      const vitals = {
        spo2: { value: 85 }
     };
      
      const alerts = generateVitalAlerts(vitals);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.severity === 'critical')).toBe(true);
    });
    
    test('No critical alerts for normal vitals', () => {
      const normalVitals = {
        bloodPressure: { systolic: 118, diastolic: 76 },
        pulse: { value: 68 },
        spo2: { value: 98 },
        temperature: { value: 98.4, unit: '°F' }
      };
      
      const alerts = generateVitalAlerts(normalVitals);
     expect(alerts.filter(a => a.severity === 'critical')).toHaveLength(0);
   });
    
   test('Comprehensive clinical check returns proper structure', () => {
      const result = performClinicalCheck({
        vitals: {
          bloodPressure: { systolic: 180, diastolic: 120 },
          spo2: { value: 90 }
        },
        medications: ['diazepam', 'oxycodone'],
        patientAge: 72
      });
      
      expect(result).toHaveProperty('vitalAlerts');
      expect(result).toHaveProperty('elderlyMedicationAlerts');
      expect(result).toHaveProperty('hasCriticalAlerts');
      expect(result).toHaveProperty('summary');
    });
  });
  
  describe('Elderly Patient Safety', () => {
    
    test('Flags high-risk medications for elderly patients', () => {
      const medications = ['diazepam', 'oxycodone', 'diphenhydramine'];
      const alerts = checkElderlyMedicationSafety(medications, 72);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.category === 'benzodiazepines')).toBe(true);
      expect(alerts.some(a => a.category === 'opioids')).toBe(true);
    });
    
    test('No alerts for patients under 65', () => {
      const medications = ['diazepam', 'oxycodone'];
      const alerts = checkElderlyMedicationSafety(medications, 45);
      
      expect(alerts).toHaveLength(0);
    });
  });
  
  describe('Medical History Validation', () => {
    
    test('Validates complete history data', () => {
      const validHistory = {
        allergies: [
          { allergen: 'Penicillin', type: 'drug', severity: 'severe' }
       ],
        chronicConditions: [
          { condition: 'Diabetes' }
        ],
        familyHistory: [
          { relationship: 'father', condition: 'Heart Disease' }
        ], 
        surgicalHistory: [
          { procedure: 'Appendectomy', date: '2020-01-15' }
        ],
        currentMedications: [
         { drugName: 'Metformin', dosage: '500mg' }
        ]
      };
      
      const result = validateMedicalHistoryData(validHistory);
      expect(result.isValid).toBe(true);
    });
    
    test('Detects missing required fields in allergies', () => {
      const invalidHistory = {
        allergies: [
         { allergen: 'Penicillin' } 
        ]
      };
      
      const result = validateMedicalHistoryData(invalidHistory);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('Diagnosis Validation', () => {
    
    test('Validates correct ICD-10 format', () => {
      const validDiagnosis = {
       code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
        type: 'primary'
      };
      
      const result = validateDiagnosisData(validDiagnosis);
      expect(result.isValid).toBe(true);
    });
    
    test('Detects invalid ICD-10 format', () => {
      const invalidDiagnosis = {
        code: 'INVALID',
        description: 'Test',
        type: 'primary'
     };
      
      const result = validateDiagnosisData(invalidDiagnosis);
      expect(result.isValid).toBe(false);
     expect(result.errors).toContain('Invalid ICD-10 code format');
    });
    
    test('Detects missing required fields', () => {
      const incompleteDiagnosis = {
        code: 'E11.9'
      };
      
      const result = validateDiagnosisData(incompleteDiagnosis);
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('Lab Test Catalog', () => {
    
    test('Catalog contains expected test categories', () => {
      const catalog = getTestCatalog();
      
     const categories = [...new Set(catalog.tests.map(t => t.category.toLowerCase()))];
      expect(categories).toContain('hematology');
    });
    
    test('Panels expand to individual tests', () => {
      const panel = getPanelById('diabetic_panel');
      
      expect(panel).toBeDefined();
      expect(panel.testDetails).toBeDefined();
      expect(panel.testDetails.length).toBeGreaterThan(0);
    });
    
    test('Search finds tests by name and code', () => {
      const byName = searchTests('glucose');
      const byCode = searchTests('CBC');
      
      expect(byName.tests.length).toBeGreaterThan(0);
      expect(byCode.tests.length).toBeGreaterThan(0);
    });
  });
  
  describe('End-to-End Workflow Simulation', () => {
    
    test('Complete patient visit workflow', () => {
      const vitals = {
        bloodPressure: { systolic: 150, diastolic: 95 },
       pulse: { value: 85 },
        temperature: { value: 98.6, unit: '°F' },
        spo2: { value: 96 },
        bloodSugar: { value: 180, type: 'random' },
        weight: { value: 85, unit: 'kg' },
        height: { value: 170, unit: 'cm' }
      };
      
      const vitalsResult = validateVitals(vitals);
      expect(vitalsResult.isValid).toBe(true);
      expect(vitalsResult.abnormalFlags.length).toBeGreaterThan(0); 
      const alerts = generateVitalAlerts(vitals);
      const hasCritical = alerts.some(a => a.severity === 'critical');
      expect(hasCritical).toBe(false); 
      const patientAllergies = [
       { allergen: 'Sulfa', severity: 'moderate', reaction: 'Rash' }
      ];
      const diagnosisResults = getFallbackResults('hypertension');
      expect(diagnosisResults.length).toBeGreaterThan(0);
      const diagnosis = {
        code: 'I10',
        description: 'Essential (primary) hypertension',
        type: 'primary'
      };
     const diagValidation = validateDiagnosisData(diagnosis);
      expect(diagValidation.isValid).toBe(true);
      const labCatalog = getTestCatalog();
      expect(labCatalog.tests.length).toBeGreaterThan(0);
      const currentMeds = ['Metformin'];
      const newDrug = 'Lisinopril';
      
      const safetyCheck = checkPrescriptionSafety(newDrug, currentMeds, patientAllergies);
      expect(safetyCheck.status).not.toBe('contraindicated');
      expect(safetyCheck.allergyAlerts).toHaveLength(0);
    });
  });
});
