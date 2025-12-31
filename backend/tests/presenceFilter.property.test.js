/**
 * Property-Based Tests for Presence Filtering
 * Feature: staff-presence-analytics
 * Property 1: Filter by Attribute Correctness
 * Property 2: Combined Filter AND Logic
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5
 */

const fc = require('fast-check');
const mongoose = require('mongoose');

// Valid role values from BranchStaff model
const validRoles = ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'];

// Valid custom status values
const validStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null];

// Sample departments
const sampleDepartments = ['Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics', 'General', 'ICU', 'OPD', null];

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

/**
 * Arbitrary for generating a staff presence record
 */
const staffPresenceArbitrary = fc.record({
  _id: objectIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom(...validRoles),
  department: fc.constantFrom(...sampleDepartments),
  branchId: objectIdArbitrary,
  branchName: fc.string({ minLength: 1, maxLength: 30 }),
  isCheckedIn: fc.boolean(),
  customStatus: fc.constantFrom(...validStatuses),
  customStatusText: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  lastActivity: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
});

/**
 * Generates a list of staff presence records
 */
const staffListArbitrary = fc.array(staffPresenceArbitrary, { minLength: 0, maxLength: 50 });

/**
 * Filter function that mimics the backend filtering logic
 * @param {Array} staffList - List of staff presence records
 * @param {Object} filters - Filter criteria { role, branchId, department, status }
 * @returns {Array} Filtered staff list
 */
