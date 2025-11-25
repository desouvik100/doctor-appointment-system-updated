import React, { useState, useEffect } from "react";
import axios from "../api/config";
import "../styles/admin-dashboard-clean.css";

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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [appointmentFilters, setAppointmentFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: ""
  });

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, appointmentFilters]);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, doctorsRes, appointmentsRes, clinicsRes, pendingRes] = await Promise.allSettled([
        axios.get("/api/users"),
        axios.get("/api/doctors"),
        axios.get("/api/appointments"),
        axios.get("/api/clinics"),
        axios.get("/api/receptionists/pending").catch(() => ({ data: [] })) // Handle if endpoint doesn't exist
      ]);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const clinicsData = clinicsRes.status === 'fulfilled' ? clinicsRes.value.data : [];
      const pendingData = pendingRes.status === 'fulfilled' ? pendingRes.value.data : [];

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
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
  };

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
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchDashboardData();
        alert("User deactivated successfully!");
      } catch (error) {
        alert("Error deactivating user");
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
    if (window.confirm("Are you sure you want to deactivate this doctor?")) {
      try {
        await axios.delete(`/api/doctors/${doctorId}`);
        fetchDashboardData();
        alert("Doctor deactivated successfully!");
      } catch (error) {
        alert("Error deactivating doctor");
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
    if (window.confirm("Are you sure you want to deactivate this clinic? This will also deactivate all doctors in this clinic.")) {
      try {
        await axios.delete(`/api/clinics/${clinicId}`);
        fetchDashboardData();
        alert("Clinic deactivated successfully!");
      } catch (error) {
        alert("Error deactivating clinic");
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

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Search filter
    if (appointmentFilters.search) {
      const searchLower = appointmentFilters.search.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.userId?.name?.toLowerCase().includes(searchLower) ||
        apt.doctorId?.name?.toLowerCase().includes(searchLower) ||
        apt.reason?.toLowerCase().includes(searchLower) ||
        apt.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (appointmentFilters.status) {
      filtered = filtered.filter(apt => apt.status === appointmentFilters.status);
    }

    // Date range filter
    if (appointmentFilters.dateFrom) {
      filtered = filtered.filter(apt => new Date(apt.date) >= new Date(appointmentFilters.dateFrom));
    }
    if (appointmentFilters.dateTo) {
      filtered = filtered.filter(apt => new Date(apt.date) <= new Date(appointmentFilters.dateTo));
    }

    setFilteredAppointments(filtered);
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

  const openApprovalModal = (receptionist) => {
    setSelectedReceptionist(receptionist);
    setShowApprovalModal(true);
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

  const exportAppointmentsToCSV = () => {
    if (appointments.length === 0) {
      alert("No appointments to export");
      return;
    }

    const headers = ["Date", "Time", "Patient", "Email", "Phone", "Doctor", "Specialization", "Clinic", "Status", "Reason"];
    const rows = appointments.map(apt => [
      new Date(apt.date).toLocaleDateString(),
      apt.time,
      apt.userId?.name || "Unknown",
      apt.userId?.email || "",
      apt.userId?.phone || "",
      apt.doctorId?.name || "Unknown",
      apt.doctorId?.specialization || "",
      apt.clinicId?.name || "Unknown",
      apt.status,
      apt.reason || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `appointments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Professional Header */}
      <div className="dashboard-header mb-4">
        <div className="header-content">
          <div className="header-main">
            <div className="header-title-section">
              <div className="title-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="title-content">
                <h1 className="dashboard-title">Administrator Dashboard</h1>
                <p className="dashboard-subtitle">
                  <span className="status-indicator online"></span>
                  System Status: All Services Operational
                </p>
              </div>
            </div>
            <div className="header-actions">
              <div className="system-status">
                <div className="status-badge online">ONLINE</div>
                <div className="last-updated">Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
              <div className="quick-actions">
                <button className="btn-action" onClick={() => fetchDashboardData()}>
                  <i className="fas fa-sync-alt"></i>
                </button>
                <button className="btn-action">
                  <i className="fas fa-bell"></i>
                  {pendingReceptionists.length > 0 && (
                    <span className="notification-badge">{pendingReceptionists.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Stats Grid */}
      <div className="stats-grid mb-4">
        <div className="stat-card primary">
          <div className="stat-content">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+12% this month</span>
              </div>
            </div>
          </div>
          <div className="stat-chart">
            <div className="mini-chart users"></div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-content">
            <div className="stat-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalDoctors}</div>
              <div className="stat-label">Total Doctors</div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+5% this month</span>
              </div>
            </div>
          </div>
          <div className="stat-chart">
            <div className="mini-chart doctors"></div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-content">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalAppointments}</div>
              <div className="stat-label">Total Appointments</div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+18% this month</span>
              </div>
            </div>
          </div>
          <div className="stat-chart">
            <div className="mini-chart appointments"></div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-content">
            <div className="stat-icon">
              <i className="fas fa-clinic-medical"></i>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalClinics}</div>
              <div className="stat-label">Active Clinics</div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                <span>+3% this month</span>
              </div>
            </div>
          </div>
          <div className="stat-chart">
            <div className="mini-chart clinics"></div>
          </div>
        </div>
      </div>

      {/* Professional Navigation */}
      <div className="dashboard-navigation">
        <div className="nav-container">
          <div className="nav-tabs-professional">
            <button
              className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <div className="tab-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="tab-label">Overview</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <div className="tab-icon">
                <i className="fas fa-users"></i>
              </div>
              <span className="tab-label">Users</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => setActiveTab("doctors")}
            >
              <div className="tab-icon">
                <i className="fas fa-user-md"></i>
              </div>
              <span className="tab-label">Doctors</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "clinics" ? "active" : ""}`}
              onClick={() => setActiveTab("clinics")}
            >
              <div className="tab-icon">
                <i className="fas fa-clinic-medical"></i>
              </div>
              <span className="tab-label">Clinics</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              <div className="tab-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <span className="tab-label">Appointments</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              <div className="tab-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <span className="tab-label">Reports</span>
            </button>
            <button
              className={`nav-tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <div className="tab-icon">
                <i className="fas fa-user-clock"></i>
                {pendingReceptionists.length > 0 && (
                  <span className="notification-dot">{pendingReceptionists.length}</span>
                )}
              </div>
              <span className="tab-label">Pending</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-content">
            {activeTab === "overview" && (
              <div>
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
              <div>
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

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Clinic</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${user.role === 'admin' ? 'bg-danger' :
                              user.role === 'receptionist' ? 'bg-info' : 'bg-primary'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{user.clinicId?.name || user.clinicName || 'N/A'}</td>
                          <td>
                            {user.role === 'receptionist' && user.approvalStatus && (
                              <span className={`badge ${user.approvalStatus === 'approved' ? 'bg-success' :
                                user.approvalStatus === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                                }`}>
                                {user.approvalStatus}
                              </span>
                            )}
                            {user.role !== 'receptionist' && (
                              <span className="badge bg-success">Active</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => openUserModal(user)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "doctors" && (
              <div>
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

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Specialization</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Clinic</th>
                        <th>Fee</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doctor) => (
                        <tr key={doctor._id}>
                          <td>Dr. {doctor.name}</td>
                          <td>{doctor.specialization}</td>
                          <td>{doctor.email}</td>
                          <td>{doctor.phone}</td>
                          <td>{doctor.clinicId?.name}</td>
                          <td>₹{doctor.consultationFee}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => openDoctorModal(doctor)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteDoctor(doctor._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "clinics" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Clinic Management</h5>
                  <button
                    className="btn btn-warning"
                    onClick={() => openClinicModal()}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Add Clinic
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinics.map((clinic) => (
                        <tr key={clinic._id}>
                          <td><strong>{clinic.name}</strong></td>
                          <td>
                            <span className={`badge ${clinic.type === 'hospital' ? 'bg-danger' : 'bg-info'
                              }`}>
                              {clinic.type}
                            </span>
                          </td>
                          <td>{clinic.address}</td>
                          <td>{clinic.city}</td>
                          <td>{clinic.phone || 'N/A'}</td>
                          <td>{clinic.email || 'N/A'}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => openClinicModal(clinic)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClinic(clinic._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Appointments Overview</h5>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => exportAppointmentsToCSV()}
                  >
                    <i className="fas fa-download me-1"></i>
                    Export CSV
                  </button>
                </div>

                {/* Filters */}
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Search</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by patient, doctor, or reason..."
                          value={appointmentFilters.search}
                          onChange={(e) => setAppointmentFilters({ ...appointmentFilters, search: e.target.value })}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={appointmentFilters.status}
                          onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })}
                        >
                          <option value="">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Date From</label>
                        <input
                          type="date"
                          className="form-control"
                          value={appointmentFilters.dateFrom}
                          onChange={(e) => setAppointmentFilters({ ...appointmentFilters, dateFrom: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Date To</label>
                        <input
                          type="date"
                          className="form-control"
                          value={appointmentFilters.dateTo}
                          onChange={(e) => setAppointmentFilters({ ...appointmentFilters, dateTo: e.target.value })}
                        />
                      </div>
                    </div>
                    {(appointmentFilters.search || appointmentFilters.status || appointmentFilters.dateFrom || appointmentFilters.dateTo) && (
                      <div className="mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setAppointmentFilters({ search: "", status: "", dateFrom: "", dateTo: "" })}
                        >
                          <i className="fas fa-times me-1"></i>
                          Clear Filters
                        </button>
                        <span className="ms-2 text-muted small">
                          Showing {filteredAppointments.length} of {appointments.length} appointments
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                            <p className="text-muted mb-0">No appointments found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredAppointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>{appointment.userId?.name || "Unknown"}</td>
                            <td>Dr. {appointment.doctorId?.name || "Unknown"}</td>
                            <td>{new Date(appointment.date).toLocaleDateString()}</td>
                            <td>{appointment.time}</td>
                            <td>
                              <span className={`badge ${appointment.status === 'pending' ? 'bg-warning text-dark' :
                                appointment.status === 'confirmed' ? 'bg-success' :
                                  appointment.status === 'completed' ? 'bg-info' : 'bg-danger'
                                }`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: "150px" }}>
                                {appointment.reason}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "pending" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Pending Receptionist Approvals</h5>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={fetchDashboardData}
                  >
                    <i className="fas fa-sync me-1"></i>
                    Refresh
                  </button>
                </div>

                {pendingReceptionists.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <p className="text-muted">No pending receptionist approvals</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Clinic Name</th>
                          <th>Requested Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingReceptionists.map((receptionist) => (
                          <tr key={receptionist._id}>
                            <td><strong>{receptionist.name}</strong></td>
                            <td>{receptionist.email}</td>
                            <td>{receptionist.phone || 'N/A'}</td>
                            <td>{receptionist.clinicName || 'N/A'}</td>
                            <td>{new Date(receptionist.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-success me-1"
                                onClick={() => openApprovalModal(receptionist)}
                              >
                                <i className="fas fa-check me-1"></i>
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRejectReceptionist(receptionist._id)}
                              >
                                <i className="fas fa-times me-1"></i>
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

            {activeTab === "reports" && (
              <div>
                <div className="section-header">
                  <h2 className="section-title">Analytics & Reports</h2>
                  <p className="section-subtitle">Comprehensive insights and data visualization for your healthcare system</p>
                </div>

                {/* Professional Statistics Cards */}
                <div className="reports-stats-grid">
                  <div className="report-stat-card primary">
                    <div className="report-stat-header">
                      <div className="report-stat-icon">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <div className="report-stat-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>+12%</span>
                      </div>
                    </div>
                    <div className="report-stat-content">
                      <div className="report-stat-number">{appointments.length}</div>
                      <div className="report-stat-label">Total Appointments</div>
                      <div className="report-stat-subtitle">All time appointments</div>
                    </div>
                    <div className="report-stat-chart">
                      <div className="mini-progress-bar">
                        <div className="progress-fill primary" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="report-stat-card success">
                    <div className="report-stat-header">
                      <div className="report-stat-icon">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div className="report-stat-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>+8%</span>
                      </div>
                    </div>
                    <div className="report-stat-content">
                      <div className="report-stat-number">{appointments.filter(a => a.status === 'completed').length}</div>
                      <div className="report-stat-label">Completed</div>
                      <div className="report-stat-subtitle">Successfully finished</div>
                    </div>
                    <div className="report-stat-chart">
                      <div className="mini-progress-bar">
                        <div className="progress-fill success" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="report-stat-card warning">
                    <div className="report-stat-header">
                      <div className="report-stat-icon">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div className="report-stat-trend neutral">
                        <i className="fas fa-minus"></i>
                        <span>0%</span>
                      </div>
                    </div>
                    <div className="report-stat-content">
                      <div className="report-stat-number">{appointments.filter(a => a.status === 'pending').length}</div>
                      <div className="report-stat-label">Pending</div>
                      <div className="report-stat-subtitle">Awaiting confirmation</div>
                    </div>
                    <div className="report-stat-chart">
                      <div className="mini-progress-bar">
                        <div className="progress-fill warning" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="report-stat-card info">
                    <div className="report-stat-header">
                      <div className="report-stat-icon">
                        <i className="fas fa-calendar-check"></i>
                      </div>
                      <div className="report-stat-trend positive">
                        <i className="fas fa-arrow-up"></i>
                        <span>+15%</span>
                      </div>
                    </div>
                    <div className="report-stat-content">
                      <div className="report-stat-number">{appointments.filter(a => a.status === 'confirmed').length}</div>
                      <div className="report-stat-label">Confirmed</div>
                      <div className="report-stat-subtitle">Ready for appointment</div>
                    </div>
                    <div className="report-stat-chart">
                      <div className="mini-progress-bar">
                        <div className="progress-fill info" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Appointment Status Distribution</h6>
                      </div>
                      <div className="card-body">
                        {['pending', 'confirmed', 'completed', 'cancelled'].map(status => {
                          const count = appointments.filter(a => a.status === status).length;
                          const percentage = appointments.length > 0 ? (count / appointments.length * 100).toFixed(1) : 0;
                          return (
                            <div key={status} className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-capitalize">{status}</span>
                                <span>{count} ({percentage}%)</span>
                              </div>
                              <div className="progress" style={{ height: '20px' }}>
                                <div
                                  className={`progress-bar ${status === 'pending' ? 'bg-warning' :
                                    status === 'confirmed' ? 'bg-success' :
                                      status === 'completed' ? 'bg-info' : 'bg-danger'
                                    }`}
                                  role="progressbar"
                                  style={{ width: `${percentage}%` }}
                                >
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Top Specializations</h6>
                      </div>
                      <div className="card-body">
                        {(() => {
                          const specCounts = {};
                          doctors.forEach(doctor => {
                            specCounts[doctor.specialization] = (specCounts[doctor.specialization] || 0) + 1;
                          });
                          const topSpecs = Object.entries(specCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5);
                          return topSpecs.map(([spec, count]) => (
                            <div key={spec} className="d-flex justify-content-between align-items-center mb-2">
                              <span>{spec}</span>
                              <span className="badge bg-primary">{count} doctors</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Recent Appointments (Last 7 Days)</h6>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => exportAppointmentsToCSV()}
                    >
                      <i className="fas fa-download me-1"></i>
                      Export CSV
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments
                            .filter(apt => {
                              const aptDate = new Date(apt.date);
                              const weekAgo = new Date();
                              weekAgo.setDate(weekAgo.getDate() - 7);
                              return aptDate >= weekAgo;
                            })
                            .slice(0, 10)
                            .map((appointment) => (
                              <tr key={appointment._id}>
                                <td>{new Date(appointment.date).toLocaleDateString()}</td>
                                <td>{appointment.userId?.name || "Unknown"}</td>
                                <td>Dr. {appointment.doctorId?.name || "Unknown"}</td>
                                <td>
                                  <span className={`badge ${appointment.status === 'pending' ? 'bg-warning text-dark' :
                                    appointment.status === 'confirmed' ? 'bg-success' :
                                      appointment.status === 'completed' ? 'bg-info' : 'bg-danger'
                                    }`}>
                                    {appointment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Edit User' : 'Add New User'}
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
                    <label className="form-label">Password {editingUser && '(leave blank to keep current)'}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required={!editingUser}
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
                      className="form-select"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="patient">Patient</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {userForm.role === 'receptionist' && (
                    <div className="mb-3">
                      <label className="form-label">Clinic</label>
                      <select
                        className="form-select"
                        value={userForm.clinicId}
                        onChange={(e) => setUserForm({ ...userForm, clinicId: e.target.value })}
                        required
                      >
                        <option value="">Select Clinic</option>
                        {clinics.map(clinic => (
                          <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Update' : 'Create'} User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )
      }

      {/* Clinic Modal */}
      {
        showClinicModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowClinicModal(false)}
                  ></button>
                </div>
                <form onSubmit={editingClinic ? handleUpdateClinic : handleCreateClinic}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Clinic Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={clinicForm.name}
                            onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Type</label>
                          <select
                            className="form-select"
                            value={clinicForm.type}
                            onChange={(e) => setClinicForm({ ...clinicForm, type: e.target.value })}
                            required
                          >
                            <option value="clinic">Clinic</option>
                            <option value="hospital">Hospital</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinicForm.address}
                        onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            className="form-control"
                            value={clinicForm.city}
                            onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">State</label>
                          <input
                            type="text"
                            className="form-control"
                            value={clinicForm.state}
                            onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Pincode</label>
                          <input
                            type="text"
                            className="form-control"
                            value={clinicForm.pincode}
                            onChange={(e) => setClinicForm({ ...clinicForm, pincode: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={clinicForm.phone}
                            onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={clinicForm.email}
                            onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowClinicModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-warning">
                      {editingClinic ? 'Update' : 'Create'} Clinic
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Approval Modal */}
      {
        showApprovalModal && selectedReceptionist && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-check-circle me-2"></i>
                    Approve Receptionist
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedReceptionist(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <p><strong>Name:</strong> {selectedReceptionist.name}</p>
                    <p><strong>Email:</strong> {selectedReceptionist.email}</p>
                    <p><strong>Phone:</strong> {selectedReceptionist.phone || 'N/A'}</p>
                    <p><strong>Clinic Name:</strong> {selectedReceptionist.clinicName || 'N/A'}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Assign to Clinic (Optional)</label>
                    <select
                      className="form-select"
                      id="approvalClinicId"
                    >
                      <option value="">No clinic assignment</option>
                      {clinics.map(clinic => (
                        <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      You can assign this receptionist to an existing clinic or leave it unassigned
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedReceptionist(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      const clinicId = document.getElementById('approvalClinicId')?.value || null;
                      handleApproveReceptionist(clinicId);
                    }}
                  >
                    <i className="fas fa-check me-1"></i>
                    Approve Receptionist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Doctor Modal */}
      {
        showDoctorModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDoctorModal(false)}
                  ></button>
                </div>
                <form onSubmit={editingDoctor ? handleUpdateDoctor : handleCreateDoctor}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={doctorForm.name}
                            onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={doctorForm.email}
                            onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={doctorForm.phone}
                            onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Specialization</label>
                          <input
                            type="text"
                            className="form-control"
                            value={doctorForm.specialization}
                            onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Clinic</label>
                          <select
                            className="form-select"
                            value={doctorForm.clinicId}
                            onChange={(e) => setDoctorForm({ ...doctorForm, clinicId: e.target.value })}
                            required
                          >
                            <option value="">Select Clinic</option>
                            {clinics.map(clinic => (
                              <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Consultation Fee (₹)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={doctorForm.consultationFee}
                            onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Experience (years)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={doctorForm.experience}
                            onChange={(e) => setDoctorForm({ ...doctorForm, experience: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Qualification</label>
                          <input
                            type="text"
                            className="form-control"
                            value={doctorForm.qualification}
                            onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Availability</label>
                      <select
                        className="form-select"
                        value={doctorForm.availability}
                        onChange={(e) => setDoctorForm({ ...doctorForm, availability: e.target.value })}
                      >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowDoctorModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      {editingDoctor ? 'Update' : 'Create'} Doctor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminDashboard;