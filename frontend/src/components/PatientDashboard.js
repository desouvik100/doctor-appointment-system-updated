import { useState, useEffect, useMemo, useRef } from 'react';
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
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualCity, setManualCity] = useState('');
  
  // Favorites state
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatDoctor, setChatDoctor] = useState(null);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Debounce ref
  const searchTimeoutRef = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchClinics();
    fetchUserLocation();
    fetchFavorites();
    fetchUnreadNotifications();
  }, []);

  // Fetch unread notification count
  const fetchUnreadNotifications = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/notifications/unread-count/${userId}`);
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      // Silently fail - notifications are optional
      setUnreadNotifications(0);
    }
  };

  // Open chat with doctor
  const openDoctorChat = (doctor) => {
    setChatDoctor(doctor);
    setShowChat(true);
  };

  // Fetch user's saved location
  const fetchUserLocation = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const location = await getUserLocation(userId);
      if (location?.latitude) {
        setUserLocation(location);
      }
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
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearby doctors based on user location
  const fetchNearbyDoctors = async () => {
    try {
      setLoading(true);
      const userId = currentUser.id || currentUser._id;
      const params = new URLSearchParams({ maxDistance: maxDistance.toString() });
      if (selectedSpecialization) params.append('specialization', selectedSpecialization);
      
      const response = await axios.get(`/api/location/nearby-doctors/${userId}?${params}`);
      setDoctors(response.data.doctors || []);
      toast.success(`Found ${response.data.totalFound} doctors within ${maxDistance}km`);
    } catch (error) {
      console.error('Error fetching nearby doctors:', error);
      toast.error(error.response?.data?.message || 'Failed to load nearby doctors');
      setNearbyMode(false);
      fetchDoctors(); // Fallback to all doctors
    } finally {
      setLoading(false);
    }
  };

  // Update user location
  const handleUpdateLocation = async () => {
    setUpdatingLocation(true);
    try {
      const userId = currentUser.id || currentUser._id;
      const result = await trackUserLocation(userId);
      if (result.success) {
        setUserLocation(result.location);
        const accuracy = result.coordinates?.accuracy 
          ? ` (±${Math.round(result.coordinates.accuracy)}m)` 
          : '';
        toast.success(
          `Location: ${result.location.city || 'Unknown'}, ${result.location.state || ''}${accuracy}`,
          { duration: 5000 }
        );
        console.log('📍 Location details:', {
          city: result.location.city,
          state: result.location.state,
          lat: result.coordinates?.latitude,
          lng: result.coordinates?.longitude,
          accuracy: result.coordinates?.accuracy
        });
        if (nearbyMode) {
          fetchNearbyDoctors();
        }
      } else {
        toast.error(result.error || 'Failed to update location');
      }
    } catch (error) {
      toast.error('Failed to get your location. Please enable location access.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  // Save manual location
  const handleSaveManualLocation = async () => {
    if (!manualCity.trim()) {
      toast.error('Please enter a city name');
      return;
    }
    setUpdatingLocation(true);
    try {
      const userId = currentUser.id || currentUser._id;
      const result = await saveManualLocation(userId, {
        city: manualCity.trim(),
        state: '',
        country: 'India',
        address: manualCity.trim()
      });
      if (result.success) {
        setUserLocation(result.location);
        setShowManualLocation(false);
        setManualCity('');
        toast.success(`Location set to: ${manualCity.trim()}`);
      } else {
        toast.error(result.error || 'Failed to save location');
      }
    } catch (error) {
      toast.error('Failed to save location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  // Toggle nearby mode
  const toggleNearbyMode = async () => {
    if (!nearbyMode) {
      if (!userLocation?.latitude) {
        toast.error('Please update your location first');
        return;
      }
      setNearbyMode(true);
      // Clear specialization filter when switching to nearby mode for better results
      // setSelectedSpecialization('');
      try {
        setLoading(true);
        const userId = currentUser.id || currentUser._id;
        const params = new URLSearchParams({ maxDistance: maxDistance.toString() });
        // Don't filter by specialization initially to show all nearby doctors
        
        const response = await axios.get(`/api/location/nearby-doctors/${userId}?${params}`);
        setDoctors(response.data.doctors || []);
        toast.success(`Found ${response.data.totalFound} doctors within ${maxDistance}km`);
      } catch (error) {
        console.error('Error fetching nearby doctors:', error);
        toast.error(error.response?.data?.message || 'Failed to load nearby doctors');
        setNearbyMode(false);
      } finally {
        setLoading(false);
      }
    } else {
      setNearbyMode(false);
      fetchDoctors();
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

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/favorites/${userId}`);
      setFavoriteDoctors(response.data.map(d => d._id));
    } catch (error) {
      console.log('Error fetching favorites');
    }
  };

  // Toggle favorite doctor
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

  // Check if doctor is favorite
  const isFavorite = (doctorId) => favoriteDoctors.includes(doctorId);

  // Call clinic directly
  const callClinic = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('Phone number not available');
    }
  };

  // Share doctor profile
  const shareDoctor = async (doctor) => {
    const shareData = {
      title: `Dr. ${doctor.name} - ${doctor.specialization}`,
      text: `Book an appointment with Dr. ${doctor.name}, ${doctor.specialization} at ${doctor.clinicId?.name || 'HealthSync'}. Fee: ₹${doctor.consultationFee}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(shareData.text + ' ' + shareData.url);
      }
    } else {
      copyToClipboard(shareData.text + ' ' + shareData.url);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Emergency SOS
  const handleEmergency = async () => {
    try {
      const userId = currentUser.id || currentUser._id;
      const response = await axios.get(`/api/health/emergency/${userId}`);
      const { emergencyNumbers, nearbyHospitalsUrl } = response.data;
      
      // Show emergency options
      const choice = window.confirm(
        `🚨 EMERGENCY SERVICES 🚨\n\n` +
        `Ambulance: ${emergencyNumbers.ambulance}\n` +
        `National Emergency: ${emergencyNumbers.nationalEmergency}\n\n` +
        `Click OK to find nearby hospitals on map\n` +
        `Click Cancel to call ambulance directly`
      );
      
      if (choice && nearbyHospitalsUrl) {
        window.open(nearbyHospitalsUrl, '_blank');
      } else {
        window.location.href = `tel:${emergencyNumbers.ambulance}`;
      }
    } catch (error) {
      // Fallback to direct call
      window.location.href = 'tel:102';
    }
  };

  // Open Google Maps directions
  const openDirections = (clinic) => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      toast.error('Please update your location first to get directions');
      return;
    }
    
    const destLat = clinic?.latitude;
    const destLng = clinic?.longitude;
    
    if (!destLat || !destLng) {
      // Fallback to clinic address if no coordinates
      const address = encodeURIComponent(`${clinic?.name}, ${clinic?.address}, ${clinic?.city}`);
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${address}`, '_blank');
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank');
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
                {userLocation?.city && (
                  <div className="patient-dashboard__location-info">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="patient-dashboard__header-actions">
              <button 
                className="patient-dashboard__notification-btn"
                onClick={() => setShowNotifications(true)}
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadNotifications > 0 && (
                  <span className="patient-dashboard__notification-badge">{unreadNotifications}</span>
                )}
              </button>
              <button 
                className="patient-dashboard__sos-btn"
                onClick={handleEmergency}
                title="Emergency SOS"
              >
                <i className="fas fa-ambulance"></i> SOS
              </button>
              <div className="patient-dashboard__location-wrapper">
                <button 
                  className={`patient-dashboard__location-btn ${updatingLocation ? 'patient-dashboard__location-btn--loading' : ''}`}
                  onClick={handleUpdateLocation}
                  disabled={updatingLocation}
                  title="Auto-detect your location"
                >
                  {updatingLocation ? (
                    <><i className="fas fa-spinner fa-spin"></i> Updating...</>
                  ) : (
                    <><i className="fas fa-location-crosshairs"></i> Auto Location</>
                  )}
                </button>
                <button 
                  className="patient-dashboard__manual-location-btn"
                  onClick={() => setShowManualLocation(!showManualLocation)}
                  title="Enter location manually"
                >
                  <i className="fas fa-edit"></i>
                </button>
                {showManualLocation && (
                  <div className="patient-dashboard__manual-location-popup">
                    <input
                      type="text"
                      placeholder="Enter your city (e.g., Bankura)"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveManualLocation()}
                    />
                    <button onClick={handleSaveManualLocation} disabled={updatingLocation}>
                      <i className="fas fa-check"></i> Save
                    </button>
                    <button onClick={() => setShowManualLocation(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
              <button className="patient-dashboard__logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
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
              className={`patient-dashboard__tab ${activeTab === 'health' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('health')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <span className="patient-dashboard__tab-label">Health Profile</span>
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
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'lab-reports' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('lab-reports')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-flask"></i>
              </div>
              <span className="patient-dashboard__tab-label">Lab Reports</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'medicines' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('medicines')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-pills"></i>
              </div>
              <span className="patient-dashboard__tab-label">Medicines</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'ambulance' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('ambulance')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-ambulance"></i>
              </div>
              <span className="patient-dashboard__tab-label">Ambulance</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'messages' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-comments"></i>
              </div>
              <span className="patient-dashboard__tab-label">Messages</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'health-tips' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('health-tips')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <span className="patient-dashboard__tab-label">Health Tips</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'checkup' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('checkup')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-stethoscope"></i>
              </div>
              <span className="patient-dashboard__tab-label">Full Body Checkup</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'medicine-reminder' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('medicine-reminder')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-pills"></i>
              </div>
              <span className="patient-dashboard__tab-label">Medicine Reminder</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'health-analytics' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('health-analytics')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="patient-dashboard__tab-label">Health Analytics</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'emergency' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('emergency')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <span className="patient-dashboard__tab-label">Emergency</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'insurance' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('insurance')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <span className="patient-dashboard__tab-label">Insurance</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'wallet' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-wallet"></i>
              </div>
              <span className="patient-dashboard__tab-label">Wallet</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'referrals' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('referrals')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-gift"></i>
              </div>
              <span className="patient-dashboard__tab-label">Refer & Earn</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'second-opinion' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('second-opinion')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-user-md"></i>
              </div>
              <span className="patient-dashboard__tab-label">Second Opinion</span>
            </button>
            
            <button 
              className={`patient-dashboard__tab ${activeTab === 'loyalty' ? 'patient-dashboard__tab--active' : ''}`}
              onClick={() => setActiveTab('loyalty')}
            >
              <div className="patient-dashboard__tab-icon">
                <i className="fas fa-coins"></i>
              </div>
              <span className="patient-dashboard__tab-label">Loyalty Points</span>
            </button>
          </div>
        </div>

        {/* Doctors Tab Content */}
        {activeTab === 'doctors' && (
          <>
            {/* Search & Filters */}
            <div className="patient-dashboard__filters">
              {/* Nearby Toggle */}
              <div className="patient-dashboard__nearby-toggle">
                <button 
                  className={`patient-dashboard__nearby-btn ${nearbyMode ? 'patient-dashboard__nearby-btn--active' : ''}`}
                  onClick={toggleNearbyMode}
                  disabled={!userLocation?.latitude && !nearbyMode}
                  title={!userLocation?.latitude ? 'Update your location first' : 'Find doctors near you'}
                >
                  <i className="fas fa-map-marker-alt"></i>
                  {nearbyMode ? 'Show All Doctors' : 'Find Nearby'}
                </button>
                
                {nearbyMode && (
                  <div className="patient-dashboard__distance-filter">
                    <label>Within:</label>
                    <select 
                      value={maxDistance} 
                      onChange={(e) => {
                        setMaxDistance(e.target.value);
                        setTimeout(fetchNearbyDoctors, 100);
                      }}
                      className="patient-dashboard__distance-select"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                      <option value="100">100 km</option>
                    </select>
                  </div>
                )}
                
                {userLocation?.city && (
                  <span className="patient-dashboard__current-location">
                    <i className="fas fa-location-dot"></i> {userLocation.city}
                  </span>
                )}
              </div>

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
                    onChange={(e) => {
                      setSelectedSpecialization(e.target.value);
                      if (nearbyMode) setTimeout(fetchNearbyDoctors, 100);
                    }}
                  >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                {!nearbyMode && (
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
                )}
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
                      {/* Quick Actions */}
                      <div className="doctor-card__quick-actions">
                        <button 
                          className={`doctor-card__fav-btn ${isFavorite(doctor._id) ? 'doctor-card__fav-btn--active' : ''}`}
                          onClick={() => toggleFavorite(doctor._id)}
                          title={isFavorite(doctor._id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <i className={isFavorite(doctor._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        </button>
                        <button 
                          className="doctor-card__share-btn"
                          onClick={() => shareDoctor(doctor)}
                          title="Share doctor profile"
                        >
                          <i className="fas fa-share-alt"></i>
                        </button>
                        <button 
                          className="doctor-card__call-btn"
                          onClick={() => callClinic(doctor.clinicId?.phone || doctor.phone)}
                          title="Call clinic"
                        >
                          <i className="fas fa-phone"></i>
                        </button>
                        <button 
                          className="doctor-card__chat-btn"
                          onClick={() => openDoctorChat(doctor)}
                          title="Chat with doctor"
                        >
                          <i className="fas fa-comment-medical"></i>
                        </button>
                      </div>

                      {/* Profile Photo */}
                      <div className="doctor-card__photo-container">
                        {doctor.profilePhoto ? (
                          <img 
                            src={doctor.profilePhoto} 
                            alt={`Dr. ${doctor.name}`}
                            className="doctor-card__photo"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=667eea&color=fff&size=100`;
                            }}
                          />
                        ) : (
                          <div className="doctor-card__photo-placeholder">
                            <i className="fas fa-user-md"></i>
                          </div>
                        )}
                      </div>

                      {doctor.experience > 10 && (
                        <span className="doctor-card__badge">Most Experienced</span>
                      )}
                      
                      {/* Rating */}
                      {doctor.rating > 0 && (
                        <div className="doctor-card__rating">
                          <i className="fas fa-star"></i>
                          <span>{doctor.rating.toFixed(1)}</span>
                          <span className="doctor-card__review-count">({doctor.reviewCount || 0} reviews)</span>
                        </div>
                      )}
                      
                      <h3 className="doctor-card__name">Dr. {doctor.name}</h3>
                      <p className="doctor-card__specialization">{doctor.specialization}</p>
                      
                      <div className="doctor-card__meta">
                        <div className="doctor-card__meta-item">
                          <i className="fas fa-hospital doctor-card__meta-icon"></i>
                          {doctor.clinicId?.name || 'No clinic assigned'}
                        </div>
                        {nearbyMode && doctor.distanceText && (
                          <div className="doctor-card__meta-item doctor-card__distance">
                            <i className="fas fa-route doctor-card__meta-icon"></i>
                            {doctor.distanceText}
                          </div>
                        )}
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
                      
                      <div className="doctor-card__actions">
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
                        
                        <button 
                          className="doctor-card__directions-btn"
                          onClick={() => openDirections(doctor.clinicId)}
                          title="Get directions to clinic"
                        >
                          <i className="fas fa-directions"></i> Get Directions
                        </button>
                      </div>
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
                  // Use patient-specific link if available (for Jitsi), otherwise use general link
                  const meetLink = apt.patientMeetLink || apt.googleMeetLink || apt.meetingLink;
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
                                  <>
                                    <div className="appointment-card-pro__meet-warning">
                                      <i className="fas fa-exclamation-triangle"></i>
                                      <span>Please wait for the doctor to start the meeting first. If you see "waiting for host", the doctor hasn't joined yet.</span>
                                    </div>
                                    <button 
                                      className="appointment-card-pro__join-btn"
                                      onClick={() => window.open(meetLink, '_blank')}
                                    >
                                      <i className="fas fa-video"></i> Join Meeting
                                    </button>
                                  </>
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
                        <div className="appointment-card-pro__footer-actions">
                          {apt.status === 'completed' && (
                            <button 
                              className="appointment-card-pro__review-btn"
                              onClick={() => {
                                setReviewAppointment(apt);
                                setShowReviewModal(true);
                              }}
                            >
                              <i className="fas fa-star"></i> Write Review
                            </button>
                          )}
                          {apt.payment?.totalAmount && (
                            <div className="appointment-card-pro__amount">
                              ₹{apt.payment.totalAmount}
                            </div>
                          )}
                        </div>
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

        {/* Health Profile Tab Content */}
        {activeTab === 'health' && (
          <HealthProfile userId={currentUser.id || currentUser._id} />
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

        {/* Lab Reports Tab Content */}
        {activeTab === 'lab-reports' && (
          <LabReports userId={currentUser.id || currentUser._id} />
        )}

        {/* Medicine Delivery Tab Content */}
        {activeTab === 'medicines' && (
          <MedicineDelivery 
            userId={currentUser.id || currentUser._id}
            userAddress={userLocation}
          />
        )}

        {/* Ambulance Booking Tab Content */}
        {activeTab === 'ambulance' && (
          <AmbulanceBooking 
            userId={currentUser.id || currentUser._id}
            userName={currentUser.name}
            userPhone={currentUser.phone}
            userLocation={userLocation}
          />
        )}

        {/* Messages Tab Content */}
        {activeTab === 'messages' && (
          <div className="patient-dashboard__messages-section">
            <div className="patient-dashboard__section-header">
              <h2 className="patient-dashboard__section-title">
                <div className="patient-dashboard__section-icon">
                  <i className="fas fa-comments"></i>
                </div>
                Messages
              </h2>
            </div>
            <div className="patient-dashboard__messages-info">
              <div className="patient-dashboard__empty-icon">
                <i className="fas fa-comment-medical"></i>
              </div>
              <h3>Chat with Your Doctors</h3>
              <p>Click the chat icon on any doctor card to start a conversation</p>
              <button 
                className="patient-dashboard__empty-btn"
                onClick={() => setActiveTab('doctors')}
              >
                <i className="fas fa-user-md"></i> Find Doctors
              </button>
            </div>
          </div>
        )}

        {/* Health Tips Tab Content */}
        {activeTab === 'health-tips' && (
          <HealthTips />
        )}

        {/* Full Body Checkup Tab Content */}
        {activeTab === 'checkup' && (
          <HealthCheckup 
            userId={currentUser.id || currentUser._id}
            userName={currentUser.name}
            userEmail={currentUser.email}
            userPhone={currentUser.phone}
          />
        )}

        {/* Medicine Reminder Tab Content */}
        {activeTab === 'medicine-reminder' && (
          <MedicineReminder userId={currentUser.id || currentUser._id} />
        )}

        {/* Health Analytics Tab Content */}
        {activeTab === 'health-analytics' && (
          <HealthAnalytics userId={currentUser.id || currentUser._id} />
        )}

        {/* Emergency Contacts Tab Content */}
        {activeTab === 'emergency' && (
          <EmergencyContacts userId={currentUser.id || currentUser._id} />
        )}

        {/* Health Insurance Tab Content */}
        {activeTab === 'insurance' && (
          <HealthInsurance userId={currentUser.id || currentUser._id} />
        )}

        {/* Health Wallet Tab Content */}
        {activeTab === 'wallet' && (
          <HealthWallet 
            userId={currentUser.id || currentUser._id}
            userName={currentUser.name}
          />
        )}

        {/* Referral & Rewards Tab Content */}
        {activeTab === 'referrals' && (
          <ReferralRewards 
            userId={currentUser.id || currentUser._id}
            userName={currentUser.name}
          />
        )}

        {/* Second Opinion Tab Content */}
        {activeTab === 'second-opinion' && (
          <SecondOpinion 
            userId={currentUser.id || currentUser._id}
            userName={currentUser.name}
          />
        )}

        {/* Loyalty Points Tab Content */}
        {activeTab === 'loyalty' && (
          <LoyaltyPoints 
            userId={currentUser.id || currentUser._id}
          />
        )}

        {/* Review Modal */}
        {showReviewModal && reviewAppointment && (
          <ReviewModal
            appointment={reviewAppointment}
            onClose={() => {
              setShowReviewModal(false);
              setReviewAppointment(null);
            }}
            onSuccess={() => {
              fetchAppointments();
            }}
          />
        )}

        {/* Notification Center */}
        {showNotifications && (
          <NotificationCenter
            userId={currentUser.id || currentUser._id}
            onClose={() => {
              setShowNotifications(false);
              fetchUnreadNotifications();
            }}
          />
        )}

        {/* Doctor Chat Modal */}
        {showChat && chatDoctor && (
          <div className="patient-dashboard__chat-overlay">
            <div className="patient-dashboard__chat-modal">
              <DoctorChat
                user={currentUser}
                doctor={chatDoctor}
                onClose={() => {
                  setShowChat(false);
                  setChatDoctor(null);
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDashboard;
