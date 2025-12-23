/**
 * LabOrderForm Component
 * Form for ordering lab tests with searchable catalog and panel quick-select
 * Requirements: 2.1, 2.2, 2.3, 7.1, 7.2
 */

import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/config';
import './LabOrderForm.css';

// Urgency options
const URGENCY_OPTIONS = [
  { value: 'routine', label: 'Routine', description: 'Standard turnaround time', color: '#10b981' },
  { value: 'urgent', label: 'Urgent', description: 'Priority processing', color: '#f59e0b' },
  { value: 'stat', label: 'STAT', description: 'Immediate processing', color: '#ef4444' }
];

const LabOrderForm = ({ 
  patientId, 
  clinicId, 
  visitId,
  patientName,
  onSave, 
  onCancel 
}) => {
  // Catalog state
  const [catalog, setCatalog] = useState({ tests: [], panels: [], categories: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ tests: [], panels: [] });
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Order state
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [urgency, setUrgency] = useState('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [patientInstructions, setPatientInstructions] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tests'); // tests, panels

  // Fetch catalog on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const response = await axios.get('/api/emr/lab-tests/catalog');
      if (response.data.success) {
        setCatalog(response.data.catalog);
      } else if (response.data.tests) {
        // Direct catalog response
        setCatalog(response.data);
      }
    } catch (err) {
      console.error('Error fetching lab catalog:', err);
      setError('Failed to load lab test catalog');
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Search tests
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults({ tests: [], panels: [] });
      return;
    }
    
    const searchLower = term.toLowerCase();
    
    const matchingTests = catalog.tests.filter(test =>
      test.name.toLowerCase().includes(searchLower) ||
      test.code.toLowerCase().includes(searchLower) ||
      test.description?.toLowerCase().includes(searchLower) ||
      test.components?.some(comp => comp.toLowerCase().includes(searchLower))
    );
    
    const matchingPanels = catalog.panels.filter(panel =>
      panel.name.toLowerCase().includes(searchLower) ||
      panel.description?.toLowerCase().includes(searchLower) ||
      panel.indication?.toLowerCase().includes(searchLower)
    );
    
    setSearchResults({ tests: matchingTests, panels: matchingPanels });
  }, [catalog]);

  // Filter tests by category
  const getFilteredTests = () => {
    if (searchTerm.trim()) {
      return searchResults.tests;
    }
    
    if (activeCategory === 'all') {
      return catalog.tests;
    }
    
    return catalog.tests.filter(test => test.category === activeCategory);
  };

  // Toggle test selection
  const toggleTest = (test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.code === test.code);
      if (exists) {
        return prev.filter(t => t.code !== test.code);
      }
      return [...prev, test];
    });
  };

  // Toggle panel selection
  const togglePanel = (panel) => {
    setSelectedPanels(prev => {
      const exists = prev.find(p => p.id === panel.id);
      if (exists) {
        return prev.filter(p => p.id !== panel.id);
      }
      return [...prev, panel];
    });
  };

  // Check if test is selected (directly or via panel)
  const isTestSelected = (testCode) => {
    if (selectedTests.find(t => t.code === testCode)) return true;
    
    // Check if test is part of a selected panel
    for (const panel of selectedPanels) {
      if (panel.tests.includes(testCode)) return true;
    }
    
    return false;
  };

  // Get all selected test codes (including from panels)
  const getAllSelectedTestCodes = () => {
    const testCodes = new Set(selectedTests.map(t => t.code));
    
    selectedPanels.forEach(panel => {
      panel.tests.forEach(code => testCodes.add(code));
    });
    
    return Array.from(testCodes);
  };

  // Calculate estimated turnaround
  const getEstimatedTurnaround = () => {
    const allTestCodes = getAllSelectedTestCodes();
    if (allTestCodes.length === 0) return null;
    
    let maxHours = 0;
    allTestCodes.forEach(code => {
      const test = catalog.tests.find(t => t.code === code);
      if (test) {
        const hours = test.turnaroundUnit === 'hours' ? test.turnaroundTime : test.turnaroundTime * 24;
        maxHours = Math.max(maxHours, hours);
      }
    });
    
    if (maxHours < 24) {
      return `${maxHours} hours`;
    }
    return `${Math.ceil(maxHours / 24)} days`;
  };

  // Check if fasting is required
  const isFastingRequired = () => {
    const allTestCodes = getAllSelectedTestCodes();
    return allTestCodes.some(code => {
      const test = catalog.tests.find(t => t.code === code);
      return test?.fasting;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedTests.length === 0 && selectedPanels.length === 0) {
      setError('Please select at least one test or panel');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const orderData = {
        patientId,
        clinicId,
        visitId,
        tests: selectedTests.map(t => t.code),
        panels: selectedPanels.map(p => p.id),
        urgency,
        clinicalNotes,
        patientInstructions
      };
      
      const response = await axios.post('/api/emr/lab-orders', orderData);
      
      if (response.data.success || response.data.order) {
        onSave?.(response.data.order || response.data);
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating lab order:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create lab order');
    } finally {
      setSaving(false);
    }
  };

  // Remove selected test
  const removeTest = (testCode) => {
    setSelectedTests(prev => prev.filter(t => t.code !== testCode));
  };

  // Remove selected panel
  const removePanel = (panelId) => {
    setSelectedPanels(prev => prev.filter(p => p.id !== panelId));
  };

  if (loadingCatalog) {
    return (
      <div className="lab-order-form loading">
        <div className="loading-spinner"></div>
        <p>Loading lab test catalog...</p>
      </div>
    );
  }

  const filteredTests = getFilteredTests();
  const filteredPanels = searchTerm.trim() ? searchResults.panels : catalog.panels;
  const totalSelected = getAllSelectedTestCodes().length;

  return (
    <div className="lab-order-form">
      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      {/* Patient Info Header */}
      {patientName && (
        <div className="patient-header">
          <span className="patient-icon">👤</span>
          <span className="patient-name">{patientName}</span>
        </div>
      )}

      <div className="form-layout">
        {/* Left Panel - Test Selection */}
        <div className="selection-panel">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search tests by name, code, or component..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
              aria-label="Search lab tests"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => { setSearchTerm(''); setSearchResults({ tests: [], panels: [] }); }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              🧪 Individual Tests
            </button>
            <button
              className={`tab-btn ${activeTab === 'panels' ? 'active' : ''}`}
              onClick={() => setActiveTab('panels')}
            >
              📋 Test Panels
            </button>
          </div>

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div className="tests-section">
              {/* Category Filter */}
              {!searchTerm && (
                <div className="category-filter">
                  <button
                    className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                  >
                    All
                  </button>
                  {catalog.categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.id)}
                      title={cat.description}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Tests List */}
              <div className="tests-list">
                {filteredTests.length === 0 ? (
                  <p className="empty-message">
                    {searchTerm ? 'No tests found matching your search' : 'No tests available'}
                  </p>
                ) : (
                  filteredTests.map(test => (
                    <div
                      key={test.code}
                      className={`test-item ${isTestSelected(test.code) ? 'selected' : ''}`}
                      onClick={() => toggleTest(test)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isTestSelected(test.code)}
                    >
                      <div className="test-checkbox">
                        {isTestSelected(test.code) ? '✓' : ''}
                      </div>
                      <div className="test-info">
                        <div className="test-header">
                          <span className="test-code">{test.code}</span>
                          <span className="test-name">{test.name}</span>
                        </div>
                        <p className="test-description">{test.description}</p>
                        <div className="test-meta">
                          <span className="meta-item">
                            <span className="meta-icon">⏱️</span>
                            {test.turnaroundTime} {test.turnaroundUnit}
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">🩸</span>
                            {test.sampleType}
                          </span>
                          {test.fasting && (
                            <span className="meta-item fasting">
                              <span className="meta-icon">🍽️</span>
                              Fasting required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Panels Tab */}
          {activeTab === 'panels' && (
            <div className="panels-section">
              <div className="panels-list">
                {filteredPanels.length === 0 ? (
                  <p className="empty-message">
                    {searchTerm ? 'No panels found matching your search' : 'No panels available'}
                  </p>
                ) : (
                  filteredPanels.map(panel => (
                    <div
                      key={panel.id}
                      className={`panel-item ${selectedPanels.find(p => p.id === panel.id) ? 'selected' : ''}`}
                      onClick={() => togglePanel(panel)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={!!selectedPanels.find(p => p.id === panel.id)}
                    >
                      <div className="panel-checkbox">
                        {selectedPanels.find(p => p.id === panel.id) ? '✓' : ''}
                      </div>
                      <div className="panel-info">
                        <div className="panel-header">
                          <span className="panel-name">{panel.name}</span>
                          <span className="panel-test-count">{panel.tests.length} tests</span>
                        </div>
                        <p className="panel-description">{panel.description}</p>
                        <p className="panel-indication">
                          <strong>Indication:</strong> {panel.indication}
                        </p>
                        <div className="panel-tests">
                          {panel.tests.map(testCode => {
                            const test = catalog.tests.find(t => t.code === testCode);
                            return test ? (
                              <span key={testCode} className="panel-test-badge">
                                {test.code}
                              </span>
                            ) : null;
                          })}
                        </div>
                        <div className="panel-meta">
                          <span className="meta-item">
                            <span className="meta-icon">⏱️</span>
                            {panel.turnaroundTime} {panel.turnaroundUnit}
                          </span>
                          {panel.fasting && (
                            <span className="meta-item fasting">
                              <span className="meta-icon">🍽️</span>
                              Fasting required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Order Summary */}
        <div className="summary-panel">
          <h3 className="summary-title">Order Summary</h3>
          
          {/* Selected Items */}
          <div className="selected-items">
            {selectedTests.length === 0 && selectedPanels.length === 0 ? (
              <p className="empty-selection">No tests selected</p>
            ) : (
              <>
                {/* Selected Panels */}
                {selectedPanels.map(panel => (
                  <div key={panel.id} className="selected-item panel">
                    <div className="item-info">
                      <span className="item-icon">📋</span>
                      <span className="item-name">{panel.name}</span>
                      <span className="item-count">({panel.tests.length} tests)</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removePanel(panel.id)}
                      aria-label={`Remove ${panel.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {/* Selected Individual Tests */}
                {selectedTests.map(test => (
                  <div key={test.code} className="selected-item test">
                    <div className="item-info">
                      <span className="item-icon">🧪</span>
                      <span className="item-code">{test.code}</span>
                      <span className="item-name">{test.name}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeTest(test.code)}
                      aria-label={`Remove ${test.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Order Info */}
          {totalSelected > 0 && (
            <div className="order-info">
              <div className="info-row">
                <span className="info-label">Total Tests:</span>
                <span className="info-value">{totalSelected}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Est. Turnaround:</span>
                <span className="info-value">{getEstimatedTurnaround()}</span>
              </div>
              {isFastingRequired() && (
                <div className="fasting-alert">
                  <span className="alert-icon">⚠️</span>
                  <span>Fasting required for some tests</span>
                </div>
              )}
            </div>
          )}

          {/* Urgency Selection */}
          <div className="form-section">
            <label className="section-label">Urgency Level</label>
            <div className="urgency-options">
              {URGENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`urgency-btn ${urgency === opt.value ? 'selected' : ''}`}
                  onClick={() => setUrgency(opt.value)}
                  style={{ '--urgency-color': opt.color }}
                >
                  <span className="urgency-label">{opt.label}</span>
                  <span className="urgency-desc">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="form-section">
            <label className="section-label">Clinical Notes (Optional)</label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add clinical notes for the lab..."
              className="notes-input"
              rows={3}
            />
          </div>

          {/* Patient Instructions */}
          <div className="form-section">
            <label className="section-label">Patient Instructions (Optional)</label>
            <textarea
              value={patientInstructions}
              onChange={(e) => setPatientInstructions(e.target.value)}
              placeholder="Special instructions for the patient..."
              className="notes-input"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              className="cancel-btn"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={saving || totalSelected === 0}
            >
              {saving ? 'Creating Order...' : `Create Order (${totalSelected} tests)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabOrderForm;
