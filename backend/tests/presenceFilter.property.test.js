

const fc = require('fast-check');
const mongoose = require('mongoose');
const validRoles = ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'];
const validStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null];
const sampleDepartments = ['Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics', 'General', 'ICU', 'OPD', null];
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

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

const staffListArbitrary = fc.array(staffPresenceArbitrary, { minLength: 0, maxLength: 50 });

function filterStaffPresence(staffList, filters) {
  const { role, branchId, department, status } = filters;
  
  return staffList.filter(staff => {
    if (role && staff.role !== role) {
      return false;
    }
    if (branchId && staff.branchId.toString() !== branchId.toString()) {
      return false;
    }
    if (department && staff.department !== department) {
      return false;
   }
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
    console.log('DEBUG: presenceFilter.property.test.js');
    }
    
    return true;
  });
}

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
  describe('Property 1: Filter by Attribute Correctness', () => {
    
    test('*For any* staff list and role filter, filtered result SHALL contain only staff with matching role', () => {
     fc.assert(
        fc.property(
          staffListArbitrary,
         fc.constantFrom(...validRoles),
         (staffList, role) => {
            const filtered = filterStaffPresence(staffList, { role });
            const verification = verifyFilterMatch(filtered, { role });
            expect(verification.valid).toBe(true);
            expect(filtered.length).toBeLessThanOrEqual(staffList.length);
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
            const verification = verifyFilterMatch(filtered, { branchId });
            expect(verification.valid).toBe(true);
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
            const verification = verifyFilterMatch(filtered, { department });
            expect(verification.valid).toBe(true);
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
            const verification = verifyFilterMatch(filtered, { status });
            expect(verification.valid).toBe(true);
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
           expect(filtered.length).toBe(staffList.length);
          }
        ),
        { numRuns: 20 }
      );
    }); 
  });
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
            const verification = verifyFilterMatch(filtered, filters);
            expect(verification.valid).toBe(true);
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
            const verification = verifyFilterMatch(filtered, filters);
           expect(verification.valid).toBe(true);
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
            const verification = verifyFilterMatch(filtered, filters);
            expect(verification.valid).toBe(true);
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
            const filteredByRole = filterStaffPresence(staffList, { role });
            const filteredByBoth = filterStaffPresence(staffList, { role, department });
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
            const filtered1 = filterStaffPresence(
              filterStaffPresence(staffList, { role }), 
              { department }
            );
            
            const filtered2 = filterStaffPresence(
              filterStaffPresence(staffList, { department }), 
              { role }
            );
            expect(filtered1.length).toBe(filtered2.length);
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
            const nonExistentBranchId = new mongoose.Types.ObjectId();
            const filtered = filterStaffPresence(staffList, { branchId: nonExistentBranchId });
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
module.exports = {
  filterStaffPresence,
  verifyFilterMatch
};
