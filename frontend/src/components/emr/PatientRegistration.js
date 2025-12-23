/**
 * Patient Registration Screen
 * For registering walk-in patients in EMR
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './PatientRegistration.css';

const PatientRegistration = ({ clinicId, onPatientSelect, onClose }) => {
  const [mode, setMode] = useState('search'); // 'search' or 'register'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  // Search patients
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setError('Enter at least 2 characters to search');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await axios.get('/api/emr/patients/search', {
        params: { q: searchQuery, clinicId, includeAll: 'true' }
      });

      if (response.data.success) {
        setSearchResults(response.data.patients || []);
        if (response.data.patients?.length === 0) {
          setError('No patients found. You can register a new patient.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Register new patient
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    // Validate phone
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const response = await axios.post('/api/emr/patients/walk-in', {
        clinicId,
        name: formData.name,
        phone: cleanPhone,
        email: formData.email || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        } : undefined
      });

      if (response.data.success) {
        setSuccess(response.data.isNew ? 'Patient registered successfully!' : 'Patient linked to clinic!');
        setTimeout(() => {
          onPatientSelect(response.data.patient);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  // Select existing patient
  const handleSelectPatient = async (patient) => {
    if (!patient.isRegisteredAtClinic) {
      // Link patient to clinic first
      try {
        await axios.post(`/api/emr/patients/${patient._id}/link`, { clinicId });
      } catch (err) {
        console.error('Error linking patient:', err);
      }
    }
    onPatientSelect(patient);
  };

  return (
    <div className="patient-registration">
      <div className="patient-registration__header">
        <h2>
          <span className="header-icon">📋</span>
          Patient Registration
        </h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="patient-registration__tabs">
        <button 
          className={`tab ${mode === 'search' ? 'active' : ''}`}
          onClick={() => setMode('search')}
        >
          <span>🔍</span> Search Patient
        </button>
        <button 
          className={`tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          <span>➕</span> New Walk-in
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Search Mode */}
      {mode === 'search' && (
        <div className="patient-registration__search">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, phone, or patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={searching}>
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {/* Search Results */}
          <div className="search-results">
            {searchResults.map((patient) => (
              <div 
                key={patient._id} 
                className="patient-card"
                onClick={() => handleSelectPatient(patient)}
              >
                <div className="patient-avatar">
                  {patient.profilePhoto ? (
                    <img src={patient.profilePhoto} alt={patient.name} />
                  ) : (
                    <span>{patient.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="patient-info">
                  <h4>{patient.name}</h4>
                  <p>📱 {patient.phone}</p>
                  {patient.age && <p>🎂 {patient.age} years</p>}
                  {patient.gender && <p>👤 {patient.gender}</p>}
                </div>
                <div className="patient-status">
                  {patient.isRegisteredAtClinic ? (
                    <span className="badge registered">Registered</span>
                  ) : (
                    <span className="badge new">Link to Clinic</span>
                  )}
                  {patient.clinicPatientId && (
                    <span className="patient-id">ID: {patient.clinicPatientId}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="no-results">
              <p>No patients found</p>
              <button onClick={() => {
                setMode('register');
                setFormData(prev => ({ ...prev, phone: searchQuery.replace(/\D/g, '') }));
              }}>
                Register New Patient
              </button>
            </div>
          )}
        </div>
      )}

      {/* Register Mode */}
      {mode === 'register' && (
        <form className="patient-registration__form" onSubmit={handleRegister}>
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Patient's full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age in years"
                  min="0"
                  max="150"
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  rows="2"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Emergency Contact (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <select
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setMode('search')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={registering}>
              {registering ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientRegistration;
