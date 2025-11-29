import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import AdminChatbot from './AdminChatbot';
import '../styles/admin-dashboard-professional.css';

// Stat Card Component
const StatCard = ({ title, value, icon, color = "primary" }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-card__content">
      <div className="admin-stat-card__icon" style={{ background: color === 'success' ? '#10b981' : color === 'warning' ? '#f59e0b' : color === 'info' ? '#3b82f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="admin-stat-card__details">
        <div className="admin-stat-card__value">{value}</div>
        <div className="admin-stat-card__label">{title}</div>
      </div>
    </div>
  </div>
);

// Tab Button Component
const TabButton = ({ tab, activeTab, onClick, children }) => (
  <button
    className={`admin-tab ${activeTab === tab ? 'admin-tab--active' : ''}`}
    onClick={() => onClick(tab)}
  >
    {children}
  </button>
);

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalClinics: 0
  });

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: "", email: "", password: "", phone: "", role: "patient"
  });

  const [doctorForm, setDoctorForm] = useState({
    name: "", email: "", phone: "", specialization: "", consultationFee: 500
  });

  // Clinic modal and form states
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    type: "clinic",
    address: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    phone: "",
    alternatePhone: "",
    email: "",
    website: "",
    description: "",
    facilities: [],
    isActive: true
  });

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, doctorsRes, appointmentsRes, clinicsRes] = await Promise.allSettled([
        axios.get("/api/users"),
        axios.get("/api/doctors"),
        axios.get("/api/appointments"),
        axios.get("/api/clinics")
      ]);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const clinicsData = clinicsRes.status === 'fulfilled' ? clinicsRes.value.data : [];

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setClinics(clinicsData);

      setStats({
        totalUsers: usersData.length,
        totalDoctors: doctorsData.length,
        totalAppointments: appointmentsData.length,
        totalClinics: clinicsData.length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // CRUD Operations
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchDashboardData();
        toast.success("User deleted successfully!");
      } catch (error) {
        toast.error("Error deleting user");
      }
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await axios.delete(`/api/doctors/${doctorId}`);
        fetchDashboardData();
        toast.success("Doctor deleted successfully!");
      } catch (error) {
        toast.error("Error deleting doctor");
      }
    }
  };

  // Clinic CRUD Operations
  const handleAddClinic = () => {
    setEditingClinic(null);
    setClinicForm({
      name: "",
      type: "clinic",
      address: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      latitude: "",
      longitude: "",
      googleMapsUrl: "",
      phone: "",
      alternatePhone: "",
      email: "",
      website: "",
      description: "",
      facilities: [],
      isActive: true
    });
    setShowClinicModal(true);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name || "",
      type: clinic.type || "clinic",
      address: clinic.address || "",
      addressLine2: clinic.addressLine2 || "",
      landmark: clinic.landmark || "",
      city: clinic.city || "",
      state: clinic.state || "",
      country: clinic.country || "India",
      pincode: clinic.pincode || "",
      latitude: clinic.latitude || "",
      longitude: clinic.longitude || "",
      googleMapsUrl: clinic.googleMapsUrl || "",
      phone: clinic.phone || "",
      alternatePhone: clinic.alternatePhone || "",
      email: clinic.email || "",
      website: clinic.website || "",
      description: clinic.description || "",
      facilities: clinic.facilities || [],
      isActive: clinic.isActive !== false
    });
    setShowClinicModal(true);
  };

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    try {
      if (editingClinic) {
        await axios.put(`/api/clinics/${editingClinic._id}`, clinicForm);
        toast.success("Clinic updated successfully!");
      } else {
        await axios.post("/api/clinics", clinicForm);
        toast.success("Clinic created successfully!");
      }
      setShowClinicModal(false);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving clinic");
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    if (window.confirm("Are you sure you want to delete this clinic? This will also deactivate all associated doctors.")) {
      try {
        await axios.delete(`/api/clinics/${clinicId}`);
        fetchDashboardData();
        toast.success("Clinic deleted successfully!");
      } catch (error) {
        toast.error("Error deleting clinic");
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setClinicForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Unable to get location: " + error.message);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const openGoogleMaps = () => {
    if (clinicForm.latitude && clinicForm.longitude) {
      window.open(`https://www.google.com/maps?q=${clinicForm.latitude},${clinicForm.longitude}`, '_blank');
    } else {
      toast.error("Please enter coordinates first");
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner" style={{ width: '60px', height: '60px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        
        {/* Navbar */}
        <nav className="admin-navbar">
          <div className="admin-navbar__content">
            <div className="admin-navbar__brand">
              <div className="admin-navbar__logo">
                <i className="fas fa-heartbeat"></i>
              </div>
              <h1 className="admin-navbar__title">HealthSync Admin</h1>
            </div>
            
            <div className="admin-navbar__stats">
              <div className="admin-navbar__stat">
                <div className="admin-navbar__stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div>
                  <div className="admin-navbar__stat-value">{stats.totalUsers}</div>
                  <div className="admin-navbar__stat-label">Users</div>
                </div>
              </div>
              <div className="admin-navbar__stat">
                <div className="admin-navbar__stat-icon">
                  <i className="fas fa-user-md"></i>
                </div>
                <div>
                  <div className="admin-navbar__stat-value">{stats.totalDoctors}</div>
                  <div className="admin-navbar__stat-label">Doctors</div>
                </div>
              </div>
            </div>
            
            <div className="admin-navbar__actions">
              <button className="btn btn-primary" onClick={fetchDashboardData}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>
        </nav>

        {/* Stats Grid */}
        <div className="admin-stats">
          <StatCard title="Total Users" value={stats.totalUsers} icon="users" color="primary" />
          <StatCard title="Total Doctors" value={stats.totalDoctors} icon="user-md" color="success" />
          <StatCard title="Appointments" value={stats.totalAppointments} icon="calendar-check" color="info" />
          <StatCard title="Clinics" value={stats.totalClinics} icon="hospital" color="warning" />
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <TabButton tab="overview" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-chart-pie"></i> Overview
          </TabButton>
          <TabButton tab="users" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-users"></i> Users
          </TabButton>
          <TabButton tab="doctors" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-md"></i> Doctors
          </TabButton>
          <TabButton tab="appointments" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-calendar-check"></i> Appointments
          </TabButton>
          <TabButton tab="clinics" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-hospital"></i> Clinics
          </TabButton>
        </div>

        {/* Content Sections */}
        <div className="admin-section">
          {activeTab === "overview" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-chart-pie"></i>
                  </div>
                  System Overview
                </h2>
              </div>
              <p style={{ color: '#718096', fontSize: '16px' }}>
                Welcome to the HealthSync Admin Dashboard. Monitor and manage your healthcare system from here.
              </p>
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-users"></i>
                  </div>
                  User Management
                </h2>
                <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                  <i className="fas fa-plus"></i> Add User
                </button>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className="badge badge-primary">{user.role}</span></td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-action-btn admin-action-btn--edit">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "doctors" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  Doctor Management
                </h2>
                <button className="btn btn-primary" onClick={() => setShowDoctorModal(true)}>
                  <i className="fas fa-plus"></i> Add Doctor
                </button>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Email</th>
                      <th>Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doctor => (
                      <tr key={doctor._id}>
                        <td>Dr. {doctor.name}</td>
                        <td>{doctor.specialization}</td>
                        <td>{doctor.email}</td>
                        <td>₹{doctor.consultationFee}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-action-btn admin-action-btn--edit">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteDoctor(doctor._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "appointments" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  Appointments
                </h2>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(apt => (
                      <tr key={apt._id}>
                        <td>{apt.userId?.name || 'Unknown'}</td>
                        <td>Dr. {apt.doctorId?.name || 'Unknown'}</td>
                        <td>{new Date(apt.date).toLocaleDateString()}</td>
                        <td>{apt.time}</td>
                        <td>
                          <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "clinics" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-hospital"></i>
                  </div>
                  Clinic Management
                </h2>
                <button className="btn btn-primary" onClick={handleAddClinic}>
                  <i className="fas fa-plus"></i> Add Clinic
                </button>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinics.map(clinic => (
                      <tr key={clinic._id}>
                        <td><strong>{clinic.name}</strong></td>
                        <td>
                          <span className={`badge ${clinic.type === 'hospital' ? 'badge-info' : 'badge-primary'}`}>
                            {clinic.type || 'clinic'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ fontSize: '13px' }}>{clinic.address}</div>
                          {clinic.landmark && <div style={{ fontSize: '11px', color: '#718096' }}>Near: {clinic.landmark}</div>}
                        </td>
                        <td>{clinic.city}, {clinic.state || ''}</td>
                        <td>
                          {clinic.latitude && clinic.longitude ? (
                            <a 
                              href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{ fontSize: '11px', padding: '4px 8px', background: '#10b981', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
                            >
                              <i className="fas fa-map-marker-alt"></i> View Map
                            </a>
                          ) : (
                            <span style={{ color: '#a0aec0', fontSize: '12px' }}>Not set</span>
                          )}
                        </td>
                        <td>{clinic.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge ${clinic.isActive !== false ? 'badge-success' : 'badge-error'}`}>
                            {clinic.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditClinic(clinic)}
                              title="Edit Clinic"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteClinic(clinic._id)}
                              title="Delete Clinic"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>
      
      {/* AI Chatbot */}
      <AdminChatbot 
        systemStats={stats} 
        currentContext={activeTab} 
      />

      {/* Clinic Modal */}
      {showClinicModal && (
        <div className="modal-overlay" onClick={() => setShowClinicModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-hospital"></i> {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}</h3>
              <button className="modal-close" onClick={() => setShowClinicModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveClinic}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Basic Information */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-info-circle"></i> Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Clinic Name *</label>
                      <input
                        type="text"
                        value={clinicForm.name}
                        onChange={e => setClinicForm({...clinicForm, name: e.target.value})}
                        placeholder="Enter clinic name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={clinicForm.type}
                        onChange={e => setClinicForm({...clinicForm, type: e.target.value})}
                      >
                        <option value="clinic">Clinic</option>
                        <option value="hospital">Hospital</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={clinicForm.description}
                      onChange={e => setClinicForm({...clinicForm, description: e.target.value})}
                      placeholder="Brief description of the clinic"
                      rows="2"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-map-marker-alt"></i> Address Details</h4>
                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      value={clinicForm.address}
                      onChange={e => setClinicForm({...clinicForm, address: e.target.value})}
                      placeholder="Street address, building name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={clinicForm.addressLine2}
                      onChange={e => setClinicForm({...clinicForm, addressLine2: e.target.value})}
                      placeholder="Floor, suite, unit number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={clinicForm.landmark}
                      onChange={e => setClinicForm({...clinicForm, landmark: e.target.value})}
                      placeholder="Near landmark (e.g., Near City Mall)"
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        value={clinicForm.city}
                        onChange={e => setClinicForm({...clinicForm, city: e.target.value})}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={clinicForm.state}
                        onChange={e => setClinicForm({...clinicForm, state: e.target.value})}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        value={clinicForm.pincode}
                        onChange={e => setClinicForm({...clinicForm, pincode: e.target.value})}
                        placeholder="Pincode"
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={clinicForm.country}
                        onChange={e => setClinicForm({...clinicForm, country: e.target.value})}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Coordinates */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-crosshairs"></i> Exact Location (GPS Coordinates)</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={clinicForm.latitude}
                        onChange={e => setClinicForm({...clinicForm, latitude: e.target.value})}
                        placeholder="e.g., 28.6139"
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={clinicForm.longitude}
                        onChange={e => setClinicForm({...clinicForm, longitude: e.target.value})}
                        placeholder="e.g., 77.2090"
                      />
                    </div>
                  </div>
                  <div className="form-actions-inline">
                    <button type="button" className="btn btn-secondary" onClick={getCurrentLocation}>
                      <i className="fas fa-location-arrow"></i> Get Current Location
                    </button>
                    <button type="button" className="btn btn-info" onClick={openGoogleMaps}>
                      <i className="fas fa-external-link-alt"></i> View on Google Maps
                    </button>
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Google Maps URL</label>
                    <input
                      type="url"
                      value={clinicForm.googleMapsUrl}
                      onChange={e => setClinicForm({...clinicForm, googleMapsUrl: e.target.value})}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-phone"></i> Contact Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={clinicForm.phone}
                        onChange={e => setClinicForm({...clinicForm, phone: e.target.value})}
                        placeholder="Primary phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Alternate Phone</label>
                      <input
                        type="tel"
                        value={clinicForm.alternatePhone}
                        onChange={e => setClinicForm({...clinicForm, alternatePhone: e.target.value})}
                        placeholder="Alternate phone number"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={clinicForm.email}
                        onChange={e => setClinicForm({...clinicForm, email: e.target.value})}
                        placeholder="clinic@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="url"
                        value={clinicForm.website}
                        onChange={e => setClinicForm({...clinicForm, website: e.target.value})}
                        placeholder="https://www.clinic.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="form-section">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={clinicForm.isActive}
                        onChange={e => setClinicForm({...clinicForm, isActive: e.target.checked})}
                      />
                      <span>Active (Clinic is operational)</span>
                    </label>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClinicModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingClinic ? 'Update Clinic' : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
