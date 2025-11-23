import React, { useState, useEffect } from "react";
import axios from "../api/config";

function SimpleAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalClinics: 0
  });
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        axios.get("/api/doctors"),
        axios.get("/api/appointments")
      ]);

      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
      
      setStats({
        totalDoctors: doctorsRes.data.length,
        totalAppointments: appointmentsRes.data.length,
        totalUsers: appointmentsRes.data.reduce((acc, apt) => {
          const userIds = new Set();
          appointmentsRes.data.forEach(a => userIds.add(a.userId));
          return userIds.size;
        }, 0),
        totalClinics: 1 // Placeholder
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-warning text-dark",
      confirmed: "bg-success",
      cancelled: "bg-danger",
      completed: "bg-info"
    };

    return (
      <span className={`badge ${statusClasses[status] || "bg-secondary"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
    <div>
      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.totalUsers}</h4>
                  <p className="mb-0">Total Patients</p>
                </div>
                <i className="fas fa-users fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.totalDoctors}</h4>
                  <p className="mb-0">Total Doctors</p>
                </div>
                <i className="fas fa-user-md fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.totalAppointments}</h4>
                  <p className="mb-0">Total Appointments</p>
                </div>
                <i className="fas fa-calendar-check fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.totalClinics}</h4>
                  <p className="mb-0">Active Clinics</p>
                </div>
                <i className="fas fa-clinic-medical fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card shadow-sm">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <i className="fas fa-chart-line me-1"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "doctors" ? "active" : ""}`}
                onClick={() => setActiveTab("doctors")}
              >
                <i className="fas fa-user-md me-1"></i>
                Doctors
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
                onClick={() => setActiveTab("appointments")}
              >
                <i className="fas fa-calendar-check me-1"></i>
                Appointments
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {activeTab === "overview" && (
            <div>
              <h5>System Overview</h5>
              <p className="text-muted">Welcome to the admin dashboard. Here you can monitor the overall system performance.</p>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6>Recent Activity</h6>
                      <p className="small text-muted">
                        {appointments.filter(a => a.status === "pending").length} pending appointments
                      </p>
                      <p className="small text-muted">
                        {appointments.filter(a => a.status === "confirmed").length} confirmed appointments
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6>System Status</h6>
                      <p className="small text-success">
                        <i className="fas fa-check-circle me-1"></i>
                        All systems operational
                      </p>
                      <p className="small text-muted">
                        Last updated: {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "doctors" && (
            <div>
              <h5>Doctors Management</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle p-1 me-2">
                              <i className="fas fa-user-md text-white small"></i>
                            </div>
                            Dr. {doctor.name}
                          </div>
                        </td>
                        <td>{doctor.specialization}</td>
                        <td>{doctor.email}</td>
                        <td>{doctor.phone}</td>
                        <td>
                          <span className="badge bg-success">Active</span>
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
              <h5>Appointments Management</h5>
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
                    {appointments.slice(0, 10).map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{appointment.userId?.name || "Unknown"}</td>
                        <td>Dr. {appointment.doctorId?.name || "Unknown"}</td>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>
                          <span className="text-truncate d-inline-block" style={{maxWidth: "150px"}}>
                            {appointment.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleAdminDashboard;