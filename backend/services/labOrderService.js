/**
 * Lab Order Service
 * Handles lab test ordering, status management, and result processing
 */

const LabOrder = require('../models/LabOrder');
const labTestCatalog = require('../data/labTestCatalog.json');
const mongoose = require('mongoose');

/**
 * Get lab test catalog
 */
function getTestCatalog() {
  return labTestCatalog;
}

/**
 * Search tests by name or code
 */
function searchTests(query) {
  const searchTerm = query.toLowerCase();
  
  const matchingTests = labTestCatalog.tests.filter(test => 
    test.name.toLowerCase().includes(searchTerm) ||
    test.code.toLowerCase().includes(searchTerm) ||
    test.description.toLowerCase().includes(searchTerm) ||
    test.components.some(comp => comp.toLowerCase().includes(searchTerm))
  );
  
  const matchingPanels = labTestCatalog.panels.filter(panel =>
    panel.name.toLowerCase().includes(searchTerm) ||
    panel.description.toLowerCase().includes(searchTerm) ||
    panel.indication.toLowerCase().includes(searchTerm)
  );
  
  return {
    tests: matchingTests,
    panels: matchingPanels
  };
}

/**
 * Get test details by code
 */
function getTestByCode(code) {
  return labTestCatalog.tests.find(test => test.code === code);
}

/**
 * Get panel details by ID
 */
function getPanelById(panelId) {
  const panel = labTestCatalog.panels.find(p => p.id === panelId);
  if (!panel) return null;
  
  // Expand panel with test details
  const expandedPanel = {
    ...panel,
    testDetails: panel.tests.map(testCode => getTestByCode(testCode)).filter(Boolean)
  };
  
  return expandedPanel;
}

/**
 * Create lab order
 */
async function createOrder(orderData, orderedBy) {
  try {
    const {
      patientId,
      clinicId,
      visitId,
      tests,
      panels,
      urgency = 'routine',
      clinicalNotes,
      patientInstructions
    } = orderData;
    
    // Validate required fields
    if (!patientId || !clinicId || !visitId || (!tests?.length && !panels?.length)) {
      throw new Error('Patient ID, clinic ID, visit ID, and at least one test or panel are required');
    }
    
    // Validate urgency
    const validUrgencies = ['routine', 'urgent', 'stat'];
    if (!validUrgencies.includes(urgency)) {
      throw new Error(`Invalid urgency level: ${urgency}`);
    }
    
    // Process individual tests
    const processedTests = [];
    if (tests?.length > 0) {
      for (const testCode of tests) {
        const testDetails = getTestByCode(testCode);
        if (!testDetails) {
          throw new Error(`Invalid test code: ${testCode}`);
        }
        
        processedTests.push({
          testCode: testDetails.code,
          testName: testDetails.name,
          category: testDetails.category,
          urgency: urgency,
          status: 'ordered'
        });
      }
    }
    
    // Process panels
    if (panels?.length > 0) {
      for (const panelId of panels) {
        const panelDetails = getPanelById(panelId);
        if (!panelDetails) {
          throw new Error(`Invalid panel ID: ${panelId}`);
        }
        
        // Add all tests from the panel
        for (const testCode of panelDetails.tests) {
          const testDetails = getTestByCode(testCode);
          if (testDetails) {
            // Check if test already added individually
            const existingTest = processedTests.find(t => t.testCode === testCode);
            if (!existingTest) {
              processedTests.push({
                testCode: testDetails.code,
                testName: testDetails.name,
                category: testDetails.category,
                urgency: urgency,
                status: 'ordered',
                fromPanel: panelId
              });
            }
          }
        }
      }
    }
    
    if (processedTests.length === 0) {
      throw new Error('No valid tests found to order');
    }
    
    // Calculate expected completion time
    const maxTurnaround = Math.max(...processedTests.map(t => {
      const testDetails = getTestByCode(t.testCode);
      return testDetails.turnaroundUnit === 'hours' ? testDetails.turnaroundTime : testDetails.turnaroundTime * 24;
    }));
    
    const expectedCompletion = new Date();
    expectedCompletion.setHours(expectedCompletion.getHours() + maxTurnaround);
    
    // Create the order
    const order = new LabOrder({
      patientId,
      clinicId,
      visitId,
      tests: processedTests,
      clinicalNotes,
      patientInstructions,
      orderStatus: 'pending',
      orderedBy,
      createdBy: orderedBy,
      expectedCompletionDate: expectedCompletion
    });
    
    await order.save();
    return order;
    
  } catch (error) {
    throw new Error(`Failed to create lab order: ${error.message}`);
  }
}

