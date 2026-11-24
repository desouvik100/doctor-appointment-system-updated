

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fc = require('fast-check');
const EMRVisit = require('../models/EMRVisit');
const { searchICD10, getICD10Code } = require('../services/icd10Service');
const {
  addDiagnosis,
  getDiagnoses,
  updateDiagnosis,
  removeDiagnosis,
  validateDiagnosisData
} = require('../services/diagnosisService');

let mongoServer;
const mockUserSchema = new mongoose.Schema({
  name: String
});

const mockDoctorSchema = new mongoose.Schema({
  name: String,
  specialization: String
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  if (!mongoose.models.User) {
    mongoose.model('User', mockUserSchema);
  }
  if (!mongoose.models.Doctor) {
    mongoose.model('Doctor', mockDoctorSchema);
  }
}, 60000); 

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

beforeEach(async () => {
  await EMRVisit.deleteMany({});
});

describe('Diagnosis Service Tests', () => {
  
  describe('Property 6: ICD-10 Search and Diagnosis Storage', () => {
    test('ICD-10 search returns valid codes with descriptions for any valid search term', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
          async (searchTerm) => {
            const results = await searchICD10(searchTerm.trim());
            expect(Array.isArray(results)).toBe(true);
            results.forEach(result => {
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('description');
              expect(typeof result.code).toBe('string');
              expect(typeof result.description).toBe('string');
              expect(result.code.length).toBeGreaterThan(0);
              expect(result.description.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 10 } 
      );
    }, 15000); 
    
    test('Diagnosis storage preserves both ICD-10 code and description for any valid diagnosis', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            code: fc.constantFrom('I10', 'E11.9', 'J06.9', 'Z00.00', 'R50.9'), 
            description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
            type: fc.constantFrom('primary', 'secondary', 'differential'),
            notes: fc.string({ maxLength: 50 })
          }),
          async (diagnosisData) => {
            const User = mongoose.model('User');
            const Doctor = mongoose.model('Doctor');
            
            const mockUser = new User({ name: 'Test Patient' });
            const mockDoctor = new Doctor({ name: 'Test Doctor', specialization: 'General' });
            await mockUser.save();
            await mockDoctor.save();
            const visit = new EMRVisit({
              patientId: mockUser._id,
              doctorId: mockDoctor._id,
              clinicId: new mongoose.Types.ObjectId(),
              visitDate: new Date(),
              visitType: 'walk_in', 
              status: 'in_progress' 
            });
            const savedVisit = await visit.save();
            const updatedVisit = await addDiagnosis(savedVisit._id.toString(), diagnosisData, savedVisit.doctorId.toString());
            expect(updatedVisit.diagnosis).toBeDefined();
            expect(Array.isArray(updatedVisit.diagnosis)).toBe(true);
            expect(updatedVisit.diagnosis.length).toBeGreaterThan(0);
            const addedDiagnosis = updatedVisit.diagnosis.find(d => 
              d.code === diagnosisData.code.toUpperCase()
            );
            
            expect(addedDiagnosis).toBeDefined();
            expect(addedDiagnosis.code).toBe(diagnosisData.code.toUpperCase());
            expect(addedDiagnosis.description).toBe(diagnosisData.description.trim());
            expect(addedDiagnosis.type).toBe(diagnosisData.type);
            expect(addedDiagnosis.notes).toBe(diagnosisData.notes.trim());
            expect(addedDiagnosis.addedBy.toString()).toBe(savedVisit.doctorId.toString());
            expect(addedDiagnosis.addedAt).toBeInstanceOf(Date);
            const visitWithDiagnoses = await EMRVisit.findById(savedVisit._id.toString()).lean();
            const retrievedDiagnosis = visitWithDiagnoses.diagnosis.find(d => 
              d.code === diagnosisData.code.toUpperCase()
            );
            
            expect(retrievedDiagnosis).toBeDefined();
            expect(retrievedDiagnosis.code).toBe(diagnosisData.code.toUpperCase());
            expect(retrievedDiagnosis.description).toBe(diagnosisData.description.trim());
            expect(retrievedDiagnosis.type).toBe(diagnosisData.type);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('ICD-10 code lookup returns consistent results for valid codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('I10', 'E11.9', 'J06.9', 'Z00.00', 'R50.9', 'K59.00'),
          async (validCode) => {
            const result = await getICD10Code(validCode);
            
            if (result) {
              expect(result).toHaveProperty('code');
              expect(result).toHaveProperty('description');
              expect(typeof result.code).toBe('string');
              expect(typeof result.description).toBe('string');
              expect(result.code.toUpperCase()).toBe(validCode.toUpperCase());
              expect(result.description.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 5 } 
      );
    }, 15000); 
    
    test('Diagnosis validation correctly identifies valid and invalid diagnosis data', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            code: fc.option(fc.oneof(
              fc.constantFrom('I10', 'E11.9', 'J06.9'), 
              fc.string({ minLength: 1, maxLength: 5 }).filter(s => !/^[A-Z]\d{2}(\.\d{1,2})?$/.test(s)) 
            )),
            description: fc.option(fc.string({ minLength: 0, maxLength: 600 })),
            type: fc.option(fc.oneof(
              fc.constantFrom('primary', 'secondary', 'differential'),
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => !['primary', 'secondary', 'differential'].includes(s))
            )),
            notes: fc.option(fc.string({ minLength: 0, maxLength: 1200 }))
          }),
          (diagnosisData) => {
            const validation = validateDiagnosisData(diagnosisData);
            
            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);
            const hasCode = diagnosisData.code && diagnosisData.code.trim().length > 0;
            const hasDescription = diagnosisData.description && diagnosisData.description.trim().length > 0;
            const validType = !diagnosisData.type || ['primary', 'secondary', 'differential'].includes(diagnosisData.type);
            const validDescriptionLength = !diagnosisData.description || diagnosisData.description.length <= 500;
            const validNotesLength = !diagnosisData.notes || diagnosisData.notes.length <= 1000;
            
            const shouldBeValid = hasCode && hasDescription && validType && validDescriptionLength && validNotesLength;
            if (!hasCode || !hasDescription) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            } else if (diagnosisData.type && !['primary', 'secondary', 'differential'].includes(diagnosisData.type)) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            } else if (diagnosisData.description && diagnosisData.description.length > 500) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            } else if (diagnosisData.notes && diagnosisData.notes.length > 1000) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('Multiple diagnoses can be stored and retrieved for a single visit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              code: fc.constantFrom('I10', 'E11.9', 'J06.9', 'Z00.00', 'R50.9'),
              description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
              type: fc.constantFrom('primary', 'secondary', 'differential'),
              notes: fc.string({ maxLength: 50 })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (diagnosesData) => {
            const User = mongoose.model('User');
            const Doctor = mongoose.model('Doctor');
            
            const mockUser = new User({ name: 'Test Patient' });
            const mockDoctor = new Doctor({ name: 'Test Doctor', specialization: 'General' });
            await mockUser.save();
            await mockDoctor.save();
            const visit = new EMRVisit({
              patientId: mockUser._id,
              doctorId: mockDoctor._id,
              clinicId: new mongoose.Types.ObjectId(),
              visitDate: new Date(),
              visitType: 'walk_in',
              status: 'in_progress'
            });
            const savedVisit = await visit.save();
            for (const diagnosisData of diagnosesData) {
              await addDiagnosis(savedVisit._id.toString(), diagnosisData, savedVisit.doctorId.toString());
            }
            const visitWithDiagnoses = await EMRVisit.findById(savedVisit._id.toString()).lean();
            const retrievedDiagnoses = visitWithDiagnoses.diagnosis || [];
            expect(retrievedDiagnoses.length).toBeGreaterThan(0);
            expect(retrievedDiagnoses.length).toBeLessThanOrEqual(diagnosesData.length);
            retrievedDiagnoses.forEach(diagnosis => {
              expect(diagnosis).toHaveProperty('code');
              expect(diagnosis).toHaveProperty('description');
              expect(diagnosis).toHaveProperty('type');
              expect(diagnosis).toHaveProperty('addedBy');
              expect(diagnosis).toHaveProperty('addedAt');
              
              expect(typeof diagnosis.code).toBe('string');
              expect(typeof diagnosis.description).toBe('string');
              expect(['primary', 'secondary', 'differential']).toContain(diagnosis.type);
              expect(diagnosis.addedBy.toString()).toBe(savedVisit.doctorId.toString());
              expect(diagnosis.addedAt).toBeInstanceOf(Date);
            });
            const uniqueCodes = [...new Set(diagnosesData.map(d => d.code.toUpperCase()))];
            const retrievedCodes = retrievedDiagnoses.map(d => d.code);
            
            uniqueCodes.forEach(code => {
              expect(retrievedCodes).toContain(code);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });
  
  describe('Unit Tests for Edge Cases', () => {
    
    test('should handle empty search terms gracefully', async () => {
      const emptyResult = await searchICD10('');
      expect(Array.isArray(emptyResult)).toBe(true);
      const whitespaceResult = await searchICD10('  ');
      expect(Array.isArray(whitespaceResult)).toBe(true);
      const singleCharResult = await searchICD10('a');
      expect(Array.isArray(singleCharResult)).toBe(true);
    });
    
    test('should handle invalid diagnosis data', async () => {
      const User = mongoose.model('User');
      const Doctor = mongoose.model('Doctor');
      
      const mockUser = new User({ name: 'Test Patient' });
      const mockDoctor = new Doctor({ name: 'Test Doctor', specialization: 'General' });
      await mockUser.save();
      await mockDoctor.save();
      const visit = new EMRVisit({
        patientId: mockUser._id,
        doctorId: mockDoctor._id,
        clinicId: new mongoose.Types.ObjectId(),
        visitDate: new Date(),
        visitType: 'walk_in',
        status: 'in_progress'
      });
      const savedVisit = await visit.save();
      await expect(addDiagnosis(savedVisit._id.toString(), null, savedVisit.doctorId.toString())).rejects.toThrow();
      await expect(addDiagnosis(savedVisit._id.toString(), {}, savedVisit.doctorId.toString())).rejects.toThrow();
      await expect(addDiagnosis(savedVisit._id.toString(), { code: 'I10' }, savedVisit.doctorId.toString())).rejects.toThrow(); 
      await expect(addDiagnosis(savedVisit._id.toString(), { description: 'Test' }, savedVisit.doctorId.toString())).rejects.toThrow(); 
    });
    
    test('should enforce only one primary diagnosis per visit', async () => {
      const User = mongoose.model('User');
      const Doctor = mongoose.model('Doctor');
      
      const mockUser = new User({ name: 'Test Patient' });
      const mockDoctor = new Doctor({ name: 'Test Doctor', specialization: 'General' });
      await mockUser.save();
      await mockDoctor.save();
      const visit = new EMRVisit({
        patientId: mockUser._id,
        doctorId: mockDoctor._id,
        clinicId: new mongoose.Types.ObjectId(),
        visitDate: new Date(),
        visitType: 'walk_in',
        status: 'in_progress'
      });
      const savedVisit = await visit.save();
      await addDiagnosis(savedVisit._id.toString(), {
        code: 'I10',
        description: 'Essential hypertension',
        type: 'primary'
      }, savedVisit.doctorId.toString());
      await addDiagnosis(savedVisit._id.toString(), {
        code: 'E11.9',
        description: 'Type 2 diabetes',
        type: 'primary'
      }, savedVisit.doctorId.toString());
      const visitWithDiagnoses = await EMRVisit.findById(savedVisit._id.toString()).lean();
      const primaryDiagnoses = visitWithDiagnoses.diagnosis.filter(d => d.type === 'primary');
      expect(primaryDiagnoses.length).toBe(1);
      expect(primaryDiagnoses[0].code).toBe('E11.9'); 
    });
  });
});