import { useState, useEffect, useMemo, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import BookingModal from './BookingModal';
import AIAssistant from './AIAssistant';
import './PatientDashboard.css';

const PatientDashboard = ({ user, onLogout }) => {
  const [currentUser] = useState(user);
  const [activeTab, setActiveTab] = useState('doctors');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Doctor list state
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // Debounce ref
  const searchTimeoutRef = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchClinics();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/appointments/user/${currentUser.id}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await axios.get('/api/clinics');
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  // Debounced search handler
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {}, 300);
  };

  // Memoized filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = !searchTerm || 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialization = !selectedSpecialization || 
        doctor.specialization === selectedSpecialization;
      
      const matchesClinic = !selectedClinic || 
        doctor.clinicId?._id === selectedClinic;
      
      return matchesSearch && matchesSpecialization && matchesClinic;
    });
  }, [doctors, searchTerm, selectedSpecialization, selectedClinic]);

  // Get unique specializations
  const specializations = useMemo(() => {
    const specs = [...new Set(doctors.map(d => d.specialization))];
    return specs.sort();
  }, [doctors]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('');
    setSelectedClinic('');
    toast.success('Filters cleared');
  };

  // Get user initials
  const getUserInitials = () => {
    return currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="patient-dashboard">
      <div className="patient-dashboard__container">
        
        {/* Welcome Card */}
        <div className="patient-dashboard__header-card">
          <div className="patient-dashboard__header-content">
            <div className="patient-dashboard__user-info">
              <div className="patient-dashboard__avatar">
                {getUserInitials()}
              </div>
              <div className="patient-dashboard__user-details">
                <h1 className="patient-dashboard__welcome-title">
                  Welcome back, {currentUser.name}!
                </h1>
                <p className="patient-dashboard__user-email">
                  <i className="fas fa-envelope"></i>
                  {currentUser.email}
                </p>
                <div className="patient-dashboard__status">
                  <span className="patient-dashboard__status-dot"></span>
                  Online
                </div>
              </div>
            </div>
            <button className="patient-dashboard__logout-btn" onClick={onLogout}>
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>

        {/* Quick Actions Tabs */}
        <div className="patient-dashboard__quick-actions">
          <div className="patient-dashboard__tabs">
            <button 
              className={`patient-dashboard__tab ${activeTab === 'doctors' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-user-md"></i>
              </div>
              <span className="patient-dashboard__tab-label">Find Doctors</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'appointments' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <span className="patient-dashboard__tab-label">My Appointments</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'ai-assistant' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('ai-assistant')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-robot"></i>
              </div>
              <span className="patient-dashboard__tab-label">AI Assistant</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'payments' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-credit-card"></i>
              </div>
              <span className="patient-dashboard__tab-label">Payments</span>
            </button>
          </div>
        </div>

        {/* Doctors Tab Content */}
        {activeTab === 'doctors' && (
          <>
            {/* Search & Filters */}
            <div className="patient-dashboard__filters">
              <div className="patient-dashboard__filters-grid">
                <div className="patient-dashboard__filter-group">
                  <i className="fas fa-search patient-dashboard__filter-icon"></i>
                  <input
                    type="text"
                    className="patient-dashboard__filter-input"
                    placeholder="Search by name, specialization..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                
                <div className="patient-dashboard__filter-group">
                  <i className="fas fa-stethoscope patient-dashboard__filter-icon"></i>
                  <select
                    className="patient-dashboard__filter-select"
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                <div className="patient-dashboard__filter-group">
                  <i className="fas fa-hospital patient-dashboard__filter-icon"></i>
                  <select
                    className="patient-dashboard__filter-select"
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                  >
                    <option value="">All Clinics</option>
                    {clinics.map(clinic => (
                      <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(searchTerm || selectedSpecialization || selectedClinic) && (
                <button className="patient-dashboard__clear-filters" onClick={resetFilters}>
                  <i className="fas fa-times"></i> Clear Filters
                </button>
              )}
            </div>

            {/* Available Doctors Section */}
            <div className="patient-dashboard__doctors-section">
              <div className="patient-dashboard__section-header">
                <h2 className="patient-dashboard__section-title">
                  <div className="patient-dashboard__section-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  Available Doctors
                </h2>
                <span className="patient-dashboard__doctors-count">
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
                </span>
              </div>

              {loading ? (
                <div className="patient-dashboard__loading">
                  <div className="patient-dashboard__spinner"></div>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="patient-dashboard__empty-state">
                  <div className="patient-dashboard__empty-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <h3 className="patient-dashboard__empty-title">
                    No doctors available at the moment
                  </h3>
                  <p className="patient-dashboard__empty-text">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              ) : (
                <div className="patient-dashboard__doctors-grid">
                  {filteredDoctors.map(doctor => (
                    <div key={doctor._id} className="doctor-card">
                      {doctor.experience > 10 && (
                        <span className="doctor-card__badge">Most Experienced</span>
                      )}
                      
                      <h3 className="doctor-card__name">Dr. {doctor.name}</h3>
                      <p className="doctor-card__specialization">{doctor.specialization}</p>
                      
                      <div className="doctor-card__meta">
                        <div className="doctor-card__meta-item">
                          <i className="fas fa-hospital doctor-card__meta-icon"></i>
                          {doctor.clinicId?.name || 'No clinic assigned'}
                        </div>
                        <div className="doctor-card__meta-item">
                          <i className="fas fa-envelope doctor-card__meta-icon"></i>
                          {doctor.email}
                        </div>
                        <div className="doctor-card__meta-item">
                          <i className="fas fa-phone doctor-card__meta-icon"></i>
                          {doctor.phone}
                        </div>
                        {doctor.experience && (
                          <div className="doctor-card__meta-item">
                            <i className="fas fa-award doctor-card__meta-icon"></i>
                            {doctor.experience} years experience
                          </div>
                        )}
                      </div>
                      
                      <div className="doctor-card__fee">
                        ₹{doctor.consultationFee}
                        <span className="doctor-card__fee-label"> / consultation</span>
                      </div>
                      
                      <div className={`doctor-card__availability ${doctor.availability !== 'Available' ? 'doctor-card__availability--unavailable' : ''}`}>
                        <span className="doctor-card__availability-dot"></span>
                        {doctor.availability || 'Available'}
                      </div>
                      
                      <button 
                        className="doctor-card__book-btn"
                        disabled={doctor.availability !== 'Available'}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowBookingModal(true);
                        }}
                      >
                        <i className="fas fa-calendar-plus"></i> Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedDoctor && (
          <BookingModal
            doctor={selectedDoctor}
            user={currentUser}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedDoctor(null);
            }}
            onSuccess={(appointment) => {
              fetchAppointments();
              setShowBookingModal(false);
              setSelectedDoctor(null);
            }}
          />
        )}

        {/* Appointments Tab Content */}
        {activeTab === 'appointments' && (
          <div className="patient-dashboard__doctors-section">
            <div className="patient-dashboard__section-header">
              <h2 className="patient-dashboard__section-title">
                <div className="patient-dashboard__section-icon">
                  <i className="fas fa-calendar-check"></i>
                </div>
                My Appointments
              </h2>
              <span className="patient-dashboard__doctors-count">
                {appointments.length} {appointments.length === 1 ? 'Appointment' : 'Appointments'}
              </span>
            </div>
            
            {appointments.length === 0 ? (
              <div className="patient-dashboard__empty-state">
                <div className="patient-dashboard__empty-icon">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <h3 className="patient-dashboard__empty-title">
                  No appointments yet
                </h3>
                <p className="patient-dashboard__empty-text">
                  Book your first appointment with our expert doctors
                </p>
                <button 
                  className="patient-dashboard__empty-btn"
                  onClick={() => setActiveTab('doctors')}
                >
                  <i className="fas fa-user-md"></i> Find Doctors
                </button>
              </div>
            ) : (
              <div className="patient-dashboard__appointments-list">
                {appointments.map(apt => {
                  const meetLink = apt.googleMeetLink || apt.meetingLink;
                  const isOnline = apt.consultationType === 'online';
                  const appointmentDate = new Date(apt.date);
                  const [hours, minutes] = (apt.time || '00:00').split(':');
                  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  
                  const now = new Date();
                  const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
                  const sixtyMinutesAfter = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
                  const canJoin = isOnline && meetLink && now >= fifteenMinutesBefore && now <= sixtyMinutesAfter && apt.status !== 'cancelled' && apt.status !== 'completed';
                  
                  const getTimeUntil = () => {
                    const diff = appointmentDate.getTime() - now.getTime();
                    if (diff < 0) return 'Past';
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    if (days > 0) return `In ${days}d ${hoursLeft}h`;
                    if (hoursLeft > 0) return `In ${hoursLeft}h ${minutesLeft}m`;
                    if (minutesLeft > 0) return `In ${minutesLeft}m`;
                    return 'Starting soon';
                  };

                  return (
                    <div key={apt._id} className="appointment-card-pro">
                      <div className="appointment-card-pro__header">
                        <div className="appointment-card-pro__type">
                          {isOnline ? (
                            <><i className="fas fa-video"></i> Online Consultation</>
                          ) : (
                            <><i className="fas fa-hospital"></i> In-Person Visit</>
                          )}
                        </div>
                        <div className={`appointment-card-pro__status appointment-card-pro__status--${apt.status}`}>
                          {apt.status}
                        </div>
                      </div>

                      <div className="appointment-card-pro__body">
                        <div className="appointment-card-pro__doctor">
                          <div className="appointment-card-pro__avatar">
                            <i className="fas fa-user-md"></i>
                          </div>
                          <div>
                            <h4>Dr. {apt.doctorId?.name || 'Unknown'}</h4>
                            <p>{apt.doctorId?.specialization || 'General'}</p>
                          </div>
                        </div>

                        <div className="appointment-card-pro__details">
                          <div className="appointment-card-pro__detail">
                            <i className="fas fa-calendar"></i>
                            <span>{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="appointment-card-pro__detail">
                            <i className="fas fa-clock"></i>
                            <span>{apt.time}</span>
                          </div>
                          <div className="appointment-card-pro__detail">
                            <i className="fas fa-hospital"></i>
                            <span>{apt.clinicId?.name || 'HealthSync Clinic'}</span>
                          </div>
                        </div>

                        {apt.reason && (
                          <div className="appointment-card-pro__reason">
                            <i className="fas fa-notes-medical"></i>
                            <span>{apt.reason}</span>
                          </div>
                        )}

                        {/* Google Meet Section */}
                        {isOnline && (
                          <div className="appointment-card-pro__meet">
                            {meetLink ? (
                              <>
                                <div className="appointment-card-pro__meet-header">
                                  <i className="fas fa-video"></i>
                                  <span>Video Consultation</span>
                                  {apt.meetLinkGenerated && (
                                    <span className="appointment-card-pro__meet-badge">
                                      <i className="fas fa-check"></i> Ready
                                    </span>
                                  )}
                                </div>
                                <div className="appointment-card-pro__meet-link">
                                  <span>{meetLink}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(meetLink);
                                      toast.success('Link copied!');
                                    }}
                                    title="Copy link"
                                  >
                                    <i className="fas fa-copy"></i>
                                  </button>
                                </div>
                                {canJoin ? (
                                  <button 
                                    className="appointment-card-pro__join-btn"
                                    onClick={() => window.open(meetLink, '_blank')}
                                  >
                                    <i className="fas fa-video"></i> Join Meeting Now
                                  </button>
                                ) : (
                                  <div className="appointment-card-pro__meet-info">
                                    <i className="fas fa-info-circle"></i>
                                    <span>
                                      {apt.status === 'completed' ? 'Meeting ended' : 
                                       apt.status === 'cancelled' ? 'Cancelled' :
                                       `Opens 15 min before (${getTimeUntil()})`}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="appointment-card-pro__meet-pending">
                                <i className="fas fa-clock"></i>
                                <span>Meeting link will be generated 18 minutes before your appointment</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="appointment-card-pro__footer">
                        <div className="appointment-card-pro__countdown">
                          <i className="fas fa-hourglass-half"></i>
                          <span>{getTimeUntil()}</span>
                        </div>
                        {apt.payment?.totalAmount && (
                          <div className="appointment-card-pro__amount">
                            ₹{apt.payment.totalAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab Content */}
        {activeTab === 'ai-assistant' && (
          <div className="patient-dashboard__ai-section">
            <AIAssistant user={currentUser} />
          </div>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <div className="patient-dashboard__doctors-section">
            <div className="patient-dashboard__section-header">
              <h2 className="patient-dashboard__section-title">
                <div className="patient-dashboard__section-icon">
                  <i className="fas fa-credit-card"></i>
                </div>
                Payment History
              </h2>
            </div>
            
            <div className="patient-dashboard__empty-state">
              <div className="patient-dashboard__empty-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="patient-dashboard__empty-title">
                No payment history
              </h3>
              <p className="patient-dashboard__empty-text">
                Your payment transactions will appear here
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDashboard;
