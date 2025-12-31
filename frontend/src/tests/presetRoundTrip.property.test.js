/**
 * Property Test: Preset Save-Load Round-Trip
 * Property 5: For any valid filter combination saved as a preset, loading that preset 
 * SHALL restore the exact same filter values that were saved.
 * Validates: Requirements 3.2
 */

const fc = require('fast-check');

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Simplified preset management functions for testing
const STORAGE_KEY = 'staffPresenceFilterPresets';

const generateId = () => {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const savePreset = (storage, name, filters) => {
  if (!name || !name.trim()) {
    return null;
  }

  const newPreset = {
    id: generateId(),
    name: name.trim(),
    filters: {
      role: filters.role || '',
      branchId: filters.branchId || '',
      department: filters.department || '',
      status: filters.status || ''
    },
    createdAt: new Date().toISOString()
  };

  const existing = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
  existing.push(newPreset);
  storage.setItem(STORAGE_KEY, JSON.stringify(existing));
  
  return newPreset;
};

const loadPreset = (storage, presetId, validBranches = [], validRoles = []) => {
  const presets = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
  const preset = presets.find(p => p.id === presetId);
  
  if (!preset) {
    return null;
  }

  // Validate and sanitize filters (Requirements: 3.5)
  const sanitizedFilters = { ...preset.filters };

  // Check if branchId still exists in valid branches
  if (sanitizedFilters.branchId && validBranches.length > 0) {
    const branchExists = validBranches.some(b => 
      b._id === sanitizedFilters.branchId || b === sanitizedFilters.branchId
    );
    if (!branchExists) {
      sanitizedFilters.branchId = '';
    }
  }

  // Check if role still exists in valid roles
  if (sanitizedFilters.role && validRoles.length > 0) {
    if (!validRoles.includes(sanitizedFilters.role)) {
      sanitizedFilters.role = '';
    }
  }

  return sanitizedFilters;
};

const deletePreset = (storage, presetId) => {
  const presets = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
  const index = presets.findIndex(p => p.id === presetId);
  
  if (index === -1) {
    return false;
  }

  presets.splice(index, 1);
  storage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return true;
};

const getPresets = (storage) => {
  return JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
};

// Arbitraries for generating test data
const roleArbitrary = fc.constantFrom(
  'branch_admin', 'branch_manager', 'receptionist', 'doctor', 
  'nurse', 'pharmacist', 'lab_tech', 'accountant'
);

const branchIdArbitrary = fc.constantFrom('branch1', 'branch2', 'branch3', 'branch4');

const departmentArbitrary = fc.constantFrom('OPD', 'Emergency', 'Pharmacy', 'Lab', 'ICU', 'Surgery');

const statusArbitrary = fc.constantFrom(
  'checked_in', 'checked_out', 'available', 'with_patient', 
  'in_surgery', 'on_break', 'in_meeting', 'unavailable'
);

const filterArbitrary = fc.record({
  role: fc.oneof(roleArbitrary, fc.constant('')),
  branchId: fc.oneof(branchIdArbitrary, fc.constant('')),
  department: fc.oneof(departmentArbitrary, fc.constant('')),
  status: fc.oneof(statusArbitrary, fc.constant(''))
});

const presetNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

describe('Preset Save-Load Round-Trip Property Tests', () => {
  let storage;

  beforeEach(() => {
    storage = new MockLocalStorage();
  });

  // Property 5: Preset Save-Load Round-Trip
  it('Property 5: Loading a saved preset restores exact filter values', () => {
    fc.assert(
      fc.property(
        presetNameArbitrary,
        filterArbitrary,
        (name, filters) => {
          storage.clear();
          
          // Save the preset
          const savedPreset = savePreset(storage, name, filters);
          
          if (!savedPreset) {
            return true; // Skip if save failed (empty name)
          }
          
          // Load the preset (without validation - all values are valid)
          const loadedFilters = loadPreset(storage, savedPreset.id);
          
          // Property: Loaded filters should exactly match saved filters
          return loadedFilters !== null &&
                 loadedFilters.role === (filters.role || '') &&
                 loadedFilters.branchId === (filters.branchId || '') &&
                 loadedFilters.department === (filters.department || '') &&
                 loadedFilters.status === (filters.status || '');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5a: Multiple presets can be saved and loaded independently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(presetNameArbitrary, filterArbitrary),
          { minLength: 1, maxLength: 10 }
        ),
        (presetsData) => {
          storage.clear();
          
          // Save all presets
          const savedPresets = presetsData.map(([name, filters]) => 
            savePreset(storage, name, filters)
          ).filter(p => p !== null);
          
          // Load each preset and verify
          return savedPresets.every((preset, index) => {
            const loadedFilters = loadPreset(storage, preset.id);
            const originalFilters = presetsData[index][1];
            
            return loadedFilters !== null &&
                   loadedFilters.role === (originalFilters.role || '') &&
                   loadedFilters.branchId === (originalFilters.branchId || '') &&
                   loadedFilters.department === (originalFilters.department || '') &&
                   loadedFilters.status === (originalFilters.status || '');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5b: Deleted presets cannot be loaded', () => {
    fc.assert(
      fc.property(
        presetNameArbitrary,
        filterArbitrary,
        (name, filters) => {
          storage.clear();
          
          // Save and then delete
          const savedPreset = savePreset(storage, name, filters);
          if (!savedPreset) return true;
          
          deletePreset(storage, savedPreset.id);
          
          // Property: Loading deleted preset should return null
          const loadedFilters = loadPreset(storage, savedPreset.id);
          return loadedFilters === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5c: Preset name is preserved after save-load', () => {
    fc.assert(
      fc.property(
        presetNameArbitrary,
        filterArbitrary,
        (name, filters) => {
          storage.clear();
          
          const savedPreset = savePreset(storage, name, filters);
          if (!savedPreset) return true;
          
          const presets = getPresets(storage);
          const foundPreset = presets.find(p => p.id === savedPreset.id);
          
          // Property: Preset name should be trimmed and preserved
          return foundPreset !== null && foundPreset.name === name.trim();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property for edge case handling (Requirements: 3.5)
  it('Property 5d: Invalid branch in preset is cleared on load', () => {
    fc.assert(
      fc.property(
        presetNameArbitrary,
        filterArbitrary,
        fc.array(branchIdArbitrary, { minLength: 0, maxLength: 3 }),
        (name, filters, validBranches) => {
          storage.clear();
          
          const savedPreset = savePreset(storage, name, filters);
          if (!savedPreset) return true;
          
          // Load with validation
          const loadedFilters = loadPreset(storage, savedPreset.id, validBranches, []);
          
          if (!loadedFilters) return true;
          
          // Property: If branchId was set but not in validBranches, it should be cleared
          if (filters.branchId && validBranches.length > 0 && !validBranches.includes(filters.branchId)) {
            return loadedFilters.branchId === '';
          }
          
          // Otherwise, branchId should be preserved
          return loadedFilters.branchId === (filters.branchId || '');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5e: Invalid role in preset is cleared on load', () => {
    fc.assert(
      fc.property(
        presetNameArbitrary,
        filterArbitrary,
        fc.array(roleArbitrary, { minLength: 0, maxLength: 3 }),
        (name, filters, validRoles) => {
          storage.clear();
          
          const savedPreset = savePreset(storage, name, filters);
          if (!savedPreset) return true;
          
          // Load with validation
          const loadedFilters = loadPreset(storage, savedPreset.id, [], validRoles);
          
          if (!loadedFilters) return true;
          
          // Property: If role was set but not in validRoles, it should be cleared
          if (filters.role && validRoles.length > 0 && !validRoles.includes(filters.role)) {
            return loadedFilters.role === '';
          }
          
          // Otherwise, role should be preserved
          return loadedFilters.role === (filters.role || '');
        }
      ),
      { numRuns: 100 }
    );
  });
});