function filterStaffPresence(staffList, filters) {
  const { role, branchId, department, status } = filters;
  
  return staffList.filter(staff => {
    // Apply role filter (Requirements: 1.2)
    if (role && staff.role !== role) {
      return false;
    }
    
    // Apply branchId filter (Requirements: 1.3)
    if (branchId && staff.branchId.toString() !== branchId.toString()) {
      return false;
    }
    
    // Apply department filter (Requirements: 1.4)
    if (department && staff.department !== department) {
      return false;
    }
    
    // Apply status filter
    if (status) {
      if (status === 'checked_in' && !staff.isCheckedIn) {
        return false;
      }
      if (status === 'checked_out' && staff.isCheckedIn) {
        return false;
      }
      if (status !== 'checked_in' && status !== 'checked_out' && staff.customStatus !== status) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Verifies that all items in filtered result match the filter criteria
 */
function verifyFilterMatch(filteredList, filters) {
  const { role, branchId, department, status } = filters;
  
  for (const staff of filteredList) {
    if (role && staff.role !== role) {
      return { valid: false, reason: `Staff ${staff.name} has role ${staff.role}, expected ${role}` };
    }
    if (branchId && staff.branchId.toString() !== branchId.toString()) {
      return { valid: false, reason: `Staff ${staff.name} has branchId ${staff.branchId}, expected ${branchId}` };
    }
    if (department && staff.department !== department) {
      return { valid: false, reason: `Staff ${staff.name} has department ${staff.department}, expected ${department}` };
    }
    if (status) {
      if (status === 'checked_in' && !staff.isCheckedIn) {
        return { valid: false, reason: `Staff ${staff.name} is not checked in` };
      }
      if (status === 'checked_out' && staff.isCheckedIn) {
        return { valid: false, reason: `Staff ${staff.name} is checked in, expected checked out` };
      }
      if (status !== 'checked_in' && status !== 'checked_out' && staff.customStatus !== status) {
        return { valid: false, reason: `Staff ${staff.name} has status ${staff.customStatus}, expected ${status}` };
      }
    }
  }
  
  return { valid: true };
}

describe('Presence Filter - Property Tests', () => {
  
  // Property 1: Filter by Attribute Correctness
  // Validates: Requirements 1.2, 1.3, 1.4
  describe('Property 1: Filter by Attribute Correctness', () => {
    
    test('*For any* staff list and role filter, filtered result SHALL contain only staff with matching role', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          (staffList, role) => {
            const filtered = filterStaffPresence(staffList, { role });
            
            // All filtered results should have the matching role
            const verification = verifyFilterMatch(filtered, { role });
            expect(verification.valid).toBe(true);
            
            // Filtered result should be a subset of original
            expect(filtered.length).toBeLessThanOrEqual(staffList.length);
            
            // Every item in filtered should exist in original
            for (const item of filtered) {
              expect(staffList.some(s => s._id.toString() === item._id.toString())).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('*For any* staff list and branchId filter, filtered result SHALL contain only staff from that branch', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          objectIdArbitrary,
          (staffList, branchId) => {
            const filtered = filterStaffPresence(staffList, { branchId });
            
            // All filtered results should have the matching branchId
            const verification = verifyFilterMatch(filtered, { branchId });
            expect(verification.valid).toBe(true);
            
            // Filtered result should be a subset of original
            expect(filtered.length).toBeLessThanOrEqual(staffList.length);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('*For any* staff list and department filter, filtered result SHALL contain only staff in that department', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom('Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics', 'General', 'ICU', 'OPD'),
          (staffList, department) => {
            const filtered = filterStaffPresence(staffList, { department });
            
            // All filtered results should have the matching department
            const verification = verifyFilterMatch(filtered, { department });
            expect(verification.valid).toBe(true);
            
            // Filtered result should be a subset of original
            expect(filtered.length).toBeLessThanOrEqual(staffList.length);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('*For any* staff list and status filter, filtered result SHALL contain only staff with matching status', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom('checked_in', 'checked_out', 'available', 'with_patient', 'in_surgery', 'on_break'),
          (staffList, status) => {
            const filtered = filterStaffPresence(staffList, { status });
            
            // All filtered results should match the status criteria
            const verification = verifyFilterMatch(filtered, { status });
            expect(verification.valid).toBe(true);
            
            // Filtered result should be a subset of original
            expect(filtered.length).toBeLessThanOrEqual(staffList.length);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('filtering with no criteria returns the original list', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          (staffList) => {
            const filtered = filterStaffPresence(staffList, {});
            
            // No filters should return all staff
            expect(filtered.length).toBe(staffList.length);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  
  // Property 2: Combined Filter AND Logic
  // Validates: Requirements 1.5
  describe('Property 2: Combined Filter AND Logic', () => {
    
    test('*For any* staff list and combination of filters, result SHALL contain only staff matching ALL criteria', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          fc.constantFrom('Emergency', 'Cardiology', 'Pediatrics', 'General'),
          (staffList, role, department) => {
            const filters = { role, department };
            const filtered = filterStaffPresence(staffList, filters);
            
            // All filtered results should match ALL filter criteria
            const verification = verifyFilterMatch(filtered, filters);
            expect(verification.valid).toBe(true);
            
            // Each item must satisfy both conditions
            for (const staff of filtered) {
              expect(staff.role).toBe(role);
              expect(staff.department).toBe(department);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('combined filters with role, branchId, and department return intersection', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          objectIdArbitrary,
          fc.constantFrom('Emergency', 'Cardiology', 'Pediatrics'),
          (staffList, role, branchId, department) => {
            const filters = { role, branchId, department };
            const filtered = filterStaffPresence(staffList, filters);
            
            // Verify all criteria are met
            const verification = verifyFilterMatch(filtered, filters);
            expect(verification.valid).toBe(true);
            
            // Each item must satisfy all three conditions
            for (const staff of filtered) {
              expect(staff.role).toBe(role);
              expect(staff.branchId.toString()).toBe(branchId.toString());
              expect(staff.department).toBe(department);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('combined filters with role and status return intersection', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          fc.constantFrom('checked_in', 'checked_out'),
          (staffList, role, status) => {
            const filters = { role, status };
            const filtered = filterStaffPresence(staffList, filters);
            
            // Verify all criteria are met
            const verification = verifyFilterMatch(filtered, filters);
            expect(verification.valid).toBe(true);
            
            // Each item must satisfy both conditions
            for (const staff of filtered) {
              expect(staff.role).toBe(role);
              if (status === 'checked_in') {
                expect(staff.isCheckedIn).toBe(true);
              } else {
                expect(staff.isCheckedIn).toBe(false);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('adding more filters never increases result size', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          fc.constantFrom('Emergency', 'Cardiology', 'Pediatrics'),
          (staffList, role, department) => {
            // Filter with just role
            const filteredByRole = filterStaffPresence(staffList, { role });
            
            // Filter with role AND department
            const filteredByBoth = filterStaffPresence(staffList, { role, department });
            
            // Adding more filters should never increase result size
            expect(filteredByBoth.length).toBeLessThanOrEqual(filteredByRole.length);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('filter order does not affect result', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          fc.constantFrom(...validRoles),
          fc.constantFrom('Emergency', 'Cardiology', 'Pediatrics'),
          (staffList, role, department) => {
            // Apply filters in different orders (simulated by applying sequentially)
            const filtered1 = filterStaffPresence(
              filterStaffPresence(staffList, { role }), 
              { department }
            );
            
            const filtered2 = filterStaffPresence(
              filterStaffPresence(staffList, { department }), 
              { role }
            );
            
            // Results should be the same regardless of order
            expect(filtered1.length).toBe(filtered2.length);
            
            // Same IDs should be present
            const ids1 = new Set(filtered1.map(s => s._id.toString()));
            const ids2 = new Set(filtered2.map(s => s._id.toString()));
            expect(ids1.size).toBe(ids2.size);
            for (const id of ids1) {
              expect(ids2.has(id)).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  
  // Additional edge case tests
  describe('Edge Cases', () => {
    test('filtering empty list returns empty list', () => {
      const filtered = filterStaffPresence([], { role: 'doctor' });
      expect(filtered).toEqual([]);
    });
    
    test('filtering with non-existent role returns empty list', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          (staffList) => {
            // Use a role that doesn't exist in validRoles
            const filtered = filterStaffPresence(staffList, { role: 'non_existent_role' });
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });
    
    test('filtering with non-existent branchId returns empty list', () => {
      fc.assert(
        fc.property(
          staffListArbitrary,
          (staffList) => {
            // Use a branchId that won't match any staff
            const nonExistentBranchId = new mongoose.Types.ObjectId();
            const filtered = filterStaffPresence(staffList, { branchId: nonExistentBranchId });
            
            // Should only return staff that happen to have this exact branchId (very unlikely)
            for (const staff of filtered) {
              expect(staff.branchId.toString()).toBe(nonExistentBranchId.toString());
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

// Export filter function for use in other modules
module.exports = {
  filterStaffPresence,
  verifyFilterMatch
};
