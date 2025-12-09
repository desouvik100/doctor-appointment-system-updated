// frontend/src/components/CancelAppointmentModal.js
// Modal for cancelling appointments with reason

import React, { useState } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './CancelAppointmentModal.css';

const CANCELLATION_REASONS = [
  { id: 'schedule_conflict', label: 'Schedule conflict', icon: '📅' },
  { id: 'feeling_better', label: 'Feeling better', icon: '😊' },
  { id: 'found_another_doctor', label: 'Found another doctor', icon: '👨‍⚕️' },
  { id: 'financial_reasons', label: 'Financial reasons', icon: '💰' },
  { id: 'transportation_issues', label: 'Transportation issues', icon: '🚗' },
  { id: 'emergency', label: 'Emergency situation', icon: '🚨' },
  { id: 'other', label: 'Other reason', icon: '📝' }
];

const CancelAppointmentModal = ({
  isOpen,
  onClose,
  appointment,
  onCancelled,
  userType = 'patient' // 'patient' or 'doctor'
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notifyOther, setNotifyOther] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    const reason = selectedReason === 'other' 
      ? customReason || 'Other reason'
      : CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    setLoading(true);
    try {
      const response = await axios.put(`/api/appointments/${appointment._id}/cancel`, {
        reason,
        cancelledBy: userType,
        notifyPatient: userType === 'doctor' ? notifyOther : true,
        notifyDoctor: userType === 'patient' ? notifyOther : true
      });

      if (response.data.success) {
        toast.success('Appointment cancelled successfully');
        onCancelled?.(response.data.appointment);
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time || !time.includes(':')) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const otherPartyName = userType === 'patient' 
    ? `Dr. ${appointment.doctorId?.name}` 
    : appointment.userId?.name || 'Patient';

  return (
    <div className="cancel-modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="cancel-modal">
        <div className="cancel-modal__header">
          <div className="cancel-modal__icon">
            <i className="fas fa-calendar-times"></i>
          </div>
          <h2>Cancel Appointment</h2>
          <p>Are you sure you want to cancel this appointment?</p>
        </div>

        <div className="cancel-modal__appointment-info">
          <div className="cancel-modal__info-row">
            <i className="fas fa-user-md"></i>
            <span>{otherPartyName}</span>
          </div>
          <div className="cancel-modal__info-row">
            <i className="fas fa-calendar"></i>
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="cancel-modal__info-row">
            <i className="fas fa-clock"></i>
            <span>{formatTime(appointment.time)}</span>
          </div>
        </div>

        <div className="cancel-modal__reasons">
          <label className="cancel-modal__label">
            <i className="fas fa-question-circle"></i>
            Why are you cancelling?
          </label>
          <div className="cancel-modal__reason-grid">
            {CANCELLATION_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                className={`cancel-modal__reason-btn ${selectedReason === reason.id ? 'cancel-modal__reason-btn--selected' : ''}`}
                onClick={() => setSelectedReason(reason.id)}
              >
                <span className="cancel-modal__reason-icon">{reason.icon}</span>
                <span className="cancel-modal__reason-label">{reason.label}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedReason === 'other' && (
          <div className="cancel-modal__custom-reason">
            <label className="cancel-modal__label">
              <i className="fas fa-edit"></i>
              Please specify your reason
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your reason for cancellation..."
              rows={3}
              maxLength={500}
            />
            <span className="cancel-modal__char-count">{customReason.length}/500</span>
          </div>
        )}

        <div className="cancel-modal__notify">
          <label className="cancel-modal__checkbox">
            <input
              type="checkbox"
              checked={notifyOther}
              onChange={(e) => setNotifyOther(e.target.checked)}
            />
            <span className="cancel-modal__checkbox-mark"></span>
            <span>Notify {userType === 'patient' ? 'the doctor' : 'the patient'} via email</span>
          </label>
        </div>

        <div className="cancel-modal__warning">
          <i className="fas fa-exclamation-triangle"></i>
          <p>This action cannot be undone. You will need to book a new appointment if you change your mind.</p>
        </div>

        <div className="cancel-modal__actions">
          <button 
            className="cancel-modal__btn cancel-modal__btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Keep Appointment
          </button>
          <button 
            className="cancel-modal__btn cancel-modal__btn--danger"
            onClick={handleCancel}
            disabled={loading || !selectedReason}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Cancelling...
              </>
            ) : (
              <>
                <i className="fas fa-times"></i>
                Cancel Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
