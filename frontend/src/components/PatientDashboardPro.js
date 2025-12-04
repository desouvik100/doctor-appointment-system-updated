import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import BookingModal from './BookingModal';
import AIAssistant from './AIAssistant';
import ReviewModal from './ReviewModal';
import HealthProfile from './HealthProfile';
import LabReports from './LabReports';
import MedicineDelivery from './MedicineDelivery';
import AmbulanceBooking from './AmbulanceBooking';
import DoctorChat from './DoctorChat';
import HealthTips from './HealthTips';
import NotificationCenter from './NotificationCenter';
import HealthCheckup from './HealthCheckup';
import { trackUserLocation, getUserLocation, saveManualLocation } from '../utils/locationService';
import MedicineReminder from './MedicineReminder';
import HealthAnalytics from './HealthAnalytics';
import EmergencyContacts from './EmergencyContacts';
import HealthInsurance from './HealthInsurance';
import ReferralRewards from './ReferralRewards';
import HealthWallet from './HealthWallet';
import SecondOpinion from './SecondOpinion';
import LoyaltyPoints from './LoyaltyPoints';
import './PatientDashboardPro.css';

const PatientDashboardPro = ({ user, onLogout }) => {
  const [currentUser] = useState(user);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Doctor list state
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  
  // Favorites & Reviews
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  
  // Chat & Notifications
  const [showChat, setShowChat] = useState(false);
  const [chatDoctor, setChatDoctor] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const searchTimeoutRef = useRef(null);

  // Navigation menu structure
  const menuSections = [
    {
      title: 'Main',
      items: [
        { id: 'overview', icon: 'fas fa-home', label: 'Overview' },
        { id: 'doctors', icon: 'fas fa-user-md', label: 'Find Doctors' },
        { id: 'appointments', icon: 'fas fa-calendar-check', label: 'Appointments' },
      ]
    },
    {
      title: 'Health Services',
      items: [
        { id: 'ai-assistant', icon: 'fas fa-robot', label: 'AI Assistant' },
        { id: 'health', icon: 'fas fa-heartbeat', label: 'Health Profile' },
        { id: 'lab-reports', icon: 'fas fa-flask', label: 'Lab Reports' },
        { id: 'checkup', icon: 'fas fa-stethoscope', label: 'Health Checkup' },
        { id: 'health-analytics', icon: 'fas fa-chart-line', label: 'Analytics' },
      ]
    },
    {
      title: 'Services',
      items: [
        { id: 'medicines', icon: 'fas fa-pills', label: 'Medicines' },
        { id: 'medicine-reminder', icon: 'fas fa-bell', label: 'Reminders' },
        { id: 'ambulance', icon: 'fas fa-ambulance', label: 'Ambulance' },
        { id: 'second-opinion', icon: 'fas fa-user-md', label: 'Second Opinion' },
      ]
    },
    {
      title: 'Financial',
      items: [
        { id: 'wallet', icon: 'fas fa-wallet', label: 'Wallet' },
        { id: 'insurance', icon: 'fas fa-shield-alt', label: 'Insurance' },
        { id: 'loyalty', icon: 'fas fa-coins', label: 'Loyalty Points' },
        { id: 'referrals', icon: 'fas fa-gift', label: 'Refer & Earn' },
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'emergency', icon: 'fas fa-phone-alt', label: 'Emergency' },
        { id: 'health-tips', icon: 'fas fa-lightbulb', label: 'Health Tips' },
        { id: 'messages', icon: 'fas fa-comments', label: 'Messages' },
      ]
    }
  ];

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchClinics();
    fetchUserLocation();
    fetchFavorites();
    fetchUnreadNotifications();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/notifications/unread-count/${userId}`);
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      setUnreadNotifications(0);
    }
  };

  const fetchUserLocation = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const location = await getUserLocation(userId);
      if (location?.latitude) setUserLocation(location);
    } catch (error) {
      console.log('No saved location found');
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors');
      setDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/appointments/user/${userId}`);
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

  const fetchFavorites = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/favorites/${userId}`);
      setFavoriteDoctors(response.data.map(d => d._id));
    } catch (error) {
      console.log('Error fetching favorites');
    }
  };

  const handleUpdateLocation = async () => {
    setUpdatingLocation(true);
    try {
      const userId = currentUser.id || currentUser._id;
      const result = await trackUserLocation(userId);
      if (result.success) {
        setUserLocation(result.location);
        toast.success(`Location: ${result.location.city || 'Unknown'}`);
      } else {
        toast.error(result.error || 'Failed to update location');
      }
    } catch (error) {
      toast.error('Failed to get your location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = !searchTerm || 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialization = !selectedSpecialization || 
        doctor.specialization === selectedSpecialization;
      const matchesClinic = !selectedClinic || 
        doctor.clinicId?._id === selectedClinic;
      return matchesSearch && matchesSpecialization && matchesClinic;
    });
  }, [doctors, searchTerm, selectedSpecialization, selectedClinic]);

  const specializations = useMemo(() => {
    return [...new Set(doctors.map(d => d.specialization))].sort();
  }, [doctors]);

  const getUserInitials = () => {
    return currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleFavorite = async (doctorId) => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.post(`/api/favorites/${userId}/toggle`, { doctorId });
      if (response.data.isFavorite) {
        setFavoriteDoctors([...favoriteDoctors, doctorId]);
        toast.success('Added to favorites');
      } else {
        setFavoriteDoctors(favoriteDoctors.filter(id => id !== doctorId));
        toast.success('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
  ).slice(0, 3);

  const recentDoctors = doctors.slice(0, 4);

  // Quick stats for overview
  const stats = {
    totalAppointments: appointments.length,
    upcomingCount: upcomingAppointments.length,
    completedCount: appointments.filter(a => a.status === 'completed').length,
    favoritesCount: favoriteDoctors.length
  };

  
return (
    <div className={`dashboard-pro ${sidebarCollapsed ? 'dashboard-pro--collapsed' : ''} ${mobileSidebarOpen ? 'dashboard-pro--sidebar-open' : ''}`}>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div className="dashboard-pro__overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}
      
      {/* Sidebar Navigation */}
      <aside className="dashboard-pro__sidebar">
        <div className="dashboard-pro__sidebar-header">
          <div className="dashboard-pro__logo">
            <div className="dashboard-pro__logo-icon">
              <svg className="dashboard-pro__bpm-logo" viewBox="0 0 60 40" fill="none">
                <path 
                  className="dashboard-pro__bpm-line" 
                  d="M0 20 L10 20 L15 20 L20 8 L25 32 L30 12 L35 28 L40 20 L50 20 L60 20" 
                  stroke="#ef4444" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <span>HealthSync</span>
          </div>
        </div>

        <nav className="dashboard-pro__nav">
          {menuSections.map((section, idx) => (
            <div key={idx} className="dashboard-pro__nav-section">
              <h3 className="dashboard-pro__nav-title">{section.title}</h3>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`dashboard-pro__nav-item ${activeSection === item.id ? 'dashboard-pro__nav-item--active' : ''}`}
                  onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                  title={item.label}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="dashboard-pro__sidebar-footer">
          <button className="dashboard-pro__logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-pro__main">
        {/* Top Header */}
        <header className="dashboard-pro__header">
          <div className="dashboard-pro__header-left">
            <button 
              className="dashboard-pro__menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="dashboard-pro__page-title">
              {menuSections.flatMap(s => s.items).find(i => i.id === activeSection)?.label || 'Dashboard'}
            </h1>
            {userLocation?.city && (
              <span className="dashboard-pro__location">
                <i className="fas fa-map-marker-alt"></i> {userLocation.city}
              </span>
            )}
          </div>
          <div className="dashboard-pro__header-right">
            <button 
              className="dashboard-pro__header-btn"
              onClick={handleUpdateLocation}
              disabled={updatingLocation}
            >
              <i className={`fas ${updatingLocation ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
            </button>
            <button 
              className="dashboard-pro__header-btn dashboard-pro__header-btn--notification"
              onClick={() => setShowNotifications(true)}
            >
              <i className="fas fa-bell"></i>
              {unreadNotifications > 0 && (
                <span className="dashboard-pro__badge">{unreadNotifications}</span>
              )}
            </button>
            <div className="dashboard-pro__user-menu">
              <div className="dashboard-pro__avatar">{getUserInitials()}</div>
              <div className="dashboard-pro__user-info">
                <span className="dashboard-pro__user-name">{currentUser.name}</span>
                <span className="dashboard-pro__user-email">{currentUser.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-pro__content">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="dashboard-pro__overview">
              {/* Welcome Banner */}
              <div className="dashboard-pro__welcome-banner">
                <div className="dashboard-pro__welcome-content">
                  <h2>Welcome back, {currentUser.name.split(' ')[0]}! 👋</h2>
                  <p>Here's what's happening with your health today.</p>
                </div>
                <button 
                  className="dashboard-pro__sos-btn"
                  onClick={() => window.location.href = 'tel:102'}
                >
                  <i className="fas fa-ambulance"></i> Emergency SOS
                </button>
              </div>

              {/* Stats Cards */}
              <div className="dashboard-pro__stats-grid">
                <div className="dashboard-pro__stat-card dashboard-pro__stat-card--primary">
                  <div className="dashboard-pro__stat-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="dashboard-pro__stat-info">
                    <span className="dashboard-pro__stat-value">{stats.upcomingCount}</span>
                    <span className="dashboard-pro__stat-label">Upcoming</span>
                  </div>
                </div>
                <div className="dashboard-pro__stat-card dashboard-pro__stat-card--success">
                  <div className="dashboard-pro__stat-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="dashboard-pro__stat-info">
                    <span className="dashboard-pro__stat-value">{stats.completedCount}</span>
                    <span className="dashboard-pro__stat-label">Completed</span>
                  </div>
                </div>
                <div className="dashboard-pro__stat-card dashboard-pro__stat-card--warning">
                  <div className="dashboard-pro__stat-icon">
                    <i className="fas fa-heart"></i>
                  </div>
                  <div className="dashboard-pro__stat-info">
                    <span className="dashboard-pro__stat-value">{stats.favoritesCount}</span>
                    <span className="dashboard-pro__stat-label">Favorites</span>
                  </div>
                </div>
                <div className="dashboard-pro__stat-card dashboard-pro__stat-card--info">
                  <div className="dashboard-pro__stat-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div className="dashboard-pro__stat-info">
                    <span className="dashboard-pro__stat-value">{doctors.length}</span>
                    <span className="dashboard-pro__stat-label">Doctors</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-pro__quick-actions">
                <h3>Quick Actions</h3>
                <div className="dashboard-pro__actions-grid">
                  <button className="dashboard-pro__action-card" onClick={() => setActiveSection('doctors')}>
                    <i className="fas fa-user-md"></i>
                    <span>Book Appointment</span>
                  </button>
                  <button className="dashboard-pro__action-card" onClick={() => setActiveSection('ai-assistant')}>
                    <i className="fas fa-robot"></i>
                    <span>AI Health Check</span>
                  </button>
                  <button className="dashboard-pro__action-card" onClick={() => setActiveSection('medicines')}>
                    <i className="fas fa-pills"></i>
                    <span>Order Medicines</span>
                  </button>
                  <button className="dashboard-pro__action-card" onClick={() => setActiveSection('lab-reports')}>
                    <i className="fas fa-flask"></i>
                    <span>Lab Reports</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <div className="dashboard-pro__section">
                  <div className="dashboard-pro__section-header">
                    <h3>Upcoming Appointments</h3>
                    <button onClick={() => setActiveSection('appointments')}>View All</button>
                  </div>
                  <div className="dashboard-pro__appointments-list">
                    {upcomingAppointments.map(apt => (
                      <div key={apt._id} className="dashboard-pro__appointment-card">
                        <div className="dashboard-pro__appointment-avatar">
                          <i className="fas fa-user-md"></i>
                        </div>
                        <div className="dashboard-pro__appointment-info">
                          <h4>Dr. {apt.doctorId?.name || 'Unknown'}</h4>
                          <p>{apt.doctorId?.specialization}</p>
                        </div>
                        <div className="dashboard-pro__appointment-time">
                          <span className="dashboard-pro__appointment-date">
                            {new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="dashboard-pro__appointment-hour">{apt.time}</span>
                        </div>
                        <span className={`dashboard-pro__appointment-status dashboard-pro__appointment-status--${apt.status}`}>
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Doctors */}
              <div className="dashboard-pro__section">
                <div className="dashboard-pro__section-header">
                  <h3>Top Doctors</h3>
                  <button onClick={() => setActiveSection('doctors')}>View All</button>
                </div>
                <div className="dashboard-pro__doctors-grid">
                  {recentDoctors.map(doctor => (
                    <div key={doctor._id} className="dashboard-pro__doctor-card">
                      <div className="dashboard-pro__doctor-photo">
                        {doctor.profilePhoto ? (
                          <img src={doctor.profilePhoto} alt={doctor.name} />
                        ) : (
                          <i className="fas fa-user-md"></i>
                        )}
                      </div>
                      <h4>Dr. {doctor.name}</h4>
                      <p>{doctor.specialization}</p>
                      <span className="dashboard-pro__doctor-fee">₹{doctor.consultationFee}</span>
                      <button 
                        className="dashboard-pro__book-btn"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowBookingModal(true);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Doctors Section */}
          {activeSection === 'doctors' && (
            <div className="dashboard-pro__doctors-section">
              <div className="dashboard-pro__filters">
                <div className="dashboard-pro__search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search doctors by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                >
                  <option value="">All Clinics</option>
                  {clinics.map(clinic => (
                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                  ))}
                </select>
              </div>

              <div className="dashboard-pro__results-header">
                <span>{filteredDoctors.length} doctors found</span>
              </div>

              {loading ? (
                <div className="dashboard-pro__loading">
                  <div className="dashboard-pro__spinner"></div>
                  <p>Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="dashboard-pro__empty">
                  <i className="fas fa-user-md"></i>
                  <h3>No doctors found</h3>
                  <p>Try adjusting your search filters</p>
                </div>
              ) : (
                <div className="dashboard-pro__doctors-list">
                  {filteredDoctors.map(doctor => (
                    <div key={doctor._id} className="dashboard-pro__doctor-row">
                      <div className="dashboard-pro__doctor-main">
                        <div className="dashboard-pro__doctor-avatar">
                          {doctor.profilePhoto ? (
                            <img src={doctor.profilePhoto} alt={doctor.name} />
                          ) : (
                            <i className="fas fa-user-md"></i>
                          )}
                        </div>
                        <div className="dashboard-pro__doctor-details">
                          <h4>Dr. {doctor.name}</h4>
                          <p className="dashboard-pro__doctor-spec">{doctor.specialization}</p>
                          <p className="dashboard-pro__doctor-clinic">
                            <i className="fas fa-hospital"></i> {doctor.clinicId?.name || 'Independent'}
                          </p>
                        </div>
                      </div>
                      <div className="dashboard-pro__doctor-meta">
                        {doctor.experience && (
                          <span><i className="fas fa-award"></i> {doctor.experience} yrs</span>
                        )}
                        {doctor.rating > 0 && (
                          <span><i className="fas fa-star"></i> {doctor.rating.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="dashboard-pro__doctor-price">
                        <span className="dashboard-pro__price">₹{doctor.consultationFee}</span>
                        <span className="dashboard-pro__price-label">per visit</span>
                      </div>
                      <div className="dashboard-pro__doctor-actions">
                        <button
                          className={`dashboard-pro__fav-btn ${favoriteDoctors.includes(doctor._id) ? 'dashboard-pro__fav-btn--active' : ''}`}
                          onClick={() => toggleFavorite(doctor._id)}
                        >
                          <i className={favoriteDoctors.includes(doctor._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        </button>
                        <button
                          className="dashboard-pro__book-btn"
                          disabled={doctor.availability !== 'Available'}
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowBookingModal(true);
                          }}
                        >
                          {doctor.availability === 'Available' ? 'Book Now' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointments Section */}
          {activeSection === 'appointments' && (
            <div className="dashboard-pro__appointments-section">
              {appointments.length === 0 ? (
                <div className="dashboard-pro__empty">
                  <i className="fas fa-calendar-times"></i>
                  <h3>No appointments yet</h3>
                  <p>Book your first appointment with our expert doctors</p>
                  <button onClick={() => setActiveSection('doctors')}>Find Doctors</button>
                </div>
              ) : (
                <div className="dashboard-pro__appointments-full">
                  {appointments.map(apt => (
                    <div key={apt._id} className="dashboard-pro__apt-card">
                      <div className="dashboard-pro__apt-header">
                        <span className={`dashboard-pro__apt-type ${apt.consultationType === 'online' ? 'dashboard-pro__apt-type--online' : ''}`}>
                          <i className={apt.consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                          {apt.consultationType === 'online' ? 'Online' : 'In-Person'}
                        </span>
                        <span className={`dashboard-pro__apt-status dashboard-pro__apt-status--${apt.status}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="dashboard-pro__apt-body">
                        <div className="dashboard-pro__apt-doctor">
                          <div className="dashboard-pro__apt-avatar">
                            <i className="fas fa-user-md"></i>
                          </div>
                          <div>
                            <h4>Dr. {apt.doctorId?.name || 'Unknown'}</h4>
                            <p>{apt.doctorId?.specialization}</p>
                          </div>
                        </div>
                        <div className="dashboard-pro__apt-details">
                          <div><i className="fas fa-calendar"></i> {new Date(apt.date).toLocaleDateString()}</div>
                          <div><i className="fas fa-clock"></i> {apt.time}</div>
                          <div><i className="fas fa-hospital"></i> {apt.clinicId?.name || 'HealthSync'}</div>
                        </div>
                        {apt.consultationType === 'online' && apt.googleMeetLink && (
                          <button 
                            className="dashboard-pro__join-btn"
                            onClick={() => window.open(apt.googleMeetLink, '_blank')}
                          >
                            <i className="fas fa-video"></i> Join Meeting
                          </button>
                        )}
                      </div>
                      {apt.status === 'completed' && (
                        <div className="dashboard-pro__apt-footer">
                          <button onClick={() => { setReviewAppointment(apt); setShowReviewModal(true); }}>
                            <i className="fas fa-star"></i> Write Review
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Assistant */}
          {activeSection === 'ai-assistant' && <AIAssistant user={currentUser} />}

          {/* Health Profile */}
          {activeSection === 'health' && <HealthProfile userId={currentUser.id || currentUser._id} />}

          {/* Lab Reports */}
          {activeSection === 'lab-reports' && <LabReports userId={currentUser.id || currentUser._id} />}

          {/* Health Checkup */}
          {activeSection === 'checkup' && (
            <HealthCheckup 
              userId={currentUser.id || currentUser._id}
              userName={currentUser.name}
              userEmail={currentUser.email}
              userPhone={currentUser.phone}
            />
          )}

          {/* Health Analytics */}
          {activeSection === 'health-analytics' && <HealthAnalytics userId={currentUser.id || currentUser._id} />}

          {/* Medicines */}
          {activeSection === 'medicines' && (
            <MedicineDelivery userId={currentUser.id || currentUser._id} userAddress={userLocation} />
          )}

          {/* Medicine Reminder */}
          {activeSection === 'medicine-reminder' && <MedicineReminder userId={currentUser.id || currentUser._id} />}

          {/* Ambulance */}
          {activeSection === 'ambulance' && (
            <AmbulanceBooking 
              userId={currentUser.id || currentUser._id}
              userName={currentUser.name}
              userPhone={currentUser.phone}
              userLocation={userLocation}
            />
          )}

          {/* Second Opinion */}
          {activeSection === 'second-opinion' && (
            <SecondOpinion userId={currentUser.id || currentUser._id} userName={currentUser.name} />
          )}

          {/* Wallet */}
          {activeSection === 'wallet' && (
            <HealthWallet userId={currentUser.id || currentUser._id} userName={currentUser.name} />
          )}

          {/* Insurance */}
          {activeSection === 'insurance' && <HealthInsurance userId={currentUser.id || currentUser._id} />}

          {/* Loyalty Points */}
          {activeSection === 'loyalty' && <LoyaltyPoints userId={currentUser.id || currentUser._id} />}

          {/* Referrals */}
          {activeSection === 'referrals' && (
            <ReferralRewards userId={currentUser.id || currentUser._id} userName={currentUser.name} />
          )}

          {/* Emergency */}
          {activeSection === 'emergency' && <EmergencyContacts userId={currentUser.id || currentUser._id} />}

          {/* Health Tips */}
          {activeSection === 'health-tips' && <HealthTips />}

          {/* Messages */}
          {activeSection === 'messages' && (
            <div className="dashboard-pro__empty">
              <i className="fas fa-comments"></i>
              <h3>Chat with Doctors</h3>
              <p>Click on a doctor to start a conversation</p>
              <button onClick={() => setActiveSection('doctors')}>Find Doctors</button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="dashboard-pro__mobile-nav">
        <button 
          className={`dashboard-pro__mobile-nav-item ${activeSection === 'overview' ? 'dashboard-pro__mobile-nav-item--active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <i className="fas fa-home"></i>
          <span>Home</span>
        </button>
        <button 
          className={`dashboard-pro__mobile-nav-item ${activeSection === 'doctors' ? 'dashboard-pro__mobile-nav-item--active' : ''}`}
          onClick={() => setActiveSection('doctors')}
        >
          <i className="fas fa-user-md"></i>
          <span>Doctors</span>
        </button>
        <button 
          className={`dashboard-pro__mobile-nav-item ${activeSection === 'appointments' ? 'dashboard-pro__mobile-nav-item--active' : ''}`}
          onClick={() => setActiveSection('appointments')}
        >
          <i className="fas fa-calendar"></i>
          <span>Bookings</span>
        </button>
        <button 
          className={`dashboard-pro__mobile-nav-item ${activeSection === 'ai-assistant' ? 'dashboard-pro__mobile-nav-item--active' : ''}`}
          onClick={() => setActiveSection('ai-assistant')}
        >
          <i className="fas fa-robot"></i>
          <span>AI</span>
        </button>
        <button 
          className="dashboard-pro__mobile-nav-item"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <i className="fas fa-ellipsis-h"></i>
          <span>More</span>
        </button>
      </nav>

      {/* Modals */}
      {showBookingModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          user={currentUser}
          onClose={() => { setShowBookingModal(false); setSelectedDoctor(null); }}
          onSuccess={() => { fetchAppointments(); setShowBookingModal(false); setSelectedDoctor(null); }}
        />
      )}

      {showReviewModal && reviewAppointment && (
        <ReviewModal
          appointment={reviewAppointment}
          onClose={() => { setShowReviewModal(false); setReviewAppointment(null); }}
          onSuccess={() => fetchAppointments()}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          userId={currentUser.id || currentUser._id}
          onClose={() => { setShowNotifications(false); fetchUnreadNotifications(); }}
        />
      )}

      {showChat && chatDoctor && (
        <div className="dashboard-pro__chat-overlay">
          <DoctorChat
            user={currentUser}
            doctor={chatDoctor}
            onClose={() => { setShowChat(false); setChatDoctor(null); }}
          />
        </div>
      )}
    </div>
  );
};

export default PatientDashboardPro;
