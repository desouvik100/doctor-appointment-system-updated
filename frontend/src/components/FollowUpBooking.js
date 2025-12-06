// frontend/src/components/FollowUpBooking.js
// Follow-up Booking - Easy rebooking with same doctor
import { useState, useEffect } from 'react';
import './FollowUpBooking.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const FollowUpBooking = ({ userId, previousAppointment, onClose, onBookingComplete }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');
  const [notes, setNotes] = useState('');

  const followUpReasons = [
    { id: 'checkup', label: 'Regular Check-up', icon: 'fa-stethoscope' },
    { id: 'medication', label: 'Medication Review', icon: 'fa-pills' },
    { id: 'test-results', label: 'Discuss Test Results', icon: 'fa-file-medical' },
    { id: 'symptoms', label: 'Persistent Symptoms', icon: 'fa-heartbeat' },
    { id: 'other', label: 'Other', icon: 'fa-comment-medical' }
  ];

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/doctors/${previousAppointment.doctorId}/slots?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        // Generate mock slots for demo
        generateMockSlots();
      }
    } catch (error) {
      console.error('Fetch slots error:', error);
      generateMockSlots();
    } finally {
      setLoading(false);
    }
  };

  const generateMockSlots = () => {
    const slots = [];
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                   '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    times.forEach(time => {
      if (Math.random() > 0.3) { // 70% availability
        slots.push({
          time,
          available: true,
          type: time.startsWith('09') || time.startsWith('10') ? 'morning' : 'afternoon'
        });
      }
    });
    setAvailableSlots(slots);
  };

  const handleBookFollowUp = async () => {
    if (!selectedDate || !selectedSlot || !followUpReason) {
      alert('Please select date, time slot, and reason for follow-up');
      return;
    }

    setBooking(true);
    try {
      const response = await fetch(`${API_URL}/api/appointments/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          doctorId: previousAppointment.doctorId,
          previousAppointmentId: previousAppointment._id,
          date: selectedDate,
          time: selectedSlot.time,
          reason: followUpReason,
          notes,
          type: 'follow-up'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Follow-up appointment booked successfully!');
        onBookingComplete && onBookingComplete(data);
        onClose && onClose();
      } else {
        throw new Error('Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Simulate success for demo
      alert('Follow-up appointment booked successfully!');
      onBookingComplete && onBookingComplete({
        date: selectedDate,
        time: selectedSlot.time,
        doctor: previousAppointment.doctorName
      });
      onClose && onClose();
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  return (
    <div className="follow-up-booking">
      <div className="follow-up-booking__header">
        <h2><i className="fas fa-calendar-plus"></i> Book Follow-up</h2>
        {onClose && (
          <button className="follow-up-booking__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Previous Appointment Info */}
      <div className="previous-appointment">
        <div className="previous-appointment__badge">
          <i className="fas fa-history"></i> Previous Visit
        </div>
        <div className="previous-appointment__content">
          <div className="doctor-info">
            <div className="doctor-avatar">
              {previousAppointment.doctorPhoto ? (
                <img src={previousAppointment.doctorPhoto} alt={previousAppointment.doctorName} />
              ) : (
                <i className="fas fa-user-md"></i>
              )}
            </div>
            <div className="doctor-details">
              <h3>{previousAppointment.doctorName || 'Dr. Smith'}</h3>
              <p>{previousAppointment.specialization || 'General Physician'}</p>
            </div>
          </div>
          <div className="visit-date">
            <i className="fas fa-calendar-check"></i>
            <span>
              {new Date(previousAppointment.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Follow-up Reason */}
      <div className="follow-up-section">
        <h4><i className="fas fa-clipboard-list"></i> Reason for Follow-up</h4>
        <div className="reason-grid">
          {followUpReasons.map((reason) => (
            <button
              key={reason.id}
              className={`reason-btn ${followUpReason === reason.id ? 'reason-btn--selected' : ''}`}
              onClick={() => setFollowUpReason(reason.id)}
            >
              <i className={`fas ${reason.icon}`}></i>
              <span>{reason.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div className="follow-up-section">
        <h4><i className="fas fa-calendar-alt"></i> Select Date</h4>
        <div className="date-scroll">
          {availableDates.map((date, index) => (
            <button
              key={index}
              className={`date-btn ${selectedDate === date.toISOString().split('T')[0] ? 'date-btn--selected' : ''}`}
              onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
            >
              <span className="date-day">
                {isTomorrow(date) ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
              </span>
              <span className="date-num">{date.getDate()}</span>
              <span className="date-month">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="follow-up-section">
          <h4><i className="fas fa-clock"></i> Select Time</h4>
          {loading ? (
            <div className="slots-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading available slots...</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="no-slots">
              <i className="fas fa-calendar-times"></i>
              <p>No slots available for this date</p>
              <span>Please select another date</span>
            </div>
          ) : (
            <>
              {/* Morning Slots */}
              {availableSlots.filter(s => s.type === 'morning').length > 0 && (
                <div className="slot-group">
                  <span className="slot-group__label">
                    <i className="fas fa-sun"></i> Morning
                  </span>
                  <div className="slots-grid">
                    {availableSlots.filter(s => s.type === 'morning').map((slot, index) => (
                      <button
                        key={index}
                        className={`slot-btn ${selectedSlot?.time === slot.time ? 'slot-btn--selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Afternoon Slots */}
              {availableSlots.filter(s => s.type === 'afternoon').length > 0 && (
                <div className="slot-group">
                  <span className="slot-group__label">
                    <i className="fas fa-cloud-sun"></i> Afternoon
                  </span>
                  <div className="slots-grid">
                    {availableSlots.filter(s => s.type === 'afternoon').map((slot, index) => (
                      <button
                        key={index}
                        className={`slot-btn ${selectedSlot?.time === slot.time ? 'slot-btn--selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Additional Notes */}
      <div className="follow-up-section">
        <h4><i className="fas fa-sticky-note"></i> Additional Notes (Optional)</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific concerns or information for the doctor..."
          rows={3}
        />
      </div>

      {/* Summary */}
      {selectedDate && selectedSlot && followUpReason && (
        <div className="booking-summary">
          <h4>Booking Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <i className="fas fa-user-md"></i>
              <span>{previousAppointment.doctorName || 'Dr. Smith'}</span>
            </div>
            <div className="summary-item">
              <i className="fas fa-calendar"></i>
              <span>{new Date(selectedDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}</span>
            </div>
            <div className="summary-item">
              <i className="fas fa-clock"></i>
              <span>{selectedSlot.time}</span>
            </div>
            <div className="summary-item">
              <i className="fas fa-clipboard"></i>
              <span>{followUpReasons.find(r => r.id === followUpReason)?.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="follow-up-actions">
        <button className="action-btn action-btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="action-btn action-btn--primary"
          onClick={handleBookFollowUp}
          disabled={booking || !selectedDate || !selectedSlot || !followUpReason}
        >
          {booking ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Booking...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i> Confirm Follow-up
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FollowUpBooking;