/**
 * Update order status
 */
async function updateStatus(orderId, newStatus, updatedBy, notes = null) {
  try {
    const validStatuses = ['pending', 'partial', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    const order = await LabOrder.findById(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }
    
    // Update order status
    order.orderStatus = newStatus;
    order.updatedBy = updatedBy;
    
    // Set completion timestamp if completed
    if (newStatus === 'completed') {
      order.completedAt = new Date();
    } else if (newStatus === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = notes;
    }
    
    await order.save();
    return order;
    
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

/**
 * Update individual test status
 */
async function updateTestStatus(orderId, testCode, newStatus, updatedBy, notes = null) {
  try {
    const validStatuses = ['ordered', 'sample_collected', 'processing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid test status: ${newStatus}`);
    }
    
    const order = await LabOrder.findById(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }
    
    const test = order.tests.find(t => t.testCode === testCode);
    if (!test) {
      throw new Error(`Test ${testCode} not found in order`);
    }
    
    // Update test status
    test.status = newStatus;
    
    if (newStatus === 'completed') {
      test.completedAt = new Date();
    } else if (newStatus === 'sample_collected') {
      test.sampleCollectedAt = new Date();
    }
    
    // Add to test status history
    test.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      changedBy: updatedBy,
      notes
    });
    
    // Update overall order status
    order.updateOrderStatus();
    order.updatedBy = updatedBy;
    
    await order.save();
    return order;
    
  } catch (error) {
    throw new Error(`Failed to update test status: ${error.message}`);
  }
}

/**
 * Add test results
 */
async function addResults(orderId, testCode, results, addedBy) {
  try {
    const order = await LabOrder.findById(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }
    
    const test = order.tests.find(t => t.testCode === testCode);
    if (!test) {
      throw new Error(`Test ${testCode} not found in order`);
    }
    
    // Validate results structure
    if (!results.values || !Array.isArray(results.values)) {
      throw new Error('Results must contain a values array');
    }
    
    // Process result values and flag abnormal results
    const processedValues = results.values.map(value => {
      const processedValue = {
        parameter: value.parameter,
        value: value.value,
        unit: value.unit,
        referenceRange: value.referenceRange,
        isAbnormal: false,
        abnormalFlag: null
      };
      
      // Flag abnormal results based on reference ranges
      if (value.referenceRange && value.value) {
        const numericValue = parseFloat(value.value);
        if (!isNaN(numericValue)) {
          // Simple range checking (can be enhanced)
          if (value.referenceRange.includes('-')) {
            const [min, max] = value.referenceRange.split('-').map(v => parseFloat(v.trim()));
            if (!isNaN(min) && !isNaN(max)) {
              if (numericValue < min) {
                processedValue.isAbnormal = true;
                processedValue.abnormalFlag = 'LOW';
              } else if (numericValue > max) {
                processedValue.isAbnormal = true;
                processedValue.abnormalFlag = 'HIGH';
              }
            }
          }
        }
      }
      
      return processedValue;
    });
    
    // Update test with results - store in a custom results field for testing
    test.results = {
      values: processedValues,
      reportDate: new Date(),
      addedBy,
      comments: results.comments
    };
    
    // Mark test as completed if not already
    if (test.status !== 'completed') {
      test.status = 'completed';
      test.completedAt = new Date();
    }
    
    // Add to test status history
    test.statusHistory.push({
      status: 'results added',
      changedAt: new Date(),
      changedBy: addedBy,
      notes: 'Test results added'
    });
    
    // Update overall order status
    order.updateOrderStatus();
    order.updatedBy = addedBy;
    
    await order.save();
    return order;
    
  } catch (error) {
    throw new Error(`Failed to add test results: ${error.message}`);
  }
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  try {
    const order = await LabOrder.findById(orderId);
    return order;
  } catch (error) {
    throw new Error(`Failed to get lab order: ${error.message}`);
  }
}

/**
 * Get orders for patient
 */
async function getPatientOrders(patientId, options = {}) {
  try {
    const {
      clinicId,
      status,
      startDate,
      endDate,
      limit = 50,
      page = 1
    } = options;
    
    const query = { patientId, isDeleted: false };
    
    if (clinicId) query.clinicId = clinicId;
    if (status) query.orderStatus = status;
    
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }
    
    const orders = await LabOrder.find(query)
      .sort({ orderDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await LabOrder.countDocuments(query);
    
    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Failed to get patient orders: ${error.message}`);
  }
}

/**
 * Get orders for clinic
 */
async function getClinicOrders(clinicId, options = {}) {
  try {
    const {
      status,
      startDate,
      endDate,
      limit = 100,
      page = 1
    } = options;
    
    const query = { clinicId, isDeleted: false };
    
    if (status) query.orderStatus = status;
    
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }
    
    const orders = await LabOrder.find(query)
      .sort({ orderDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await LabOrder.countDocuments(query);
    
    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Failed to get clinic orders: ${error.message}`);
  }
}

/**
 * Cancel order
 */
async function cancelOrder(orderId, cancelledBy, reason) {
  try {
    const order = await LabOrder.findById(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }
    
    if (order.orderStatus === 'completed') {
      throw new Error('Cannot cancel completed order');
    }
    
    if (order.orderStatus === 'cancelled') {
      throw new Error('Order is already cancelled');
    }
    
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.updatedBy = cancelledBy;
    
    // Cancel all individual tests
    order.tests.forEach(test => {
      if (test.status !== 'completed') {
        test.status = 'cancelled';
        test.statusHistory.push({
          status: 'cancelled',
          changedAt: new Date(),
          changedBy: cancelledBy,
          notes: reason
        });
      }
    });
    
    await order.save();
    return order;
    
  } catch (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}

/**
 * Get order statistics for clinic
 */
async function getOrderStats(clinicId, startDate, endDate) {
  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    const [totalOrders, statusStats, categoryStats] = await Promise.all([
      LabOrder.countDocuments({
        clinicId,
        orderDate: { $gte: start, $lte: end },
        isDeleted: false
      }),
      LabOrder.aggregate([
        { $match: { clinicId: mongoose.Types.ObjectId(clinicId), orderDate: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      LabOrder.aggregate([
        { $match: { clinicId: mongoose.Types.ObjectId(clinicId), orderDate: { $gte: start, $lte: end }, isDeleted: false } },
        { $unwind: '$tests' },
        { $group: { _id: '$tests.category', count: { $sum: 1 } } }
      ])
    ]);
    
    return {
      totalOrders,
      statusDistribution: statusStats.map(s => ({ status: s._id, count: s.count })),
      categoryDistribution: categoryStats.map(c => ({ category: c._id, count: c.count }))
    };
  } catch (error) {
    throw new Error(`Failed to get order statistics: ${error.message}`);
  }
}

module.exports = {
  getTestCatalog,
  searchTests,
  getTestByCode,
  getPanelById,
  createOrder,
  updateStatus,
  updateTestStatus,
  addResults,
  getOrder,
  getPatientOrders,
  getClinicOrders,
  cancelOrder,
  getOrderStats
};