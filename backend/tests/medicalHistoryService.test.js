/**
 * Medical History Service Tests
 * Tests Property 4: Medical History Data Completeness
 * Validates Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MedicalHistory = require('../models/MedicalHistory');
const {
  createOrUpdateHistory,
  getHistory,
  updateAllergies,
  updateConditions,
  getCriticalSummary,
  validateMedicalHistoryData
} = require('../services/medicalHistoryService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 60000); // 60 second timeout for MongoDB download

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

beforeEach(async () => {
  await MedicalHistory.deleteMany({});
});

describe('Medical History Service Tests', () => {
  
  describe('Property 4: Medical History Data Completeness', () => {
    
    test('Medical history creation preserves all provided data', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      const historyData = {
        allergies: [
          { allergen: 'Penicillin', type: 'drug', severity: 'severe', isActive: true },
          { allergen: 'Peanuts', type: 'food', severity: 'moderate', isActive: true }
        ],
        chronicConditions: [
          { condition: 'Diabetes Type 2', status: 'active' },
          { condition: 'Hypertension', status: 'controlled' }
        ],
        currentMedications: [
          { drugName: 'Metformin', dosage: '500mg', isActive: true },
          { drugName: 'Lisinopril', dosage: '10mg', isActive: false }
        ]
      };
      
      // Create medical history
      await createOrUpdateHistory(patientId, historyData, clinicId, updatedBy);
      
      // Retrieve the history directly from database to avoid populate issues in test
      const retrievedHistory = await MedicalHistory.findOne({ patientId, clinicId });
      
      // All provided data should be preserved
      expect(retrievedHistory).toBeTruthy();
      expect(retrievedHistory.patientId.toString()).toBe(patientId);
      expect(retrievedHistory.clinicId.toString()).toBe(clinicId);
      
      // Check allergies completeness
      expect(retrievedHistory.allergies).toHaveLength(2);
      expect(retrievedHistory.allergies[0].allergen).toBe('Penicillin');
      expect(retrievedHistory.allergies[0].type).toBe('drug');
      expect(retrievedHistory.allergies[0].severity).toBe('severe');
      expect(retrievedHistory.allergies[0].isActive).toBe(true);
      
      // Check conditions completeness
      expect(retrievedHistory.chronicConditions).toHaveLength(2);
      expect(retrievedHistory.chronicConditions[0].condition).toBe('Diabetes Type 2');
      expect(retrievedHistory.chronicConditions[0].status).toBe('active');
      
      // Check medications completeness
      expect(retrievedHistory.currentMedications).toHaveLength(2);
      expect(retrievedHistory.currentMedications[0].drugName).toBe('Metformin');
      expect(retrievedHistory.currentMedications[0].dosage).toBe('500mg');
      expect(retrievedHistory.currentMedications[0].isActive).toBe(true);
    });
    
    test('Critical summary includes only active items', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      const historyData = {
        allergies: [
          { allergen: 'Penicillin', type: 'drug', severity: 'severe', isActive: true },
          { allergen: 'Shellfish', type: 'food', severity: 'mild', isActive: false }
        ],
        chronicConditions: [
          { condition: 'Diabetes Type 2', status: 'active' },
          { condition: 'Old Fracture', status: 'resolved' }
        ],
        currentMedications: [
          { drugName: 'Metformin', dosage: '500mg', isActive: true },
          { drugName: 'Old Medicine', dosage: '10mg', isActive: false }
        ]
      };
      
      // Create history with data
      await createOrUpdateHistory(patientId, historyData, clinicId, updatedBy);
      
      // Get critical summary
      const summary = await getCriticalSummary(patientId);
      
      // Summary should include only active items
      expect(summary.allergies).toHaveLength(1);
      expect(summary.allergies[0].allergen).toBe('Penicillin');
      
      expect(summary.activeConditions).toHaveLength(1);
      expect(summary.activeConditions[0].condition).toBe('Diabetes Type 2');
      
      expect(summary.activeMedications).toHaveLength(1);
      expect(summary.activeMedications[0].drugName).toBe('Metformin');
    });
    
    test('Data validation correctly identifies invalid data', () => {
      const invalidData = {
        allergies: [
          { allergen: '', type: 'drug', severity: 'severe' }, // Missing allergen
          { allergen: 'Penicillin', type: '', severity: 'severe' }, // Missing type
          { allergen: 'Penicillin', type: 'drug', severity: '' } // Missing severity
        ],
        chronicConditions: [
          { condition: '' } // Missing condition
        ]
      };
      
      const validation = validateMedicalHistoryData(invalidData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThanOrEqual(4);
    });
    
    test('Section updates preserve existing data', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      const allergies = [
        { allergen: 'Penicillin', type: 'drug', severity: 'severe', isActive: true }
      ];
      
      const conditions = [
        { condition: 'Diabetes Type 2', status: 'active' }
      ];
      
      // Update allergies section
      await updateAllergies(patientId, allergies, updatedBy);
      
      // Update conditions section
      const historyAfterConditions = await updateConditions(patientId, conditions, updatedBy);
      
      // Both sections should be preserved
      expect(historyAfterConditions.allergies).toHaveLength(1);
      expect(historyAfterConditions.chronicConditions).toHaveLength(1);
      
      expect(historyAfterConditions.allergies[0].allergen).toBe('Penicillin');
      expect(historyAfterConditions.chronicConditions[0].condition).toBe('Diabetes Type 2');
    });
    
    test('Empty sections are handled correctly', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      // Update with empty arrays
      await updateAllergies(patientId, [], updatedBy);
      await updateConditions(patientId, [], updatedBy);
      
      const finalHistory = await MedicalHistory.findOne({ patientId });
      
      // All sections should be empty arrays, not null/undefined
      expect(finalHistory.allergies).toEqual([]);
      expect(finalHistory.chronicConditions).toEqual([]);
      
      // Critical summary should be empty
      const summary = await getCriticalSummary(patientId);
      expect(summary.allergies).toEqual([]);
      expect(summary.activeConditions).toEqual([]);
      expect(summary.activeMedications).toEqual([]);
    });
    
  });
  
});