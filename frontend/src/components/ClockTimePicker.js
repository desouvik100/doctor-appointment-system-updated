import { useState, useEffect } from 'react';
import './ClockTimePicker.css';

const ClockTimePicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('hours'); // hours or minutes
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setPeriod(hours >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  const formatTime = (hour, minute, ampm) => {
    let h = hour;
    if (ampm === 'PM' && hour !== 12) h = hour + 12;
    if (ampm === 'AM' && hour === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const formatDisplayTime = () => {
    if (!value) return '--:--';
    const [hours, minutes] = value.split(':').map(Number);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const handleHourClick = (hour) => {
    setSelectedHour(hour);
    setActiveView('minutes');
  };

  const handleMinuteClick = (minute) => {
    setSelectedMinute(minute);
    const timeStr = formatTime(selectedHour, minute, period);
    onChange(timeStr);
    setIsOpen(false);
    setActiveView('hours');
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (selectedHour && selectedMinute !== undefined) {
      const timeStr = formatTime(selectedHour, selectedMinute, newPeriod);
      onChange(timeStr);
    }
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate position on clock face
  const getPosition = (index, total, radius) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`
    };
  };

  return (
    <div className="clock-time-picker">
      {label && <label className="clock-picker-label">{label}</label>}
      <div className="clock-picker-input" onClick={() => setIsOpen(!isOpen)}>
        <i className="fas fa-clock"></i>
        <span>{formatDisplayTime()}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </div>

      {isOpen && (
        <>
          <div className="clock-picker-overlay" onClick={() => setIsOpen(false)}></div>
          <div className="clock-picker-dropdown">
            {/* Header */}
          <div className="clock-picker-header">
            <div className="time-display">
              <span 
                className={`time-part ${activeView === 'hours' ? 'active' : ''}`}
                onClick={() => setActiveView('hours')}
              >
                {String(selectedHour).padStart(2, '0')}
              </span>
              <span className="time-separator">:</span>
              <span 
                className={`time-part ${activeView === 'minutes' ? 'active' : ''}`}
                onClick={() => setActiveView('minutes')}
              >
                {String(selectedMinute).padStart(2, '0')}
              </span>
            </div>
            <div className="period-selector">
              <button 
                className={`period-btn ${period === 'AM' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('AM')}
              >
                AM
              </button>
              <button 
                className={`period-btn ${period === 'PM' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('PM')}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clock Face */}
          <div className="clock-face">
            <div className="clock-center"></div>
            
            {activeView === 'hours' ? (
              // Hours
              hours.map((hour, index) => {
                const pos = getPosition(index, 12, 38);
                return (
                  <div
                    key={hour}
                    className={`clock-number ${selectedHour === hour ? 'selected' : ''}`}
                    style={pos}
                    onClick={() => handleHourClick(hour)}
                  >
                    {hour}
                  </div>
                );
              })
            ) : (
              // Minutes
              minutes.map((minute, index) => {
                const pos = getPosition(index, 12, 38);
                return (
                  <div
                    key={minute}
                    className={`clock-number minute ${selectedMinute === minute ? 'selected' : ''}`}
                    style={pos}
                    onClick={() => handleMinuteClick(minute)}
                  >
                    {String(minute).padStart(2, '0')}
                  </div>
                );
              })
            )}

            {/* Clock hand */}
            <div 
              className="clock-hand"
              style={{
                transform: `rotate(${activeView === 'hours' 
                  ? (selectedHour % 12) * 30 - 90 
                  : (selectedMinute / 5) * 30 - 90}deg)`
              }}
            ></div>
          </div>

          {/* Quick Select */}
          <div className="quick-times">
            <span className="quick-label">Quick:</span>
            {['09:00', '12:00', '14:00', '17:00', '20:00'].map(time => (
              <button
                key={time}
                className="quick-time-btn"
                onClick={() => {
                  onChange(time);
                  const [h, m] = time.split(':').map(Number);
                  setSelectedHour(h % 12 || 12);
                  setSelectedMinute(m);
                  setPeriod(h >= 12 ? 'PM' : 'AM');
                  setIsOpen(false);
                }}
              >
                {parseInt(time.split(':')[0]) > 12 
                  ? `${parseInt(time.split(':')[0]) - 12}PM` 
                  : parseInt(time.split(':')[0]) === 12 
                    ? '12PM'
                    : `${parseInt(time.split(':')[0])}AM`}
              </button>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default ClockTimePicker;
