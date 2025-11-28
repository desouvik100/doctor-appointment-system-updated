import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
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
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinics.map(clinic => (
                      <tr key={clinic._id}>
                        <td>{clinic.name}</td>
                        <td>{clinic.city}</td>
                        <td>{clinic.phone || 'N/A'}</td>
                        <td>{clinic.email || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
