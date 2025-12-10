import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './CinemaStyleBooking.css';
import LiveQueueTracker from './LiveQueueTracker';

const CinemaStyleBooking = ({ doctor, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Date, 2: Details, 3: Confirm, 4: Success
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [consultationType, setConsultationType] = useState('in_person');
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

  // Common symptoms for quick selection
  const commonSymptoms = [
    'Fever', 'Cold & Cough', 'Headache', 'Body Pain', 
    'Stomach Issues', 'Skin Problem', 'Follow-up', 'General Checkup'
  ];

  // Get slot duration from doctor or queueInfo (default 30 min)
  const slotDuration = queueInfo?.slotDuration || doctor?.consultationDuration || 30;

  const doctorId = doctor?._id || doctor?.id;

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      fetchQueueInfo(selectedDate);
    }
  }, [selectedDate]);

  // Live queue updates - poll every 10 seconds when on step 2 or 3
  useEffect(() => {
    let intervalId;
    
    if (selectedDate && (step === 2 || step === 3) && !bookingSuccess) {
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
      const response = await axios.get(`/api/appointments/queue-info/${doctorId}/${dateStr}`);
      
      if (response.data.success) {
        setQueueInfo(response.data);
      } else {
        // Default queue info
        setQueueInfo({
          currentQueueCount: 0,
          nextQueueNumber: 1,
          estimatedTime: '09:00',
          maxSlots: 20,
          availableSlots: 20
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
        estimatedTime: '09:00',
        maxSlots: 20,
        availableSlots: 20
      });
    } finally {
      setQueueLoading(false);
    }
  };

  // Calculate estimated time based on queue position and doctor's consultation duration
  const calculateEstimatedTime = (queueNumber) => {
    const startHour = 9; // 9 AM
    const minutesFromStart = (queueNumber - 1) * slotDuration;
    const hours = Math.floor(minutesFromStart / 60);
    const minutes = minutesFromStart % 60;
    
    let estimatedHour = startHour + hours;
    // Skip lunch hour (1 PM - 2 PM)
    if (estimatedHour >= 13) {
      estimatedHour += 1;
    }
    
    // Check if within clinic hours
    if (estimatedHour >= 19) {
      return null; // Clinic closed
    }
    
    return `${estimatedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDateSelect = (day) => {
    if (day.isPast || !day.isAvailable) return;
    setSelectedDate(day.date);
    setStep(2);
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

      const response = await axios.post('/api/appointments/queue-booking', {
        userId: user.id || user._id,
        doctorId: doctorId,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        date: selectedDate,
        queueNumber: queueNumber,
        estimatedTime: estimatedTime,
        reason: fullReason,
        consultationType,
        urgencyLevel,
        reminderPreference,
        sendEstimatedTimeEmail: true
      });

      // Show success animation with confetti
      setBookedAppointment({
        ...response.data,
        queueNumber: response.data.queueNumber || queueNumber,
        estimatedTime: response.data.estimatedTime || estimatedTime
      });
      setBookingSuccess(true);
      setShowConfetti(true);
      setStep(4); // Success step
      
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
      
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
        toast.error(error.response.data?.message || 'Invalid booking details. Please check and try again.');
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

        {/* Progress Steps - Updated for queue-based booking */}
        <div className="booking-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 1 ? <i className="fas fa-check"></i> : <i className="fas fa-calendar"></i>}
            </div>
            <span>Select Date</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 2 ? <i className="fas fa-check"></i> : <i className="fas fa-clipboard"></i>}
            </div>
            <span>Details</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 3 ? <i className="fas fa-check"></i> : <i className="fas fa-check-circle"></i>}
            </div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="cinema-booking-content">
          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div className="date-selection">
              {/* Clinic Hours Info */}
              <div className="clinic-hours-banner">
                <i className="fas fa-clock"></i>
                <div>
                  <span className="hours-label">Clinic Hours</span>
                  <span className="hours-value">9:00 AM - 7:00 PM (Mon-Sat)</span>
                </div>
                <div className="slot-duration">
                  <i className="fas fa-user-clock"></i>
                  <span>~{doctor?.consultationDuration || 30} min per patient</span>
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


          {/* Step 2: Queue Info & Details */}
          {step === 2 && (
            <div className="details-section">
              <div className="selected-date-banner">
                <i className="fas fa-calendar-check"></i>
                <span>{formatDate(selectedDate)}</span>
                <button onClick={() => setStep(1)} className="change-btn">Change</button>
              </div>

              {/* Queue Information Card */}
              {queueLoading ? (
                <div className="queue-loading">
                  <div className="spinner"></div>
                  <p>Checking queue availability...</p>
                </div>
              ) : queueInfo && (
                <div className={`queue-info-card ${queueChanged ? 'queue-updated' : ''}`}>
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
                      <span className="stat-label">In Queue</span>
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
                    <i className="fas fa-clock"></i>
                    <div>
                      <span className="est-label">Your Estimated Time</span>
                      <span className="est-time">{formatTime(calculateEstimatedTime(queueInfo.nextQueueNumber || 1))}</span>
                    </div>
                    <span className="est-note">*Arrive 15 min early</span>
                  </div>
                </div>
              )}

              <div className="consultation-type">
                <h4>Consultation Type</h4>
                <div className="type-options">
                  <button
                    className={`type-btn ${consultationType === 'in_person' ? 'selected' : ''}`}
                    onClick={() => setConsultationType('in_person')}
                  >
                    <div className="type-icon">
                      <i className="fas fa-hospital"></i>
                    </div>
                    <div className="type-info">
                      <span className="type-name">In-Person</span>
                      <span className="type-desc">Visit the clinic</span>
                    </div>
                    {consultationType === 'in_person' && <i className="fas fa-check-circle check"></i>}
                  </button>
                  <button
                    className={`type-btn ${consultationType === 'online' ? 'selected' : ''}`}
                    onClick={() => setConsultationType('online')}
                  >
                    <div className="type-icon virtual">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="type-info">
                      <span className="type-name">Video Call</span>
                      <span className="type-desc">Online consultation</span>
                    </div>
                    {consultationType === 'online' && <i className="fas fa-check-circle check"></i>}
                  </button>
                </div>
              </div>

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
                onClick={() => setStep(3)}
              >
                Proceed to Confirm <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="confirmation-section">
              <div className="booking-summary">
                <h3><i className="fas fa-clipboard-check"></i> Booking Summary</h3>
                
                <div className="summary-card">
                  <div className="summary-row">
                    <span className="label"><i className="fas fa-user-md"></i> Doctor</span>
                    <span className="value">Dr. {doctor?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label"><i className="fas fa-stethoscope"></i> Specialization</span>
                    <span className="value">{doctor?.specialization}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label"><i className="fas fa-hospital"></i> Clinic</span>
                    <span className="value">{doctor?.clinicId?.name || 'HealthSync Clinic'}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="label"><i className="fas fa-calendar"></i> Date</span>
                    <span className="value">{formatDate(selectedDate)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="label"><i className="fas fa-ticket-alt"></i> Queue Position</span>
                    <span className="value">#{queueInfo?.nextQueueNumber || 1}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="label"><i className="fas fa-clock"></i> Estimated Time</span>
                    <span className="value">{formatTime(calculateEstimatedTime(queueInfo?.nextQueueNumber || 1))}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label"><i className={consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i> Type</span>
                    <span className="value">{consultationType === 'online' ? '🎥 Video Consultation' : '🏥 In-Person Visit'}</span>
                  </div>
                </div>

                <div className="fee-breakdown">
                  <div className="fee-row">
                    <span>Consultation Fee</span>
                    <span>₹{doctor?.consultationFee || 500}</span>
                  </div>
                  <div className="fee-row total">
                    <span>Total</span>
                    <span>₹{doctor?.consultationFee || 500}</span>
                  </div>
                </div>

                <div className="reason-preview">
                  <span className="label">Reason for Visit:</span>
                  <p>{selectedSymptoms.length > 0 ? `Symptoms: ${selectedSymptoms.join(', ')}. ` : ''}{reason}</p>
                </div>

                <div className="email-notice">
                  <i className="fas fa-envelope"></i>
                  <p>Your estimated arrival time will be sent to your registered email after booking.</p>
                </div>
              </div>

              <div className="confirm-actions">
                <button className="back-btn" onClick={() => setStep(2)}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleBooking}
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Booking...</>
                  ) : (
                    <><i className="fas fa-check"></i> Confirm Booking</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success Animation */}
          {step === 4 && bookingSuccess && (
            <div className="success-section">
              {/* Confetti Animation */}
              {showConfetti && (
                <div className="confetti-container">
                  {[...Array(50)].map((_, i) => (
                    <div key={i} className={`confetti confetti-${i % 6}`} style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }} />
                  ))}
                </div>
              )}
              
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

              <div className="success-details">
                <div className="success-card">
                  <div className="success-row">
                    <i className="fas fa-user-md"></i>
                    <span>Dr. {doctor?.name}</span>
                  </div>
                  <div className="success-row">
                    <i className="fas fa-calendar"></i>
                    <span>{formatDate(selectedDate)}</span>
                  </div>
                  
                  {/* Queue Token Display */}
                  <div className="token-display">
                    <span className="token-label">Your Queue Token</span>
                    <span className="token-number">#{bookedAppointment?.queueNumber || queueInfo?.nextQueueNumber || 1}</span>
                  </div>
                  
                  {/* Estimated Time Display */}
                  <div className="estimated-arrival">
                    <i className="fas fa-clock"></i>
                    <div>
                      <span className="arrival-label">Estimated Arrival Time</span>
                      <span className="arrival-time">{formatTime(bookedAppointment?.estimatedTime || calculateEstimatedTime(queueInfo?.nextQueueNumber || 1))}</span>
                    </div>
                  </div>

                  <div className="success-row">
                    <i className={consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                    <span>{consultationType === 'online' ? 'Video Consultation' : 'In-Person Visit'}</span>
                  </div>
                </div>

                <div className="success-tips">
                  <h4><i className="fas fa-lightbulb"></i> What's Next?</h4>
                  <ul>
                    <li><i className="fas fa-envelope"></i> Confirmation email with estimated time sent to your email</li>
                    <li><i className="fas fa-bell"></i> You'll receive a reminder before your appointment</li>
                    <li><i className="fas fa-clock"></i> Please arrive 15 minutes before your estimated time</li>
                    {consultationType === 'online' && (
                      <li><i className="fas fa-video"></i> Video call link will be sent 15 minutes before</li>
                    )}
                    {consultationType === 'in_person' && (
                      <li><i className="fas fa-map-marker-alt"></i> Bring your ID and any previous medical records</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Share Options */}
              <div className="share-section">
                <p className="share-label">Share appointment details:</p>
                <div className="share-buttons">
                  <button 
                    className="share-btn whatsapp"
                    onClick={() => {
                      const estTime = bookedAppointment?.estimatedTime || calculateEstimatedTime(queueInfo?.nextQueueNumber || 1);
                      const text = `🏥 *Appointment Booked*\n\n👨‍⚕️ Doctor: Dr. ${doctor?.name}\n📅 Date: ${formatDate(selectedDate)}\n⏰ Time: ${formatTime(estTime)}\n🎫 Token: #${bookedAppointment?.queueNumber || queueInfo?.nextQueueNumber || 1}\n\nBooked via HealthSync Pro`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <i className="fab fa-whatsapp"></i>
                  </button>
                  <button 
                    className="share-btn copy"
                    onClick={() => {
                      const estTime = bookedAppointment?.estimatedTime || calculateEstimatedTime(queueInfo?.nextQueueNumber || 1);
                      const text = `Appointment Booked\nDoctor: Dr. ${doctor?.name}\nDate: ${formatDate(selectedDate)}\nTime: ${formatTime(estTime)}\nToken: #${bookedAppointment?.queueNumber || queueInfo?.nextQueueNumber || 1}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Copied to clipboard!');
                    }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>

              {/* Live Queue Button - Prominent */}
              <div className="live-queue-section">
                <button 
                  className="live-queue-btn"
                  onClick={() => setShowLiveTracker(true)}
                >
                  <div className="live-indicator-btn">
                    <span className="live-dot-btn"></span>
                    LIVE
                  </div>
                  <i className="fas fa-users"></i>
                  <span>View Live Queue Status</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
                <p className="live-queue-hint">See real-time queue position and when it's your turn</p>
              </div>

              <div className="success-actions">
                <button className="add-calendar-btn" onClick={() => {
                  const estTime = bookedAppointment?.estimatedTime || calculateEstimatedTime(queueInfo?.nextQueueNumber || 1);
                  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Doctor Appointment - Dr. ${doctor?.name}`)}&dates=${selectedDate.replace(/-/g, '')}T${estTime.replace(':', '')}00/${selectedDate.replace(/-/g, '')}T${estTime.replace(':', '')}30`;
                  window.open(gcalUrl, '_blank');
                }}>
                  <i className="fas fa-calendar-plus"></i> Add to Calendar
                </button>
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
    </div>
  );
};

export default CinemaStyleBooking;