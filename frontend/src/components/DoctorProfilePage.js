import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import CinemaStyleBooking from './CinemaStyleBooking';
import './DoctorProfilePage.css';

const DoctorProfilePage = ({ doctor, user, onBack, onBookingSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const doctorId = doctor?._id || doctor?.id;

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
      fetchCalendar();
    }
  }, [doctorId]);

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const [doctorRes, scheduleRes] = await Promise.all([
        axios.get(`/api/doctors/${doctorId}`),
        axios.get(`/api/doctors/${doctorId}/schedule`)
      ]);
      setDoctorData(doctorRes.data);
      if (scheduleRes.data.success) {
        setSchedule(scheduleRes.data.schedule);
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      setDoctorData(doctor); // Use passed doctor data as fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const response = await axios.get(`/api/doctors/${doctorId}/calendar?month=${month}&year=${year}`);
      if (response.data.success) {
        setCalendarData(response.data.calendar || []);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      // Generate default calendar if API fails
      generateDefaultCalendar();
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
      const response = await axios.get(`/api/doctors/${doctorId}/available-slots?date=${dateStr}`);
      if (response.data.success) {
        setAvailableSlots(response.data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateClick = (day) => {
    if (day.isPast || !day.isAvailable) return;
    setSelectedDate(day.date);
    fetchAvailableSlots(day.date);
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    if (newMonth >= new Date(new Date().getFullYear(), new Date().getMonth())) {
      setCurrentMonth(newMonth);
      setSelectedDate(null);
      setAvailableSlots([]);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setAvailableSlots([]);
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

  const doc = doctorData || doctor;

  if (loading) {
    return (
      <div className="doctor-profile-loading">
        <div className="spinner"></div>
        <p>Loading doctor profile...</p>
      </div>
    );
  }

  return (
    <div className="doctor-profile-page">
      {/* Back Button */}
      <button className="doctor-profile-back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Doctors
      </button>

      <div className="doctor-profile-container">
        {/* Left: Doctor Info */}
        <div className="doctor-profile-info">
          <div className="doctor-profile-card">
            <div className="doctor-profile-header">
              {doc?.profilePhoto ? (
                <img src={doc.profilePhoto} alt={doc.name} className="doctor-profile-photo" />
              ) : (
                <div className="doctor-profile-photo-placeholder">
                  <i className="fas fa-user-md"></i>
                </div>
              )}
              <div className="doctor-profile-details">
                <h1>Dr. {doc?.name}</h1>
                <p className="specialization">{doc?.specialization}</p>
                {doc?.qualification && <p className="qualification">{doc.qualification}</p>}
                {doc?.rating > 0 && (
                  <div className="rating">
                    <i className="fas fa-star"></i>
                    <span>{doc.rating.toFixed(1)}</span>
                    <span className="review-count">({doc.reviewCount || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="doctor-profile-meta">
              {doc?.experience > 0 && (
                <div className="meta-item">
                  <i className="fas fa-award"></i>
                  <span>{doc.experience} years experience</span>
                </div>
              )}
              <div className="meta-item">
                <i className="fas fa-hospital"></i>
                <span>{doc?.clinicId?.name || 'HealthSync Clinic'}</span>
              </div>
              {doc?.clinicId?.address && (
                <div className="meta-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{doc.clinicId.address}, {doc.clinicId.city}</span>
                </div>
              )}
              <div className="meta-item">
                <i className="fas fa-rupee-sign"></i>
                <span>₹{doc?.consultationFee || 500} per consultation</span>
              </div>
            </div>

            {/* Consultation Types */}
            <div className="consultation-types">
              <h3>Consultation Available</h3>
              <div className="type-badges">
                {(schedule?.consultationSettings?.inClinicConsultationEnabled !== false) && (
                  <span className="type-badge in-clinic">
                    <i className="fas fa-hospital"></i> In-Clinic
                  </span>
                )}
                {(schedule?.consultationSettings?.virtualConsultationEnabled !== false) && (
                  <span className="type-badge virtual">
                    <i className="fas fa-video"></i> Video Consultation
                  </span>
                )}
              </div>
            </div>

            {/* Book Button */}
            <button 
              className="book-appointment-btn"
              onClick={() => setShowBookingModal(true)}
              disabled={doc?.availability === 'Unavailable'}
            >
              <i className="fas fa-calendar-plus"></i>
              Book Appointment
            </button>
          </div>
        </div>

        {/* Right: Availability Calendar */}
        <div className="doctor-profile-calendar">
          <div className="calendar-card">
            <h2><i className="fas fa-calendar-alt"></i> Availability Calendar</h2>
            <p className="calendar-subtitle">Select a date to see available time slots</p>

            {/* Calendar Navigation */}
            <div className="calendar-nav">
              <button onClick={prevMonth} disabled={currentMonth <= new Date()}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
              <button onClick={nextMonth}>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Day Headers */}
            <div className="calendar-header">
              {dayNames.map(day => (
                <div key={day} className="calendar-day-name">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {(() => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                const cells = [];
                
                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
                }
                
                // Day cells
                calendarData.forEach(day => {
                  const dayNum = new Date(day.date).getDate();
                  cells.push(
                    <div
                      key={day.date}
                      className={`calendar-cell 
                        ${day.isAvailable ? 'available' : 'unavailable'}
                        ${day.isToday ? 'today' : ''}
                        ${day.isPast ? 'past' : ''}
                        ${day.isSpecialDate ? 'special' : ''}
                        ${selectedDate === day.date ? 'selected' : ''}`}
                      onClick={() => handleDateClick(day)}
                      title={day.reason || (day.isAvailable ? 'Available' : 'Not available')}
                    >
                      <span className="day-number">{dayNum}</span>
                      {day.isAvailable && !day.isPast && (
                        <span className="availability-dot"></span>
                      )}
                      {day.isSpecialDate && (
                        <span className="special-icon"><i className="fas fa-star"></i></span>
                      )}
                    </div>
                  );
                });
                
                return cells;
              })()}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot available"></span> Available
              </div>
              <div className="legend-item">
                <span className="legend-dot unavailable"></span> Not Available
              </div>
              <div className="legend-item">
                <span className="legend-dot selected"></span> Selected
              </div>
            </div>

            {/* Selected Date Slots */}
            {selectedDate && (
              <div className="selected-date-slots">
                <h4>
                  <i className="fas fa-clock"></i>
                  Available Slots for {formatDate(selectedDate)}
                </h4>
                
                {slotsLoading ? (
                  <div className="slots-loading">
                    <i className="fas fa-spinner fa-spin"></i> Loading slots...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="slots-grid">
                    {availableSlots.map((slot, idx) => (
                      <div key={idx} className={`slot-item ${slot.type || 'both'}`}>
                        <span className="slot-time">{formatTime(slot.time)}</span>
                        {slot.type && slot.type !== 'both' && (
                          <span className="slot-type-icon">
                            <i className={slot.type === 'virtual' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-slots">
                    <i className="fas fa-calendar-times"></i>
                    <p>No slots available on this date</p>
                  </div>
                )}

                {availableSlots.length > 0 && (
                  <button 
                    className="book-selected-btn"
                    onClick={() => setShowBookingModal(true)}
                  >
                    <i className="fas fa-calendar-check"></i>
                    Book for {formatDate(selectedDate)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cinema Style Booking Modal */}
      {showBookingModal && (
        <CinemaStyleBooking
          doctor={doc}
          user={user}
          onClose={() => setShowBookingModal(false)}
          onSuccess={(appointment) => {
            setShowBookingModal(false);
            toast.success('Appointment booked successfully!');
            if (onBookingSuccess) onBookingSuccess(appointment);
          }}
        />
      )}
    </div>
  );
};

export default DoctorProfilePage;
