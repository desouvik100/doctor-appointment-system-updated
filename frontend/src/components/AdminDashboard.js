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

function AdminDashboard({ admin, onLogout }) {
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

  // Pending approvals state
  const [pendingStaff, setPendingStaff] = useState([]);
  const [pendingClinics, setPendingClinics] = useState([]);

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
    fetchPendingApprovals();
  }, [fetchDashboardData]);

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      const [staffRes, clinicsRes] = await Promise.allSettled([
        axios.get('/api/receptionists/pending'),
        axios.get('/api/clinics/admin/pending')
      ]);
      
      if (staffRes.status === 'fulfilled') {
        setPendingStaff(staffRes.value.data || []);
      }
      if (clinicsRes.status === 'fulfilled') {
        setPendingClinics(clinicsRes.value.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  // Approve staff
  const handleApproveStaff = async (staffId, clinicId) => {
    try {
      await axios.put(`/api/receptionists/${staffId}/approve`, { clinicId });
      toast.success('Staff approved successfully!');
      fetchPendingApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve staff');
    }
  };

  // Reject staff
  const handleRejectStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to reject this staff registration?')) return;
    try {
      await axios.put(`/api/receptionists/${staffId}/reject`);
      toast.success('Staff rejected');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject staff');
    }
  };

  // Approve clinic
  const handleApproveClinic = async (clinicId) => {
    try {
      await axios.put(`/api/clinics/${clinicId}/approve`, { adminId: admin?.id || admin?._id });
      toast.success('Clinic approved successfully!');
      fetchPendingApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve clinic');
    }
  };

  // Reject clinic
  const handleRejectClinic = async (clinicId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await axios.put(`/api/clinics/${clinicId}/reject`, { reason });
      toast.success('Clinic rejected');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject clinic');
    }
  };

  // CRUD Operations
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/users/${userId}`);
        console.log('Delete user response:', response.data);
        
        // Immediately update local state to remove the user
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        
        toast.success("User deleted successfully!");
      } catch (error) {
        console.error('Delete user error:', error);
        toast.error(error.response?.data?.message || "Error deleting user");
      }
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/doctors/${doctorId}`);
        console.log('Delete doctor response:', response.data);
        
        // Immediately update local state to remove the doctor
        setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor._id !== doctorId));
        setStats(prev => ({ ...prev, totalDoctors: prev.totalDoctors - 1 }));
        
        toast.success("Doctor deleted successfully!");
      } catch (error) {
        console.error('Delete doctor error:', error);
        toast.error(error.response?.data?.message || "Error deleting doctor");
      }
    }
  };

  // User CRUD Operations
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "", email: "", password: "", phone: "", role: "patient"
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: user.role || "patient"
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, userForm);
        toast.success("User updated successfully!");
      } else {
        await axios.post("/api/users", userForm);
        toast.success("User created successfully!");
      }
      setShowUserModal(false);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving user");
    }
  };

  // Doctor CRUD Operations
  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: "", email: "", phone: "", specialization: "", consultationFee: 500, clinicId: ""
    });
    setShowDoctorModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      name: doctor.name || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      specialization: doctor.specialization || "",
      consultationFee: doctor.consultationFee || 500,
      clinicId: doctor.clinicId?._id || doctor.clinicId || ""
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await axios.put(`/api/doctors/${editingDoctor._id}`, doctorForm);
        toast.success("Doctor updated successfully!");
      } else {
        await axios.post("/api/doctors", doctorForm);
        toast.success("Doctor created successfully!");
      }
      setShowDoctorModal(false);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving doctor");
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
    if (window.confirm("Are you sure you want to delete this clinic? This will also deactivate all associated doctors. This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/clinics/${clinicId}`);
        console.log('Delete clinic response:', response.data);
        
        // Immediately update local state to remove the clinic
        setClinics(prevClinics => prevClinics.filter(clinic => clinic._id !== clinicId));
        setStats(prev => ({ ...prev, totalClinics: prev.totalClinics - 1 }));
        
        // Also refresh doctors as some may have been deactivated
        const doctorsRes = await axios.get("/api/doctors");
        setDoctors(doctorsRes.data);
        setStats(prev => ({ ...prev, totalDoctors: doctorsRes.data.length }));
        
        toast.success("Clinic deleted successfully!");
      } catch (error) {
        console.error('Delete clinic error:', error);
        toast.error(error.response?.data?.message || "Error deleting clinic");
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
              {admin && (
                <span className="admin-navbar__user">
                  <i className="fas fa-user-shield"></i>
                  {admin.name || 'Admin'}
                </span>
              )}
              <button className="btn btn-primary" onClick={fetchDashboardData}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
              {onLogout && (
                <button className="btn btn-outline-light" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              )}
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
          <TabButton tab="approvals" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-check"></i> Approvals
            {(pendingStaff.length + pendingClinics.length) > 0 && (
              <span className="admin-tab__badge">{pendingStaff.length + pendingClinics.length}</span>
            )}
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
                <button className="btn btn-primary" onClick={handleAddUser}>
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
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
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
                <button className="btn btn-primary" onClick={handleAddDoctor}>
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
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditDoctor(doctor)}
                              title="Edit Doctor"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteDoctor(doctor._id)}
                              title="Delete Doctor"
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

          {activeTab === "approvals" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  Pending Approvals
                </h2>
              </div>

              {/* Pending Staff */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-user-tie" style={{ color: '#3b82f6' }}></i>
                  Pending Staff Registrations ({pendingStaff.length})
                </h3>
                {pendingStaff.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                    <p>No pending staff registrations</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Clinic Name</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingStaff.map(staff => (
                          <tr key={staff._id}>
                            <td><strong>{staff.name}</strong></td>
                            <td>{staff.email}</td>
                            <td>{staff.phone || 'N/A'}</td>
                            <td>{staff.clinicName || 'Not specified'}</td>
                            <td>{new Date(staff.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <select 
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginRight: '8px', fontSize: '13px' }}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleApproveStaff(staff._id, e.target.value);
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">Assign Clinic & Approve</option>
                                  {clinics.map(clinic => (
                                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                                  ))}
                                </select>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => handleRejectStaff(staff._id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Clinics */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-hospital" style={{ color: '#10b981' }}></i>
                  Pending Clinic Registrations ({pendingClinics.length})
                </h3>
                {pendingClinics.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                    <p>No pending clinic registrations</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Address</th>
                          <th>City</th>
                          <th>Phone</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingClinics.map(clinic => (
                          <tr key={clinic._id}>
                            <td><strong>{clinic.name}</strong></td>
                            <td>
                              <span className={`badge ${clinic.type === 'hospital' ? 'badge-info' : 'badge-primary'}`}>
                                {clinic.type || 'clinic'}
                              </span>
                            </td>
                            <td>{clinic.address}</td>
                            <td>{clinic.city}</td>
                            <td>{clinic.phone || 'N/A'}</td>
                            <td>{new Date(clinic.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <button 
                                  className="admin-action-btn"
                                  style={{ background: '#10b981', color: 'white' }}
                                  onClick={() => handleApproveClinic(clinic._id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => handleRejectClinic(clinic._id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user"></i> {editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Enter password"
                    required={!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={e => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="patient">Patient</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-md"></i> {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="modal-close" onClick={() => setShowDoctorModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveDoctor}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={doctorForm.name}
                    onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                    placeholder="Enter doctor's name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={e => setDoctorForm({...doctorForm, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={doctorForm.phone}
                    onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization *</label>
                  <select
                    value={doctorForm.specialization}
                    onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})}
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Dentist">Dentist</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={doctorForm.consultationFee}
                    onChange={e => setDoctorForm({...doctorForm, consultationFee: parseInt(e.target.value) || 0})}
                    placeholder="Enter consultation fee"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Clinic</label>
                  <select
                    value={doctorForm.clinicId}
                    onChange={e => setDoctorForm({...doctorForm, clinicId: e.target.value})}
                  >
                    <option value="">Select Clinic (Optional)</option>
                    {clinics.map(clinic => (
                      <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDoctorModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
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
