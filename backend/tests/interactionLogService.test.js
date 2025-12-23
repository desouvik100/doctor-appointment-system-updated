/**
 * Interaction Log Service Tests
 * Tests Property 9: Interaction Override Logging
 * Validates Requirements 5.5, 5.8
 */

const fc = require('fast-check');

// Mock the DrugInteractionLog model
jest.mock('../models/DrugInteractionLog');
const DrugInteractionLog = require('../models/DrugInteractionLog');

const {
  createInteractionLog,
  logOverride,
  logInteractionOverride,
  logAllergyOverride,
  finalizePrescription,
  getLogById,
  getLogsByVisit,
  checkOverrideStatus
} = require('../services/interactionLogService');

describe('Interaction Log Service Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 9: Interaction Override Logging', () => {
    
    // Feature: emr-clinical-features, Property 9: Interaction Override Logging
    // **Validates: Requirements 5.5, 5.8**
    
    test('For any interaction check, createInteractionLog stores all required fields', async () => {
      const testCases = [
        { patientId: 'patient1', doctorId: 'doctor1', drugs: ['aspirin'] },
        { patientId: 'patient2', doctorId: 'doctor2', drugs: ['warfarin', 'ibuprofen'] },
        { patientId: 'patient3', doctorId: 'doctor3', drugs: ['lisinopril', 'metformin', 'aspirin'] }
      ];
      
      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const mockSave = jest.fn().mockResolvedValue(true);
        const mockLog = { save: mockSave };
        DrugInteractionLog.mockImplementation(() => mockLog);
        
        const interactions = [
          { drug1: 'warfarin', drug2: 'aspirin', severity: 'major', mechanism: 'Test', clinicalEffect: 'Test', recommendation: 'Test' }
        ];
        
        await createInteractionLog({
          patientId: testCase.patientId,
          doctorId: testCase.doctorId,
          drugsPrescribed: testCase.drugs,
          existingMedications: ['metformin'],
          interactions,
          allergyAlerts: []
        });
        
        expect(DrugInteractionLog).toHaveBeenCalled();
        const constructorCall = DrugInteractionLog.mock.calls[0][0];
        
        expect(constructorCall).toHaveProperty('patientId', testCase.patientId);
        expect(constructorCall).toHaveProperty('doctorId', testCase.doctorId);
        expect(constructorCall).toHaveProperty('drugsPrescribed');
        expect(constructorCall).toHaveProperty('interactionsFound');
        expect(constructorCall).toHaveProperty('checkedAt');
        expect(mockSave).toHaveBeenCalled();
      }
    });
    
    test('For any override, logOverride requires reason and doctorId', async () => {
      const testCases = [
        { type: 'interaction', drug1: 'warfarin', drug2: 'aspirin' },
        { type: 'allergy', drug: 'aspirin', allergen: 'nsaid' }
      ];
      
      for (const testCase of testCases) {
        // Test missing reason
        await expect(logOverride({
          logId: '507f1f77bcf86cd799439011',
          type: testCase.type,
          ...testCase,
          doctorId: '507f1f77bcf86cd799439012'
          // reason missing
        })).rejects.toThrow();
        
        // Test missing doctorId
        await expect(logOverride({
          logId: '507f1f77bcf86cd799439011',
          type: testCase.type,
          ...testCase,
          reason: 'Clinical necessity'
          // doctorId missing
        })).rejects.toThrow();
      }
    });
    
    test('For any valid override, the override timestamp is recorded', async () => {
      const reasons = [
        'Clinical necessity - patient has been on this combination before',
        'Benefits outweigh risks in this case',
        'No alternative available'
      ];
      
      for (const reason of reasons) {
        jest.clearAllMocks();
        
        const mockInteraction = {
          drug1: 'warfarin',
          drug2: 'aspirin',
          severity: 'major',
          wasOverridden: false
        };
        
        const mockLog = {
          _id: '507f1f77bcf86cd799439011',
          interactionsFound: [mockInteraction],
          allergyAlerts: [],
          save: jest.fn().mockResolvedValue(true)
        };
        
        DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
        
        const beforeTime = new Date();
        
        await logInteractionOverride({
          logId: '507f1f77bcf86cd799439011',
          drug1: 'warfarin',
          drug2: 'aspirin',
          reason,
          doctorId: '507f1f77bcf86cd799439012'
        });
        
        const afterTime = new Date();
        
        expect(mockInteraction.wasOverridden).toBe(true);
        expect(mockInteraction.overrideReason).toBe(reason);
        expect(mockInteraction.overriddenAt).toBeDefined();
        expect(mockInteraction.overriddenAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(mockInteraction.overriddenAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        expect(mockInteraction.overriddenBy).toBe('507f1f77bcf86cd799439012');
      }
    });
    
    test('For any allergy override, the override details are stored correctly', async () => {
      const testCases = [
        { drug: 'aspirin', allergen: 'nsaid', reason: 'Patient tolerates aspirin well despite class allergy' },
        { drug: 'ibuprofen', allergen: 'ibuprofen', reason: 'Previous reaction was mild, benefits outweigh risks' },
        { drug: 'naproxen', allergen: 'nsaid', reason: 'No alternative pain medication available' }
      ];
      
      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const mockAlert = {
          drug: testCase.drug,
          allergen: testCase.allergen,
          wasOverridden: false
        };
        
        const mockLog = {
          _id: '507f1f77bcf86cd799439011',
          interactionsFound: [],
          allergyAlerts: [mockAlert],
          save: jest.fn().mockResolvedValue(true)
        };
        
        DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
        
        await logAllergyOverride({
          logId: '507f1f77bcf86cd799439011',
          drug: testCase.drug,
          allergen: testCase.allergen,
          reason: testCase.reason,
          doctorId: '507f1f77bcf86cd799439012'
        });
        
        expect(mockAlert.wasOverridden).toBe(true);
        expect(mockAlert.overrideReason).toBe(testCase.reason);
        expect(mockAlert.overriddenBy).toBe('507f1f77bcf86cd799439012');
      }
    });
    
    test('logOverride correctly routes to interaction or allergy override based on type', async () => {
      // Test interaction override
      const mockInteraction = { drug1: 'warfarin', drug2: 'aspirin', wasOverridden: false };
      const mockAlert = { drug: 'aspirin', allergen: 'nsaid', wasOverridden: false };
      
      let mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [{ ...mockInteraction }],
        allergyAlerts: [{ ...mockAlert }],
        save: jest.fn().mockResolvedValue(true)
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      await logOverride({
        logId: '507f1f77bcf86cd799439011',
        type: 'interaction',
        drug1: 'warfarin',
        drug2: 'aspirin',
        reason: 'Clinical necessity',
        doctorId: '507f1f77bcf86cd799439012'
      });
      
      expect(mockLog.interactionsFound[0].wasOverridden).toBe(true);
      expect(mockLog.allergyAlerts[0].wasOverridden).toBe(false);
      
      // Test allergy override
      mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [{ drug1: 'warfarin', drug2: 'aspirin', wasOverridden: false }],
        allergyAlerts: [{ drug: 'aspirin', allergen: 'nsaid', wasOverridden: false }],
        save: jest.fn().mockResolvedValue(true)
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      await logOverride({
        logId: '507f1f77bcf86cd799439011',
        type: 'allergy',
        drug: 'aspirin',
        allergen: 'nsaid',
        reason: 'Patient tolerates well',
        doctorId: '507f1f77bcf86cd799439012'
      });
      
      expect(mockLog.allergyAlerts[0].wasOverridden).toBe(true);
      expect(mockLog.interactionsFound[0].wasOverridden).toBe(false);
    });
    
    test('checkOverrideStatus correctly identifies pending critical overrides', async () => {
      const testCases = [
        { contraindicatedCount: 0, overriddenCount: 0, expectedPending: 0, hasCritical: false },
        { contraindicatedCount: 2, overriddenCount: 0, expectedPending: 2, hasCritical: true },
        { contraindicatedCount: 2, overriddenCount: 1, expectedPending: 1, hasCritical: true },
        { contraindicatedCount: 2, overriddenCount: 2, expectedPending: 0, hasCritical: true },
        { contraindicatedCount: 3, overriddenCount: 3, expectedPending: 0, hasCritical: true }
      ];
      
      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const interactions = [];
        for (let i = 0; i < testCase.contraindicatedCount; i++) {
          interactions.push({
            drug1: `drug${i}a`,
            drug2: `drug${i}b`,
            severity: 'contraindicated',
            wasOverridden: i < testCase.overriddenCount
          });
        }
        
        const mockLog = {
          _id: '507f1f77bcf86cd799439011',
          interactionsFound: interactions,
          allergyAlerts: [],
          hasCriticalAlerts: testCase.contraindicatedCount > 0
        };
        
        DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
        
        const status = await checkOverrideStatus('507f1f77bcf86cd799439011');
        
        expect(status.pendingOverrides.contraindicated).toBe(testCase.expectedPending);
        expect(status.hasCriticalAlerts).toBe(testCase.hasCritical);
        expect(status.allCriticalOverridden).toBe(testCase.expectedPending === 0);
      }
    });
    
    test('For any override, doctor ID is stored for audit trail', async () => {
      const doctorIds = [
        '507f1f77bcf86cd799439001',
        '507f1f77bcf86cd799439002',
        '507f1f77bcf86cd799439003'
      ];
      
      for (const doctorId of doctorIds) {
        jest.clearAllMocks();
        
        const mockInteraction = {
          drug1: 'warfarin',
          drug2: 'aspirin',
          severity: 'major',
          wasOverridden: false
        };
        
        const mockLog = {
          _id: '507f1f77bcf86cd799439011',
          interactionsFound: [mockInteraction],
          allergyAlerts: [],
          save: jest.fn().mockResolvedValue(true)
        };
        
        DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
        
        await logInteractionOverride({
          logId: '507f1f77bcf86cd799439011',
          drug1: 'warfarin',
          drug2: 'aspirin',
          reason: 'Clinical necessity',
          doctorId
        });
        
        expect(mockInteraction.overriddenBy).toBe(doctorId);
      }
    });
  });
  
  describe('Unit Tests for Override Logging', () => {
    
    test('createInteractionLog formats interactions correctly', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      DrugInteractionLog.mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));
      
      const interactions = [
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
          severity: 'major',
          mechanism: 'Bleeding risk',
          clinicalEffect: 'Increased bleeding',
          recommendation: 'Avoid'
        }
      ];
      
      await createInteractionLog({
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439012',
        drugsPrescribed: ['warfarin'],
        existingMedications: ['aspirin'],
        interactions,
        allergyAlerts: []
      });
      
      const constructorCall = DrugInteractionLog.mock.calls[0][0];
      expect(constructorCall.interactionsFound[0]).toMatchObject({
        drug1: 'warfarin',
        drug2: 'aspirin',
        severity: 'major',
        wasOverridden: false
      });
    });
    
    test('createInteractionLog formats allergy alerts correctly', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      DrugInteractionLog.mockImplementation((data) => ({
        ...data,
        save: mockSave
      }));
      
      const allergyAlerts = [
        {
          drug: 'aspirin',
          allergen: 'nsaid',
          matchType: 'class',
          severity: 'severe',
          patientReaction: 'Anaphylaxis'
        }
      ];
      
      await createInteractionLog({
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439012',
        drugsPrescribed: ['aspirin'],
        interactions: [],
        allergyAlerts
      });
      
      const constructorCall = DrugInteractionLog.mock.calls[0][0];
      expect(constructorCall.allergyAlerts[0]).toMatchObject({
        drug: 'aspirin',
        allergen: 'nsaid',
        matchType: 'class',
        wasOverridden: false
      });
    });
    
    test('logInteractionOverride throws if log not found', async () => {
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(null);
      
      await expect(logInteractionOverride({
        logId: '507f1f77bcf86cd799439011',
        drug1: 'warfarin',
        drug2: 'aspirin',
        reason: 'Test',
        doctorId: '507f1f77bcf86cd799439012'
      })).rejects.toThrow('Interaction log not found');
    });
    
    test('logInteractionOverride throws if interaction not found in log', async () => {
      const mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [{ drug1: 'other', drug2: 'drugs' }],
        allergyAlerts: [],
        save: jest.fn()
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      await expect(logInteractionOverride({
        logId: '507f1f77bcf86cd799439011',
        drug1: 'warfarin',
        drug2: 'aspirin',
        reason: 'Test',
        doctorId: '507f1f77bcf86cd799439012'
      })).rejects.toThrow('Interaction not found in log');
    });
    
    test('logAllergyOverride throws if allergy alert not found', async () => {
      const mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [],
        allergyAlerts: [{ drug: 'other', allergen: 'thing' }],
        save: jest.fn()
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      await expect(logAllergyOverride({
        logId: '507f1f77bcf86cd799439011',
        drug: 'aspirin',
        allergen: 'nsaid',
        reason: 'Test',
        doctorId: '507f1f77bcf86cd799439012'
      })).rejects.toThrow('Allergy alert not found in log');
    });
    
    test('logOverride throws for invalid type', async () => {
      await expect(logOverride({
        logId: '507f1f77bcf86cd799439011',
        type: 'invalid',
        reason: 'Test',
        doctorId: '507f1f77bcf86cd799439012'
      })).rejects.toThrow('Invalid override type');
    });
    
    test('finalizePrescription updates log correctly', async () => {
      const mockLog = {
        _id: '507f1f77bcf86cd799439011',
        prescriptionFinalized: false,
        save: jest.fn().mockResolvedValue(true)
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      const beforeTime = new Date();
      await finalizePrescription('507f1f77bcf86cd799439011');
      const afterTime = new Date();
      
      expect(mockLog.prescriptionFinalized).toBe(true);
      expect(mockLog.finalizedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(mockLog.finalizedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(mockLog.save).toHaveBeenCalled();
    });
    
    test('getLogById populates doctor and patient', async () => {
      const mockPopulate = jest.fn().mockReturnThis();
      DrugInteractionLog.findById = jest.fn().mockReturnValue({
        populate: mockPopulate
      });
      mockPopulate.mockReturnValueOnce({ populate: mockPopulate });
      
      await getLogById('507f1f77bcf86cd799439011');
      
      expect(DrugInteractionLog.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockPopulate).toHaveBeenCalledWith('doctorId', 'name email');
    });
    
    test('getLogsByVisit returns logs sorted by checkedAt', async () => {
      const mockSort = jest.fn().mockResolvedValue([]);
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      DrugInteractionLog.find = jest.fn().mockReturnValue({ populate: mockPopulate });
      
      await getLogsByVisit('507f1f77bcf86cd799439011');
      
      expect(DrugInteractionLog.find).toHaveBeenCalledWith({ visitId: '507f1f77bcf86cd799439011' });
      expect(mockSort).toHaveBeenCalledWith({ checkedAt: -1 });
    });
    
    test('checkOverrideStatus returns canFinalize true when no critical alerts', async () => {
      const mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [{ severity: 'moderate', wasOverridden: false }],
        allergyAlerts: [],
        hasCriticalAlerts: false
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      const status = await checkOverrideStatus('507f1f77bcf86cd799439011');
      
      expect(status.canFinalize).toBe(true);
      expect(status.hasCriticalAlerts).toBe(false);
    });
    
    test('checkOverrideStatus includes severe allergy alerts in pending count', async () => {
      const mockLog = {
        _id: '507f1f77bcf86cd799439011',
        interactionsFound: [],
        allergyAlerts: [
          { allergySeverity: 'severe', wasOverridden: false },
          { allergySeverity: 'life-threatening', wasOverridden: false },
          { allergySeverity: 'moderate', wasOverridden: false }
        ],
        hasCriticalAlerts: true
      };
      
      DrugInteractionLog.findById = jest.fn().mockResolvedValue(mockLog);
      
      const status = await checkOverrideStatus('507f1f77bcf86cd799439011');
      
      expect(status.pendingOverrides.severeAllergies).toBe(2);
      expect(status.canFinalize).toBe(false);
    });
  });
});
