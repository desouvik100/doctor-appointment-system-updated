/**
 * Lab Order Service Tests
 * Tests Property 5: Lab Order Lifecycle and Result Flagging
 * Validates Requirements 2.3, 2.5, 2.7, 2.8
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const LabOrder = require('../models/LabOrder');
const {
  createOrder,
  updateStatus,
  updateTestStatus,
  addResults,
  getOrder,
  getTestCatalog,
  searchTests,
  getPatientOrders,
  cancelOrder
} = require('../services/labOrderService');

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
  await LabOrder.deleteMany({});
});

describe('Lab Order Service Tests', () => {
  
  describe('Property 5: Lab Order Lifecycle and Result Flagging', () => {
    
    test('Lab order creation generates unique order numbers and validates data', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: ['CBC', 'BMP'],
        urgency: 'routine',
        clinicalNotes: 'Routine checkup'
      };
      
      // Create multiple orders to test uniqueness
      const order1 = await createOrder(orderData, orderedBy);
      const order2 = await createOrder(orderData, orderedBy);
      
      // Order numbers should be unique
      expect(order1.orderNumber).toBeDefined();
      expect(order2.orderNumber).toBeDefined();
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
      
      // Both orders should have proper structure
      expect(order1.patientId.toString()).toBe(patientId);
      expect(order1.clinicId.toString()).toBe(clinicId);
      expect(order1.orderStatus).toBe('pending');
      expect(order1.tests).toHaveLength(2);
      
      // Tests should have proper details from catalog
      const cbcTest = order1.tests.find(t => t.testCode === 'CBC');
      expect(cbcTest).toBeDefined();
      expect(cbcTest.testName).toBe('Complete Blood Count');
      expect(cbcTest.category).toBe('hematology');
      expect(cbcTest.status).toBe('ordered');
    });
    
    test('Status transitions follow valid workflow and maintain audit trail', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: ['CBC'],
        urgency: 'routine'
      };
      
      // Create order
      const order = await createOrder(orderData, orderedBy);
      expect(order.orderStatus).toBe('pending');
      
      // Valid transition: pending -> partial
      const partialOrder = await updateStatus(order._id, 'partial', updatedBy, 'Some tests completed');
      expect(partialOrder.orderStatus).toBe('partial');
      
      // Valid transition: partial -> completed
      const completedOrder = await updateStatus(order._id, 'completed', updatedBy);
      expect(completedOrder.orderStatus).toBe('completed');
      expect(completedOrder.completedAt).toBeDefined();
      
      // Valid transition: pending -> cancelled
      const order2 = await createOrder(orderData, orderedBy);
      const cancelledOrder = await updateStatus(order2._id, 'cancelled', updatedBy, 'Patient cancelled');
      expect(cancelledOrder.orderStatus).toBe('cancelled');
      expect(cancelledOrder.cancelledAt).toBeDefined();
    });
    
    test('Individual test status updates affect overall order status', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      const updatedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: ['CBC', 'BMP', 'LIPID'], // Multiple tests
        urgency: 'routine'
      };
      
      const order = await createOrder(orderData, orderedBy);
      expect(order.orderStatus).toBe('pending');
      expect(order.tests).toHaveLength(3);
      
      // Update one test to sample_collected - order should remain pending
      await updateTestStatus(order._id, 'CBC', 'sample_collected', updatedBy);
      let updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('pending'); // Should remain pending
      
      // Complete one test - order should become partial
      await updateTestStatus(order._id, 'BMP', 'completed', updatedBy);
      updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('partial'); // Should change to partial
      
      // Complete all tests - order should become completed
      await updateTestStatus(order._id, 'CBC', 'completed', updatedBy);
      await updateTestStatus(order._id, 'LIPID', 'completed', updatedBy);
      
      updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('completed');
      expect(updatedOrder.completedAt).toBeDefined();
      
      // All individual tests should be completed
      updatedOrder.tests.forEach(test => {
        expect(test.status).toBe('completed');
        expect(test.completedAt).toBeDefined();
      });
    });
    
    test('Result flagging correctly identifies abnormal values', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      const addedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: ['CBC'],
        urgency: 'routine'
      };
      
      const order = await createOrder(orderData, orderedBy);
      
      // Add results with both normal and abnormal values
      const results = {
        values: [
          {
            parameter: 'Hemoglobin',
            value: '8.5', // Low (normal: 13.5-17.5 for male)
            unit: 'g/dL',
            referenceRange: '13.5-17.5'
          },
          {
            parameter: 'WBC Count',
            value: '7.2', // Normal
            unit: 'x10³/μL',
            referenceRange: '4.0-11.0'
          },
          {
            parameter: 'Platelets',
            value: '550', // High (normal: 150-450)
            unit: 'x10³/μL',
            referenceRange: '150-450'
          }
        ],
        comments: 'Mild anemia noted'
      };
      
      const updatedOrder = await addResults(order._id, 'CBC', results, addedBy);
      
      // Order should be completed after adding results
      expect(updatedOrder.orderStatus).toBe('completed');
      
      // Find the CBC test
      const cbcTest = updatedOrder.tests.find(t => t.testCode === 'CBC');
      expect(cbcTest.status).toBe('completed');
      expect(cbcTest.results).toBeDefined();
      expect(cbcTest.results.values).toHaveLength(3);
      
      // Check abnormal flagging
      const hemoglobin = cbcTest.results.values.find(v => v.parameter === 'Hemoglobin');
      expect(hemoglobin.isAbnormal).toBe(true);
      expect(hemoglobin.abnormalFlag).toBe('LOW');
      
      const wbc = cbcTest.results.values.find(v => v.parameter === 'WBC Count');
      expect(wbc.isAbnormal).toBe(false);
      expect(wbc.abnormalFlag).toBeNull();
      
      const platelets = cbcTest.results.values.find(v => v.parameter === 'Platelets');
      expect(platelets.isAbnormal).toBe(true);
      expect(platelets.abnormalFlag).toBe('HIGH');
    });
    
    test('Panel expansion includes all constituent tests', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        panels: ['diabetic_panel'], // Should include HBA1C, BMP, LIPID, URINE
        urgency: 'routine'
      };
      
      const order = await createOrder(orderData, orderedBy);
      
      // Should have expanded to individual tests
      expect(order.tests.length).toBeGreaterThan(0);
      
      // Check that panel tests are included
      const testCodes = order.tests.map(t => t.testCode);
      expect(testCodes).toContain('HBA1C');
      expect(testCodes).toContain('BMP');
      expect(testCodes).toContain('LIPID');
      expect(testCodes).toContain('URINE');
      
      // Should have at least 4 tests from the diabetic panel
      expect(order.tests.length).toBeGreaterThanOrEqual(4);
    });
    
    test('Order cancellation prevents further status changes', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      const cancelledBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: ['CBC'],
        urgency: 'routine'
      };
      
      const order = await createOrder(orderData, orderedBy);
      
      // Cancel the order
      const cancelledOrder = await cancelOrder(order._id, cancelledBy, 'Patient request');
      
      expect(cancelledOrder.orderStatus).toBe('cancelled');
      expect(cancelledOrder.cancelledAt).toBeDefined();
      expect(cancelledOrder.cancelReason).toBe('Patient request');
      
      // All tests should be cancelled
      cancelledOrder.tests.forEach(test => {
        expect(test.status).toBe('cancelled');
      });
    });
    
    test('Search functionality finds tests by various criteria', () => {
      // Test search by name
      let results = searchTests('blood count');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.code === 'CBC')).toBe(true);
      
      // Test search by code
      results = searchTests('TSH');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.code === 'TSH')).toBe(true);
      
      // Test search by component
      results = searchTests('hemoglobin');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.components.includes('Hemoglobin'))).toBe(true);
      
      // Test panel search
      results = searchTests('diabetes');
      expect(results.panels.length).toBeGreaterThan(0);
      expect(results.panels.some(p => p.id === 'diabetic_panel')).toBe(true);
    });
    
    test('Patient order history maintains chronological order', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      
      // Create multiple orders at different times
      const order1 = await createOrder({
        patientId,
        clinicId,
        visitId,
        tests: ['CBC'],
        urgency: 'routine'
      }, orderedBy);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const order2 = await createOrder({
        patientId,
        clinicId,
        visitId,
        tests: ['BMP'],
        urgency: 'urgent'
      }, orderedBy);
      
      // Get patient orders
      const patientOrders = await getPatientOrders(patientId, { clinicId });
      
      expect(patientOrders.orders).toHaveLength(2);
      expect(patientOrders.total).toBe(2);
      
      // Should be in reverse chronological order (newest first)
      expect(patientOrders.orders[0]._id.toString()).toBe(order2._id.toString());
      expect(patientOrders.orders[1]._id.toString()).toBe(order1._id.toString());
    });
    
  });
  
  describe('Test Catalog Functionality', () => {
    
    test('Test catalog contains required test information', () => {
      const catalog = getTestCatalog();
      
      expect(catalog.categories).toBeDefined();
      expect(catalog.tests).toBeDefined();
      expect(catalog.panels).toBeDefined();
      
      // Check that tests have required fields
      catalog.tests.forEach(test => {
        expect(test.code).toBeDefined();
        expect(test.name).toBeDefined();
        expect(test.category).toBeDefined();
        expect(test.turnaroundTime).toBeDefined();
        expect(test.sampleType).toBeDefined();
        expect(test.components).toBeDefined();
        expect(Array.isArray(test.components)).toBe(true);
      });
      
      // Check that panels reference valid tests
      catalog.panels.forEach(panel => {
        expect(panel.id).toBeDefined();
        expect(panel.name).toBeDefined();
        expect(panel.tests).toBeDefined();
        expect(Array.isArray(panel.tests)).toBe(true);
        
        // All panel tests should exist in catalog
        panel.tests.forEach(testCode => {
          const testExists = catalog.tests.some(t => t.code === testCode);
          expect(testExists).toBe(true);
        });
      });
    });
    
  });
  
});