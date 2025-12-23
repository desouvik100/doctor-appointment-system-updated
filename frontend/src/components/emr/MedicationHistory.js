/**
 * Medication History Screen
 * View all prescriptions for a patient with timeline view
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './MedicationHistory.css';

const MedicationHistory = ({ clinicId, patientId, onClose }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [currentMedications, setCurrentMedications] = useState([]);

  useEffect(() => {
    fetchMedicationHistory();
  }, [patientId]);

  const fetchMedicationHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/emr/medications/history', {
        params: { patientId, clinicId }
      });
      
      if (response.data.success) {
        setPrescriptions(response.data.prescriptions || []);
        setCurrentMedications(response.data.currentMedications || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medication history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMedicationStatus = (prescription) => {
    const endDate = new Date(prescription.endDate || prescription.createdAt);
    endDate.setDate(endDate.getDate() + (prescription.duration || 7));
    
    if (new Date() > endDate) return 'completed';
    return 'active';
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (filter === 'all') return true;
    return getMedicationStatus(p) === filter;
  });

  const groupByMonth = (items) => {
    const groups = {};
    items.forEach(item => {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      
      if (!groups[key]) {
        groups[key] = { label, items: [] };
      }
      groups[key].items.push(item);
    });
    return Object.values(groups);
  };

  if (loading) {
    return (
      <div className="medication-history">
        <div className="med-loading">
          <div className="spinner"></div>
          <p>Loading medication history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medication-history">
      {/* Header */}
      <div className="med-header">
        <h2>
          <span className="header-icon">💊</span>
          Medication History
        </h2>
        <div className="header-actions">
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Current Medications Summary */}
      {currentMedications.length > 0 && (
        <div className="current-medications">
          <h3>Currently Taking</h3>
          <div className="current-med-list">
            {currentMedications.map((med, idx) => (
              <div key={idx} className="current-med-item">
                <span className="med-name">{med.name}</span>
                <span className="med-dosage">{med.dosage}</span>
                <span className="med-frequency">{med.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="med-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Content */}
      <div className="med-content">
        {filteredPrescriptions.length === 0 ? (
          <div className="no-medications">
            <span className="no-med-icon">💊</span>
            <p>No medication history found</p>
          </div>
        ) : (
          <div className="med-timeline">
            {groupByMonth(filteredPrescriptions).map((group, gIdx) => (
              <div key={gIdx} className="timeline-group">
                <div className="timeline-month">{group.label}</div>
                {group.items.map((prescription, idx) => {
                  const status = getMedicationStatus(prescription);
                  return (
                    <div 
                      key={prescription._id || idx} 
                      className={`prescription-card ${status}`}
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <div className="prescription-date">
                        <span className="date">{formatDate(prescription.createdAt)}</span>
                        <span className={`status-dot ${status}`}></span>
                      </div>
                      <div className="prescription-content">
                        <div className="prescription-header">
                          <span className="doctor-name">
                            Dr. {prescription.doctorName || 'Unknown'}
                          </span>
                          <span className={`status-badge ${status}`}>
                            {status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </div>
                        <div className="medications-preview">
                          {prescription.medications?.slice(0, 3).map((med, mIdx) => (
                            <span key={mIdx} className="med-chip">
                              {med.name}
                            </span>
                          ))}
                          {prescription.medications?.length > 3 && (
                            <span className="more-meds">
                              +{prescription.medications.length - 3} more
                            </span>
                          )}
                        </div>
                        {prescription.diagnosis && (
                          <p className="diagnosis-preview">
                            Dx: {prescription.diagnosis}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="prescription-modal" onClick={() => setSelectedPrescription(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Prescription Details</h3>
              <button onClick={() => setSelectedPrescription(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Date:</span>
                <span>{formatDate(selectedPrescription.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Doctor:</span>
                <span>Dr. {selectedPrescription.doctorName || 'Unknown'}</span>
              </div>
              {selectedPrescription.diagnosis && (
                <div className="detail-row">
                  <span className="label">Diagnosis:</span>
                  <span>{selectedPrescription.diagnosis}</span>
                </div>
              )}
              
              <h4>Medications</h4>
              <div className="medications-detail">
                {selectedPrescription.medications?.map((med, idx) => (
                  <div key={idx} className="medication-detail-item">
                    <div className="med-main">
                      <span className="med-name">{med.name}</span>
                      <span className="med-dosage">{med.dosage}</span>
                    </div>
                    <div className="med-instructions">
                      <span>{med.frequency}</span>
                      {med.duration && <span>• {med.duration} days</span>}
                      {med.timing && <span>• {med.timing}</span>}
                    </div>
                    {med.instructions && (
                      <p className="med-notes">{med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>

              {selectedPrescription.notes && (
                <>
                  <h4>Notes</h4>
                  <p className="prescription-notes">{selectedPrescription.notes}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationHistory;
