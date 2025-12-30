import { useState } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './WalkInPatientModal.css';

const WalkInPatientModal = ({ doctor, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    reason: '',
    consultationType: 'in_person'
  });
  const [searchPhone, setSearchPhone] = useState('');
  const [existingPatient, setExistingPatient] = useState(null);
  const [searching, setSearching] = useState(false);

  const doctorId = doctor?._id || doctor?.id;

  // Search for existing patient by phone
  const searchPatient = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`/api/users/search?phone=${searchPhone}`);
      if (response.data && response.data._id) {
        setExistingPatient(response.data);
        toast.success('Patient found!');
      } else {
        setExistingPatient(null);
        toast('New patient - fill details below', { icon: '📝' });
      }
    } catch (error) {
      setExistingPatient(null);
      toast('New patient - fill details below', { icon: '📝' });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!existingPatient && !formData.patientName) {
      toast.error('Patient name is required');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        doctorId,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        date: new Date().toISOString().split('T')[0], // Today
        reason: formData.reason || 'Walk-in Consultation',
        consultationType: formData.consultationType,
        addedBy: doctor._id
      };

      if (existingPatient) {
        // Existing patient with account
        bookingData.userId = existingPatient._id;
      } else {
        // New walk-in patient
        bookingData.patientName = formData.patientName;
        bookingData.patientPhone = formData.patientPhone || searchPhone;
        bookingData.patientEmail = formData.patientEmail;
        bookingData.patientAge = formData.patientAge ? parseInt(formData.patientAge) : null;
        bookingData.patientGender = formData.patientGender;
      }

      const response = await axios.post('/api/appointments/walk-in', bookingData);

      if (response.data.success) {
        toast.success(`Patient added! Token #${response.data.queueNumber}`);
        if (onSuccess) onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="walkin-modal-overlay" onClick={onClose}>
      <div className="walkin-modal" onClick={e => e.stopPropagation()}>
        <div className="walkin-header">
          <h2><i className="fas fa-user-plus"></i> Add Walk-In Patient</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="walkin-content">
          {/* Search Existing Patient */}
          <div className="search-section">
            <label>Search by Phone Number</label>
            <div className="search-input-group">
              <input
                type="tel"
                placeholder="Enter patient's phone number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                maxLength={10}
              />
              <button 
                type="button" 
                onClick={searchPatient}
                disabled={searching}
                className="search-btn"
              >
                {searching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              </button>
            </div>
          </div>

          {/* Existing Patient Found */}
          {existingPatient && (
            <div className="existing-patient-card">
              <div className="patient-avatar">
                {existingPatient.profilePhoto ? (
                  <img src={existingPatient.profilePhoto} alt={existingPatient.name} />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              <div className="patient-info">
                <h4>{existingPatient.name}</h4>
                <p><i className="fas fa-phone"></i> {existingPatient.phone}</p>
                <p><i className="fas fa-envelope"></i> {existingPatient.email}</p>
              </div>
              <span className="verified-badge">
                <i className="fas fa-check-circle"></i> Verified
              </span>
            </div>
          )}

          {/* New Patient Form */}
          {!existingPatient && (
            <form onSubmit={handleSubmit} className="walkin-form">
              <div className="form-divider">
                <span>New Patient Details</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Patient Name <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={formData.patientName}
                    onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.patientPhone || searchPhone}
                    onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="patient@email.com (for sending prescription)"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({...formData, patientEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    min="0"
                    max="120"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({...formData, patientGender: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {/* Common Fields */}
          <div className="common-fields">
            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea
                placeholder="Brief description of symptoms or reason..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Consultation Type</label>
              <div className="type-toggle">
                <button
                  type="button"
                  className={formData.consultationType === 'in_person' ? 'active' : ''}
                  onClick={() => setFormData({...formData, consultationType: 'in_person'})}
                >
                  <i className="fas fa-hospital"></i> In-Person
                </button>
                <button
                  type="button"
                  className={formData.consultationType === 'online' ? 'active' : ''}
                  onClick={() => setFormData({...formData, consultationType: 'online'})}
                >
                  <i className="fas fa-video"></i> Video Call
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="walkin-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Adding...</>
            ) : (
              <><i className="fas fa-plus"></i> Add to Queue</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkInPatientModal;
