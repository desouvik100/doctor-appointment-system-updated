import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './CinemaStyleBooking.css';

const CinemaStyleBooking = ({ doctor, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Details, 4: Confirm
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('in_person');
  const [reason, setReason] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const doctorId = doctor?._id || doctor?.id;

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

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
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      calendar.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        isAvailable: dayOfWeek !== 'sunday' && date >= today,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today
      });
    }
    setCalendarData(calendar);
  };

  const fetchAvailableSlots = async (dateStr) => {
    try {
      setSlotsLoading(true);
      const [slotsRes, bookedRes] = await Promise.all([
        axios.get(`/api/doctors/${doctorId}/available-slots?date=${dateStr}`),
        axios.get(`/api/appointments/booked-times/${doctorId}/${dateStr}`)
      ]);
      
      if (slotsRes.data.success && slotsRes.data.available) {
        setAvailableSlots(slotsRes.data.slots || []);
      } else {
        // Generate default slots
        setAvailableSlots(generateDefaultSlots());
      }
      
      setBookedSlots(bookedRes.data.bookedTimes || []);
    } catch (error) {
      setAvailableSlots(generateDefaultSlots());
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const generateDefaultSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      if (hour !== 13) { // Skip lunch
        slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, type: 'both' });
        slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, type: 'both' });
      }
    }
    return slots;
  };

  const handleDateSelect = (day) => {
    if (day.isPast || !day.isAvailable) return;
    setSelectedDate(day.date);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    if (bookedSlots.includes(slot.time)) return;
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/appointments', {
        userId: user.id || user._id,
        doctorId: doctorId,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        date: selectedDate,
        time: selectedSlot.time,
        reason: reason.trim(),
        consultationType
      });

      toast.success('Appointment booked successfully!');
      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
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
    return new Date(dateStr).toLocaleDateString('en-IN', {
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

  // Group slots by time period
  const groupedSlots = {
    morning: availableSlots.filter(s => parseInt(s.time.split(':')[0]) < 12),
    afternoon: availableSlots.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: availableSlots.filter(s => parseInt(s.time.split(':')[0]) >= 17)
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
                <i className="fas fa-user-md"></i>
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

        {/* Progress Steps */}
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
              {step > 2 ? <i className="fas fa-check"></i> : <i className="fas fa-clock"></i>}
            </div>
            <span>Select Time</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 3 ? <i className="fas fa-check"></i> : <i className="fas fa-clipboard"></i>}
            </div>
            <span>Details</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="cinema-booking-content">
          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div className="date-selection">
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

          {/* Step 2: Time Selection - Cinema Style */}
          {step === 2 && (
            <div className="time-selection">
              <div className="selected-date-banner">
                <i className="fas fa-calendar-check"></i>
                <span>{formatDate(selectedDate)}</span>
                <button onClick={() => setStep(1)} className="change-btn">Change</button>
              </div>

              {slotsLoading ? (
                <div className="slots-loading">
                  <div className="spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : (
                <div className="slots-container">
                  {/* Morning Slots */}
                  {groupedSlots.morning.length > 0 && (
                    <div className="slot-group">
                      <h4><i className="fas fa-sun"></i> Morning</h4>
                      <div className="slots-grid">
                        {groupedSlots.morning.map(slot => {
                          const isBooked = bookedSlots.includes(slot.time);
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              className={`slot-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={isBooked}
                            >
                              <span className="slot-time">{formatTime(slot.time)}</span>
                              {isBooked && <span className="booked-label">Booked</span>}
                              {slot.type !== 'both' && (
                                <span className="slot-type">
                                  <i className={slot.type === 'virtual' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Afternoon Slots */}
                  {groupedSlots.afternoon.length > 0 && (
                    <div className="slot-group">
                      <h4><i className="fas fa-cloud-sun"></i> Afternoon</h4>
                      <div className="slots-grid">
                        {groupedSlots.afternoon.map(slot => {
                          const isBooked = bookedSlots.includes(slot.time);
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              className={`slot-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={isBooked}
                            >
                              <span className="slot-time">{formatTime(slot.time)}</span>
                              {isBooked && <span className="booked-label">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evening Slots */}
                  {groupedSlots.evening.length > 0 && (
                    <div className="slot-group">
                      <h4><i className="fas fa-moon"></i> Evening</h4>
                      <div className="slots-grid">
                        {groupedSlots.evening.map(slot => {
                          const isBooked = bookedSlots.includes(slot.time);
                          const isSelected = selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={slot.time}
                              className={`slot-btn ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={isBooked}
                            >
                              <span className="slot-time">{formatTime(slot.time)}</span>
                              {isBooked && <span className="booked-label">Booked</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableSlots.length === 0 && (
                    <div className="no-slots">
                      <i className="fas fa-calendar-times"></i>
                      <p>No slots available on this date</p>
                      <button onClick={() => setStep(1)}>Select Another Date</button>
                    </div>
                  )}
                </div>
              )}

              <div className="slots-legend">
                <span><span className="legend-box available"></span> Available</span>
                <span><span className="legend-box booked"></span> Booked</span>
                <span><span className="legend-box selected"></span> Selected</span>
              </div>
            </div>
          )}


          {/* Step 3: Details */}
          {step === 3 && (
            <div className="details-section">
              <div className="selection-summary">
                <div className="summary-item">
                  <i className="fas fa-calendar"></i>
                  <div>
                    <span className="label">Date</span>
                    <span className="value">{formatDate(selectedDate)}</span>
                  </div>
                  <button onClick={() => setStep(1)}>Change</button>
                </div>
                <div className="summary-item">
                  <i className="fas fa-clock"></i>
                  <div>
                    <span className="label">Time</span>
                    <span className="value">{formatTime(selectedSlot?.time)}</span>
                  </div>
                  <button onClick={() => setStep(2)}>Change</button>
                </div>
              </div>

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

              <div className="reason-input">
                <h4>Reason for Visit <span className="required">*</span></h4>
                <textarea
                  placeholder="Describe your symptoms or reason for consultation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>

              <button 
                className="proceed-btn"
                onClick={() => setStep(4)}
                disabled={!reason.trim()}
              >
                Proceed to Confirm <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
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
                    <span className="label"><i className="fas fa-clock"></i> Time</span>
                    <span className="value">{formatTime(selectedSlot?.time)}</span>
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
                  <p>{reason}</p>
                </div>
              </div>

              <div className="confirm-actions">
                <button className="back-btn" onClick={() => setStep(3)}>
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
        </div>
      </div>
    </div>
  );
};

export default CinemaStyleBooking;
