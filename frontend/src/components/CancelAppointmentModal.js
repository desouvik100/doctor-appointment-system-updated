// frontend/src/components/CancelAppointmentModal.js
// Modal for cancelling appointments with refund policy preview

import React, { useState, useEffect } from 'react';
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
  const [refundPreview, setRefundPreview] = useState(null);
  const [loadingRefund, setLoadingRefund] = useState(false);

  // Check if payment was completed (check both root level and nested payment object)
  const isPaymentCompleted = appointment?.paymentStatus === 'completed' || 
                              appointment?.payment?.paymentStatus === 'completed';

  // Debug logging
  useEffect(() => {
    if (isOpen && appointment) {
      console.log('🔍 CancelAppointmentModal Debug:');
      console.log('  - appointment._id:', appointment._id);
      console.log('  - appointment.paymentStatus:', appointment.paymentStatus);
      console.log('  - appointment.payment:', appointment.payment);
      console.log('  - appointment.payment?.paymentStatus:', appointment.payment?.paymentStatus);
      console.log('  - isPaymentCompleted:', isPaymentCompleted);
    }
  }, [isOpen, appointment, isPaymentCompleted]);

  // Fetch refund preview when modal opens
  useEffect(() => {
    if (isOpen && appointment?._id && isPaymentCompleted) {
      console.log('📡 Fetching refund preview...');
      fetchRefundPreview();
    }
  }, [isOpen, appointment, isPaymentCompleted]);

  const fetchRefundPreview = async () => {
    setLoadingRefund(true);
    try {
      console.log('📡 Calling API: /api/refunds/preview/' + appointment._id);
      const response = await axios.get(`/api/refunds/preview/${appointment._id}?cancelledBy=${userType}`);
      console.log('📡 API Response:', response.data);
      if (response.data.success) {
        setRefundPreview(response.data.preview);
        console.log('✅ Refund preview set:', response.data.preview);
      }
    } catch (error) {
      console.error('❌ Error fetching refund preview:', error);
      console.error('❌ Error response:', error.response?.data);
    } finally {
      setLoadingRefund(false);
    }
  };

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
        notifyDoctor: userType === 'patient' ? notifyOther : true,
        processRefund: true
      });

      if (response.data.success) {
        // Show refund info in success message
        let successMsg = 'Appointment cancelled successfully';
        if (response.data.refund?.processed || response.data.refund?.pending) {
          const refundAmount = response.data.refund.amount || 0;
          if (refundAmount > 0) {
            if (response.data.refund.pending) {
              successMsg += `. Refund of ₹${refundAmount} will be credited to your account within 5-7 business days.`;
            } else {
              successMsg += `. Refund of ₹${refundAmount} has been processed.`;
            }
          }
          if (response.data.refund.walletCredit > 0) {
            successMsg += ` ₹${response.data.refund.walletCredit} added to your wallet as compensation.`;
          }
        }
        toast.success(successMsg, { duration: 6000 });
        onCancelled?.(response.data.appointment, response.data.refund);
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

  const getRefundPolicyBadge = () => {
    if (!refundPreview) return null;
    
    const { policyApplied, refundPercentage } = refundPreview;
    
    switch (policyApplied) {
      case 'full_refund':
        return { color: 'green', icon: '✓', text: '100% Refund' };
      case 'partial_refund':
        return { color: 'orange', icon: '⚠', text: '50% Refund' };
      case 'no_refund':
      case 'no_show':
        return { color: 'red', icon: '✗', text: 'No Refund' };
      case 'doctor_cancelled':
        return { color: 'green', icon: '✓', text: 'Full Refund + Credit' };
      default:
        return null;
    }
  };

  const badge = getRefundPolicyBadge();

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

        {/* Refund Policy Preview - Always show this section */}
        <div className="cancel-modal__refund-section">
          <div className="cancel-modal__refund-header">
            <i className="fas fa-rupee-sign"></i>
            <span>Refund Information</span>
          </div>
          
          {!isPaymentCompleted ? (
            <div className="cancel-modal__refund-info">
              <p>💡 No payment was made for this appointment. No refund applicable.</p>
            </div>
          ) : loadingRefund ? (
              <div className="cancel-modal__refund-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Calculating refund...</span>
              </div>
            ) : refundPreview ? (
              <div className="cancel-modal__refund-details">
                {badge && (
                  <div className={`cancel-modal__refund-badge cancel-modal__refund-badge--${badge.color}`}>
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-text">{badge.text}</span>
                  </div>
                )}
                
                <div className="cancel-modal__refund-breakdown">
                  {refundPreview.originalAmount > 0 && (
                    <div className="refund-row">
                      <span>Amount Paid</span>
                      <span>₹{refundPreview.originalAmount}</span>
                    </div>
                  )}
                  
                  {refundPreview.gatewayFeeDeducted > 0 && (
                    <div className="refund-row refund-row--deduction">
                      <span>Gateway Fee</span>
                      <span>-₹{refundPreview.gatewayFeeDeducted}</span>
                    </div>
                  )}
                  
                  {refundPreview.platformRetained > 0 && (
                    <div className="refund-row refund-row--deduction">
                      <span>Late Cancellation Fee</span>
                      <span>-₹{refundPreview.platformRetained}</span>
                    </div>
                  )}
                  
                  <div className="refund-row refund-row--total">
                    <span>Refund Amount</span>
                    <span className={refundPreview.refundAmount > 0 ? 'text-green' : 'text-red'}>
                      ₹{refundPreview.refundAmount}
                    </span>
                  </div>
                  
                  {refundPreview.walletCredit > 0 && (
                    <div className="refund-row refund-row--bonus">
                      <span>+ Wallet Credit (Compensation)</span>
                      <span className="text-green">₹{refundPreview.walletCredit}</span>
                    </div>
                  )}
                </div>
                
                <div className="cancel-modal__refund-reason">
                  <i className="fas fa-info-circle"></i>
                  <span>{refundPreview.reason}</span>
                </div>
                
                {refundPreview.hoursUntilAppointment !== undefined && (
                  <div className="cancel-modal__time-info">
                    <i className="fas fa-hourglass-half"></i>
                    <span>
                      {refundPreview.hoursUntilAppointment > 0 
                        ? `${Math.round(refundPreview.hoursUntilAppointment)} hours until appointment`
                        : 'Appointment time has passed'}
                    </span>
                  </div>
                )}
                
                {refundPreview.refundAmount > 0 && (
                  <div className="cancel-modal__refund-timeline">
                    <i className="fas fa-clock"></i>
                    <span>Refund will be credited to your original payment method within 5-7 business days</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="cancel-modal__refund-info">
                <p>Refund will be processed based on our cancellation policy.</p>
              </div>
            )}
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
                {refundPreview?.refundAmount > 0 && ` (₹${refundPreview.refundAmount} refund)`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;
