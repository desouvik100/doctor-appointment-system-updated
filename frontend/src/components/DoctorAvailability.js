// frontend/src/components/DoctorAvailability.js
// Doctor Availability Calendar - View and manage doctor schedules
import { useState, useEffect } from 'react';
import './DoctorAvailability.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const DoctorAvailability = ({ doctorId, doctorName, onClose, onSlotSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState({});
  const [daySlots, setDaySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // calendar or list

  useEffect(() => {
    fetchMonthAvailability();
  }, [currentMonth, doctorId]);

  const fetchMonthAvailability = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(
        `${API_URL}/api/doctors/${doctorId}/availability?year=${year}&month=${month}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || {});
      } else {
        generateMockAvailability();
      }
    } catch (error) {
      console.error('Fetch availability error:', error);
      generateMockAvailability();
    } finally {
      setLoading(false);
    }
  };

  const generateMockAvailability = () => {
    const mockAvailability = {};
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayOfWeek = date.getDay();
      
      // No availability on Sundays
      if (dayOfWeek === 0) continue;
      
      // Past dates have no availability
      if (date < new Date().setHours(0, 0, 0, 0)) continue;

      const dateStr = date.toISOString().split('T')[0];
      const slotsCount = Math.floor(Math.random() * 8) + 2;
      mockAvailability[dateStr] = {
        available: slotsCount > 0,
        slotsCount,
        status: slotsCount > 5 ? 'high' : slotsCount > 2 ? 'medium' : 'low'
      };
    }
    setAvailability(mockAvailability);
  };

  const fetchDaySlots = async (date) => {
    try {
      const response = await fetch(
        `${API_URL}/api/doctors/${doctorId}/slots?date=${date}`
      );
      if (response.ok) {
        const data = await response.json();
        setDaySlots(data.slots || []);
      } else {
        generateMockSlots();
      }
    } catch (error) {
      console.error('Fetch slots error:', error);
      generateMockSlots();
    }
  };

  const generateMockSlots = () => {
    const slots = [];
    const morningTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const afternoonTimes = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    
    morningTimes.forEach(time => {
      if (Math.random() > 0.3) {
        slots.push({ time, period: 'morning', available: true });
      }
    });
    
    afternoonTimes.forEach(time => {
      if (Math.random() > 0.3) {
        slots.push({ time, period: 'afternoon', available: true });
      }
    });
    
    setDaySlots(slots);
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (availability[dateStr]?.available) {
      setSelectedDate(date);
      fetchDaySlots(dateStr);
    }
  };

  const handleSlotClick = (slot) => {
    if (onSlotSelect) {
      onSlotSelect({
        date: selectedDate,
        time: slot.time,
        doctorId,
        doctorName
      });
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    setSelectedDate(null);
    setDaySlots([]);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDateStatus = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return availability[dateStr];
  };

  const getUpcomingAvailability = () => {
    const upcoming = [];
    const today = new Date();
    
    Object.entries(availability)
      .filter(([dateStr, data]) => {
        const date = new Date(dateStr);
        return date >= today && data.available;
      })
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 7)
      .forEach(([dateStr, data]) => {
        upcoming.push({
          date: new Date(dateStr),
          ...data
        });
      });
    
    return upcoming;
  };

  return (
    <div className="doctor-availability">
      <div className="doctor-availability__header">
        <div className="header-info">
          <h2><i className="fas fa-calendar-alt"></i> Availability</h2>
          <p>{doctorName || 'Doctor Schedule'}</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              <i className="fas fa-calendar"></i>
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

      </div>


      {loading ? (
        <div className="availability-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading availability...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="calendar-view">
          {/* Month Navigation */}
          <div className="month-nav">
            <button onClick={() => navigateMonth(-1)}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <h3>
              {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => navigateMonth(1)}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-header">{day}</div>
            ))}
            
            {/* Calendar Days */}
            {getDaysInMonth().map((date, index) => {
              const status = getDateStatus(date);
              const isSelected = selectedDate && date && 
                selectedDate.toDateString() === date.toDateString();
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} 
                    ${isToday(date) ? 'today' : ''} 
                    ${isPast(date) ? 'past' : ''} 
                    ${status?.available ? 'available' : ''} 
                    ${status?.status || ''} 
                    ${isSelected ? 'selected' : ''}`}
                  onClick={() => date && !isPast(date) && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <span className="day-number">{date.getDate()}</span>
                      {status?.available && (
                        <span className="slots-indicator">
                          {status.slotsCount} slots
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot high"></span>
              <span>High availability</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot medium"></span>
              <span>Medium availability</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot low"></span>
              <span>Low availability</span>
            </div>
          </div>

          {/* Selected Date Slots */}
          {selectedDate && (
            <div className="selected-date-slots">
              <h4>
                <i className="fas fa-clock"></i>
                Available Slots for {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h4>
              
              {daySlots.length === 0 ? (
                <div className="no-slots">
                  <p>No slots available</p>
                </div>
              ) : (
                <div className="slots-container">
                  {/* Morning Slots */}
                  {daySlots.filter(s => s.period === 'morning').length > 0 && (
                    <div className="slot-period">
                      <span className="period-label">
                        <i className="fas fa-sun"></i> Morning
                      </span>
                      <div className="period-slots">
                        {daySlots.filter(s => s.period === 'morning').map((slot, idx) => (
                          <button
                            key={idx}
                            className="slot-btn"
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Afternoon Slots */}
                  {daySlots.filter(s => s.period === 'afternoon').length > 0 && (
                    <div className="slot-period">
                      <span className="period-label">
                        <i className="fas fa-cloud-sun"></i> Afternoon
                      </span>
                      <div className="period-slots">
                        {daySlots.filter(s => s.period === 'afternoon').map((slot, idx) => (
                          <button
                            key={idx}
                            className="slot-btn"
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="list-view">
          <h4>Upcoming Availability</h4>
          <div className="availability-list">
            {getUpcomingAvailability().map((item, index) => (
              <div 
                key={index} 
                className="availability-item"
                onClick={() => handleDateClick(item.date)}
              >
                <div className="item-date">
                  <span className="date-day">
                    {item.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="date-num">{item.date.getDate()}</span>
                  <span className="date-month">
                    {item.date.toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </div>
                <div className="item-info">
                  <span className="slots-count">{item.slotsCount} slots available</span>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'high' ? 'Many slots' : 
                     item.status === 'medium' ? 'Some slots' : 'Few slots'}
                  </span>
                </div>
                <i className="fas fa-chevron-right"></i>
              </div>
            ))}
            
            {getUpcomingAvailability().length === 0 && (
              <div className="no-availability">
                <i className="fas fa-calendar-times"></i>
                <p>No upcoming availability</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
