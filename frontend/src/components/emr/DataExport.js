/**
 * Data Export Screen
 * Patient record PDF export and bulk export options
 * Advanced Plan Feature - Requirements: 5.6, 10.2, 10.3
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import './DataExport.css';

const EXPORT_TYPES = {
  patient_record: {
    id: 'patient_record',
    label: 'Patient Record',
    icon: '👤',
    description: 'Complete patient profile with visit history'
  },
  visit_summary: {
    id: 'visit_summary',
    label: 'Visit Summary',
    icon: '🏥',
    description: 'Summary of all visits in date range'
  },
  prescription_history: {
    id: 'prescription_history',
    label: 'Prescription History',
    icon: '💊',
    description: 'All prescriptions for a patient'
  },
  clinical_notes: {
    id: 'clinical_notes',
    label: 'Clinical Notes',
    icon: '📝',
    description: 'Doctor notes and diagnoses'
  },
  clinical_summary: {
    id: 'clinical_summary',
    label: 'Clinical Summary',
    icon: '🩺',
    description: 'Vitals, labs, diagnoses, and medical history'
  },
  bulk_patients: {
    id: 'bulk_patients',
    label: 'Bulk Patient Export',
    icon: '📦',
    description: 'Export multiple patient records'
  }
};

const DataExport = ({ clinicId }) => {
  const [exportType, setExportType] = useState('patient_record');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exportHistory, setExportHistory] = useState([]);
  const [includeOptions, setIncludeOptions] = useState({
    visitHistory: true,
    prescriptions: true,
    clinicalNotes: true,
    labReports: true,
    systematicHistory: true,
    // Clinical features
    vitals: true,
    vitalsTrends: true,
    labOrders: true,
    medicalHistory: true,
    diagnoses: true,
    drugInteractions: false
  });

  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (clinicId) {
      fetchExportHistory();
    }
  }, [clinicId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  const searchPatients = async () => {
    try {
      const response = await axios.get('/api/emr/patients/search', {
        params: { q: searchQuery, clinicId }
      });
      if (response.data.success) {
        setPatients(response.data.patients || []);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await axios.get(`/api/emr/export/${clinicId}/history`);
      if (response.data.success) {
        setExportHistory(response.data.exports || []);
      }
    } catch (err) {
      console.error('Error fetching export history:', err);
    }
  };

  const handleExport = async () => {
    if (exportType === 'bulk_patients' && selectedPatients.length === 0) {
      setError('Please select at least one patient for bulk export');
      return;
    }
    
    if (exportType !== 'bulk_patients' && !selectedPatient) {
      setError('Please select a patient');
      return;
    }

    setExporting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        exportType,
        clinicId,
        dateRange,
        includeOptions
      };

      if (exportType === 'bulk_patients') {
        payload.patientIds = selectedPatients.map(p => p._id);
      } else {
        payload.patientId = selectedPatient._id;
      }

      const response = await axios.post('/api/emr/export/generate', payload, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = exportType === 'bulk_patients' 
        ? `bulk_export_${new Date().toISOString().split('T')[0]}.pdf`
        : `${selectedPatient.name.replace(/\s+/g, '_')}_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Export generated successfully!');
      fetchExportHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate export');
    } finally {
      setExporting(false);
    }
  };

  const togglePatientSelection = (patient) => {
    setSelectedPatients(prev => {
      const exists = prev.find(p => p._id === patient._id);
      if (exists) {
        return prev.filter(p => p._id !== patient._id);
      }
      return [...prev, patient];
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="data-export">
      {/* Header */}
      <div className="export-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">📤</span>
            Data Export
          </h1>
          <p className="header-subtitle">Export patient records as PDF</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="export-content">
        {/* Export Type Selection */}
        <div className="export-section">
          <h3>Select Export Type</h3>
          <div className="export-types">
            {Object.values(EXPORT_TYPES).map((type) => (
              <button
                key={type.id}
                className={`export-type-btn ${exportType === type.id ? 'selected' : ''}`}
                onClick={() => {
                  setExportType(type.id);
                  setSelectedPatient(null);
                  setSelectedPatients([]);
                }}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-label">{type.label}</span>
                <span className="type-desc">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Selection */}
        <div className="export-section">
          <h3>
            {exportType === 'bulk_patients' ? 'Select Patients' : 'Select Patient'}
          </h3>
          <div className="patient-search">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length >= 2 && patients.length === 0 && (
              <span className="search-loading">Searching...</span>
            )}
          </div>

          {patients.length > 0 && (
            <div className="patient-results">
              {patients.map((patient) => {
                const isSelected = exportType === 'bulk_patients'
                  ? selectedPatients.some(p => p._id === patient._id)
                  : selectedPatient?._id === patient._id;

                return (
                  <div
                    key={patient._id}
                    className={`patient-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (exportType === 'bulk_patients') {
                        togglePatientSelection(patient);
                      } else {
                        setSelectedPatient(patient);
                      }
                    }}
                  >
                    <div className="patient-avatar">
                      {patient.profilePhoto ? (
                        <img src={patient.profilePhoto} alt={patient.name} />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="patient-info">
                      <span className="patient-name">{patient.name}</span>
                      <span className="patient-details">
                        {patient.phone} {patient.age && `• ${patient.age} yrs`}
                      </span>
                    </div>
                    {isSelected && <span className="check-icon">✓</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Patients for Bulk Export */}
          {exportType === 'bulk_patients' && selectedPatients.length > 0 && (
            <div className="selected-patients">
              <h4>Selected ({selectedPatients.length})</h4>
              <div className="selected-list">
                {selectedPatients.map((patient) => (
                  <span key={patient._id} className="selected-tag">
                    {patient.name}
                    <button onClick={() => togglePatientSelection(patient)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selected Patient Display */}
          {exportType !== 'bulk_patients' && selectedPatient && (
            <div className="selected-patient-card">
              <div className="patient-avatar large">
                {selectedPatient.profilePhoto ? (
                  <img src={selectedPatient.profilePhoto} alt={selectedPatient.name} />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="patient-info">
                <h4>{selectedPatient.name}</h4>
                <p>{selectedPatient.phone}</p>
                {selectedPatient.email && <p>{selectedPatient.email}</p>}
              </div>
              <button 
                className="btn-change"
                onClick={() => setSelectedPatient(null)}
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="export-section">
          <h3>Date Range</h3>
          <div className="date-range">
            <div className="date-input">
              <label>From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="date-input">
              <label>To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Include Options */}
        <div className="export-section">
          <h3>Include in Export</h3>
          <div className="include-options">
            <div className="options-group">
              <h4>Basic Information</h4>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.visitHistory}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, visitHistory: e.target.checked })}
                />
                <span className="checkbox-label">📅 Visit History</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.prescriptions}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, prescriptions: e.target.checked })}
                />
                <span className="checkbox-label">💊 Prescriptions</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.clinicalNotes}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, clinicalNotes: e.target.checked })}
                />
                <span className="checkbox-label">📝 Clinical Notes</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.systematicHistory}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, systematicHistory: e.target.checked })}
                />
                <span className="checkbox-label">📋 Systematic History</span>
              </label>
            </div>
            
            <div className="options-group">
              <h4>Clinical Features</h4>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.vitals}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, vitals: e.target.checked })}
                />
                <span className="checkbox-label">❤️ Vitals Records</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.vitalsTrends}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, vitalsTrends: e.target.checked })}
                />
                <span className="checkbox-label">📈 Vitals Trends</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.labOrders}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, labOrders: e.target.checked })}
                />
                <span className="checkbox-label">🧪 Lab Orders & Results</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.medicalHistory}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, medicalHistory: e.target.checked })}
                />
                <span className="checkbox-label">📋 Medical History</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.diagnoses}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, diagnoses: e.target.checked })}
                />
                <span className="checkbox-label">🏥 ICD-10 Diagnoses</span>
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeOptions.drugInteractions}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, drugInteractions: e.target.checked })}
                />
                <span className="checkbox-label">⚠️ Drug Interaction Log</span>
              </label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="export-actions">
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={exporting || (!selectedPatient && selectedPatients.length === 0)}
          >
            {exporting ? (
              <>
                <span className="spinner-small"></span>
                Generating PDF...
              </>
            ) : (
              <>
                📄 Generate PDF Export
              </>
            )}
          </button>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className="export-section">
            <h3>Recent Exports</h3>
            <div className="export-history">
              {exportHistory.slice(0, 5).map((exp, idx) => (
                <div key={exp._id || idx} className="history-item">
                  <div className="history-icon">
                    {EXPORT_TYPES[exp.exportType]?.icon || '📄'}
                  </div>
                  <div className="history-info">
                    <span className="history-type">
                      {EXPORT_TYPES[exp.exportType]?.label || exp.exportType}
                    </span>
                    <span className="history-date">{formatDate(exp.createdAt)}</span>
                  </div>
                  {exp.downloadUrl && (
                    <a href={exp.downloadUrl} className="btn-download" download>
                      ⬇️
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExport;
