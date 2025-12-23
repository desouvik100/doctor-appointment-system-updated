/**
 * DiagnosisCoder Component
 * ICD-10 code search with autocomplete and diagnosis type selection
 * Requirements: 4.1, 4.2, 4.3, 4.7
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../api/config';
import './DiagnosisCoder.css';

// Diagnosis type options
const DIAGNOSIS_TYPES = [
  { value: 'primary', label: 'Primary', description: 'Main reason for visit', color: '#dc2626' },
  { value: 'secondary', label: 'Secondary', description: 'Contributing condition', color: '#f59e0b' },
  { value: 'differential', label: 'Differential', description: 'Possible diagnosis', color: '#6366f1' }
];

const DiagnosisCoder = ({
  visitId,
  onDiagnosisAdded,
  onCancel,
  existingDiagnoses = [],
  compact = false
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Selection state
  const [selectedCode, setSelectedCode] = useState(null);
  const [diagnosisType, setDiagnosisType] = useState('primary');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [popularCodes, setPopularCodes] = useState([]);
  
  // Refs
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Fetch popular codes on mount
  useEffect(() => {
    fetchPopularCodes();
  }, []);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPopularCodes = async () => {
    try {
      const response = await axios.get('/api/emr/icd10/popular');
      if (response.data.success && response.data.codes) {
        setPopularCodes(response.data.codes);
      }
    } catch (err) {
      console.error('Error fetching popular codes:', err);
    }
  };

  // Debounced search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setError('');
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!term.trim() || term.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);
      
      try {
        const response = await axios.get('/api/emr/icd10/search', {
          params: { q: term.trim(), limit: 15 }
        });
        
        if (response.data.success && response.data.results) {
          // Filter out already added diagnoses
          const filtered = response.data.results.filter(
            result => !existingDiagnoses.some(d => d.code === result.code)
          );
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [existingDiagnoses]);

  // Select a code from results
  const handleSelectCode = (code) => {
    setSelectedCode(code);
    setSearchTerm(`${code.code} - ${code.description}`);
    setShowResults(false);
    
    // Auto-set type based on existing diagnoses
    if (existingDiagnoses.length === 0) {
      setDiagnosisType('primary');
    } else if (!existingDiagnoses.some(d => d.type === 'primary')) {
      setDiagnosisType('primary');
    } else {
      setDiagnosisType('secondary');
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedCode(null);
    setSearchTerm('');
    setNotes('');
    setDiagnosisType('primary');
    searchInputRef.current?.focus();
  };

  // Add diagnosis
  const handleAddDiagnosis = async () => {
    if (!selectedCode) {
      setError('Please select an ICD-10 code');
      return;
    }
    
    if (!visitId) {
      setError('Visit ID is required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const diagnosisData = {
        code: selectedCode.code,
        description: selectedCode.description,
        type: diagnosisType,
        notes: notes.trim()
      };
      
      const response = await axios.post(`/api/emr/visits/${visitId}/diagnoses`, diagnosisData);
      
      if (response.data.success || response.data.visit) {
        onDiagnosisAdded?.(diagnosisData);
        handleClearSelection();
      } else {
        throw new Error(response.data.message || 'Failed to add diagnosis');
      }
    } catch (err) {
      console.error('Error adding diagnosis:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add diagnosis');
    } finally {
      setSaving(false);
    }
  };

  // Quick add from popular codes
  const handleQuickAdd = (code) => {
    if (existingDiagnoses.some(d => d.code === code.code)) {
      setError('This diagnosis has already been added');
      return;
    }
    handleSelectCode(code);
  };

  return (
    <div className={`diagnosis-coder ${compact ? 'compact' : ''}`}>
      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <label className="search-label">Search ICD-10 Codes</label>
        <div className="search-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
            placeholder="Search by code, condition, or symptom..."
            className={`search-input ${selectedCode ? 'has-selection' : ''}`}
            disabled={saving}
            aria-label="Search ICD-10 codes"
            aria-expanded={showResults}
            aria-autocomplete="list"
          />
          {searching && <span className="search-spinner">⏳</span>}
          {selectedCode && (
            <button 
              className="clear-btn"
              onClick={handleClearSelection}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="search-results" ref={resultsRef} role="listbox">
            {searching ? (
              <div className="results-loading">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, idx) => (
                <div
                  key={result.code}
                  className="result-item"
                  onClick={() => handleSelectCode(result)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectCode(result)}
                >
                  <span className="result-code">{result.code}</span>
                  <span className="result-description">{result.description}</span>
                </div>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="no-results">No matching codes found</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected Code Display */}
      {selectedCode && (
        <div className="selected-code-section">
          <div className="selected-code-card">
            <div className="code-header">
              <span className="code-badge">{selectedCode.code}</span>
              <span className="code-description">{selectedCode.description}</span>
            </div>
          </div>

          {/* Diagnosis Type Selection */}
          <div className="type-section">
            <label className="section-label">Diagnosis Type</label>
            <div className="type-options">
              {DIAGNOSIS_TYPES.map(type => (
                <button
                  key={type.value}
                  className={`type-btn ${diagnosisType === type.value ? 'selected' : ''}`}
                  onClick={() => setDiagnosisType(type.value)}
                  style={{ '--type-color': type.color }}
                  disabled={saving}
                >
                  <span className="type-label">{type.label}</span>
                  <span className="type-desc">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="notes-section">
            <label className="section-label">Clinical Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this diagnosis..."
              className="notes-input"
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="action-buttons">
            {onCancel && (
              <button
                className="cancel-btn"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <button
              className="add-btn"
              onClick={handleAddDiagnosis}
              disabled={saving || !selectedCode}
            >
              {saving ? 'Adding...' : 'Add Diagnosis'}
            </button>
          </div>
        </div>
      )}

      {/* Popular Codes (when no selection) */}
      {!selectedCode && !compact && popularCodes.length > 0 && (
        <div className="popular-section">
          <label className="section-label">Common Diagnoses</label>
          <div className="popular-codes">
            {popularCodes.slice(0, 8).map(code => (
              <button
                key={code.code}
                className={`popular-code-btn ${existingDiagnoses.some(d => d.code === code.code) ? 'disabled' : ''}`}
                onClick={() => handleQuickAdd(code)}
                disabled={existingDiagnoses.some(d => d.code === code.code)}
                title={code.description}
              >
                <span className="pop-code">{code.code}</span>
                <span className="pop-desc">{code.description.substring(0, 30)}...</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisCoder;
