/**
 * useFilterPresets Hook
 * Manages filter presets for staff presence widget
 * Saves/loads presets to/from localStorage
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'staffPresenceFilterPresets';

/**
 * @typedef {Object} FilterPreset
 * @property {string} id - Unique identifier
 * @property {string} name - User-defined preset name
 * @property {Object} filters - Filter values
 * @property {string} filters.role - Role filter
 * @property {string} filters.branchId - Branch filter
 * @property {string} filters.department - Department filter
 * @property {string} filters.status - Status filter
 * @property {string} createdAt - ISO timestamp
 */

/**
 * Hook for managing filter presets with localStorage persistence
 * @param {Object} options - Configuration options
 * @param {Array} options.validBranches - List of valid branch IDs for validation
 * @param {Array} options.validRoles - List of valid roles for validation
 * @returns {Object} Preset management functions and state
 */
const useFilterPresets = ({ validBranches = [], validRoles = [] } = {}) => {
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPresets(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading filter presets:', error);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      } catch (error) {
        console.error('Error saving filter presets:', error);
        // Handle localStorage quota exceeded
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Consider clearing old presets.');
        }
      }
    }
  }, [presets, isLoading]);

  /**
   * Generate unique ID for preset
   */
  const generateId = () => {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Save a new preset
   * @param {string} name - Preset name
   * @param {Object} filters - Filter values to save
   * @returns {FilterPreset|null} Created preset or null if failed
   */
  const savePreset = useCallback((name, filters) => {
    if (!name || !name.trim()) {
      console.error('Preset name is required');
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

    setPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  /**
   * Load a preset and return its filters
   * Handles edge cases for deleted branches/roles (Requirements: 3.5)
   * @param {string} presetId - ID of preset to load
   * @returns {Object|null} Filter values or null if not found
   */
  const loadPreset = useCallback((presetId) => {
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
        console.warn(`Branch ${sanitizedFilters.branchId} no longer exists, removing from filter`);
        sanitizedFilters.branchId = '';
      }
    }

    // Check if role still exists in valid roles
    if (sanitizedFilters.role && validRoles.length > 0) {
      if (!validRoles.includes(sanitizedFilters.role)) {
        console.warn(`Role ${sanitizedFilters.role} no longer exists, removing from filter`);
        sanitizedFilters.role = '';
      }
    }

    return sanitizedFilters;
  }, [presets, validBranches, validRoles]);

  /**
   * Delete a preset
   * @param {string} presetId - ID of preset to delete
   * @returns {boolean} True if deleted, false if not found
   */
  const deletePreset = useCallback((presetId) => {
    const index = presets.findIndex(p => p.id === presetId);
    if (index === -1) {
      return false;
    }

    setPresets(prev => prev.filter(p => p.id !== presetId));
    return true;
  }, [presets]);

  /**
   * Update an existing preset
   * @param {string} presetId - ID of preset to update
   * @param {Object} updates - Fields to update (name and/or filters)
   * @returns {FilterPreset|null} Updated preset or null if not found
   */
  const updatePreset = useCallback((presetId, updates) => {
    const index = presets.findIndex(p => p.id === presetId);
    if (index === -1) {
      return null;
    }

    const updatedPreset = {
      ...presets[index],
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.filters && { 
        filters: {
          ...presets[index].filters,
          ...updates.filters
        }
      })
    };

    setPresets(prev => prev.map(p => p.id === presetId ? updatedPreset : p));
    return updatedPreset;
  }, [presets]);

  /**
   * Get a preset by ID
   * @param {string} presetId - ID of preset
   * @returns {FilterPreset|null} Preset or null if not found
   */
  const getPreset = useCallback((presetId) => {
    return presets.find(p => p.id === presetId) || null;
  }, [presets]);

  /**
   * Clear all presets
   */
  const clearAllPresets = useCallback(() => {
    setPresets([]);
  }, []);

  return {
    presets,
    isLoading,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    getPreset,
    clearAllPresets
  };
};

export default useFilterPresets;
