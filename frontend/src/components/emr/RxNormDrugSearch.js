/**
 * RxNorm Drug Search Component
 * Autocomplete drug search using RxNorm API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../api/config';
import './RxNormDrugSearch.css';

const RxNormDrugSearch = ({
  onSelect,
  placeholder = 'Search for a drug...',
  disabled = false,
  value = '',
  showValidation = true,
  className = ''
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  const searchDrugs = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/drugs/search', {
        params: { q: searchQuery, limit: 10 }
      });

      if (response.data.success) {
        setSuggestions(response.data.results || []);
      }
    } catch (error) {
      console.error('Drug search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedDrug(null);
    setValidationStatus(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchDrugs(newQuery);
    }, 300);
  };

  // Handle drug selection
  const handleSelect = async (drug) => {
    setQuery(drug.name);
    setSelectedDrug(drug);
    setSuggestions([]);
    setShowDropdown(false);

    // Validate the selected drug
    if (showValidation && drug.rxcui) {
      setValidationStatus('validating');
      try {
        const response = await axios.get('/api/drugs/validate', {
          params: { name: drug.name }
        });
        setValidationStatus(response.data.valid ? 'valid' : 'invalid');
      } catch {
        setValidationStatus('unknown');
      }
    }

    onSelect?.(drug);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <span className="validation-icon validating">⏳</span>;
      case 'valid':
        return <span className="validation-icon valid">✓</span>;
      case 'invalid':
        return <span className="validation-icon invalid">⚠️</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`rxnorm-drug-search ${className}`}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`drug-search-input ${selectedDrug ? 'has-selection' : ''}`}
          autoComplete="off"
        />
        {loading && <span className="search-spinner">🔄</span>}
        {showValidation && validationStatus && getValidationIcon()}
        {selectedDrug?.rxcui && (
          <span className="rxcui-badge" title="RxNorm Concept ID">
            RxCUI: {selectedDrug.rxcui}
          </span>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div ref={dropdownRef} className="suggestions-dropdown">
          {suggestions.map((drug, index) => (
            <div
              key={`${drug.name}-${index}`}
              className="suggestion-item"
              onClick={() => handleSelect(drug)}
            >
              <span className="drug-name">{drug.name}</span>
              {drug.rxcui && (
                <span className="drug-rxcui">RxCUI: {drug.rxcui}</span>
              )}
              {drug.className && (
                <span className="drug-class">{drug.className}</span>
              )}
            </div>
          ))}
          <div className="dropdown-footer">
            <small>Powered by NIH RxNorm API</small>
          </div>
        </div>
      )}

      {query.length > 0 && query.length < 2 && (
        <div className="search-hint">Type at least 2 characters to search</div>
      )}
    </div>
  );
};

export default RxNormDrugSearch;
