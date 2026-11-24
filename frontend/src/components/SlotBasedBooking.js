import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './SlotBasedBooking.css';

const SlotBasedBooking = ({ doctor, user, onClose, onSuccess }) => {
  // Step 1: Choose appointment type FIRST
  const [appointmentType, setAppointmentType] = useState(null); // 'online' or 'clinic'
  const [step, setStep] = useState(1); // 1: Type, 2: Date, 3: Slot, 4: Confirm, 5: Success
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [bookedAppointment, setBookedAppointment] = useState(null);
  
  const [calendarDays, setCalendarDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const doctorId = doctor?._id || doctor?.id;

  // Generate calendar days
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Fetch slots when date and type are selected
  useEffect(() => {
    if (selectedDate && appointmentType) {
      fetchSlots();
    }
  }, [selectedDate, appointmentType]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      days.push({
        date: dateStr,
        dayNum: day,
        dayOfWeek,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
        isWeekend: dayOfWeek === 0
      });
    }
    setCalendarDays(days);
  };

  const fetchSlots = async () => {
    if (!selectedDate || !appointmentType) return;
    
    try {
      setSlotsLoading(true);
      setAvailableSlots([]);
      setSelectedSlot(null);
      
      // Use availableOnly=true to get only available slots for patient booking
      const endpoint = appointmentType === 'online' 
        ? `/api/slots/online/${doctorId}/${selectedDate}?availableOnly=true`
        : `/api/slots/clinic/${doctorId}/${selectedDate}?availableOnly=true`;
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setAvailableSlots(response.data.slots || []);
        if (response.data.slots?.length === 0) {
          toast('No slots available for this date', { icon: '📅' });
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleTypeSelect = (type) => {
    setAppointmentType(type);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setStep(2);
  };

  const handleDateSelect = (day) => {
    if (day.isPast || day.isWeekend) return;
    setSelectedDate(day.date);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !appointmentType) {
      toast.error('Please select a slot');
      return;
    }

    try {
      setLoading(true);
      
      // Book the slot with strict type validation
      const bookingResponse = await axios.post('/api/slots/book', {
        slotId: selectedSlot._id,
        slotType: appointmentType === 'online' ? 'online' : 'clinic',
        userId: user.id || user._id,
        appointmentData: {
          consultationType: appointmentType === 'online' ? 'online' : 'in_person'
        }
      });

      if (!bookingResponse.data.success) {
        throw new Error(bookingResponse.data.message);
      }

      // Create the appointment
      const appointmentResponse = await axios.post('/api/appointments/slot-booking', {
        userId: user.id || user._id,
        doctorId: doctorId,
        clinicId: doctor.clinicId?._id || doctor.clinicId,
        slotId: selectedSlot._id,
        slotType: appointmentType === 'online' ? 'online' : 'clinic',
        date: selectedDate,
        time: selectedSlot.startTime,
        reason: reason || 'General Consultation',
        consultationType: appointmentType === 'online' ? 'online' : 'in_person'
      });

      if (appointmentResponse.data.success) {
        setBookedAppointment(appointmentResponse.data);
        setStep(5);
        toast.success('Appointment booked successfully!');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || error.message || 'Booking failed');
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
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="slot-booking-overlay" onClick={onClose}>
      <div className="slot-booking-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="slot-booking-header">
          <div className="doctor-info">
            <div className="doctor-avatar">
              {doctor?.name?.charAt(0) || 'D'}
            </div>
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
        <div className="slot-booking-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-num">{step > 1 ? '✓' : '1'}</div>
            <span>Type</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-num">{step > 2 ? '✓' : '2'}</div>
            <span>Date</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-num">{step > 3 ? '✓' : '3'}</div>
            <span>Slot</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <div className="step-num">{step > 4 ? '✓' : '4'}</div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="slot-booking-content">
          {/* Step 1: Choose Appointment Type FIRST */}
          {step === 1 && (
            <div className="type-selection">
              <h3>Choose Appointment Type</h3>
              <p className="type-subtitle">Select how you'd like to consult with the doctor</p>
              
              <div className="type-cards">
                <div 
                  className="type-card online"
                  onClick={() => handleTypeSelect('online')}
                >
                  <div className="type-icon">
                    <i className="fas fa-video"></i>
                  </div>
                  <h4>Online Consultation</h4>
                  <p>Video call from anywhere</p>
                  <ul className="type-features">
                    <li><i className="fas fa-check"></i> No travel required</li>
                    <li><i className="fas fa-check"></i> Shorter wait times</li>
                    <li><i className="fas fa-check"></i> Get prescription online</li>
                  </ul>
                  <div className="type-badge">
                    <i className="fas fa-clock"></i> ~20 min slots
                  </div>
                </div>

                <div 
                  className="type-card clinic"
                  onClick={() => handleTypeSelect('clinic')}
                >
                  <div className="type-icon">
                    <i className="fas fa-hospital"></i>
                  </div>
                  <h4>In-Clinic Visit</h4>
                  <p>Visit the clinic in person</p>
                  <ul className="type-features">
                    <li><i className="fas fa-check"></i> Physical examination</li>
                    <li><i className="fas fa-check"></i> Lab tests on-site</li>
                    <li><i className="fas fa-check"></i> Detailed consultation</li>
                  </ul>
                  <div className="type-badge">
                    <i className="fas fa-clock"></i> ~30 min slots
                  </div>
                </div>
              </div>

              <div className="type-note">
                <i className="fas fa-info-circle"></i>
                <span>Online and clinic slots are completely separate. Choose based on your needs.</span>
              </div>
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === 2 && (
            <div className="date-selection">
              <div className="selection-header">
                <button className="back-btn" onClick={() => setStep(1)}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="selected-type-badge">
                  <i className={`fas ${appointmentType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                  {appointmentType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
                </div>
              </div>

              <h3>Select Date</h3>
              
              <div className="calendar-nav">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h4>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h4>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
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
                  
                  calendarDays.forEach(day => {
                    cells.push(
                      <div
                        key={day.date}
                        className={`calendar-cell 
                          ${!day.isPast && !day.isWeekend ? 'available' : 'unavailable'}
                          ${day.isToday ? 'today' : ''}
                          ${day.isPast ? 'past' : ''}
                          ${day.isWeekend ? 'weekend' : ''}
                          ${selectedDate === day.date ? 'selected' : ''}`}
                        onClick={() => handleDateSelect(day)}
                      >
                        <span>{day.dayNum}</span>
                      </div>
                    );
                  });
                  
                  return cells;
                })()}
              </div>
            </div>
          )}

          {/* Step 3: Select Slot */}
          {step === 3 && (
            <div className="slot-selection">
              <div className="selection-header">
                <button className="back-btn" onClick={() => setStep(2)}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="selected-info">
                  <span className={`type-badge ${appointmentType}`}>
                    <i className={`fas ${appointmentType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                    {appointmentType === 'online' ? 'Online' : 'Clinic'}
                  </span>
                  <span className="date-badge">
                    <i className="fas fa-calendar"></i>
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>

              <h3>Select Time Slot</h3>
              <p className="slot-subtitle">
                {appointmentType === 'online' 
                  ? 'Available online consultation slots' 
                  : 'Available in-clinic appointment slots'}
              </p>

              {slotsLoading ? (
                <div className="slots-loading">
                  <div className="spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="no-slots">
                  <i className="fas fa-calendar-times"></i>
                  <h4>No Slots Available</h4>
                  <p>No {appointmentType === 'online' ? 'online' : 'clinic'} slots for this date</p>
                  <button onClick={() => setStep(2)}>Choose Another Date</button>
                </div>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map(slot => (
                    <div
                      key={slot._id}
                      className={`slot-card ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <div className="slot-time">
                        {formatTime(slot.startTime)}
                      </div>
                      <div className="slot-duration">
                        {slot.duration} min
                      </div>
                      {selectedSlot?._id === slot._id && (
                        <div className="slot-check">
                          <i className="fas fa-check"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <div className="slot-actions">
                  <div className="reason-input">
                    <label>Reason for Visit (Optional)</label>
                    <textarea
                      placeholder="Describe your symptoms or reason..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <button className="proceed-btn" onClick={() => setStep(4)}>
                    Proceed to Confirm <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="confirmation">
              <div className="selection-header">
                <button className="back-btn" onClick={() => setStep(3)}>
                  <i className="fas fa-arrow-left"></i>
                </button>
              </div>

              <h3>Confirm Booking</h3>

              <div className="booking-summary">
                <div className="summary-card">
                  <div className={`summary-type ${appointmentType}`}>
                    <i className={`fas ${appointmentType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                    {appointmentType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
                  </div>

                  <div className="summary-row">
                    <i className="fas fa-user-md"></i>
                    <span>Dr. {doctor?.name}</span>
                  </div>
                  <div className="summary-row">
                    <i className="fas fa-stethoscope"></i>
                    <span>{doctor?.specialization}</span>
                  </div>
                  <div className="summary-row highlight">
                    <i className="fas fa-calendar"></i>
                    <span>{formatDate(selectedDate)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <i className="fas fa-clock"></i>
                    <span>{formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}</span>
                  </div>
                  {reason && (
                    <div className="summary-row">
                      <i className="fas fa-notes-medical"></i>
                      <span>{reason}</span>
                    </div>
                  )}
                </div>

                <div className="fee-section">
                  <div className="fee-row">
                    <span>Consultation Fee</span>
                    <span>₹{doctor?.consultationFee || 500}</span>
                  </div>
                  <div className="fee-row total">
                    <span>Total</span>
                    <span>₹{doctor?.consultationFee || 500}</span>
                  </div>
                </div>

                <div className="confirm-note">
                  <i className="fas fa-shield-alt"></i>
                  <span>
                    {appointmentType === 'online' 
                      ? 'Video call link will be sent to your email before the appointment'
                      : 'Please arrive 15 minutes before your appointment time'}
                  </span>
                </div>
              </div>

              <div className="confirm-actions">
                <button className="cancel-btn" onClick={() => setStep(3)}>
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

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="booking-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Booking Confirmed!</h3>
              <p>Your {appointmentType === 'online' ? 'online consultation' : 'clinic appointment'} has been booked</p>

              <div className="success-details">
                <div className={`success-type ${appointmentType}`}>
                  <i className={`fas ${appointmentType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                  {appointmentType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
                </div>
                <div className="success-info">
                  <p><strong>Dr. {doctor?.name}</strong></p>
                  <p>{formatDate(selectedDate)}</p>
                  <p>{formatTime(selectedSlot?.startTime)}</p>
                </div>
              </div>

              <div className="success-actions">
                <button className="done-btn" onClick={() => { onSuccess && onSuccess(bookedAppointment); onClose(); }}>
                  <i className="fas fa-check"></i> Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotBasedBooking;
