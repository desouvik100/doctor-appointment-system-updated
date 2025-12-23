/**
 * Critical Alerts Service Tests
 * Tests Property 10: Clinical Decision Support Alerts
 * Validates Requirements 9.1
 */

const fc = require('fast-check');
const {
  CRITICAL_THRESHOLDS,
  ELDERLY_HIGH_RISK_MEDICATIONS,
  generateVitalAlerts,
  checkElderlyMedicationSafety,
  escalateInteractionsForElderly,
  performClinicalCheck,
  getCriticalThresholds,
  getElderlyHighRiskMedications
} = require('../services/criticalAlertsService');

describe('Critical Alerts Service Tests', () => {
  
  describe('Property 10: Clinical Decision Support Alerts', () => {
    
    // Feature: emr-clinical-features, Property 10: Clinical Decision Support Alerts
    // **Validates: Requirements 9.1**
    
    test('For any BP >= 180/120, a hypertensive crisis alert is generated', () => {
      const criticalBPValues = [
        { systolic: 180, diastolic: 120 },
        { systolic: 200, diastolic: 130 },
        { systolic: 185, diastolic: 125 },
        { systolic: 220, diastolic: 140 }
      ];
      
      for (const bp of criticalBPValues) {
        const vitals = { bloodPressure: bp };
        const alerts = generateVitalAlerts(vitals);
        
        expect(alerts.length).toBeGreaterThan(0);
        
        const crisisAlert = alerts.find(a => 
          a.vital === 'bloodPressure' && a.severity === 'critical'
        );
        expect(crisisAlert).toBeDefined();
        expect(crisisAlert.alert).toBe('HYPERTENSIVE CRISIS');
      }
    });
    
    test('For any SpO2 < 90%, a hypoxia alert is generated', () => {
      const lowSpO2Values = [89, 88, 85, 80, 75];
      
      for (const spo2 of lowSpO2Values) {
        const vitals = { spo2: { value: spo2 } };
        const alerts = generateVitalAlerts(vitals);
        
        expect(alerts.length).toBeGreaterThan(0);
        
        const hypoxiaAlert = alerts.find(a => a.vital === 'spo2');
        expect(hypoxiaAlert).toBeDefined();
        expect(['critical', 'high']).toContain(hypoxiaAlert.severity);
      }
    });
    
    test('For any pulse >= 150 or <= 40, a critical pulse alert is generated', () => {
      const criticalPulseValues = [150, 160, 180, 200, 40, 35, 30];
      
      for (const pulse of criticalPulseValues) {
        const vitals = { pulse: { value: pulse } };
        const alerts = generateVitalAlerts(vitals);
        
        expect(alerts.length).toBeGreaterThan(0);
        
        const pulseAlert = alerts.find(a => a.vital === 'pulse');
        expect(pulseAlert).toBeDefined();
        expect(pulseAlert.severity).toBe('critical');
      }
    });
    
    test('For any temperature >= 104°F (40°C), a hyperthermia alert is generated', () => {
      const hypertemps = [
        { value: 104, unit: 'F' },
        { value: 105, unit: 'F' },
        { value: 40, unit: 'C' },
        { value: 41, unit: '°C' }
      ];
      
      for (const temp of hypertemps) {
        const vitals = { temperature: temp };
        const alerts = generateVitalAlerts(vitals);
        
        expect(alerts.length).toBeGreaterThan(0);
        
        const tempAlert = alerts.find(a => a.vital === 'temperature');
        expect(tempAlert).toBeDefined();
        expect(tempAlert.severity).toBe('critical');
        expect(tempAlert.alert).toBe('HYPERTHERMIA');
      }
    });
    
    test('For any blood sugar <= 50 or >= 400, a critical glucose alert is generated', () => {
      const criticalSugarValues = [50, 45, 40, 400, 450, 500];
      
      for (const sugar of criticalSugarValues) {
        const vitals = { bloodSugar: { value: sugar, type: 'random' } };
        const alerts = generateVitalAlerts(vitals);
        
        expect(alerts.length).toBeGreaterThan(0);
        
        const sugarAlert = alerts.find(a => a.vital === 'bloodSugar');
        expect(sugarAlert).toBeDefined();
        expect(sugarAlert.severity).toBe('critical');
      }
    });
    
    test('Alerts are sorted by severity (critical first)', () => {
      // Create vitals with multiple alerts of different severities
      const vitals = {
        bloodPressure: { systolic: 180, diastolic: 120 }, // critical
        pulse: { value: 110 }, // no alert (normal range)
        spo2: { value: 93 }, // moderate (mild hypoxia)
        temperature: { value: 102, unit: 'F' } // high (high fever)
      };
      
      const alerts = generateVitalAlerts(vitals);
      
      // Should have multiple alerts
      expect(alerts.length).toBeGreaterThan(1);
      
      // Should be sorted by severity
      const severityOrder = { critical: 1, high: 2, moderate: 3, low: 4 };
      for (let i = 0; i < alerts.length - 1; i++) {
        const currentOrder = severityOrder[alerts[i].severity] || 5;
        const nextOrder = severityOrder[alerts[i + 1].severity] || 5;
        expect(currentOrder).toBeLessThanOrEqual(nextOrder);
      }
    });
    
    test('For any elderly patient (age >= 65) on high-risk medications, safety alerts are generated', () => {
      const elderlyAges = [65, 70, 75, 80, 85];
      const highRiskMeds = ['diazepam', 'oxycodone', 'ibuprofen', 'glyburide'];
      
      for (const age of elderlyAges) {
        for (const med of highRiskMeds) {
          const alerts = checkElderlyMedicationSafety([med], age);
          
          expect(alerts.length).toBeGreaterThan(0);
          expect(alerts[0].type).toBe('elderly_safety');
          expect(alerts[0]).toHaveProperty('risk');
          expect(alerts[0]).toHaveProperty('recommendation');
        }
      }
    });
    
    test('For patients under 65, no elderly medication alerts are generated', () => {
      const youngAges = [20, 30, 40, 50, 64];
      const highRiskMeds = ['diazepam', 'oxycodone', 'ibuprofen'];
      
      for (const age of youngAges) {
        const alerts = checkElderlyMedicationSafety(highRiskMeds, age);
        expect(alerts).toEqual([]);
      }
    });
    
    test('escalateInteractionsForElderly escalates moderate to major for elderly', () => {
      const interactions = [
        { severity: 'moderate', severityLevel: 3, drug1: 'drugA', drug2: 'drugB' },
        { severity: 'major', severityLevel: 2, drug1: 'drugC', drug2: 'drugD' }
      ];
      
      const escalated = escalateInteractionsForElderly(interactions, 70);
      
      // Moderate should be escalated to major
      const formerlyModerate = escalated.find(i => i.drug1 === 'drugA');
      expect(formerlyModerate.severity).toBe('major');
      expect(formerlyModerate.elderlyEscalated).toBe(true);
      expect(formerlyModerate.originalSeverity).toBe('moderate');
      
      // Major should have elderly warning
      const majorInteraction = escalated.find(i => i.drug1 === 'drugC');
      expect(majorInteraction.elderlyWarning).toBeDefined();
    });
    
    test('performClinicalCheck returns comprehensive results', () => {
      const params = {
        vitals: {
          bloodPressure: { systolic: 185, diastolic: 125 },
          spo2: { value: 88 }
        },
        medications: ['diazepam', 'oxycodone'],
        patientAge: 72
      };
      
      const result = performClinicalCheck(params);
      
      expect(result).toHaveProperty('vitalAlerts');
      expect(result).toHaveProperty('elderlyMedicationAlerts');
      expect(result).toHaveProperty('hasCriticalAlerts');
      expect(result).toHaveProperty('hasHighAlerts');
      expect(result).toHaveProperty('summary');
      
      expect(result.hasCriticalAlerts).toBe(true);
      expect(result.vitalAlerts.length).toBeGreaterThan(0);
      expect(result.elderlyMedicationAlerts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Unit Tests for Critical Alerts', () => {
    
    test('generateVitalAlerts returns empty array for normal vitals', () => {
      const normalVitals = {
        bloodPressure: { systolic: 120, diastolic: 80 },
        pulse: { value: 72 },
        spo2: { value: 98 },
        temperature: { value: 98.6, unit: 'F' },
        respiratoryRate: { value: 16 },
        bloodSugar: { value: 100, type: 'fasting' }
      };
      
      const alerts = generateVitalAlerts(normalVitals);
      expect(alerts).toEqual([]);
    });
    
    test('generateVitalAlerts handles missing vitals gracefully', () => {
      const partialVitals = {
        bloodPressure: { systolic: 120 }
        // Missing other vitals
      };
      
      const alerts = generateVitalAlerts(partialVitals);
      expect(Array.isArray(alerts)).toBe(true);
    });
    
    test('generateVitalAlerts handles empty object', () => {
      const alerts = generateVitalAlerts({});
      expect(alerts).toEqual([]);
    });
    
    test('severe hypotension generates critical alert', () => {
      const vitals = { bloodPressure: { systolic: 75, diastolic: 45 } };
      const alerts = generateVitalAlerts(vitals);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].alert).toBe('SEVERE HYPOTENSION');
      expect(alerts[0].severity).toBe('critical');
    });
    
    test('hypothermia generates critical alert', () => {
      const vitals = { temperature: { value: 94, unit: 'F' } };
      const alerts = generateVitalAlerts(vitals);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].alert).toBe('HYPOTHERMIA');
      expect(alerts[0].severity).toBe('critical');
    });
    
    test('respiratory distress generates appropriate alerts', () => {
      // High respiratory rate
      let vitals = { respiratoryRate: { value: 32 } };
      let alerts = generateVitalAlerts(vitals);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].alert).toBe('SEVERE RESPIRATORY DISTRESS');
      
      // Low respiratory rate
      vitals = { respiratoryRate: { value: 7 } };
      alerts = generateVitalAlerts(vitals);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].alert).toBe('RESPIRATORY DEPRESSION');
    });
    
    test('checkElderlyMedicationSafety returns empty for non-high-risk meds', () => {
      const safeMeds = ['metformin', 'lisinopril', 'atorvastatin'];
      const alerts = checkElderlyMedicationSafety(safeMeds, 75);
      
      expect(alerts).toEqual([]);
    });
    
    test('checkElderlyMedicationSafety handles empty medications array', () => {
      const alerts = checkElderlyMedicationSafety([], 75);
      expect(alerts).toEqual([]);
    });
    
    test('checkElderlyMedicationSafety handles null medications', () => {
      const alerts = checkElderlyMedicationSafety(null, 75);
      expect(alerts).toEqual([]);
    });
    
    test('escalateInteractionsForElderly returns unchanged for young patients', () => {
      const interactions = [
        { severity: 'moderate', severityLevel: 3 }
      ];
      
      const result = escalateInteractionsForElderly(interactions, 50);
      
      expect(result[0].severity).toBe('moderate');
      expect(result[0].elderlyEscalated).toBeUndefined();
    });
    
    test('getCriticalThresholds returns all thresholds', () => {
      const thresholds = getCriticalThresholds();
      
      expect(thresholds).toHaveProperty('bloodPressure');
      expect(thresholds).toHaveProperty('spo2');
      expect(thresholds).toHaveProperty('pulse');
      expect(thresholds).toHaveProperty('temperature');
      expect(thresholds).toHaveProperty('respiratoryRate');
      expect(thresholds).toHaveProperty('bloodSugar');
    });
    
    test('getElderlyHighRiskMedications returns all categories', () => {
      const meds = getElderlyHighRiskMedications();
      
      expect(meds).toHaveProperty('benzodiazepines');
      expect(meds).toHaveProperty('opioids');
      expect(meds).toHaveProperty('nsaids');
      expect(meds).toHaveProperty('anticholinergics');
      
      // Each category should have drugs array
      expect(Array.isArray(meds.benzodiazepines.drugs)).toBe(true);
      expect(meds.benzodiazepines.drugs.length).toBeGreaterThan(0);
    });
    
    test('performClinicalCheck handles missing parameters', () => {
      const result = performClinicalCheck({});
      
      expect(result.vitalAlerts).toEqual([]);
      expect(result.elderlyMedicationAlerts).toEqual([]);
      expect(result.hasCriticalAlerts).toBe(false);
    });
    
    test('performClinicalCheck summary reflects alert severity', () => {
      // Critical alerts
      let result = performClinicalCheck({
        vitals: { bloodPressure: { systolic: 200, diastolic: 130 } }
      });
      expect(result.summary).toContain('CRITICAL');
      
      // High alerts only
      result = performClinicalCheck({
        vitals: { pulse: { value: 125 } }
      });
      expect(result.summary).toContain('high-priority');
      
      // No alerts
      result = performClinicalCheck({
        vitals: { pulse: { value: 72 } }
      });
      expect(result.summary).toBe('No critical alerts');
    });
    
    test('alerts include action recommendations', () => {
      const vitals = { spo2: { value: 85 } };
      const alerts = generateVitalAlerts(vitals);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('action');
      expect(alerts[0].action.length).toBeGreaterThan(0);
    });
    
    test('alerts include color coding', () => {
      const vitals = { bloodPressure: { systolic: 185, diastolic: 125 } };
      const alerts = generateVitalAlerts(vitals);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('color');
      expect(alerts[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
