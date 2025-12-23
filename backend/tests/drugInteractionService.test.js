/**
 * Drug Interaction Service Tests
 * Tests Property 7: Drug Interaction Detection and Severity
 * Validates Requirements 5.1, 5.2, 5.3, 5.4
 */

const fc = require('fast-check');
const {
  checkInteractions,
  checkNewDrugInteractions,
  checkDrugPair,
  getDrugClasses,
  getSeverityInfo,
  getAllSeverityLevels,
  getDrugClassInfo,
  getAllDrugClasses,
  searchDrugs,
  hasKnownInteractions,
  getInteractionStats,
  normalizeDrugName,
  // Allergy cross-checking functions
  checkDrugAllergies,
  checkMultipleDrugAllergies,
  checkDrugAllergyMatch,
  checkPrescriptionSafety,
  getAllergySeverityInfo,
  getAllAllergySeverityLevels
} = require('../services/drugInteractionService');

describe('Drug Interaction Service Tests', () => {
  
  describe('Property 7: Drug Interaction Detection and Severity', () => {
    
    // Feature: emr-clinical-features, Property 7: Drug Interaction Detection and Severity
    // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    
    test('For any known interacting drug pair, checkDrugPair returns interaction with valid severity', () => {
      // Known interacting pairs from the database
      const knownInteractions = [
        ['warfarin', 'ibuprofen'],
        ['warfarin', 'aspirin'],
        ['lisinopril', 'losartan'],
        ['fluoxetine', 'phenelzine'],
        ['morphine', 'diazepam'],
        ['simvastatin', 'clarithromycin'],
        ['sildenafil', 'nitroglycerin']
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...knownInteractions),
          ([drug1, drug2]) => {
            const interaction = checkDrugPair(drug1, drug2);
            
            // Should find an interaction
            expect(interaction).not.toBeNull();
            expect(interaction).toHaveProperty('severity');
            expect(interaction).toHaveProperty('severityLevel');
            expect(interaction).toHaveProperty('mechanism');
            expect(interaction).toHaveProperty('clinicalEffect');
            expect(interaction).toHaveProperty('recommendation');
            
            // Severity should be valid
            expect(['contraindicated', 'major', 'moderate', 'minor']).toContain(interaction.severity);
            expect(interaction.severityLevel).toBeGreaterThanOrEqual(1);
            expect(interaction.severityLevel).toBeLessThanOrEqual(4);
            
            // Should have meaningful content
            expect(interaction.mechanism.length).toBeGreaterThan(0);
            expect(interaction.clinicalEffect.length).toBeGreaterThan(0);
            expect(interaction.recommendation.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('For any list of drugs, checkInteractions returns interactions sorted by severity', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'warfarin', 'aspirin', 'ibuprofen', 'lisinopril', 'metoprolol',
              'amlodipine', 'simvastatin', 'metformin', 'omeprazole', 'fluoxetine'
            ),
            { minLength: 2, maxLength: 5 }
          ),
          (drugs) => {
            const interactions = checkInteractions(drugs);
            
            // Should return an array
            expect(Array.isArray(interactions)).toBe(true);
            
            // If multiple interactions, should be sorted by severity (lowest level = most severe)
            if (interactions.length > 1) {
              for (let i = 0; i < interactions.length - 1; i++) {
                expect(interactions[i].severityLevel).toBeLessThanOrEqual(interactions[i + 1].severityLevel);
              }
            }
            
            // Each interaction should have required fields
            interactions.forEach(interaction => {
              expect(interaction).toHaveProperty('drug1');
              expect(interaction).toHaveProperty('drug2');
              expect(interaction).toHaveProperty('severity');
              expect(interaction).toHaveProperty('severityLevel');
            });
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('For any drug, getDrugClasses returns consistent class membership', () => {
      const drugsWithClasses = [
        { drug: 'ibuprofen', expectedClass: 'nsaid' },
        { drug: 'warfarin', expectedClass: 'anticoagulant' },
        { drug: 'lisinopril', expectedClass: 'ace_inhibitor' },
        { drug: 'metoprolol', expectedClass: 'beta_blocker' },
        { drug: 'fluoxetine', expectedClass: 'ssri' },
        { drug: 'morphine', expectedClass: 'opioid' },
        { drug: 'diazepam', expectedClass: 'benzodiazepine' }
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...drugsWithClasses),
          ({ drug, expectedClass }) => {
            const classes = getDrugClasses(drug);
            
            expect(Array.isArray(classes)).toBe(true);
            expect(classes).toContain(expectedClass);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('Drug interaction check is symmetric - order of drugs does not matter', () => {
      const drugPairs = [
        ['warfarin', 'aspirin'],
        ['lisinopril', 'spironolactone'],
        ['fluoxetine', 'tramadol'],
        ['metoprolol', 'verapamil']
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...drugPairs),
          ([drug1, drug2]) => {
            const interaction1 = checkDrugPair(drug1, drug2);
            const interaction2 = checkDrugPair(drug2, drug1);
            
            // Both should find the same interaction (or both null)
            if (interaction1 === null) {
              expect(interaction2).toBeNull();
            } else {
              expect(interaction2).not.toBeNull();
              expect(interaction1.severity).toBe(interaction2.severity);
              expect(interaction1.mechanism).toBe(interaction2.mechanism);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('For any severity level, getSeverityInfo returns valid severity details', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('contraindicated', 'major', 'moderate', 'minor'),
          (severity) => {
            const info = getSeverityInfo(severity);
            
            expect(info).not.toBeNull();
            expect(info).toHaveProperty('level');
            expect(info).toHaveProperty('name');
            expect(info).toHaveProperty('description');
            expect(info).toHaveProperty('color');
            expect(info).toHaveProperty('action');
            
            expect(typeof info.level).toBe('number');
            expect(info.level).toBeGreaterThanOrEqual(1);
            expect(info.level).toBeLessThanOrEqual(4);
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('checkNewDrugInteractions finds interactions between new drug and current medications', () => {
      fc.assert(
        fc.property(
          fc.record({
            newDrug: fc.constantFrom('warfarin', 'fluoxetine', 'lisinopril'),
            currentMeds: fc.array(
              fc.constantFrom('aspirin', 'ibuprofen', 'tramadol', 'spironolactone', 'phenelzine'),
              { minLength: 1, maxLength: 3 }
            )
          }),
          ({ newDrug, currentMeds }) => {
            const interactions = checkNewDrugInteractions(newDrug, currentMeds);
            
            expect(Array.isArray(interactions)).toBe(true);
            
            // Each interaction should involve the new drug
            interactions.forEach(interaction => {
              const involvesDrug = 
                normalizeDrugName(interaction.drug1) === normalizeDrugName(newDrug) ||
                normalizeDrugName(interaction.drug2) === normalizeDrugName(newDrug);
              expect(involvesDrug).toBe(true);
            });
          }
        ),
        { numRuns: 15 }
      );
    });
  });
  
  describe('Unit Tests for Edge Cases', () => {
    
    test('should return empty array for single drug', () => {
      const interactions = checkInteractions(['aspirin']);
      expect(interactions).toEqual([]);
    });
    
    test('should return empty array for empty drug list', () => {
      const interactions = checkInteractions([]);
      expect(interactions).toEqual([]);
    });
    
    test('should return null for same drug compared to itself', () => {
      const interaction = checkDrugPair('aspirin', 'aspirin');
      expect(interaction).toBeNull();
    });
    
    test('should handle case-insensitive drug names', () => {
      const interaction1 = checkDrugPair('WARFARIN', 'aspirin');
      const interaction2 = checkDrugPair('warfarin', 'ASPIRIN');
      const interaction3 = checkDrugPair('Warfarin', 'Aspirin');
      
      expect(interaction1).not.toBeNull();
      expect(interaction2).not.toBeNull();
      expect(interaction3).not.toBeNull();
      
      expect(interaction1.severity).toBe(interaction2.severity);
      expect(interaction2.severity).toBe(interaction3.severity);
    });
    
    test('should return null for non-interacting drugs', () => {
      const interaction = checkDrugPair('acetaminophen', 'vitamin_d');
      expect(interaction).toBeNull();
    });
    
    test('should detect contraindicated interactions', () => {
      // SSRI + MAOI is contraindicated
      const interaction = checkDrugPair('fluoxetine', 'phenelzine');
      
      expect(interaction).not.toBeNull();
      expect(interaction.severity).toBe('contraindicated');
      expect(interaction.severityLevel).toBe(1);
    });
    
    test('should detect major interactions', () => {
      // Warfarin + NSAID is major
      const interaction = checkDrugPair('warfarin', 'ibuprofen');
      
      expect(interaction).not.toBeNull();
      expect(interaction.severity).toBe('major');
      expect(interaction.severityLevel).toBe(2);
    });
    
    test('should detect class-based interactions', () => {
      // Any SSRI + any MAOI should interact
      const interaction1 = checkDrugPair('sertraline', 'tranylcypromine');
      const interaction2 = checkDrugPair('paroxetine', 'isocarboxazid');
      
      expect(interaction1).not.toBeNull();
      expect(interaction2).not.toBeNull();
      expect(interaction1.severity).toBe('contraindicated');
      expect(interaction2.severity).toBe('contraindicated');
    });
    
    test('getAllDrugClasses returns all drug classes', () => {
      const classes = getAllDrugClasses();
      
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      
      classes.forEach(drugClass => {
        expect(drugClass).toHaveProperty('id');
        expect(drugClass).toHaveProperty('name');
        expect(drugClass).toHaveProperty('drugs');
        expect(Array.isArray(drugClass.drugs)).toBe(true);
      });
    });
    
    test('getAllSeverityLevels returns all severity levels', () => {
      const levels = getAllSeverityLevels();
      
      expect(levels).toHaveProperty('contraindicated');
      expect(levels).toHaveProperty('major');
      expect(levels).toHaveProperty('moderate');
      expect(levels).toHaveProperty('minor');
    });
    
    test('searchDrugs finds drugs by partial name', () => {
      const results = searchDrugs('metop');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === 'metoprolol')).toBe(true);
    });
    
    test('hasKnownInteractions returns true for drugs with interactions', () => {
      expect(hasKnownInteractions('warfarin')).toBe(true);
      expect(hasKnownInteractions('fluoxetine')).toBe(true);
      expect(hasKnownInteractions('lisinopril')).toBe(true);
    });
    
    test('getInteractionStats returns valid statistics', () => {
      const stats = getInteractionStats();
      
      expect(stats).toHaveProperty('totalInteractions');
      expect(stats).toHaveProperty('totalDrugClasses');
      expect(stats).toHaveProperty('totalDrugs');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats).toHaveProperty('version');
      
      expect(stats.totalInteractions).toBeGreaterThan(0);
      expect(stats.totalDrugClasses).toBeGreaterThan(0);
    });
    
    test('normalizeDrugName handles various input formats', () => {
      expect(normalizeDrugName('Aspirin')).toBe('aspirin');
      expect(normalizeDrugName('WARFARIN')).toBe('warfarin');
      expect(normalizeDrugName('  lisinopril  ')).toBe('lisinopril');
      expect(normalizeDrugName('Insulin-Regular')).toBe('insulinregular');
      expect(normalizeDrugName('')).toBe('');
      expect(normalizeDrugName(null)).toBe('');
    });
  });

  describe('Property 8: Allergy Cross-Checking During Prescription', () => {
    
    // Feature: emr-clinical-features, Property 8: Allergy Cross-Checking During Prescription
    // **Validates: Requirements 5.6, 5.7**
    
    test('For any drug prescribed to a patient with a direct allergy to that drug, an alert is generated', () => {
      const drugsWithAllergies = [
        { drug: 'ibuprofen', allergen: 'ibuprofen' },
        { drug: 'aspirin', allergen: 'aspirin' },
        { drug: 'penicillin', allergen: 'penicillin' },
        { drug: 'warfarin', allergen: 'warfarin' },
        { drug: 'lisinopril', allergen: 'lisinopril' }
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...drugsWithAllergies),
          fc.constantFrom('severe', 'moderate', 'mild', 'unknown'),
          ({ drug, allergen }, severity) => {
            const allergies = [{ allergen, severity, reaction: 'Test reaction' }];
            const alerts = checkDrugAllergies(drug, allergies);
            
            // Should find an allergy alert
            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0]).toHaveProperty('type', 'allergy');
            expect(alerts[0]).toHaveProperty('drug', drug);
            expect(alerts[0]).toHaveProperty('allergen', allergen);
            expect(alerts[0]).toHaveProperty('matchType', 'direct');
            expect(alerts[0]).toHaveProperty('severity');
            expect(alerts[0]).toHaveProperty('severityLevel');
            expect(alerts[0]).toHaveProperty('alert');
          }
        ),
        { numRuns: 15 }
      );
    });
    
    test('For any drug in a class the patient is allergic to, a class-based alert is generated', () => {
      const classAllergies = [
        { drug: 'ibuprofen', allergenClass: 'nsaid' },
        { drug: 'naproxen', allergenClass: 'nsaids' },
        { drug: 'warfarin', allergenClass: 'anticoagulant' },
        { drug: 'lisinopril', allergenClass: 'ace_inhibitor' },
        { drug: 'metoprolol', allergenClass: 'beta_blocker' },
        { drug: 'fluoxetine', allergenClass: 'ssri' }
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...classAllergies),
          ({ drug, allergenClass }) => {
            const allergies = [{ allergen: allergenClass, severity: 'moderate', reaction: 'Class allergy' }];
            const alerts = checkDrugAllergies(drug, allergies);
            
            // Should find a class-based allergy alert
            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0]).toHaveProperty('type', 'allergy');
            expect(alerts[0]).toHaveProperty('drug', drug);
            expect(alerts[0]).toHaveProperty('matchType', 'class');
          }
        ),
        { numRuns: 15 }
      );
    });
    
    test('For any two drugs in the same class, allergy to one triggers cross-reactivity alert for the other', () => {
      const crossReactivityPairs = [
        { drug: 'naproxen', allergen: 'ibuprofen', class: 'nsaid' },
        { drug: 'sertraline', allergen: 'fluoxetine', class: 'ssri' },
        { drug: 'enalapril', allergen: 'lisinopril', class: 'ace_inhibitor' },
        { drug: 'atenolol', allergen: 'metoprolol', class: 'beta_blocker' },
        { drug: 'losartan', allergen: 'valsartan', class: 'arb' }
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...crossReactivityPairs),
          ({ drug, allergen }) => {
            const allergies = [{ allergen, severity: 'severe', reaction: 'Anaphylaxis' }];
            const alerts = checkDrugAllergies(drug, allergies);
            
            // Should find a cross-reactivity alert
            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0]).toHaveProperty('type', 'allergy');
            expect(alerts[0]).toHaveProperty('matchType', 'cross-reactivity');
            expect(alerts[0].matchReason).toContain('Cross-reactivity');
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('For any allergy severity, the alert contains appropriate severity information', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('severe', 'moderate', 'mild', 'unknown'),
          (severity) => {
            const allergies = [{ allergen: 'aspirin', severity, reaction: 'Test' }];
            const alerts = checkDrugAllergies('aspirin', allergies);
            
            expect(alerts.length).toBe(1);
            expect(alerts[0].severity).toBe(severity);
            expect(alerts[0].severityLevel).toBeGreaterThanOrEqual(1);
            expect(alerts[0].severityLevel).toBeLessThanOrEqual(4);
            expect(alerts[0]).toHaveProperty('severityName');
            expect(alerts[0]).toHaveProperty('severityColor');
            expect(alerts[0]).toHaveProperty('action');
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('checkPrescriptionSafety combines drug interactions and allergy checks correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            newDrug: fc.constantFrom('warfarin', 'ibuprofen', 'fluoxetine'),
            currentMeds: fc.array(
              fc.constantFrom('aspirin', 'phenelzine', 'lisinopril'),
              { minLength: 0, maxLength: 2 }
            ),
            allergies: fc.array(
              fc.record({
                allergen: fc.constantFrom('nsaid', 'aspirin', 'penicillin'),
                severity: fc.constantFrom('severe', 'moderate', 'mild'),
                reaction: fc.constant('Test reaction')
              }),
              { minLength: 0, maxLength: 2 }
            )
          }),
          ({ newDrug, currentMeds, allergies }) => {
            const result = checkPrescriptionSafety(newDrug, currentMeds, allergies);
            
            // Should return proper structure
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('interactions');
            expect(result).toHaveProperty('allergyAlerts');
            expect(result).toHaveProperty('totalAlerts');
            expect(result).toHaveProperty('requiresOverride');
            expect(result).toHaveProperty('summary');
            
            // Status should be valid
            expect(['safe', 'monitor', 'caution', 'contraindicated']).toContain(result.status);
            
            // Total alerts should match
            expect(result.totalAlerts).toBe(result.interactions.length + result.allergyAlerts.length);
            
            // Arrays should be arrays
            expect(Array.isArray(result.interactions)).toBe(true);
            expect(Array.isArray(result.allergyAlerts)).toBe(true);
          }
        ),
        { numRuns: 15 }
      );
    });
    
    test('Allergy alerts are sorted by severity (most severe first)', () => {
      const allergies = [
        { allergen: 'ibuprofen', severity: 'mild', reaction: 'Rash' },
        { allergen: 'nsaid', severity: 'severe', reaction: 'Anaphylaxis' },
        { allergen: 'aspirin', severity: 'moderate', reaction: 'Hives' }
      ];
      
      // Naproxen is an NSAID, so it should trigger multiple alerts
      const alerts = checkDrugAllergies('naproxen', allergies);
      
      // Should have alerts and be sorted by severity
      expect(alerts.length).toBeGreaterThan(0);
      
      for (let i = 0; i < alerts.length - 1; i++) {
        expect(alerts[i].severityLevel).toBeLessThanOrEqual(alerts[i + 1].severityLevel);
      }
    });
  });
  
  describe('Unit Tests for Allergy Cross-Checking', () => {
    
    test('should return empty array for null or empty allergies', () => {
      expect(checkDrugAllergies('aspirin', null)).toEqual([]);
      expect(checkDrugAllergies('aspirin', [])).toEqual([]);
      expect(checkDrugAllergies(null, [{ allergen: 'aspirin' }])).toEqual([]);
    });
    
    test('should handle case-insensitive allergen matching', () => {
      const allergies = [{ allergen: 'ASPIRIN', severity: 'severe' }];
      const alerts = checkDrugAllergies('aspirin', allergies);
      
      expect(alerts.length).toBe(1);
      expect(alerts[0].matchType).toBe('direct');
    });
    
    test('should not alert for unrelated drugs', () => {
      const allergies = [{ allergen: 'penicillin', severity: 'severe' }];
      const alerts = checkDrugAllergies('metformin', allergies);
      
      expect(alerts).toEqual([]);
    });
    
    test('checkMultipleDrugAllergies checks all drugs', () => {
      const drugs = ['aspirin', 'ibuprofen', 'metformin'];
      const allergies = [{ allergen: 'nsaid', severity: 'moderate' }];
      
      const alerts = checkMultipleDrugAllergies(drugs, allergies);
      
      // Should find alerts for aspirin and ibuprofen (both NSAIDs)
      expect(alerts.length).toBe(2);
      expect(alerts.some(a => a.drug === 'aspirin')).toBe(true);
      expect(alerts.some(a => a.drug === 'ibuprofen')).toBe(true);
    });
    
    test('checkPrescriptionSafety returns contraindicated for severe allergy', () => {
      const result = checkPrescriptionSafety(
        'aspirin',
        [],
        [{ allergen: 'aspirin', severity: 'severe', reaction: 'Anaphylaxis' }]
      );
      
      expect(result.status).toBe('contraindicated');
      expect(result.requiresOverride).toBe(true);
      expect(result.allergyAlerts.length).toBe(1);
    });
    
    test('checkPrescriptionSafety returns safe when no issues', () => {
      const result = checkPrescriptionSafety(
        'metformin',
        ['lisinopril'],
        [{ allergen: 'penicillin', severity: 'moderate' }]
      );
      
      expect(result.status).toBe('safe');
      expect(result.requiresOverride).toBe(false);
      expect(result.totalAlerts).toBe(0);
    });
    
    test('checkPrescriptionSafety detects both interactions and allergies', () => {
      const result = checkPrescriptionSafety(
        'warfarin',
        ['aspirin'],
        [{ allergen: 'anticoagulant', severity: 'mild' }]
      );
      
      // Should have both interaction (warfarin + aspirin) and allergy alert
      expect(result.interactions.length).toBeGreaterThan(0);
      expect(result.allergyAlerts.length).toBeGreaterThan(0);
    });
    
    test('getAllergySeverityInfo returns correct info for each severity', () => {
      const severe = getAllergySeverityInfo('severe');
      expect(severe.level).toBe(1);
      expect(severe.name).toBe('Severe/Anaphylaxis');
      
      const moderate = getAllergySeverityInfo('moderate');
      expect(moderate.level).toBe(2);
      
      const mild = getAllergySeverityInfo('mild');
      expect(mild.level).toBe(3);
      
      const unknown = getAllergySeverityInfo('unknown');
      expect(unknown.level).toBe(4);
    });
    
    test('getAllAllergySeverityLevels returns all levels', () => {
      const levels = getAllAllergySeverityLevels();
      
      expect(levels).toHaveProperty('severe');
      expect(levels).toHaveProperty('moderate');
      expect(levels).toHaveProperty('mild');
      expect(levels).toHaveProperty('unknown');
    });
  });
});
