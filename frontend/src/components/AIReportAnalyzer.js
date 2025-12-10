// frontend/src/components/AIReportAnalyzer.js
// AI-Powered Medical Report Analyzer Component

import React, { useState, useRef, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './AIReportAnalyzer.css';

const AIReportAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('diabetes');
  const [manualValues, setManualValues] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoryTests, setCategoryTests] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch tests when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchTestsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/ai-report/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTestsByCategory = async (category) => {
    try {
      const response = await axios.get(`/api/ai-report/tests-by-category/${category}`);
      if (response.data.success) {
        setCategoryTests(response.data.tests);
        // Reset manual values when category changes
        setManualValues({});
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };


  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('report', file);

      const response = await axios.post('/api/ai-report/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success('Report analyzed successfully!');
      } else if (response.data.requiresManualInput) {
        toast.error('Could not read image. Please enter values manually.');
        setActiveTab('manual');
      } else {
        toast.error(response.data.message || 'Failed to analyze report');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error('Failed to analyze report. Try entering values manually.');
      setActiveTab('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleManualValueChange = (testKey, value) => {
    setManualValues(prev => ({
      ...prev,
      [testKey]: value
    }));
  };

  const handleManualAnalysis = async () => {
    const filledValues = Object.entries(manualValues)
      .filter(([_, value]) => value !== '' && value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: parseFloat(value) }), {});

    if (Object.keys(filledValues).length === 0) {
      toast.error('Please enter at least one test value');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const endpoint = selectedCategory === 'diabetes' 
        ? '/api/ai-report/analyze-diabetes'
        : '/api/ai-report/analyze-manual';

      const response = await axios.post(endpoint, { values: filledValues });

      if (response.data.success) {
        setResults(response.data);
        toast.success('Analysis complete!');
      } else {
        toast.error(response.data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing values:', error);
      toast.error('Failed to analyze values');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      normal: '✅ All Normal',
      minor_concerns: '⚠️ Minor Concerns',
      attention_needed: '🔶 Needs Attention',
      critical: '🚨 Critical'
    };
    return labels[status] || status;
  };


  return (
    <div className="ai-report-analyzer">
      {/* Header */}
      <div className="ai-report-analyzer__header">
        <div className="ai-report-analyzer__icon">🔬</div>
        <h2 className="ai-report-analyzer__title">AI Report Analyzer</h2>
        <p className="ai-report-analyzer__subtitle">
          Upload your lab report or enter values to get instant AI-powered health insights
        </p>
      </div>

      {/* Tabs */}
      <div className="ai-report-analyzer__tabs">
        <button
          className={`ai-report-analyzer__tab ${activeTab === 'upload' ? 'ai-report-analyzer__tab--active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fas fa-camera"></i>
          Upload Report
        </button>
        <button
          className={`ai-report-analyzer__tab ${activeTab === 'manual' ? 'ai-report-analyzer__tab--active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <i className="fas fa-keyboard"></i>
          Enter Values
        </button>
      </div>

      {/* Upload Section */}
      {activeTab === 'upload' && (
        <div
          className={`ai-report-analyzer__upload ${dragOver ? 'ai-report-analyzer__upload--dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="ai-report-analyzer__upload-icon">📄</div>
          <p className="ai-report-analyzer__upload-text">
            Drop your lab report image here or click to upload
          </p>
          <p className="ai-report-analyzer__upload-hint">
            Supports: JPEG, PNG, WebP (Max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
        </div>
      )}

      {/* Manual Input Section */}
      {activeTab === 'manual' && (
        <div className="ai-report-analyzer__manual">
          <div className="ai-report-analyzer__category-select">
            <label>Select Report Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ai-report-analyzer__inputs">
            {categoryTests.map(test => (
              <div key={test.key} className="ai-report-analyzer__input-group">
                <label>{test.name}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`e.g., ${test.normalRange.split(' - ')[0]}`}
                  value={manualValues[test.key] || ''}
                  onChange={(e) => handleManualValueChange(test.key, e.target.value)}
                />
                <span className="ai-report-analyzer__input-unit">
                  {test.unit} (Normal: {test.normalRange})
                </span>
              </div>
            ))}
          </div>

          <button
            className="ai-report-analyzer__analyze-btn"
            onClick={handleManualAnalysis}
            disabled={loading || Object.keys(manualValues).length === 0}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="fas fa-brain"></i>
                Analyze Report
              </>
            )}
          </button>
        </div>
      )}


      {/* Loading State */}
      {loading && (
        <div className="ai-report-analyzer__loading">
          <div className="ai-report-analyzer__loading-spinner"></div>
          <p>Analyzing your report with AI...</p>
        </div>
      )}

      {/* Results Section */}
      {results && results.analysis && (
        <div className="ai-report-analyzer__results">
          <div className="ai-report-analyzer__results-header">
            <h3 className="ai-report-analyzer__results-title">
              <i className="fas fa-chart-bar"></i>
              Analysis Results
            </h3>
            <span className={`ai-report-analyzer__status ai-report-analyzer__status--${results.analysis.overallStatus}`}>
              {getStatusLabel(results.analysis.overallStatus)}
            </span>
          </div>

          {/* Summary */}
          {results.analysis.summary && (
            <div className="ai-report-analyzer__summary">
              {results.analysis.summary}
            </div>
          )}

          {/* Diabetes-specific results */}
          {results.diabetesStatus && (
            <div className="ai-report-analyzer__summary">
              <strong>Diabetes Status: </strong>
              <span style={{ 
                color: results.diabetesStatus === 'diabetic' ? '#dc2626' : 
                       results.diabetesStatus === 'prediabetic' ? '#d97706' : '#059669'
              }}>
                {results.diabetesStatus.toUpperCase()}
              </span>
              <p style={{ marginTop: '12px' }}>{results.interpretation}</p>
            </div>
          )}

          {/* Detected Conditions */}
          {results.analysis.detectedConditions?.length > 0 && (
            <div className="ai-report-analyzer__conditions">
              <h4 style={{ marginBottom: '12px', color: '#1e293b' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                Detected Conditions
              </h4>
              {results.analysis.detectedConditions.map((condition, idx) => (
                <div key={idx} className="ai-report-analyzer__condition">
                  <div className="ai-report-analyzer__condition-header">
                    <span className="ai-report-analyzer__condition-name">{condition.name}</span>
                    <span className={`ai-report-analyzer__condition-severity ai-report-analyzer__condition-severity--${condition.severity}`}>
                      {condition.severity.replace('_', ' ')}
                    </span>
                  </div>
                  <ul className="ai-report-analyzer__condition-recommendations">
                    {condition.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations for diabetes */}
          {results.recommendations && !results.analysis.detectedConditions?.length && (
            <div className="ai-report-analyzer__conditions">
              <h4 style={{ marginBottom: '12px', color: '#1e293b' }}>
                <i className="fas fa-lightbulb" style={{ color: '#6366f1', marginRight: '8px' }}></i>
                Recommendations
              </h4>
              <div className="ai-report-analyzer__condition">
                <ul className="ai-report-analyzer__condition-recommendations">
                  {results.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Test Results */}
          {results.analysis.tests?.length > 0 && (
            <div className="ai-report-analyzer__tests">
              <div className="ai-report-analyzer__tests-header">
                Test Results
              </div>
              {results.analysis.tests.map((test, idx) => (
                <div key={idx} className="ai-report-analyzer__test-row">
                  <span className="ai-report-analyzer__test-name">{test.name}</span>
                  <span className="ai-report-analyzer__test-value">
                    {test.value} {test.unit}
                  </span>
                  <span className="ai-report-analyzer__test-range">
                    Normal: {test.normalRange}
                  </span>
                  <span className={`ai-report-analyzer__test-status ai-report-analyzer__test-status--${test.status}`}>
                    {test.status === 'normal' ? '✓ Normal' : test.status === 'high' ? '↑ High' : '↓ Low'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIReportAnalyzer;