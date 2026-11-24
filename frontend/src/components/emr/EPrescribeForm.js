/**
 * E-Prescribe Form Component
 * Electronic prescription creation with pharmacy integration
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import RxNormDrugSearch from './RxNormDrugSearch';
import './EPrescribeForm.css';

const EPrescribeForm = ({
  patientId,
  patient,
  prescriberId,
  prescriber,
  clinicId,
  onSubmit,
  onCancel,
  existingMedications = []
}) => {
  const [medications, setMedications] = useState([createEmptyMedication()]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [validation, setValidation] = useState(null);
  const [formularyResults, setFormularyResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [frequencyCodes, setFrequencyCodes] = useState({});
  const [showPharmacySearch, setShowPharmacySearch] = useState(false);

  // Load frequency codes on mount
  useEffect(() => {
    loadFrequencyCodes();
  }, []);

  const loadFrequencyCodes = async () => {
    try {
      const response = await axios.get('/api/e-prescribe/frequency-codes');
      if (response.data.success) {
        setFrequencyCodes(response.data.frequencyCodes);
      }
    } catch (err) {
      console.error('Error loading frequency codes:', err);
    }
  };

  function createEmptyMedication() {
    return {
      id: Date.now(),
      drugName: '',
      rxcui: '',
      strength: '',
      form: 'TAB',
      dosage: '',
      frequency: 'QD',
      daysSupply: 30,
      quantity: 30,
      refills: 0,
      instructions: '',
      dispenseAsWritten: false
    };
  }

  const addMedication = () => {
    setMedications([...medications, createEmptyMedication()]);
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter(m => m.id !== id));
    }
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleDrugSelect = async (id, drug) => {
    updateMedication(id, 'drugName', drug.name);
    updateMedication(id, 'rxcui', drug.rxcui);

    // Check formulary
    if (drug.rxcui) {
      try {
        const response = await axios.post('/api/e-prescribe/formulary', {
          drugName: drug.name,
          rxcui: drug.rxcui
        });
        if (response.data.success) {
          setFormularyResults(prev => ({
            ...prev,
            [id]: response.data.formulary
          }));
        }
      } catch (err) {
        console.error('Formulary check error:', err);
      }
    }
  };

  const searchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/e-prescribe/pharmacies', {
        params: { 
          zipCode: patient?.address?.zipCode || '90210',
          name: pharmacySearch 
        }
      });
      if (response.data.success) {
        setPharmacies(response.data.pharmacies);
      }
    } catch (err) {
      console.error('Pharmacy search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validatePrescription = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/e-prescribe/validate', {
        patientId,
        patient,
        prescriberId,
        prescriber,
        medications: medications.filter(m => m.drugName)
      });

      setValidation(response.data);
      return response.data.validation?.valid;
    } catch (err) {
      setError('Validation failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await validatePrescription();
    if (!isValid) return;

    setSubmitting(true);
    setError('');

    try {
      // Create prescription
      const createResponse = await axios.post('/api/e-prescribe/create', {
        patientId,
        patient,
        prescriberId,
        prescriber,
        medications: medications.filter(m => m.drugName),
        pharmacy: selectedPharmacy
      });

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.message);
      }

      const prescription = createResponse.data.prescription;

      // Transmit to pharmacy if selected
      if (selectedPharmacy) {
        const transmitResponse = await axios.post('/api/e-prescribe/transmit', {
          prescription
        });

        onSubmit?.({
          prescription,
          transmitted: transmitResponse.data.success,
          transmissionResult: transmitResponse.data
        });
      } else {
        onSubmit?.({ prescription, transmitted: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="e-prescribe-form">
      <div className="form-header">
        <h2>📝 E-Prescribe</h2>
        <p className="patient-info">
          Patient: <strong>{patient?.name || 'Unknown'}</strong>
        </p>
      </div>

      {/* Medications */}
      <div className="medications-section">
        <h3>💊 Medications</h3>
        
        {medications.map((med, index) => (
          <div key={med.id} className="medication-card">
            <div className="med-header">
              <span className="med-number">#{index + 1}</span>
              {medications.length > 1 && (
                <button 
                  className="remove-med-btn"
                  onClick={() => removeMedication(med.id)}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="med-row">
              <div className="field drug-search-field">
                <label>Drug Name *</label>
                <RxNormDrugSearch
                  value={med.drugName}
                  onSelect={(drug) => handleDrugSelect(med.id, drug)}
                  placeholder="Search medication..."
                />
              </div>
              <div className="field">
                <label>Strength</label>
                <input
                  type="text"
                  value={med.strength}
                  onChange={(e) => updateMedication(med.id, 'strength', e.target.value)}
                  placeholder="e.g., 10mg"
                />
              </div>
            </div>

            <div className="med-row">
              <div className="field">
                <label>Dosage *</label>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                  placeholder="e.g., 1 tablet"
                />
              </div>
              <div className="field">
                <label>Frequency *</label>
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                >
                  {Object.entries(frequencyCodes).map(([code, info]) => (
                    <option key={code} value={code}>{info.display}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Days Supply</label>
                <input
                  type="number"
                  value={med.daysSupply}
                  onChange={(e) => updateMedication(med.id, 'daysSupply', parseInt(e.target.value))}
                  min="1"
                  max="90"
                />
              </div>
            </div>

            <div className="med-row">
              <div className="field">
                <label>Quantity</label>
                <input
                  type="number"
                  value={med.quantity}
                  onChange={(e) => updateMedication(med.id, 'quantity', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              <div className="field">
                <label>Refills</label>
                <input
                  type="number"
                  value={med.refills}
                  onChange={(e) => updateMedication(med.id, 'refills', parseInt(e.target.value))}
                  min="0"
                  max="11"
                />
              </div>
              <div className="field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={med.dispenseAsWritten}
                    onChange={(e) => updateMedication(med.id, 'dispenseAsWritten', e.target.checked)}
                  />
                  Dispense as Written (DAW)
                </label>
              </div>
            </div>

            <div className="field full-width">
              <label>Instructions</label>
              <textarea
                value={med.instructions}
                onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                placeholder="Additional instructions for patient..."
                rows={2}
              />
            </div>

            {/* Formulary Status */}
            {formularyResults[med.id] && (
              <div className={`formulary-status ${formularyResults[med.id].covered ? 'covered' : 'not-covered'}`}>
                <span className="formulary-tier">
                  Tier {formularyResults[med.id].tier}: {formularyResults[med.id].tierName}
                </span>
                <span className="formulary-copay">
                  Copay: ${formularyResults[med.id].copay}
                </span>
                {formularyResults[med.id].priorAuthRequired && (
                  <span className="prior-auth-badge">⚠️ Prior Auth Required</span>
                )}
              </div>
            )}
          </div>
        ))}

        <button className="add-med-btn" onClick={addMedication}>
          + Add Another Medication
        </button>
      </div>

      {/* Pharmacy Selection */}
      <div className="pharmacy-section">
        <h3>🏪 Pharmacy</h3>
        
        {selectedPharmacy ? (
          <div className="selected-pharmacy">
            <div className="pharmacy-info">
              <strong>{selectedPharmacy.name}</strong>
              <span>{selectedPharmacy.address?.street}</span>
              <span>{selectedPharmacy.phone}</span>
            </div>
            <button onClick={() => setSelectedPharmacy(null)}>Change</button>
          </div>
        ) : (
          <div className="pharmacy-search">
            <div className="search-row">
              <input
                type="text"
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                placeholder="Search pharmacy by name..."
              />
              <button onClick={searchPharmacies} disabled={loading}>
                {loading ? '...' : '🔍 Search'}
              </button>
            </div>

            {pharmacies.length > 0 && (
              <div className="pharmacy-list">
                {pharmacies.map(pharmacy => (
                  <div 
                    key={pharmacy.id}
                    className="pharmacy-option"
                    onClick={() => {
                      setSelectedPharmacy(pharmacy);
                      setPharmacies([]);
                    }}
                  >
                    <div className="pharmacy-name">{pharmacy.name}</div>
                    <div className="pharmacy-address">
                      {pharmacy.address?.street}, {pharmacy.address?.city}
                    </div>
                    <div className="pharmacy-meta">
                      <span>📞 {pharmacy.phone}</span>
                      {pharmacy.distance && <span>📍 {pharmacy.distance} mi</span>}
                      {pharmacy.isMailOrder && <span className="mail-order">📦 Mail Order</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`validation-results ${validation.validation?.valid ? 'valid' : 'invalid'}`}>
          <h4>{validation.validation?.valid ? '✅ Validation Passed' : '⚠️ Validation Issues'}</h4>
          
          {validation.validation?.errors?.length > 0 && (
            <ul className="error-list">
              {validation.validation.errors.map((err, i) => (
                <li key={i} className="error-item">❌ {err}</li>
              ))}
            </ul>
          )}
          
          {validation.validation?.warnings?.length > 0 && (
            <ul className="warning-list">
              {validation.validation.warnings.map((warn, i) => (
                <li key={i} className="warning-item">⚠️ {warn}</li>
              ))}
            </ul>
          )}

          {validation.interactionCheck?.interactions?.length > 0 && (
            <div className="interaction-warnings">
              <h5>💊 Drug Interactions Detected</h5>
              {validation.interactionCheck.interactions.map((int, i) => (
                <div key={i} className={`interaction-item ${int.severity}`}>
                  <strong>{int.drug1}</strong> ↔ <strong>{int.drug2}</strong>
                  <span className="severity-badge">{int.severity}</span>
                </div>
              ))}
            </div>
          )}

          {validation.therapeuticDuplicates?.length > 0 && (
            <div className="duplicate-warnings">
              <h5>⚠️ Therapeutic Duplicates</h5>
              {validation.therapeuticDuplicates.map((dup, i) => (
                <div key={i} className="duplicate-item">
                  {dup.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="form-error">
          ❌ {error}
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button 
          className="validate-btn" 
          onClick={validatePrescription}
          disabled={loading || submitting}
        >
          {loading ? 'Validating...' : '✓ Validate'}
        </button>
        <button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting || !medications.some(m => m.drugName)}
        >
          {submitting ? 'Sending...' : selectedPharmacy ? '📤 Send to Pharmacy' : '💾 Save Prescription'}
        </button>
      </div>
    </div>
  );
};

export default EPrescribeForm;
