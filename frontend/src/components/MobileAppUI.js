import { useState } from 'react';
import './MobileAppUI.css';

// Mobile Home Screen Component
export const MobileHomeScreen = ({ user, onVideoConsult, onClinicVisit, onSmartMatch, onSearch }) => {
  return (
    <div className="mobile-app">
      {/* Header */}
      <div className="mobile-header">
        <div className="header-logo">H</div>
        <button className="header-search-btn">
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* Hero Text */}
      <div className="mobile-hero-text">
        <h1>Your health. Your time.<br />Your choice.</h1>
      </div>

      {/* Service Cards */}
      <div className="service-cards">
        <div className="service-card" onClick={onVideoConsult}>
          <div className="service-icon video">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='20' r='12' fill='%23b8d4ce'/%3E%3Crect x='20' y='32' width='24' height='28' rx='4' fill='%2387bdb0'/%3E%3Ccircle cx='32' cy='18' r='6' fill='%23fff'/%3E%3C/svg%3E" alt="Doctor" />
          </div>
          <span className="service-label">Video<br />Consultation</span>
        </div>
        
        <div className="service-card" onClick={onClinicVisit}>
          <div className="service-icon clinic">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='12' y='20' width='40' height='36' rx='4' fill='%23b8d4ce'/%3E%3Crect x='22' y='8' width='20' height='16' rx='2' fill='%2387bdb0'/%3E%3Crect x='28' y='28' width='8' height='28' fill='%23fff'/%3E%3Crect x='22' y='34' width='20' height='6' fill='%23fff'/%3E%3C/svg%3E" alt="Clinic" />
          </div>
          <span className="service-label">Clinic<br />Visit</span>
        </div>
      </div>

      {/* Smart Doctor Match */}
      <div className="smart-match-card" onClick={onSmartMatch}>
        <div className="smart-match-icon">
          <i className="fas fa-robot"></i>
        </div>
        <span className="smart-match-label">Smart Doctor Match</span>
        <i className="fas fa-chevron-right smart-match-arrow"></i>
      </div>
    </div>
  );
};

// Symptom Language Selection Screen
export const SymptomLanguageScreen = ({ onNext, onBack }) => {
  const [selectedLang, setSelectedLang] = useState('English');
  const languages = ['English', 'Español', 'हिंदी', 'Français'];

  return (
    <div className="mobile-app">
      <button className="back-btn" onClick={onBack}>
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="symptom-content">
        <h1>Tell us about<br />your symptoms</h1>
        <p className="subtitle">What language do you prefer?</p>

        <div className="language-grid">
          {languages.map(lang => (
            <button
              key={lang}
              className={`lang-btn ${selectedLang === lang ? 'active' : ''}`}
              onClick={() => setSelectedLang(lang)}
            >
              {lang}
            </button>
          ))}
        </div>

        <button className="next-btn" onClick={() => onNext(selectedLang)}>
          Next
        </button>
      </div>
    </div>
  );
};

// Doctor Profile Screen
export const DoctorProfileScreen = ({ doctor, onBack, onBook }) => {
  return (
    <div className="mobile-app">
      <button className="back-btn" onClick={onBack}>
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="doctor-profile">
        <div className="doctor-header">
          <div className="doctor-avatar">
            {doctor?.profilePhoto ? (
              <img src={doctor.profilePhoto} alt={doctor.name} />
            ) : (
              <div className="avatar-placeholder">
                {doctor?.name?.charAt(0) || 'D'}
              </div>
            )}
          </div>
          <div className="doctor-info">
            <h2>Dr. {doctor?.name || 'Emily Carter'}</h2>
            <p className="specialty">{doctor?.specialization || 'Cardiologist'}</p>
            <div className="doctor-stats">
              <span>{doctor?.experience || '9'} years</span>
              <span className="rating">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
                <i className="far fa-star"></i>
                {doctor?.reviewCount || '4100'}
              </span>
            </div>
          </div>
        </div>

        <div className="availability-section">
          <h3>Availability</h3>
          <div className="date-row">
            <span className="date-label">About date</span>
            <span className="date-value">10:00 AM</span>
          </div>
        </div>

        <div className="slots-section">
          <div className="slot-row">
            <span className="slot-day">Today</span>
            <span className="slot-time active">10:30 AM</span>
          </div>
          <div className="slot-row">
            <span className="slot-time">11:00 AM</span>
            <span className="slot-time active">11:00 AM</span>
          </div>
          <div className="slot-row">
            <span className="slot-time">11:30 AM</span>
            <span className="slot-time active">11:30 AM</span>
          </div>
        </div>

        <button className="book-btn" onClick={onBook}>
          Book Appointment
        </button>

        <div className="bottom-actions">
          <button className="action-btn"><i className="far fa-thumbs-up"></i></button>
          <button className="action-btn"><i className="far fa-comment"></i></button>
          <button className="action-btn"><i className="fas fa-download"></i></button>
        </div>
      </div>
    </div>
  );
};

// Schedule Screen
export const ScheduleScreen = ({ doctor, onBack, onSelectSlot }) => {
  const [activeTab, setActiveTab] = useState('clinic');
  const [selectedDate, setSelectedDate] = useState(14);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const days = [
    { day: 'S', date: 9 }, { day: 'M', date: 10 }, { day: 'Tu', date: 11 },
    { day: 'W', date: 12 }, { day: 'Th', date: 13 }, { day: 'F', date: 14 }, { day: 'S', date: 15 },
    { day: 'S', date: 16 }, { day: 'M', date: 17 }, { day: 'Tu', date: 18 },
    { day: 'W', date: 19 }, { day: 'Th', date: 20 }, { day: 'F', date: 21 }, { day: 'S', date: 22 }
  ];

  const slots = [
    { time: '9:00 AM', status: 'available' },
    { time: '10:00 AM', status: 'booked' },
    { time: '11:00 AM', status: 'available' },
    { time: '2:00 PM', status: 'available' },
  ];

  return (
    <div className="mobile-app">
      <div className="schedule-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>My Schedule</h2>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button 
          className={`tab-btn ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          Online
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clinic' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinic')}
        >
          In Clinic
        </button>
      </div>

      {/* Month Navigation */}
      <div className="month-nav">
        <button className="nav-btn"><i className="fas fa-chevron-left"></i></button>
        <span>May 2024</span>
        <button className="nav-btn"><i className="fas fa-chevron-right"></i></button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {days.map((d, i) => (
          <div 
            key={i}
            className={`calendar-day ${selectedDate === d.date ? 'selected' : ''}`}
            onClick={() => setSelectedDate(d.date)}
          >
            <span className="day-name">{d.day}</span>
            <span className="day-date">{d.date}</span>
          </div>
        ))}
      </div>

      {/* Time Slots */}
      <div className="time-slots">
        {slots.map((slot, i) => (
          <div 
            key={i} 
            className={`time-slot ${slot.status} ${selectedSlot === i ? 'selected' : ''}`}
            onClick={() => slot.status === 'available' && setSelectedSlot(i)}
          >
            <span className="slot-time">{slot.time}</span>
            <span className={`slot-status ${slot.status}`}>
              {slot.status === 'available' ? 'Available' : 'Booked'}
            </span>
          </div>
        ))}
      </div>

      {/* Share Button */}
      <button className="share-btn">
        <i className="fas fa-download"></i> Share
      </button>
    </div>
  );
};

export default MobileHomeScreen;
