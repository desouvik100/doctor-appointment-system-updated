/**
 * Property Test: Filter Clear Round-Trip
 * Property 3: For any staff list, applying any combination of filters and then clearing 
 * all filters SHALL return the original complete staff list.
 * Validates: Requirements 1.6
 */

const fc = require('fast-check');

// Mock filter functions that mirror the frontend filtering logic
const applyFilters = (staffList, filters) => {
  let filtered = [...staffList];
  
  if (filters.role) {
    filtered = filtered.filter(s => s.role === filters.role);
  }
  if (filters.branchId) {
    filtered = filtered.filter(s => s.branchId === filters.branchId);
  }
  if (filters.department) {
    filtered = filtered.filter(s => s.department === filters.department);
  }
  if (filters.status) {
    if (filters.status === 'checked_in') {
      filtered = filtered.filter(s => s.isCheckedIn === true);
    } else if (filters.status === 'checked_out') {
      filtered = filtered.filter(s => s.isCheckedIn === false);
    } else {
      filtered = filtered.filter(s => s.customStatus === filters.status);
    }
  }
  
  return filtered;
};

const clearFilters = () => ({
  role: '',
  branchId: '',
  department: '',
  status: ''
});

const hasActiveFilters = (filters) => {
  return filters.role || filters.branchId || filters.department || filters.status;
};

// Arbitraries for generating test data
const roleArbitrary = fc.constantFrom(
  'branch_admin', 'branch_manager', 'receptionist', 'doctor', 
  'nurse', 'pharmacist', 'lab_tech', 'accountant'
);

const branchIdArbitrary = fc.constantFrom('branch1', 'branch2', 'branch3', 'branch4');

const departmentArbitrary = fc.constantFrom('OPD', 'Emergency', 'Pharmacy', 'Lab', 'ICU', 'Surgery');

const customStatusArbitrary = fc.constantFrom(
  'available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null
);

const staffArbitrary = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: roleArbitrary,
  branchId: branchIdArbitrary,
  branchName: fc.string({ minLength: 1, maxLength: 30 }),
  department: fc.oneof(departmentArbitrary, fc.constant(null)),
  isCheckedIn: fc.boolean(),
  customStatus: customStatusArbitrary,
  customStatusText: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  lastActivity: fc.date()
});

const filterArbitrary = fc.record({
  role: fc.oneof(roleArbitrary, fc.constant('')),
  branchId: fc.oneof(branchIdArbitrary, fc.constant('')),
  department: fc.oneof(departmentArbitrary, fc.constant('')),
  status: fc.oneof(
    fc.constantFrom('checked_in', 'checked_out', 'available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'),
    fc.constant('')
  )
});

describe('Filter Clear Round-Trip Property Tests', () => {
  // Property 3: Filter Clear Round-Trip
  it('Property 3: Clearing filters after applying any combination returns original list', () => {
    fc.assert(
      fc.property(
        fc.array(staffArbitrary, { minLength: 0, maxLength: 50 }),
        filterArbitrary,
        (staffList, filters) => {
          // Step 1: Apply filters to get filtered list
          const filteredList = applyFilters(staffList, filters);
          
          // Step 2: Clear filters
          const clearedFilters = clearFilters();
          
          // Step 3: Apply cleared filters (should return original list)
          const restoredList = applyFilters(staffList, clearedFilters);
          
          // Property: Restored list should equal original list
          return restoredList.length === staffList.length &&
                 restoredList.every((staff, index) => staff._id === staffList[index]._id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3a: Cleared filters have no active filter values', () => {
    fc.assert(
      fc.property(
        filterArbitrary,
        (filters) => {
          // Apply any filters, then clear
          const clearedFilters = clearFilters();
          
          // Property: Cleared filters should have no active values
          return !hasActiveFilters(clearedFilters);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3b: Applying empty filters returns complete staff list', () => {
    fc.assert(
      fc.property(
        fc.array(staffArbitrary, { minLength: 0, maxLength: 50 }),
        (staffList) => {
          const emptyFilters = { role: '', branchId: '', department: '', status: '' };
          const result = applyFilters(staffList, emptyFilters);
          
          // Property: Empty filters should return all staff
          return result.length === staffList.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3c: Filter -> Clear -> Filter cycle is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(staffArbitrary, { minLength: 1, maxLength: 50 }),
        filterArbitrary,
        filterArbitrary,
        (staffList, filters1, filters2) => {
          // Apply first filter
          const filtered1 = applyFilters(staffList, filters1);
          
          // Clear filters
          const clearedFilters = clearFilters();
          const restored = applyFilters(staffList, clearedFilters);
          
          // Apply second filter
          const filtered2 = applyFilters(staffList, filters2);
          
          // Property: After clearing, applying same filter should give same result
          const filtered2Again = applyFilters(restored, filters2);
          
          return filtered2.length === filtered2Again.length &&
                 filtered2.every((staff, index) => staff._id === filtered2Again[index]._id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3d: Filtered result is always subset of original', () => {
    fc.assert(
      fc.property(
        fc.array(staffArbitrary, { minLength: 0, maxLength: 50 }),
        filterArbitrary,
        (staffList, filters) => {
          const filtered = applyFilters(staffList, filters);
          const originalIds = new Set(staffList.map(s => s._id));
          
          // Property: All filtered items must exist in original list
          return filtered.every(s => originalIds.has(s._id)) &&
                 filtered.length <= staffList.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
