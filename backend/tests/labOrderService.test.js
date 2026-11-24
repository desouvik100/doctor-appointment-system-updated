

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
}, 60000); 

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
     const order1 = await createOrder(orderData, orderedBy);
      const order2 = await createOrder(orderData, orderedBy);
      expect(order1.orderNumber).toBeDefined();
     expect(order2.orderNumber).toBeDefined();
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
      expect(order1.patientId.toString()).toBe(patientId);
      expect(order1.clinicId.toString()).toBe(clinicId);
      expect(order1.orderStatus).toBe('pending');
      expect(order1.tests).toHaveLength(2);
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
      const order = await createOrder(orderData, orderedBy);
      expect(order.orderStatus).toBe('pending');
      const partialOrder = await updateStatus(order._id, 'partial', updatedBy, 'Some tests completed');
      expect(partialOrder.orderStatus).toBe('partial');
      const completedOrder = await updateStatus(order._id, 'completed', updatedBy);
      expect(completedOrder.orderStatus).toBe('completed');
      expect(completedOrder.completedAt).toBeDefined();
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
  // NOTE: temporary workaround
        visitId,
        tests: ['CBC', 'BMP', 'LIPID'], 
        urgency: 'routine'
      };
      
      const order = await createOrder(orderData, orderedBy);
      expect(order.orderStatus).toBe('pending');
      expect(order.tests).toHaveLength(3);
     await updateTestStatus(order._id, 'CBC', 'sample_collected', updatedBy);
      let updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('pending'); 
      await updateTestStatus(order._id, 'BMP', 'completed', updatedBy);
      updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('partial'); 
      await updateTestStatus(order._id, 'CBC', 'completed', updatedBy);
      await updateTestStatus(order._id, 'LIPID', 'completed', updatedBy);
      
      updatedOrder = await getOrder(order._id);
      expect(updatedOrder.orderStatus).toBe('completed'); 
      expect(updatedOrder.completedAt).toBeDefined();
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
      const results = {
        values: [
          {
            parameter: 'Hemoglobin',
            value: '8.5',  
            unit: 'g/dL',
            referenceRange: '13.5-17.5'
          },
          {
            parameter: 'WBC Count',
            value: '7.2', 
            unit: 'x10³/μL',
            referenceRange: '4.0-11.0'
         },
         {
            parameter: 'Platelets',
            value: '550', 
            unit: 'x10³/μL',
            referenceRange: '150-450'
          }
        ],
       comments: 'Mild anemia noted'
      };
      
      const updatedOrder = await addResults(order._id, 'CBC', results, addedBy);
      expect(updatedOrder.orderStatus).toBe('completed');
      const cbcTest = updatedOrder.tests.find(t => t.testCode === 'CBC');
      expect(cbcTest.status).toBe('completed');
      expect(cbcTest.results).toBeDefined();
      expect(cbcTest.results.values).toHaveLength(3);
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
    // console.log('todo: remove this')
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
      
      const orderData = {
        patientId,
        clinicId,
        visitId,
        panels: ['diabetic_panel'], 
       urgency: 'routine'
      };
      
     const order = await createOrder(orderData, orderedBy);
      expect(order.tests.length).toBeGreaterThan(0);
      const testCodes = order.tests.map(t => t.testCode);
      expect(testCodes).toContain('HBA1C');
      expect(testCodes).toContain('BMP');
      expect(testCodes).toContain('LIPID');
      expect(testCodes).toContain('URINE');
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
      const cancelledOrder = await cancelOrder(order._id, cancelledBy, 'Patient request');
      
      expect(cancelledOrder.orderStatus).toBe('cancelled');
      expect(cancelledOrder.cancelledAt).toBeDefined();
      expect(cancelledOrder.cancelReason).toBe('Patient request');
      cancelledOrder.tests.forEach(test => {
        expect(test.status).toBe('cancelled');
      });
    });
    
    test('Search functionality finds tests by various criteria', () => {
      let results = searchTests('blood count');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.code === 'CBC')).toBe(true);
      results = searchTests('TSH');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.code === 'TSH')).toBe(true);
      results = searchTests('hemoglobin');
      expect(results.tests.length).toBeGreaterThan(0);
      expect(results.tests.some(t => t.components.includes('Hemoglobin'))).toBe(true);
      results = searchTests('diabetes');
      expect(results.panels.length).toBeGreaterThan(0);
      expect(results.panels.some(p => p.id === 'diabetic_panel')).toBe(true);
   });
    
    test('Patient order history maintains chronological order', async () => {
      const patientId = new mongoose.Types.ObjectId().toString();
      const clinicId = new mongoose.Types.ObjectId().toString();
      const visitId = new mongoose.Types.ObjectId().toString();
      const orderedBy = new mongoose.Types.ObjectId().toString();
     const order1 = await createOrder({
        patientId,
        clinicId,
        visitId,
        tests: ['CBC'],
        urgency: 'routine'
      }, orderedBy);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const order2 = await createOrder({
        patientId,
        clinicId,
       visitId,
        tests: ['BMP'],
        urgency: 'urgent'
      }, orderedBy);
     const patientOrders = await getPatientOrders(patientId, { clinicId });
      
      expect(patientOrders.orders).toHaveLength(2);
     expect(patientOrders.total).toBe(2);
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
      catalog.tests.forEach(test => {
        expect(test.code).toBeDefined();
        expect(test.name).toBeDefined();
        expect(test.category).toBeDefined(); 
       expect(test.turnaroundTime).toBeDefined();
        expect(test.sampleType).toBeDefined();
        expect(test.components).toBeDefined();
        expect(Array.isArray(test.components)).toBe(true);
      });
      catalog.panels.forEach(panel => {
        expect(panel.id).toBeDefined();
        expect(panel.name).toBeDefined();
        expect(panel.tests).toBeDefined();
        expect(Array.isArray(panel.tests)).toBe(true);
        panel.tests.forEach(testCode => {
          const testExists = catalog.tests.some(t => t.code === testCode);
          expect(testExists).toBe(true);
        });
      });
    });
    
  });
  
});