// frontend/src/components/BookingModal.js
import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './BookingModal.css';

const BookingModal = ({ doctor, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('in_person');
  const [reason, setReason] = useState('');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [availability, setAvailability] = useState(null);
  
  // Payment state
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch payment config on mount
  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Fetch booked times when date changes
  useEffect(() => {
    if (selectedDate && doctor?._id) {
      fetchBookedTimes();
    }
  }, [selectedDate, doctor]);

  const fetchPaymentConfig = async () => {
    try {
      const response = await axios.get('/api/payments/config');
      setPaymentConfig(response.data);
      console.log('Payment config:', response.data);
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

  // Check availability when time changes
  useEffect(() => {
    if (selectedTime && selectedDate && doctor?._id) {
      checkTimeAvailability();
    } else {
      setAvailability(null);
    }
  }, [selectedTime]);

  const fetchBookedTimes = async () => {
    try {
      const response = await axios.get(`/api/appointments/booked-times/${doctor._id}/${selectedDate}`);
      setBookedTimes(response.data.bookedTimes || []);
    } catch (error) {
      console.error('Error fetching booked times:', error);
    }
  };

  const checkTimeAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const response = await axios.post('/api/appointments/check-availability', {
        doctorId: doctor._id,
        date: selectedDate,
        time: selectedTime
      });
      setAvailability(response.data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ available: false, message: 'Error checking availability' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          booked: bookedTimes.includes(timeStr),
          label: formatTime(timeStr)
        });
      }
    }
    return slots;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (availability && !availability.available) {
      toast.error('Selected time is not available');
      return;
    }

    try {
      setLoading(true);
      
      const appointmentPayload = {
        userId: user.id,
        doctorId: doctor._id,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        date: selectedDate,
        time: selectedTime,
        reason,
        consultationType
      };

      const response = await axios.post('/api/appointments', appointmentPayload);
      
      // Check if payment is enabled
      if (paymentConfig?.paymentsEnabled && paymentConfig?.keyId) {
        // Store appointment data and show payment
        setAppointmentData(response.data);
        setShowPayment(true);
        setLoading(false);
      } else {
        // No payment required - complete booking
        toast.success('Appointment booked successfully!');
        
        if (consultationType === 'online') {
          toast.success('Meet link will be sent to your email', {
            duration: 5000,
            icon: '🎥'
          });
        }
        
        onSuccess(response.data);
        onClose();
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
      setLoading(false);
    }
  };

  // Handle Razorpay payment
  const handlePayment = async () => {
    if (!appointmentData) return;
    
    try {
      setLoading(true);
      
      // Create Razorpay order
      const orderResponse = await axios.post('/api/payments/create-order', {
        appointmentId: appointmentData._id,
        userId: user.id
      });
      
      if (orderResponse.data.testMode) {
        // Test mode - payment skipped
        toast.success('Appointment confirmed!');
        onSuccess(appointmentData);
        onClose();
        return;
      }
      
      const order = orderResponse.data;
      
      // Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: 'HealthSync',
        description: `Consultation with Dr. ${doctor.name}`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointmentData._id
            });
            
            if (verifyResponse.data.success) {
              toast.success('Payment successful! Appointment confirmed.');
              if (consultationType === 'online') {
                toast.success('Meet link will be sent to your email', {
                  duration: 5000,
                  icon: '🎥'
                });
              }
              onSuccess(appointmentData);
              onClose();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        setLoading(false);
      });
      razorpay.open();
      setLoading(false);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const timeSlots = generateTimeSlots();

  // Calculate fees
  const consultationFee = doctor?.consultationFee || 500;
  const gst = Math.round(consultationFee * 0.22);
  const platformFee = Math.round(consultationFee * 0.07);
  const totalAmount = consultationFee + gst + platformFee;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-modal__header">
          <div className="booking-modal__header-content">
            <div className="booking-modal__doctor-info">
              <div className="booking-modal__doctor-avatar">
                <i className="fas fa-user-md"></i>
              </div>
              <div>
                <h2 className="booking-modal__title">Book Appointment</h2>
                <p className="booking-modal__doctor-name">Dr. {doctor?.name}</p>
                <span className="booking-modal__specialization">{doctor?.specialization}</span>
              </div>
            </div>
            <button className="booking-modal__close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="booking-modal__progress">
            <div className={`booking-modal__step ${step >= 1 ? 'active' : ''}`}>
              <div className="booking-modal__step-number">1</div>
              <span>Date & Time</span>
            </div>
            <div className="booking-modal__step-line"></div>
            <div className={`booking-modal__step ${step >= 2 ? 'active' : ''}`}>
              <div className="booking-modal__step-number">2</div>
              <span>Details</span>
            </div>
            <div className="booking-modal__step-line"></div>
            <div className={`booking-modal__step ${step >= 3 ? 'active' : ''}`}>
              <div className="booking-modal__step-number">3</div>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="booking-modal__body">
          {/* Step 1: Date & Time Selection */}
          {step === 1 && (
            <div className="booking-modal__step-content">
              {/* Date Selection */}
              <div className="booking-modal__section">
                <h3 className="booking-modal__section-title">
                  <i className="fas fa-calendar-alt"></i>
                  Select Date
                </h3>
                <input
                  type="date"
                  className="booking-modal__date-input"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                    setAvailability(null);
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
                {selectedDate && (
                  <p className="booking-modal__selected-date">
                    <i className="fas fa-check-circle"></i>
                    {formatDate(selectedDate)}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="booking-modal__section">
                  <h3 className="booking-modal__section-title">
                    <i className="fas fa-clock"></i>
                    Select Time
                  </h3>
                  
                  {/* Custom Time Input */}
                  <div className="booking-modal__time-input-wrapper">
                    <input
                      type="time"
                      className={`booking-modal__time-input ${availability ? (availability.available ? 'available' : 'unavailable') : ''}`}
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      min="09:00"
                      max="18:00"
                      step="60"
                    />
                    {checkingAvailability && (
                      <div className="booking-modal__checking">
                        <i className="fas fa-spinner fa-spin"></i>
                      </div>
                    )}
                    {availability && !checkingAvailability && (
                      <div className={`booking-modal__availability-badge ${availability.available ? 'available' : 'unavailable'}`}>
                        {availability.available ? (
                          <><i className="fas fa-check-circle"></i> Available</>
                        ) : (
                          <><i className="fas fa-times-circle"></i> Booked</>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Time Slots */}
                  <div className="booking-modal__time-slots">
                    <p className="booking-modal__slots-label">Quick Select:</p>
                    <div className="booking-modal__slots-grid">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          className={`booking-modal__slot ${slot.booked ? 'booked' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
                          onClick={() => !slot.booked && setSelectedTime(slot.time)}
                          disabled={slot.booked}
                        >
                          <span className="booking-modal__slot-time">{slot.label}</span>
                          <span className="booking-modal__slot-status">
                            {slot.booked ? <i className="fas fa-times"></i> : <i className="fas fa-check"></i>}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="booking-modal__legend">
                    <div className="booking-modal__legend-item">
                      <span className="booking-modal__legend-dot available"></span>
                      Available
                    </div>
                    <div className="booking-modal__legend-item">
                      <span className="booking-modal__legend-dot booked"></span>
                      Booked
                    </div>
                    <div className="booking-modal__legend-item">
                      <span className="booking-modal__legend-dot selected"></span>
                      Selected
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Consultation Details */}
          {step === 2 && (
            <div className="booking-modal__step-content">
              {/* Consultation Type */}
              <div className="booking-modal__section">
                <h3 className="booking-modal__section-title">
                  <i className="fas fa-video"></i>
                  Consultation Type
                </h3>
                <div className="booking-modal__type-options">
                  <button
                    type="button"
                    className={`booking-modal__type-option ${consultationType === 'in_person' ? 'selected' : ''}`}
                    onClick={() => setConsultationType('in_person')}
                  >
                    <div className="booking-modal__type-icon">
                      <i className="fas fa-hospital"></i>
                    </div>
                    <div className="booking-modal__type-content">
                      <h4>In-Person Visit</h4>
                      <p>Visit the clinic for consultation</p>
                    </div>
                    {consultationType === 'in_person' && (
                      <i className="fas fa-check-circle booking-modal__type-check"></i>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className={`booking-modal__type-option ${consultationType === 'online' ? 'selected' : ''}`}
                    onClick={() => setConsultationType('online')}
                  >
                    <div className="booking-modal__type-icon online">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="booking-modal__type-content">
                      <h4>Online Consultation</h4>
                      <p>Video call via Google Meet</p>
                      <span className="booking-modal__type-badge">
                        <i className="fas fa-bolt"></i> Auto Meet Link
                      </span>
                    </div>
                    {consultationType === 'online' && (
                      <i className="fas fa-check-circle booking-modal__type-check"></i>
                    )}
                  </button>
                </div>

                {consultationType === 'online' && (
                  <div className="booking-modal__meet-info">
                    <i className="fas fa-info-circle"></i>
                    <div>
                      <strong>Google Meet Integration</strong>
                      <p>A meeting link will be automatically generated and sent to your email 18 minutes before the appointment.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="booking-modal__section">
                <h3 className="booking-modal__section-title">
                  <i className="fas fa-notes-medical"></i>
                  Reason for Visit
                </h3>
                <textarea
                  className="booking-modal__textarea"
                  placeholder="Describe your symptoms or reason for consultation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="booking-modal__step-content">
              <div className="booking-modal__confirmation">
                {/* Appointment Summary */}
                <div className="booking-modal__summary-card">
                  <h3 className="booking-modal__summary-title">
                    <i className="fas fa-clipboard-check"></i>
                    Appointment Summary
                  </h3>
                  
                  <div className="booking-modal__summary-grid">
                    <div className="booking-modal__summary-item">
                      <i className="fas fa-user-md"></i>
                      <div>
                        <span className="label">Doctor</span>
                        <span className="value">Dr. {doctor?.name}</span>
                      </div>
                    </div>
                    
                    <div className="booking-modal__summary-item">
                      <i className="fas fa-stethoscope"></i>
                      <div>
                        <span className="label">Specialization</span>
                        <span className="value">{doctor?.specialization}</span>
                      </div>
                    </div>
                    
                    <div className="booking-modal__summary-item">
                      <i className="fas fa-calendar"></i>
                      <div>
                        <span className="label">Date</span>
                        <span className="value">{formatDate(selectedDate)}</span>
                      </div>
                    </div>
                    
                    <div className="booking-modal__summary-item">
                      <i className="fas fa-clock"></i>
                      <div>
                        <span className="label">Time</span>
                        <span className="value">{formatTime(selectedTime)}</span>
                      </div>
                    </div>
                    
                    <div className="booking-modal__summary-item">
                      <i className={consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                      <div>
                        <span className="label">Type</span>
                        <span className="value">
                          {consultationType === 'online' ? '🎥 Online Consultation' : '🏥 In-Person Visit'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="booking-modal__summary-item">
                      <i className="fas fa-hospital"></i>
                      <div>
                        <span className="label">Clinic</span>
                        <span className="value">{doctor?.clinicId?.name || 'HealthSync Clinic'}</span>
                      </div>
                    </div>
                  </div>

                  {reason && (
                    <div className="booking-modal__reason-preview">
                      <span className="label">Reason:</span>
                      <p>{reason}</p>
                    </div>
                  )}
                </div>

                {/* Payment Breakdown */}
                <div className="booking-modal__payment-card">
                  <h3 className="booking-modal__payment-title">
                    <i className="fas fa-receipt"></i>
                    Payment Details
                  </h3>
                  
                  <div className="booking-modal__payment-rows">
                    <div className="booking-modal__payment-row">
                      <span>Consultation Fee</span>
                      <span>₹{consultationFee}</span>
                    </div>
                    <div className="booking-modal__payment-row">
                      <span>GST (22%)</span>
                      <span>₹{gst}</span>
                    </div>
                    <div className="booking-modal__payment-row">
                      <span>Platform Fee (7%)</span>
                      <span>₹{platformFee}</span>
                    </div>
                    <div className="booking-modal__payment-row total">
                      <span>Total Amount</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  {paymentConfig?.paymentsEnabled && paymentConfig?.keyId ? (
                    <div className="booking-modal__payment-enabled">
                      <i className="fas fa-lock"></i>
                      <span>Secure payment via Razorpay</span>
                    </div>
                  ) : (
                    <div className="booking-modal__test-mode">
                      <i className="fas fa-flask"></i>
                      <span>Test Mode: Payment will be skipped</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {showPayment && appointmentData && (
            <div className="booking-modal__payment-step">
              <div className="booking-modal__payment-success">
                <i className="fas fa-check-circle"></i>
                <h3>Appointment Created!</h3>
                <p>Please complete payment to confirm your booking</p>
              </div>
              <div className="booking-modal__payment-amount">
                <span>Amount to Pay</span>
                <span className="amount">₹{totalAmount}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="booking-modal__footer">
          {step > 1 && !showPayment && (
            <button
              type="button"
              className="booking-modal__btn booking-modal__btn--secondary"
              onClick={() => setStep(step - 1)}
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          )}
          
          {showPayment ? (
            <button
              type="button"
              className="booking-modal__btn booking-modal__btn--razorpay"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-credit-card"></i>
                  Pay ₹{totalAmount} with Razorpay
                </>
              )}
            </button>
          ) : step < 3 ? (
            <button
              type="button"
              className="booking-modal__btn booking-modal__btn--primary"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!selectedDate || !selectedTime || (availability && !availability.available))) ||
                (step === 2 && !reason)
              }
            >
              Continue
              <i className="fas fa-arrow-right"></i>
            </button>
          ) : (
            <button
              type="button"
              className="booking-modal__btn booking-modal__btn--success"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  {paymentConfig?.paymentsEnabled ? 'Proceed to Payment' : 'Confirm Booking'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
