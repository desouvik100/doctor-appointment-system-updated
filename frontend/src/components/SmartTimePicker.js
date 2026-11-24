// frontend/src/components/SmartTimePicker.js
import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import './SmartTimePicker.css';

const SmartTimePicker = ({ doctorId, selectedDate, onTimeSelect, selectedTime }) => {
  const [time, setTime] = useState(selectedTime || '');
  const [bookedTimes, setBookedTimes] = useState([]);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch booked times when date changes
  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchBookedTimes();
    }
  }, [doctorId, selectedDate]);

  // Check availability when time changes
  useEffect(() => {
    if (time && doctorId && selectedDate) {
      checkAvailability();
    } else {
      setAvailability(null);
    }
  }, [time]);

  const fetchBookedTimes = async () => {
    try {
      setLoading(true);
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      const response = await axios.get(`/api/appointments/booked-times/${doctorId}/${formattedDate}`);
      setBookedTimes(response.data.bookedTimes || []);
    } catch (error) {
      console.error('Error fetching booked times:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    try {
      setChecking(true);
      const response = await axios.post('/api/appointments/check-availability', {
        doctorId,
        date: selectedDate,
        time
      });

      setAvailability(response.data);
      
      if (response.data.available) {
        onTimeSelect(time);
      } else {
        onTimeSelect(null);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ available: false, message: 'Error checking availability' });
    } finally {
      setChecking(false);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
  };

  const isTimeBooked = (timeStr) => {
    return bookedTimes.includes(timeStr);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          booked: isTimeBooked(timeStr)
        });
      }
    }
    
    return slots;
  };

  const quickSlots = generateTimeSlots();

  return (
    <div className="smart-time-picker">
      <label className="time-picker-label">
        <i className="fas fa-clock me-2"></i>
        Select Appointment Time
      </label>

      <div className="time-input-wrapper">
        <input
          type="time"
          className={`form-control time-input ${availability ? (availability.available ? 'available' : 'unavailable') : ''}`}
          value={time}
          onChange={handleTimeChange}
          min="09:00"
          max="18:00"
          step="60"
          required
        />
        
        {checking && (
          <div className="checking-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        )}
        
        {availability && !checking && (
          <div className={`availability-badge ${availability.available ? 'available' : 'unavailable'}`}>
            {availability.available ? (
              <>
                <i className="fas fa-check-circle"></i>
                <span>Available</span>
              </>
            ) : (
              <>
                <i className="fas fa-times-circle"></i>
                <span>Booked</span>
              </>
            )}
          </div>
        )}
      </div>

      {availability && !availability.available && (
        <div className="alert alert-warning mt-2">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {availability.message}
        </div>
      )}

      {/* Quick Time Slots */}
      <div className="quick-slots-section mt-3">
        <div className="quick-slots-header">
          <span>Quick Select (30-min intervals)</span>
          {loading && <i className="fas fa-spinner fa-spin ms-2"></i>}
        </div>
        
        <div className="quick-slots-grid">
          {quickSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={`quick-slot-btn ${slot.booked ? 'booked' : 'available'} ${time === slot.time ? 'selected' : ''}`}
              onClick={() => !slot.booked && setTime(slot.time)}
              disabled={slot.booked}
              title={slot.booked ? 'Already booked' : 'Click to select'}
            >
              <span className="slot-time">{slot.time}</span>
              <span className="slot-status">
                {slot.booked ? (
                  <i className="fas fa-times-circle"></i>
                ) : (
                  <i className="fas fa-check-circle"></i>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="time-picker-legend mt-3">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot selected"></span>
          <span>Selected</span>
        </div>
      </div>

      <div className="time-picker-info mt-2">
        <i className="fas fa-info-circle me-2"></i>
        <small>
          You can select any time between 9:00 AM and 6:00 PM. 
          Use the input field for precise minute selection or click quick slots.
        </small>
      </div>
    </div>
  );
};

export default SmartTimePicker;
