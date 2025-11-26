import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import axios from "../api/config";
import "../styles/low-end-optimized.css";
import "../styles/theme-system.css";
import { NavbarThemeToggle } from "./ThemeToggle";

// Lazy load heavy components for performance
const AdminChatbot = lazy(() => import("./AdminChatbot"));
const VirtualizedTable = lazy(() => import("./VirtualizedTable"));
const OptimizedLoader = lazy(() => import("./OptimizedLoader"));

// Memoized components to prevent unnecessary re-renders
const MemoizedStatCard = React.memo(({ title, value, icon, color = "primary" }) => (
  <div className={`stat-card ${color} gpu-accelerated`}>
    <div className="stat-content">
      <div className="stat-icon">
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stat-details">
        <div className="stat-number">{value}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  </div>
));

const MemoizedTabButton = React.memo(({ tab, activeTab, onClick, children }) => (
  <button
    className={`tab ${activeTab === tab ? "active" : ""}`}
    onClick={() => onClick(tab)}
  >
    {children}
  </button>
));

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalClinics: 0
  });

  // Data states
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pendingReceptionists, setPendingReceptionists] = useState([]);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingClinic, setEditingClinic] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "patient",
    clinicId: ""
  });

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    clinicId: "",
    availability: "Available",
    consultationFee: 500,
    experience: 0,
    qualification: "MBBS"
  });

  const [clinicForm, setClinicForm] = useState({
    name: "",
    type: "clinic",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: ""
  });

  const [appointmentFilters, setAppointmentFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: ""
  });

  const [loading, setLoading] = useState(true);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setAppointmentFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Fetch dashboard data with error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, doctorsRes, appointmentsRes, clinicsRes, pendingRes] = await Promise.allSettled([
        axios.get("/api/users"),
        axios.get("/api/doctors"),
        axios.get("/api/appointments"),
        axios.get("/api/clinics"),
        axios.get("/api/receptionists/pending").catch(() => ({ data: [] }))
      ]);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const clinicsData = clinicsRes.status === 'fulfilled' ? clinicsRes.value.data : [];
      const pendingData = pendingRes.status === 'fulfilled' ? pendingRes.value.data : [];

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setClinics(clinicsData);
      setPendingReceptionists(pendingData);

      setStats({
        totalUsers: usersData.length,
        totalDoctors: doctorsData.length,
        totalAppointments: appointmentsData.length,
        totalClinics: clinicsData.length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Pre-compute formatted dates to avoid repeated Date operations
  const appointmentsWithFormattedDates = useMemo(() => {
    return appointments.map(apt => ({
      ...apt,
      formattedDate: new Date(apt.date).toLocaleDateString(),
      formattedCreatedAt: apt.createdAt ? new Date(apt.createdAt).toLocaleDateString() : 'N/A'
    }));
  }, [appointments]);

  // Optimized filtering with pre-computed dates
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointmentsWithFormattedDates];

    if (appointmentFilters.search) {
      const searchLower = appointmentFilters.search.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.userId?.name?.toLowerCase().includes(searchLower) ||
        apt.doctorId?.name?.toLowerCase().includes(searchLower) ||
        apt.reason?.toLowerCase().includes(searchLower) ||
        apt.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    if (appointmentFilters.status) {
      filtered = filtered.filter(apt => apt.status === appointmentFilters.status);
    }

    if (appointmentFilters.dateFrom) {
      const fromDate = new Date(appointmentFilters.dateFrom);
      filtered = filtered.filter(apt => new Date(apt.date) >= fromDate);
    }
    if (appointmentFilters.dateTo) {
      const toDate = new Date(appointmentFilters.dateTo);
      filtered = filtered.filter(apt => new Date(apt.date) <= toDate);
    }

    return filtered;
  }, [appointmentsWithFormattedDates, appointmentFilters]);

  // Helper function for status badge classes
  const getStatusBadgeClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  }, []);

  // User CRUD operations
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", userForm);
      setShowUserModal(false);
      resetUserForm();
      fetchDashboardData();
      alert("User created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error creating user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${editingUser._id}`, userForm);
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchDashboardData();
      alert("User updated successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error updating user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchDashboardData();
        alert("User deleted successfully!");
      } catch (error) {
        alert("Error deleting user");
      }
    }
  };

  // Doctor CRUD operations
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/doctors", doctorForm);
      setShowDoctorModal(false);
      resetDoctorForm();
      fetchDashboardData();
      alert("Doctor created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error creating doctor");
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/doctors/${editingDoctor._id}`, doctorForm);
      setShowDoctorModal(false);
      setEditingDoctor(null);
      resetDoctorForm();
      fetchDashboardData();
      alert("Doctor updated successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error updating doctor");
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        await axios.delete(`/api/doctors/${doctorId}`);
        fetchDashboardData();
        alert("Doctor deleted successfully!");
      } catch (error) {
        alert("Error deleting doctor");
      }
    }
  };

  // Clinic CRUD operations
  const handleCreateClinic = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/clinics", clinicForm);
      setShowClinicModal(false);
      resetClinicForm();
      fetchDashboardData();
      alert("Clinic created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error creating clinic");
    }
  };

  const handleUpdateClinic = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/clinics/${editingClinic._id}`, clinicForm);
      setShowClinicModal(false);
      setEditingClinic(null);
      resetClinicForm();
      fetchDashboardData();
      alert("Clinic updated successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error updating clinic");
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    if (window.confirm("Are you sure you want to delete this clinic?")) {
      try {
        await axios.delete(`/api/clinics/${clinicId}`);
        fetchDashboardData();
        alert("Clinic deleted successfully!");
      } catch (error) {
        alert("Error deleting clinic");
      }
    }
  };

  // Form helpers
  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "patient",
      clinicId: ""
    });
  };

  const resetDoctorForm = () => {
    setDoctorForm({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      clinicId: "",
      availability: "Available",
      consultationFee: 500,
      experience: 0,
      qualification: "MBBS"
    });
  };

  const resetClinicForm = () => {
    setClinicForm({
      name: "",
      type: "clinic",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: ""
    });
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: "",
        phone: user.phone || "",
        role: user.role,
        clinicId: user.clinicId?._id || ""
      });
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const openDoctorModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setDoctorForm({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        clinicId: doctor.clinicId?._id || "",
        availability: doctor.availability,
        consultationFee: doctor.consultationFee,
        experience: doctor.experience,
        qualification: doctor.qualification
      });
    } else {
      setEditingDoctor(null);
      resetDoctorForm();
    }
    setShowDoctorModal(true);
  };

  const openClinicModal = (clinic = null) => {
    if (clinic) {
      setEditingClinic(clinic);
      setClinicForm({
        name: clinic.name,
        type: clinic.type || "clinic",
        address: clinic.address,
        city: clinic.city,
        state: clinic.state || "",
        pincode: clinic.pincode || "",
        phone: clinic.phone || "",
        email: clinic.email || ""
      });
    } else {
      setEditingClinic(null);
      resetClinicForm();
    }
    setShowClinicModal(true);
  };

  const handleApproveReceptionist = async (clinicId) => {
    try {
      await axios.put(`/api/receptionists/${selectedReceptionist._id}/approve`, {
        clinicId: clinicId || null
      });
      setShowApprovalModal(false);
      setSelectedReceptionist(null);
      fetchDashboardData();
      alert("Receptionist approved successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error approving receptionist");
    }
  };

  const handleRejectReceptionist = async (receptionistId) => {
    if (!window.confirm("Are you sure you want to reject this receptionist?")) {
      return;
    }
    try {
      await axios.put(`/api/receptionists/${receptionistId}/reject`);
      fetchDashboardData();
      alert("Receptionist rejected successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error rejecting receptionist");
    }
  };

  if (loading) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <OptimizedLoader message="Loading dashboard..." />
      </Suspense>
    );
  }

  return (
    <div className="main-content">
      {/* Enhanced Professional Header */}
      <nav className="admin-navbar">
        <div className="navbar-container">
          {/* Left Section - Brand */}
          <div className="navbar-brand-section">
            <div className="brand-logo">
              <div className="logo-icon">
                <i className="fas fa-heartbeat"></i>
              </div>
              <div className="brand-text">
                <h1 className="brand-title">HealthSync</h1>
                <span className="brand-subtitle">Admin Dashboard</span>
              </div>
            </div>
          </div>

          {/* Center Section - Quick Stats */}
          <div className="navbar-stats">
            <div className="quick-stat">
              <i className="fas fa-users"></i>
              <span className="stat-value">{stats.totalUsers}</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="quick-stat">
              <i className="fas fa-user-md"></i>
              <span className="stat-value">{stats.totalDoctors}</span>
              <span className="stat-label">Doctors</span>
            </div>
            <div className="quick-stat">
              <i className="fas fa-calendar-check"></i>
              <span className="stat-value">{appointments.filter(a => a.status === "pending").length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="navbar-actions">
            {/* Notifications */}
            {pendingReceptionists.length > 0 && (
              <div className="notification-badge">
                <i className="fas fa-bell"></i>
                <span className="badge-count">{pendingReceptionists.length}</span>
                <div className="notification-tooltip">
                  {pendingReceptionists.length} pending receptionist{pendingReceptionists.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="system-status">
              <div className="status-indicator online"></div>
              <span className="status-text">System Online</span>
            </div>

            {/* Theme Toggle */}
            <NavbarThemeToggle />

            {/* Refresh Button */}
            <button
              className="refresh-btn"
              onClick={() => fetchDashboardData()}
              title="Refresh Dashboard Data"
            >
              <i className="fas fa-sync-alt"></i>
            </button>

            {/* User Profile */}
            <div className="user-profile">
              <div className="profile-avatar">
                <i className="fas fa-user-shield"></i>
              </div>
              <div className="profile-info">
                <span className="profile-name">Admin</span>
                <span className="profile-role">System Administrator</span>
              </div>
              <div className="profile-dropdown">
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '1rem' }}>
        {/* Optimized Stats Grid */}
        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <MemoizedStatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="users"
            color="primary"
          />
          <MemoizedStatCard
            title="Total Doctors"
            value={stats.totalDoctors}
            icon="user-md"
            color="success"
          />
          <MemoizedStatCard
            title="Total Appointments"
            value={stats.totalAppointments}
            icon="calendar"
            color="info"
          />
          <MemoizedStatCard
            title="Total Clinics"
            value={stats.totalClinics}
            icon="hospital"
            color="warning"
          />
        </div>

        {/* Optimized Navigation Tabs */}
        <div className="tabs" style={{ marginBottom: '2rem' }}>
          <MemoizedTabButton tab="overview" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-chart-pie me-1"></i>
            Overview
          </MemoizedTabButton>
          <MemoizedTabButton tab="users" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-users me-1"></i>
            Users
          </MemoizedTabButton>
          <MemoizedTabButton tab="doctors" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-md me-1"></i>
            Doctors
          </MemoizedTabButton>
          <MemoizedTabButton tab="clinics" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-hospital me-1"></i>
            Clinics
          </MemoizedTabButton>
          <MemoizedTabButton tab="appointments" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-calendar-check me-1"></i>
            Appointments
          </MemoizedTabButton>
          <MemoizedTabButton tab="reports" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-chart-bar me-1"></i>
            Reports
          </MemoizedTabButton>
          <MemoizedTabButton tab="pending" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-clock me-1"></i>
            Pending ({pendingReceptionists.length})
          </MemoizedTabButton>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <div className="section-content">
              <div className="section-header">
                <h2 className="section-title">System Overview</h2>
                <p className="section-subtitle">Welcome to the admin dashboard. Monitor and manage your healthcare system.</p>
              </div>

              <div className="overview-grid">
                <div className="overview-card">
                  <div className="overview-header">
                    <h3>Recent Activity</h3>
                    <i className="fas fa-activity"></i>
                  </div>
                  <div className="overview-content">
                    <div className="activity-item">
                      <span className="activity-count">{appointments.filter(a => a.status === "pending").length}</span>
                      <span className="activity-label">Pending Appointments</span>
                    </div>
                    <div className="activity-item">
                      <span className="activity-count">{appointments.filter(a => a.status === "confirmed").length}</span>
                      <span className="activity-label">Confirmed Appointments</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-header">
                    <h3>System Status</h3>
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="overview-content">
                    <div className="status-item success">
                      <i className="fas fa-check-circle"></i>
                      <span>All systems operational</span>
                    </div>
                    <div className="status-item">
                      <i className="fas fa-clock"></i>
                      <span>Last updated: {new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="section-content">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>User Management</h5>
                <button
                  className="btn btn-primary"
                  onClick={() => openUserModal()}
                >
                  <i className="fas fa-plus me-1"></i>
                  Add User
                </button>
              </div>

              <Suspense fallback={<div>Loading users...</div>}>
                <VirtualizedTable
                  data={users}
                  columns={[
                    { key: 'name', title: 'Name' },
                    { key: 'email', title: 'Email' },
                    { key: 'role', title: 'Role' },
                    { key: 'phone', title: 'Phone' },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (item) => (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openUserModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              </Suspense>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="section-content">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Doctor Management</h5>
                <button
                  className="btn btn-success"
                  onClick={() => openDoctorModal()}
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Doctor
                </button>
              </div>

              <Suspense fallback={<div>Loading doctors...</div>}>
                <VirtualizedTable
                  data={doctors}
                  columns={[
                    { key: 'name', title: 'Name', render: (item) => `Dr. ${item.name}` },
                    { key: 'specialization', title: 'Specialization' },
                    { key: 'email', title: 'Email' },
                    { key: 'phone', title: 'Phone' },
                    { key: 'consultationFee', title: 'Fee', render: (item) => `₹${item.consultationFee}` },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (item) => (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openDoctorModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteDoctor(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              </Suspense>
            </div>
          )}

          {activeTab === "clinics" && (
            <div className="section-content">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Clinic Management</h5>
                <button
                  className="btn btn-info"
                  onClick={() => openClinicModal()}
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Clinic
                </button>
              </div>

              <Suspense fallback={<div>Loading clinics...</div>}>
                <VirtualizedTable
                  data={clinics}
                  columns={[
                    { key: 'name', title: 'Name' },
                    { key: 'type', title: 'Type' },
                    { key: 'city', title: 'City' },
                    { key: 'phone', title: 'Phone' },
                    { key: 'email', title: 'Email' },
                    {
                      key: 'actions',
                      title: 'Actions',
                      render: (item) => (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openClinicModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteClinic(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              </Suspense>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="section-content">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Appointment Management</h5>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const csvContent = filteredAppointments.map(apt =>
                      `${apt.formattedDate},${apt.time},${apt.userId?.name || 'Unknown'},${apt.doctorId?.name || 'Unknown'},${apt.status},${apt.reason || ''}`
                    ).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'appointments.csv';
                    a.click();
                  }}
                >
                  <i className="fas fa-download me-1"></i>
                  Export CSV
                </button>
              </div>

              {/* Appointment Filters */}
              <div className="filters mb-3">
                <div className="row">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search..."
                      value={appointmentFilters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-control"
                      value={appointmentFilters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input
                      type="date"
                      className="form-control"
                      value={appointmentFilters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="date"
                      className="form-control"
                      value={appointmentFilters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setAppointmentFilters({ search: "", status: "", dateFrom: "", dateTo: "" })}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              <Suspense fallback={<div>Loading appointments...</div>}>
                <VirtualizedTable
                  data={filteredAppointments}
                  columns={[
                    { key: 'formattedDate', title: 'Date' },
                    { key: 'time', title: 'Time' },
                    { key: 'patient', title: 'Patient', render: (item) => item.userId?.name || 'Unknown' },
                    { key: 'doctor', title: 'Doctor', render: (item) => `Dr. ${item.doctorId?.name || 'Unknown'}` },
                    {
                      key: 'status',
                      title: 'Status',
                      render: (item) => (
                        <span className={`badge badge-${getStatusBadgeClass(item.status)}`}>
                          {item.status}
                        </span>
                      )
                    },
                    { key: 'reason', title: 'Reason' }
                  ]}
                />
              </Suspense>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="section-content">
              <h5>Reports & Analytics</h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <h6>Appointment Statistics</h6>
                      <p>Total: {stats.totalAppointments}</p>
                      <p>Pending: {appointments.filter(a => a.status === "pending").length}</p>
                      <p>Confirmed: {appointments.filter(a => a.status === "confirmed").length}</p>
                      <p>Completed: {appointments.filter(a => a.status === "completed").length}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <h6>System Statistics</h6>
                      <p>Active Users: {users.filter(u => u.role !== 'admin').length}</p>
                      <p>Available Doctors: {doctors.filter(d => d.availability === 'Available').length}</p>
                      <p>Active Clinics: {stats.totalClinics}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div className="section-content">
              <h5>Pending Receptionists</h5>
              {pendingReceptionists.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-2">No pending receptionists</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Applied Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReceptionists.map((receptionist) => (
                        <tr key={receptionist._id}>
                          <td>{receptionist.name}</td>
                          <td>{receptionist.email}</td>
                          <td>{receptionist.phone}</td>
                          <td>{new Date(receptionist.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success me-1"
                              onClick={() => {
                                setSelectedReceptionist(receptionist);
                                setShowApprovalModal(true);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRejectReceptionist(receptionist._id)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showUserModal && (
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingUser ? 'Edit User' : 'Add User'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUserModal(false)}
                  ></button>
                </div>
                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select
                        className="form-control"
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      >
                        <option value="patient">Patient</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {!editingUser && (
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          required={!editingUser}
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingUser ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showApprovalModal && selectedReceptionist && (
          <div className="modal show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Approve Receptionist</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowApprovalModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Approve {selectedReceptionist.name} as a receptionist?</p>
                  <div className="mb-3">
                    <label className="form-label">Assign to Clinic (Optional)</label>
                    <select className="form-control" id="clinicSelect">
                      <option value="">No specific clinic</option>
                      {clinics.map(clinic => (
                        <option key={clinic._id} value={clinic._id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowApprovalModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      const clinicId = document.getElementById('clinicSelect').value;
                      handleApproveReceptionist(clinicId);
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lazy-loaded AI Chatbot */}
      <Suspense fallback={null}>
        <AdminChatbot
          systemStats={stats}
          currentContext={activeTab}
        />
      </Suspense>
    </div>
  );
}

export default React.memo(AdminDashboard);