import React, { useState, useEffect, useMemo, useRef } from 'react';
import UserAvatar from './UserAvatar';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './PatientDashboard.css';

const PatientDashboard = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Doctor list state
  const [doctors, setDoctors] = useState([]);
  const [doctorSummary, setDoctorSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // Debounce ref
  const searchTimeoutRef = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    fetchDoctors();
    fetchDoctorSummary();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSummary = async () => {
    try {
      const response = await axios.get('/api/doctors/summary');
      setDoctorSummary(response.data);
    } catch (error) {
      console.error('Error fetching doctor summary:', error);
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
    setSearchLoading(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchLoading(false);
    }, 300);
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

  // Get next upcoming appointment
  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now && (apt.status === 'pending' || apt.status === 'confirmed');
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return upcoming[0] || null;
  }, [appointments]);

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
    toast.success('Filters cleared successfully');
  };

  // Scroll to doctors section
  const scrollToDoctors = () => {
    setActiveTab('doctors');
    setTimeout(() => {
      document.getElementById('doctors-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (photoData) => {
    try {
      const response = await axios.post('/api/profile/update-photo', {
        userId: currentUser.id,
        profilePhoto: photoData
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile photo updated successfully!');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    }
  };

  return (
    <div className="patient-dashboard">
      {/* Enhanced Header with Next Appointment */}
      <div className="dashboard-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <UserAvatar 
                  user={currentUser}
                  size="large"
                  editable={true}
                  onUpload={handlePhotoUpload}
                />
                
                <div className="flex-grow-1">
                  <h2 className="mb-1">Welcome back, {currentUser.name}!</h2>
                  <p className="text-muted mb-0">
                    <i className="fas fa-envelope me-2"></i>
                    {currentUser.email}
                  </p>
                  
                  {/* Next Appointment Info */}
                  {nextAppointment ? (
                    <div className="next-appointment-badge mt-2">
                      <i className="fas fa-calendar-check me-2"></i>
                      <strong>Next:</strong> Dr. {nextAppointment.doctorId?.name} on{' '}
                      {new Date(nextAppointment.date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric' 
                      })}, {nextAppointment.time}
                      <button className="btn btn-sm btn-link ms-2" onClick={() => setActiveTab('appointments')}>
                        Details
                      </button>
                    </div>
                  ) : (
                    <div className="no-appointment-badge mt-2">
                      <i className="fas fa-info-circle me-2"></i>
                      No upcoming appointments
                      <button className="btn btn-sm btn-link ms-2" onClick={scrollToDoctors}>
                        Book now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-4 text-end">
              <button className="btn btn-outline-danger" onClick={onLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Enhanced Pills */}
      <div className="container mt-4">
        <div className="quick-actions-card">
          <h5 className="mb-3">Quick Actions</h5>
          <div className="quick-actions-pills">
            <button 
              className="action-pill"
              onClick={() => setActiveTab('appointments')}
              title="View your upcoming appointments"
            >
              <div className="pill-icon bg-primary">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="pill-content">
                <span className="pill-label">My Appointments</span>
                <span className="pill-count">{appointments.length}</span>
              </div>
            </button>
            
            <button 
              className="action-pill"
              onClick={() => setActiveTab('ai-assistant')}
              title="Get health advice from AI assistant"
            >
              <div className="pill-icon bg-success">
                <i className="fas fa-robot"></i>
              </div>
              <div className="pill-content">
                <span className="pill-label">AI Assistant</span>
                <span className="pill-badge">New</span>
              </div>
            </button>
            
            <button 
              className="action-pill"
              onClick={() => setActiveTab('payments')}
              title="View payment history and pending bills"
            >
              <div className="pill-icon bg-warning">
                <i className="fas fa-credit-card"></i>
              </div>
              <div className="pill-content">
                <span className="pill-label">Payments</span>
                <span className="pill-status">Up to date</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs mt-4">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-home me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                <i className="fas fa-calendar me-2"></i>
                Appointments
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                <i className="fas fa-user-md me-2"></i>
                Find Doctors
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user me-2"></i>
                Profile
              </button>
            </li>
          </ul>

          <div className="tab-content mt-4">
            {activeTab === 'overview' && (
              <div className="tab-pane-content">
                <h4>Dashboard Overview</h4>
                <p>Your health management at a glance</p>
              </div>
            )}
            
            {activeTab === 'appointments' && (
              <div className="tab-pane-content">
                <h4>My Appointments</h4>
                <p>View and manage your appointments</p>
              </div>
            )}
            
            {activeTab === 'doctors' && (
              <div className="tab-pane-content" id="doctors-section">
                {/* Doctor Summary Stats */}
                {doctorSummary && (
                  <div className="doctor-stats-chips mb-4">
                    <span className="stat-chip">
                      <i className="fas fa-user-md me-1"></i>
                      {doctorSummary.totalDoctors} doctors
                    </span>
                    <span className="stat-chip stat-chip-success">
                      <i className="fas fa-check-circle me-1"></i>
                      {doctorSummary.availableDoctors} available
                    </span>
                    <span className="stat-chip">
                      <i className="fas fa-stethoscope me-1"></i>
                      {doctorSummary.bySpecialization?.length || 0} specializations
                    </span>
                  </div>
                )}

                {/* Filters Card */}
                <div className="filters-card mb-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">
                        <i className="fas fa-search me-2"></i>
                        Search Doctors
                      </label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, specialization, or email (e.g., 'Cardiologist')"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {searchLoading && (
                          <div className="search-spinner">
                            <i className="fas fa-spinner fa-spin"></i>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">
                        <i className="fas fa-stethoscope me-2"></i>
                        Specialization
                      </label>
                      <select
                        className="form-select"
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                      >
                        <option value="">All Specializations</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">
                        <i className="fas fa-hospital me-2"></i>
                        Clinic
                      </label>
                      <select
                        className="form-select"
                        value={selectedClinic}
                        onChange={(e) => setSelectedClinic(e.target.value)}
                      >
                        <option value="">All Clinics</option>
                        {clinics.map(clinic => (
                          <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-2 d-flex align-items-end">
                      <button 
                        className="btn btn-outline-secondary w-100"
                        onClick={resetFilters}
                        disabled={!searchTerm && !selectedSpecialization && !selectedClinic}
                      >
                        <i className="fas fa-redo me-2"></i>
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  {searchLoading && (
                    <div className="filter-status mt-2">
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Updating results...
                    </div>
                  )}
                </div>

                {/* Available Doctors Header with Count */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">
                    Available Doctors ({filteredDoctors.length})
                  </h4>
                  {(searchTerm || selectedSpecialization || selectedClinic) && (
                    <span className="text-muted">
                      <i className="fas fa-filter me-1"></i>
                      Filters active
                    </span>
                  )}
                </div>

                {/* Doctors List or Empty State */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading doctors...</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-state-icon">
                      <i className="fas fa-user-md"></i>
                    </div>
                    <h4>No doctors match your search</h4>
                    <p className="text-muted mb-4">
                      We couldn't find any doctors matching your criteria.
                      <br />
                      Try adjusting your filters or search terms.
                    </p>
                    <div className="empty-state-suggestions">
                      <p className="mb-2"><strong>Suggestions:</strong></p>
                      <ul className="list-unstyled">
                        <li><i className="fas fa-check-circle text-success me-2"></i>Clear your search filters</li>
                        <li><i className="fas fa-check-circle text-success me-2"></i>Try a different specialization</li>
                        <li><i className="fas fa-check-circle text-success me-2"></i>Select another clinic</li>
                      </ul>
                    </div>
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={resetFilters}
                    >
                      <i className="fas fa-redo me-2"></i>
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {filteredDoctors.map(doctor => (
                      <div key={doctor._id} className="col-md-6 col-lg-4">
                        <div className="doctor-card">
                          <div className="doctor-card-header">
                            <div className="doctor-avatar">
                              <i className="fas fa-user-md"></i>
                            </div>
                            <div className="doctor-info">
                              <h5>{doctor.name}</h5>
                              <p className="specialization">{doctor.specialization}</p>
                            </div>
                            {doctor.availability === 'Available' && (
                              <span className="availability-badge available">
                                <i className="fas fa-circle"></i> Available
                              </span>
                            )}
                          </div>
                          
                          <div className="doctor-card-body">
                            <div className="info-row">
                              <i className="fas fa-hospital"></i>
                              <span>{doctor.clinicId?.name || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                              <i className="fas fa-map-marker-alt"></i>
                              <span>{doctor.clinicId?.city || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                              <i className="fas fa-graduation-cap"></i>
                              <span>{doctor.qualification}</span>
                            </div>
                            <div className="info-row">
                              <i className="fas fa-briefcase"></i>
                              <span>{doctor.experience} years experience</span>
                            </div>
                            <div className="info-row">
                              <i className="fas fa-rupee-sign"></i>
                              <span className="fee">₹{doctor.consultationFee}</span>
                            </div>
                          </div>
                          
                          <div className="doctor-card-footer">
                            <button className="btn btn-primary w-100">
                              <i className="fas fa-calendar-plus me-2"></i>
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="tab-pane-content">
                <h4>My Profile</h4>
                <div className="profile-section">
                  <div className="row">
                    <div className="col-md-4 text-center">
                      <UserAvatar 
                        user={currentUser}
                        size="xlarge"
                        editable={true}
                        onUpload={handlePhotoUpload}
                      />
                      <p className="mt-3 text-muted">
                        <small>Click camera icon to change photo</small>
                      </p>
                    </div>
                    <div className="col-md-8">
                      <div className="profile-info">
                        <div className="info-item">
                          <label>Name:</label>
                          <span>{currentUser.name}</span>
                        </div>
                        <div className="info-item">
                          <label>Email:</label>
                          <span>{currentUser.email}</span>
                        </div>
                        {currentUser.phone && (
                          <div className="info-item">
                            <label>Phone:</label>
                            <span>{currentUser.phone}</span>
                          </div>
                        )}
                        <div className="info-item">
                          <label>Role:</label>
                          <span className="badge bg-primary">{currentUser.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
