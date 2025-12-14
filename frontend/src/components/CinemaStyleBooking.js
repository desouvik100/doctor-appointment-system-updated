import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './CinemaStyleBooking.css';
import LiveQueueTracker from './LiveQueueTracker';
import PaymentSuccessReceipt from './PaymentSuccessReceipt';
import { initiatePayment } from '../utils/razorpayService';

const CinemaStyleBooking = ({ doctor, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Type, 2: Date, 3: Details, 4: Confirm, 5: Success
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [consultationType, setConsultationType] = useState(null); // null until selected
  const [reason, setReason] = useState('');
  
  // Queue-based booking states
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  
  // Enhancement states
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [reminderPreference, setReminderPreference] = useState('email');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Live queue update states
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [queueChanged, setQueueChanged] = useState(false);
  
  // Live queue tracker modal state
  const [showLiveTracker, setShowLiveTracker] = useState(false);

  // Payment states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState(null);

  // Common symptoms for quick selection
  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain', 
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup'
  ];

  // Get slot duration from doctor or queueInfo (default 30 min)
  const slotDuration = queueInfo?.slotDuration || doctor?.consultationDuration || 30;

  const doctorId = doctor?._id || doctor?.id;

  // Fee calculations - 5% platform fee, no GST
  const consultationFee = doctor?.consultationFee || 500;
  const platformFee = Math.round(consultationFee * 0.05); // 5% platform fee
  const totalPayable = consultationFee + platformFee;

  useEffect(() => {
    fetchCalendar();
    // Fetch payment config on mount
    const fetchPaymentConfig = async () => {
      try {
        const response = await axios.get('/api/payments/config');
        setPaymentConfig(response.data);
      } catch (error) {
        console.error('Error fetching payment config:', error);
      }
    };
    fetchPaymentConfig();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate && consultationType) {
      fetchQueueInfo(selectedDate);
    }
  }, [selectedDate, consultationType]); // Refetch when consultation type changes

  // Live queue updates - poll every 10 seconds when on step 3 or 4 (details/confirm)
  useEffect(() => {
    let intervalId;
    
    if (selectedDate && consultationType && (step === 3 || step === 4) && !bookingSuccess) {
      setIsLiveUpdating(true);
      
      // Poll for queue updates every 10 seconds
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`/api/appointments/queue-info/${doctorId}/${selectedDate}`);
          if (response.data.success) {
            const newQueueInfo = response.data;
            
            // Check if queue position changed
            if (queueInfo && newQueueInfo.nextQueueNumber !== queueInfo.nextQueueNumber) {
              setQueueChanged(true);
              // Show toast notification
              if (newQueueInfo.nextQueueNumber < queueInfo.nextQueueNumber) {
                toast.success(`Queue updated! Your position is now #${newQueueInfo.nextQueueNumber}`, {
                  icon: '🔄',
                  duration: 3000
                });
              } else {
                toast(`Queue updated: Position #${newQueueInfo.nextQueueNumber}`, {
                  icon: '📊',
                  duration: 3000
                });
              }
              // Reset animation after 2 seconds
              setTimeout(() => setQueueChanged(false), 2000);
            }
            
            setQueueInfo(newQueueInfo);
            setLastUpdated(new Date());
          }
        } catch (error) {
          console.error('Error fetching live queue update:', error);
        }
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setIsLiveUpdating(false);
      }
    };
  }, [selectedDate, step, bookingSuccess, doctorId, queueInfo]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const response = await axios.get(`/api/doctors/${doctorId}/calendar?month=${month}&year=${year}`);
      if (response.data.success) {
        setCalendarData(response.data.calendar || []);
      } else {
        generateDefaultCalendar();
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      // Show user-friendly message for network errors
      if (!error.response) {
        toast.error('Unable to load calendar. Please check your connection.', { id: 'calendar-error' });
      }
      generateDefaultCalendar();
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const calendar = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      calendar.push({
        date: dateStr,
        dayOfWeek,
        isAvailable: dayOfWeek !== 'sunday' && date >= today,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today
      });
    }
    setCalendarData(calendar);
  };

  const fetchQueueInfo = async (dateStr) => {
    try {
      setQueueLoading(true);
      // Get current queue count for this doctor on this date
      // Pass consultationType to get queue info for specific type
      const typeParam = consultationType === 'online' ? 'online' : 'in_person';
      const response = await axios.get(`/api/appointments/queue-info/${doctorId}/${dateStr}?consultationType=${typeParam}`);
      
      if (response.data.success) {
        setQueueInfo(response.data);
      } else {
        // Default queue info
        setQueueInfo({
          currentQueueCount: 0,
          nextQueueNumber: 1,
          estimatedTime: consultationType === 'online' ? '08:00' : '09:00',
          maxSlots: consultationType === 'online' ? 15 : 20,
          availableSlots: consultationType === 'online' ? 15 : 20,
          virtualQueue: { count: 0, maxSlots: 15, available: 15 },
          inClinicQueue: { count: 0, maxSlots: 20, available: 20 }
        });
      }
    } catch (error) {
      console.error('Error fetching queue info:', error);
      // Show error only for non-network issues
      if (error.response?.status >= 500) {
        toast.error('Unable to load queue info. Using defaults.', { id: 'queue-error', duration: 3000 });
      }
      // Default queue info on error
      setQueueInfo({
        currentQueueCount: 0,
        nextQueueNumber: 1,
        estimatedTime: consultationType === 'online' ? '08:00' : '09:00',
        maxSlots: consultationType === 'online' ? 15 : 20,
        availableSlots: consultationType === 'online' ? 15 : 20,
        virtualQueue: { count: 0, maxSlots: 15, available: 15 },
        inClinicQueue: { count: 0, maxSlots: 20, available: 20 }
      });
    } finally {
      setQueueLoading(false);
    }
  };

  // Calculate estimated time based on queue position and doctor's consultation duration
  const calculateEstimatedTime = (queueNumber) => {
    // Virtual consultations start at 8 AM, in-clinic at 9 AM
    const isVirtual = consultationType === 'online';
    const startHour = isVirtual ? 8 : 9;
    const minutesFromStart = (queueNumber - 1) * slotDuration;
    const hours = Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    
    let estimatedHour = startHour + hours;
    // Skip lunch hour (1 PM - 2 PM) for in-clinic only
    if (!isVirtual && estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    // Check if within working hours (virtual: 8 PM, in-clinic: 7 PM)
    const endHour = isVirtual ? 20 : 19;
    if (estimatedHour >= endHour) {
      return null; // Closed
    }
    
    return `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleTypeSelect = (type) => {
    setConsultationType(type);
    setSelectedDate(null); // Reset date when type changes
    setStep(2);
  };

  const handleDateSelect = (day) => {
    if (day.isPast || !day.isAvailable) return;
    setSelectedDate(day.date);
    setStep(3);
  };

  // Handle Razorpay payment success
  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Verify payment on backend
      const verifyResponse = await axios.post('/api/payments/verify', {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        appointmentId: pendingAppointmentId
      });

      if (verifyResponse.data.success) {
        // Fetch the updated appointment
        const appointmentResponse = await axios.get(`/api/appointments/${pendingAppointmentId}`);
        
        setBookedAppointment({
          ...appointmentResponse.data,
          date: selectedDate,
          consultationType
        });
        
        setPaymentDetails({
          transactionId: paymentData.razorpay_payment_id,
          amount: totalPayable,
          method: paymentData.method || 'Online',
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        });
        
        setBookingSuccess(true);
        setShowPaymentReceipt(true);
        setStep(5);
        setPaymentProcessing(false);
        
        toast.success('Payment successful! Appointment confirmed.', { duration: 4000 });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentError('Payment verification failed. Please contact support.');
      setPaymentProcessing(false);
    }
  };

  // Handle Razorpay payment failure
  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setPaymentError(error.message || 'Payment failed. Please try again.');
    setPaymentProcessing(false);
  };

  const handleBooking = async () => {
    // Build reason with symptoms if selected (both are optional now)
    let fullReason = '';
    if (selectedSymptoms.length > 0) {
      fullReason = `Symptoms: ${selectedSymptoms.join(', ')}.`;
    }
    if (reason.trim()) {
      fullReason = fullReason ? `${fullReason} ${reason.trim()}` : reason.trim();
    }
    // Default reason if nothing provided
    if (!fullReason) {
      fullReason = 'General Consultation';
    }
    
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate the estimated time for this booking
      const queueNumber = queueInfo?.nextQueueNumber || 1;
      const estimatedTime = calculateEstimatedTime(queueNumber);
      
      if (!estimatedTime) {
        toast.error('No slots available for this date. Please select another date.');
        setLoading(false);
        return;
      }

      const bookingData = {
        userId: user.id || user._id,
        doctorId: doctorId,
        clinicId: doctor.clinicId?._id || doctor.clinicId || null,
        date: selectedDate,
        queueNumber: queueNumber,
        estimatedTime: estimatedTime,
        reason: fullReason,
        consultationType,
        urgencyLevel,
        reminderPreference,
        sendEstimatedTimeEmail: true,
        paymentStatus: paymentConfig?.paymentsEnabled ? 'pending' : 'completed'
      };
      
      console.log('📋 Booking data:', bookingData);
      
      const response = await axios.post('/api/appointments/queue-booking', bookingData);
      const appointmentId = response.data._id || response.data.id;
      setPendingAppointmentId(appointmentId);

      // If payments are enabled, initiate Razorpay
      if (paymentConfig?.paymentsEnabled) {
        setLoading(false);
        
        // Initiate Razorpay payment
        initiatePayment(
          appointmentId,
          user.id || user._id,
          handlePaymentSuccess,
          handlePaymentFailure
        );
      } else {
        // Payments disabled - auto-confirm
        setBookedAppointment({
          ...response.data,
          queueNumber: response.data.queueNumber || queueNumber,
          estimatedTime: response.data.estimatedTime || estimatedTime,
          date: selectedDate,
          consultationType
        });
        
        setPaymentDetails({
          transactionId: response.data.transactionId || `TXN${Date.now()}`,
          amount: totalPayable,
          method: 'Free',
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        });
        
        setBookingSuccess(true);
        setShowPaymentReceipt(true);
        setStep(5);
        setPaymentProcessing(false);
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      
      // Handle specific error cases
      if (!error.response) {
        toast.error('Network error. Please check your connection and try again.', { duration: 5000 });
      } else if (error.response.status === 409) {
        toast.error('This slot is no longer available. Please select another time.', { duration: 4000 });
        // Refresh queue info
        fetchQueueInfo(selectedDate);
      } else if (error.response.status === 400) {
        const errorMsg = error.response.data?.errors?.join(', ') || error.response.data?.message || 'Invalid booking details. Please check and try again.';
        console.error('Validation errors:', error.response.data);
        toast.error(errorMsg, { duration: 5000 });
      } else if (error.response.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
      }
      setLoading(false);
    }
  };
  
  const handleSuccessClose = () => {
    if (onSuccess) onSuccess(bookedAppointment);
    onClose();
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    // Parse date string as local date (not UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    if (newMonth >= new Date(new Date().getFullYear(), new Date().getMonth())) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="cinema-booking-overlay" onClick={onClose}>
      <div className="cinema-booking-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cinema-booking-header">
          <div className="doctor-info">
            {doctor?.profilePhoto ? (
              <img src={doctor.profilePhoto} alt={doctor.name} className="doctor-avatar" />
            ) : (
              <div className="doctor-avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C9.243 2 7 4.243 7 7c0 2.757 2.243 5 5 5s5-2.243 5-5c0-2.757-2.243-5-5-5zm0 8c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3zm9 11v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1h2z"/>
                  <circle cx="17" cy="4" r="1.5" fill="#10b981"/>
                  <path d="M17 6.5v2M15.5 7.5h3" stroke="#10b981" strokeWidth="0.8" fill="none"/>
                </svg>
              </div>
            )}
            <div>
              <h2>Book Appointment</h2>
              <p>Dr. {doctor?.name} • {doctor?.specialization}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Progress Steps - Updated for type-first booking */}
        <div className="booking-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 1 ? <i className="fas fa-check"></i> : <i className="fas fa-stethoscope"></i>}
            </div>
            <span>Type</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 2 ? <i className="fas fa-check"></i> : <i className="fas fa-calendar"></i>}
            </div>
            <span>Date</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 3 ? <i className="fas fa-check"></i> : <i className="fas fa-clipboard"></i>}
            </div>
            <span>Details</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 4 ? <i className="fas fa-check"></i> : <i className="fas fa-check-circle"></i>}
            </div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="cinema-booking-content">
          {/* Step 1: Consultation Type Selection - FIRST */}
          {step === 1 && (
            <div className="type-selection-step mobile-optimized">
              <h3 className="step-title">
                <i className="fas fa-stethoscope"></i>
                Choose Consultation Type
              </h3>
              <p className="step-subtitle">Tap to select how you'd like to consult</p>
              
              <div className="type-selection-cards mobile-cards">
                {/* In-Clinic Visit Card */}
                <div 
                  className={`type-selection-card clinic mobile-card ${consultationType === 'in_person' ? 'selected' : ''}`}
                  onClick={() => {
                    // Haptic feedback for mobile
                    if (navigator.vibrate) navigator.vibrate(10);
                    setConsultationType('in_person');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="In-Clinic Visit - Best for physical examination"
                  aria-pressed={consultationType === 'in_person'}
                  onKeyDown={(e) => e.key === 'Enter' && setConsultationType('in_person')}
                >
                  {/* Selected checkmark */}
                  <div className="selected-check mobile-check">
                    <i className="fas fa-check"></i>
                  </div>
                  
                  <div className="mobile-card-header">
                    <div className="type-card-icon mobile-icon">
                      <i className="fas fa-hospital"></i>
                    </div>
                    <div className="mobile-card-title">
                      <h4>In-Clinic Visit</h4>
                      <span className="mobile-subtitle">Best for physical examination</span>
                    </div>
                  </div>
                  
                  <div className="mobile-card-details">
                    <div className="mobile-info-row">
                      <span className="mobile-info-item">
                        <i className="fas fa-clock"></i> 9 AM - 7 PM
                      </span>
                      <span className="mobile-info-item">
                        <i className="fas fa-hourglass-half"></i> ~{doctor?.consultationDuration || 30} min
                      </span>
                    </div>
                    <ul className="mobile-features">
                      <li><i className="fas fa-check-circle"></i> Physical exam & lab tests</li>
                      <li><i className="fas fa-check-circle"></i> Detailed consultation</li>
                    </ul>
                  </div>
                </div>

                {/* Online Consultation Card */}
                <div 
                  className={`type-selection-card virtual mobile-card ${consultationType === 'online' ? 'selected' : ''}`}
                  onClick={() => {
                    // Haptic feedback for mobile
                    if (navigator.vibrate) navigator.vibrate(10);
                    setConsultationType('online');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Online Consultation - Best for quick consultation"
                  aria-pressed={consultationType === 'online'}
                  onKeyDown={(e) => e.key === 'Enter' && setConsultationType('online')}
                >
                  {/* Selected checkmark */}
                  <div className="selected-check mobile-check">
                    <i className="fas fa-check"></i>
                  </div>
                  
                  <div className="mobile-card-header">
                    <div className="type-card-icon mobile-icon">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="mobile-card-title">
                      <h4>Online Consultation</h4>
                      <span className="mobile-subtitle">Best for quick consultation</span>
                    </div>
                  </div>
                  
                  <div className="mobile-card-details">
                    <div className="mobile-info-row">
                      <span className="mobile-info-item">
                        <i className="fas fa-clock"></i> 8 AM - 8 PM
                      </span>
                      <span className="mobile-info-item">
                        <i className="fas fa-hourglass-half"></i> ~20 min
                      </span>
                    </div>
                    <ul className="mobile-features">
                      <li><i className="fas fa-check-circle"></i> No travel required</li>
                      <li><i className="fas fa-check-circle"></i> Get prescription online</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="type-selection-note mobile-note">
                <i className="fas fa-info-circle"></i>
                <span>Separate queues for online & clinic visits</span>
              </div>

              {/* Sticky Continue Button for Mobile */}
              <div className="mobile-sticky-footer">
                <button 
                  className={`proceed-btn type-continue-btn mobile-continue ${consultationType ? 'enabled' : ''}`}
                  onClick={() => {
                    if (consultationType) {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setStep(2);
                    }
                  }}
                  disabled={!consultationType}
                >
                  {consultationType ? (
                    <>
                      <span className="continue-text">
                        Continue with {consultationType === 'online' ? 'Online' : 'Clinic Visit'}
                      </span>
                      <i className="fas fa-arrow-right"></i>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-hand-pointer"></i>
                      <span>Select an option above</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Date Selection */}
          {step === 2 && (
            <div className="date-selection">
              {/* Selected Type Banner */}
              <div className={`selected-type-banner ${consultationType === 'online' ? 'virtual' : 'clinic'}`}>
                <i className={`fas ${consultationType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                <span>{consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}</span>
                <button className="change-type-btn" onClick={() => setStep(1)}>
                  <i className="fas fa-edit"></i> Change
                </button>
              </div>

              {/* Clinic Hours Info */}
              <div className="clinic-hours-banner">
                <i className="fas fa-clock"></i>
                <div>
                  <span className="hours-label">{consultationType === 'online' ? 'Online Hours' : 'Clinic Hours'}</span>
                  <span className="hours-value">
                    {consultationType === 'online' ? '8:00 AM - 8:00 PM (Mon-Sat)' : '9:00 AM - 7:00 PM (Mon-Sat)'}
                  </span>
                </div>
                <div className="slot-duration">
                  <i className="fas fa-user-clock"></i>
                  <span>~{consultationType === 'online' ? '20' : (doctor?.consultationDuration || 30)} min per patient</span>
                </div>
              </div>

              <div className="calendar-nav">
                <button onClick={prevMonth} disabled={currentMonth <= new Date()}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                <button onClick={nextMonth}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <div className="calendar-header">
                {dayNames.map(day => (
                  <div key={day} className="day-name">{day}</div>
                ))}
              </div>

              <div className="calendar-grid">
                {(() => {
                  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                  const cells = [];
                  
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
                  }
                  
                  calendarData.forEach(day => {
                    const dayNum = new Date(day.date).getDate();
                    const isSelected = selectedDate === day.date;
                    
                    cells.push(
                      <div
                        key={day.date}
                        className={`calendar-cell 
                          ${day.isAvailable && !day.isPast ? 'available' : 'unavailable'}
                          ${day.isToday ? 'today' : ''}
                          ${day.isPast ? 'past' : ''}
                          ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleDateSelect(day)}
                      >
                        <span className="day-number">{dayNum}</span>
                        {day.isAvailable && !day.isPast && (
                          <span className="availability-indicator"></span>
                        )}
                      </div>
                    );
                  });
                  
                  return cells;
                })()}
              </div>

              <div className="calendar-legend">
                <span><i className="fas fa-circle available"></i> Available</span>
                <span><i className="fas fa-circle unavailable"></i> Unavailable</span>
                <span><i className="fas fa-circle today"></i> Today</span>
              </div>
            </div>
          )}


          {/* Step 3: Queue Info & Details */}
          {step === 3 && (
            <div className="details-section">
              {/* Selected Type & Date Banner */}
              <div className="selected-info-banner">
                <div className={`info-item type ${consultationType === 'online' ? 'virtual' : 'clinic'}`}>
                  <i className={`fas ${consultationType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                  <span>{consultationType === 'online' ? 'Online' : 'In-Clinic'}</span>
                  <button onClick={() => { setStep(1); setQueueInfo(null); setSelectedDate(null); }} className="change-btn">Change</button>
                </div>
                <div className="info-item date">
                  <i className="fas fa-calendar-check"></i>
                  <span>{formatDate(selectedDate)}</span>
                  <button onClick={() => { setStep(2); setQueueInfo(null); }} className="change-btn">Change</button>
                </div>
              </div>

              {/* Queue Information Card */}
              {queueLoading ? (
                <div className="queue-loading">
                  <div className="spinner"></div>
                  <p>Checking queue availability...</p>
                </div>
              ) : queueInfo && (
                <div className={`queue-info-card ${queueChanged ? 'queue-updated' : ''} ${consultationType === 'online' ? 'virtual-queue' : 'clinic-queue'}`}>
                  {/* Queue Type Banner */}
                  <div className={`queue-type-banner ${consultationType === 'online' ? 'virtual' : 'clinic'}`}>
                    <i className={`fas ${consultationType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                    <span>
                      {consultationType === 'online' ? 'Virtual Consultation Queue' : 'In-Clinic Queue'}
                    </span>
                    <span className="queue-type-note">
                      {consultationType === 'online' 
                        ? '(Separate from clinic visits)' 
                        : '(Separate from online consultations)'}
                    </span>
                  </div>

                  <div className="queue-header">
                    <h4><i className="fas fa-users"></i> Queue Status</h4>
                    <div className="queue-header-right">
                      {/* Live Update Indicator */}
                      {isLiveUpdating && (
                        <span className="live-indicator">
                          <span className="live-dot"></span>
                          LIVE
                        </span>
                      )}
                      {queueInfo.currentQueueCount === 0 && (
                        <span className="queue-badge empty"><i className="fas fa-star"></i> No Wait!</span>
                      )}
                      {queueInfo.currentQueueCount > 0 && queueInfo.currentQueueCount <= 3 && (
                        <span className="queue-badge low"><i className="fas fa-bolt"></i> Short Wait</span>
                      )}
                      {queueInfo.currentQueueCount > 3 && queueInfo.currentQueueCount <= 8 && (
                        <span className="queue-badge medium"><i className="fas fa-clock"></i> Moderate</span>
                      )}
                      {queueInfo.currentQueueCount > 8 && (
                        <span className="queue-badge high"><i className="fas fa-hourglass-half"></i> Busy</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Last Updated Time */}
                  {lastUpdated && (
                    <div className="last-updated">
                      <i className="fas fa-sync-alt"></i>
                      Updated {Math.floor((new Date() - lastUpdated) / 1000)}s ago
                    </div>
                  )}
                  
                  <div className="queue-stats">
                    <div className={`queue-stat ${queueChanged ? 'stat-pulse' : ''}`}>
                      <span className="stat-number">{queueInfo.currentQueueCount || 0}</span>
                      <span className="stat-label">
                        {consultationType === 'online' ? 'Online Queue' : 'Clinic Queue'}
                      </span>
                    </div>
                    <div className={`queue-stat highlight ${queueChanged ? 'stat-pulse' : ''}`}>
                      <span className="stat-number">#{queueInfo.nextQueueNumber || 1}</span>
                      <span className="stat-label">Your Position</span>
                    </div>
                    <div className={`queue-stat ${queueChanged ? 'stat-pulse' : ''}`}>
                      <span className="stat-number">{queueInfo.availableSlots || 20}</span>
                      <span className="stat-label">Slots Left</span>
                    </div>
                  </div>
                  
                  {/* Wait Time Estimate */}
                  {queueInfo.currentQueueCount > 0 && (
                    <div className="wait-time-estimate">
                      <i className="fas fa-hourglass-half"></i>
                      <span>Estimated wait: ~{(queueInfo.currentQueueCount || 0) * slotDuration} min</span>
                    </div>
                  )}
                  
                  <div className="estimated-time-box">
                    <i className={`fas ${consultationType === 'online' ? 'fa-video' : 'fa-clock'}`}></i>
                    <div>
                      <span className="est-label">
                        {consultationType === 'online' ? 'Your Video Call Time' : 'Your Estimated Time'}
                      </span>
                      <span className="est-time">{formatTime(calculateEstimatedTime(queueInfo.nextQueueNumber || 1))}</span>
                    </div>
                    <span className="est-note">
                      {consultationType === 'online' 
                        ? '*Join link sent 15 min before' 
                        : '*Arrive 15 min early'}
                    </span>
                  </div>

                  {/* Show both queue counts for transparency */}
                  {queueInfo.virtualQueue && queueInfo.inClinicQueue && (
                    <div className="both-queues-info">
                      <div className="queue-comparison">
                        <div className={`queue-type-stat ${consultationType === 'online' ? 'active' : ''}`}>
                          <i className="fas fa-video"></i>
                          <span>{queueInfo.virtualQueue.count}/{queueInfo.virtualQueue.maxSlots}</span>
                          <small>Virtual</small>
                        </div>
                        <div className="queue-separator">|</div>
                        <div className={`queue-type-stat ${consultationType === 'in_person' ? 'active' : ''}`}>
                          <i className="fas fa-hospital"></i>
                          <span>{queueInfo.inClinicQueue.count}/{queueInfo.inClinicQueue.maxSlots}</span>
                          <small>In-Clinic</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Symptom Selection */}
              <div className="symptoms-section">
                <h4><i className="fas fa-heartbeat"></i> Quick Symptoms (Optional)</h4>
                <div className="symptoms-grid">
                  {commonSymptoms.map(symptom => (
                    <button
                      key={symptom}
                      className={`symptom-chip ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedSymptoms.includes(symptom)) {
                          setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
                        } else {
                          setSelectedSymptoms([...selectedSymptoms, symptom]);
                        }
                      }}
                    >
                      {symptom}
                      {selectedSymptoms.includes(symptom) && <i className="fas fa-check"></i>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency Level */}
              <div className="urgency-section">
                <h4><i className="fas fa-exclamation-triangle"></i> Urgency Level</h4>
                <div className="urgency-options">
                  <button 
                    className={`urgency-btn normal ${urgencyLevel === 'normal' ? 'selected' : ''}`}
                    onClick={() => setUrgencyLevel('normal')}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Normal</span>
                  </button>
                  <button 
                    className={`urgency-btn urgent ${urgencyLevel === 'urgent' ? 'selected' : ''}`}
                    onClick={() => setUrgencyLevel('urgent')}
                  >
                    <i className="fas fa-clock"></i>
                    <span>Urgent</span>
                  </button>
                  <button 
                    className={`urgency-btn emergency ${urgencyLevel === 'emergency' ? 'selected' : ''}`}
                    onClick={() => setUrgencyLevel('emergency')}
                  >
                    <i className="fas fa-ambulance"></i>
                    <span>Emergency</span>
                  </button>
                </div>
              </div>

              <div className="reason-input">
                <h4>Additional Details <span className="optional">(Optional)</span></h4>
                <textarea
                  placeholder="Any additional information you'd like to share with the doctor..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Reminder Preference */}
              <div className="reminder-section">
                <h4><i className="fas fa-bell"></i> Reminder Preference</h4>
                <div className="reminder-options">
                  <label className={`reminder-option ${reminderPreference === 'email' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="reminder" 
                      checked={reminderPreference === 'email'}
                      onChange={() => setReminderPreference('email')}
                    />
                    <i className="fas fa-envelope"></i>
                    <span>Email</span>
                  </label>
                  <label className={`reminder-option ${reminderPreference === 'sms' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="reminder" 
                      checked={reminderPreference === 'sms'}
                      onChange={() => setReminderPreference('sms')}
                    />
                    <i className="fas fa-sms"></i>
                    <span>SMS</span>
                  </label>
                  <label className={`reminder-option ${reminderPreference === 'both' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="reminder" 
                      checked={reminderPreference === 'both'}
                      onChange={() => setReminderPreference('both')}
                    />
                    <i className="fas fa-bell"></i>
                    <span>Both</span>
                  </label>
                </div>
              </div>

              <button 
                className="proceed-btn"
                onClick={() => setStep(4)}
              >
                Proceed to Confirm <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* Step 4: Mobile-Optimized Payment/Confirmation */}
          {step === 4 && (
            <div className={`confirmation-section mobile-payment ${paymentProcessing ? 'processing' : ''}`}>
              {/* Payment Processing Overlay */}
              {paymentProcessing && (
                <div className="payment-processing-overlay">
                  <div className="payment-loader">
                    <div className="loader-spinner"></div>
                    <p>Processing Payment...</p>
                    <span className="processing-hint">Please don't close this screen</span>
                  </div>
                </div>
              )}

              {/* Payment Error Banner */}
              {paymentError && (
                <div className="payment-error-banner">
                  <i className="fas fa-exclamation-circle"></i>
                  <div className="error-content">
                    <strong>Payment Failed</strong>
                    <p>{paymentError}</p>
                  </div>
                  <button 
                    className="dismiss-error"
                    onClick={() => setPaymentError(null)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              <div className="booking-summary mobile-summary">
                <h3><i className="fas fa-clipboard-check"></i> Confirm & Pay</h3>
                
                {/* Compact Doctor Card */}
                <div className="mobile-doctor-card">
                  <div className="doctor-avatar-small">
                    {doctor?.profilePhoto ? (
                      <img src={doctor.profilePhoto} alt={doctor.name} />
                    ) : (
                      <i className="fas fa-user-md"></i>
                    )}
                  </div>
                  <div className="doctor-info-compact">
                    <h4>Dr. {doctor?.name}</h4>
                    <span>{doctor?.specialization}</span>
                  </div>
                </div>

                {/* Appointment Details Card */}
                <div className="summary-card mobile-card">
                  <div className="summary-row">
                    <span className="label"><i className={consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i> Type</span>
                    <span className="value type-badge">
                      {consultationType === 'online' ? '🎥 Online' : '🏥 In-Clinic'}
                    </span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="label"><i className="fas fa-calendar"></i> Date</span>
                    <span className="value">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="label"><i className="fas fa-ticket-alt"></i> Queue #</span>
                    <span className="value queue-number">#{queueInfo?.nextQueueNumber || 1}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label"><i className="fas fa-clock"></i> Est. Time</span>
                    <span className="value">{formatTime(calculateEstimatedTime(queueInfo?.nextQueueNumber || 1))}</span>
                  </div>
                </div>

                {/* Fee Breakdown - Mobile Optimized */}
                <div className="fee-breakdown mobile-fees">
                  <div className="fee-row">
                    <span>Consultation Fee</span>
                    <span>₹{consultationFee}</span>
                  </div>
                  <div className="fee-row">
                    <span>Platform Fee (5%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="fee-row total">
                    <span>Total Payable</span>
                    <span className="total-amount">₹{totalPayable}</span>
                  </div>
                </div>

                {/* Trust Signals */}
                <div className="trust-signals">
                  <div className="trust-item">
                    <i className="fas fa-lock"></i>
                    <span>Secure Payment</span>
                  </div>
                  <div className="trust-item">
                    <i className="fas fa-shield-alt"></i>
                    <span>100% Safe</span>
                  </div>
                </div>

                {/* Confirmation Notice */}
                <div className="payment-notice">
                  <i className="fas fa-info-circle"></i>
                  <span>Your appointment will be confirmed after successful payment</span>
                </div>
              </div>

              {/* Mobile Sticky Payment Footer */}
              <div className="mobile-payment-footer">
                <div className="payment-total-display">
                  <span className="pay-label">TOTAL</span>
                  <span className="pay-amount">₹{totalPayable}</span>
                </div>
                
                <div className="payment-actions">
                  <button 
                    className="back-btn mobile-back"
                    onClick={() => !paymentProcessing && setStep(3)}
                    disabled={paymentProcessing}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button 
                    className={`pay-now-btn ${paymentProcessing ? 'processing' : ''}`}
                    onClick={async () => {
                      if (paymentProcessing) return;
                      
                      // Haptic feedback
                      if (navigator.vibrate) navigator.vibrate(15);
                      
                      setPaymentProcessing(true);
                      setPaymentError(null);
                      setPaymentAttempts(prev => prev + 1);
                      
                      try {
                        // Simulate payment processing (replace with actual payment gateway)
                        await handleBooking();
                      } catch (error) {
                        setPaymentError(
                          error.message || 'Payment failed. Please try again.'
                        );
                        setPaymentProcessing(false);
                      }
                    }}
                    disabled={paymentProcessing || loading}
                  >
                    {paymentProcessing || loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : paymentError ? (
                      <>
                        <i className="fas fa-redo"></i>
                        <span>Retry Payment</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-lock"></i>
                        <span>Pay ₹{totalPayable}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment Success & Receipt - Using new component */}
          {step === 5 && bookingSuccess && !showPaymentReceipt && (
            <div className="success-section minimal">
              <div className="success-animation">
                <div className="success-checkmark">
                  <div className="check-icon">
                    <span className="icon-line line-tip"></span>
                    <span className="icon-line line-long"></span>
                    <div className="icon-circle"></div>
                    <div className="icon-fix"></div>
                  </div>
                </div>
                <h2>🎉 Booking Confirmed!</h2>
                <p>Your appointment has been successfully booked</p>
              </div>
              <div className="success-actions">
                <button className="done-btn" onClick={handleSuccessClose}>
                  <i className="fas fa-check"></i> Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Live Queue Tracker Modal */}
      {showLiveTracker && bookedAppointment && (
        <LiveQueueTracker 
          appointment={{
            ...bookedAppointment,
            doctorId: doctor,
            clinicId: doctor?.clinicId,
            date: selectedDate,
            tokenNumber: bookedAppointment?.queueNumber || queueInfo?.nextQueueNumber
          }} 
          onClose={() => setShowLiveTracker(false)} 
        />
      )}
      
      {/* Payment Success & Receipt Modal */}
      {showPaymentReceipt && bookedAppointment && (
        <PaymentSuccessReceipt
          appointment={bookedAppointment}
          doctor={doctor}
          paymentDetails={paymentDetails}
          onClose={() => {
            setShowPaymentReceipt(false);
            handleSuccessClose();
          }}
          onViewAppointments={() => {
            setShowPaymentReceipt(false);
            handleSuccessClose();
            // Navigate to appointments - this will be handled by parent
          }}
        />
      )}
    </div>
  );
};

export default CinemaStyleBooking;