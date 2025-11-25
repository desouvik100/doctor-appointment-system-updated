import React, { useState, useEffect } from "react";
import axios from "../api/config";

function PatientDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0
  });

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const [appointmentsRes, doctorsRes] = await Promise.allSettled([
        axios.get("/api/appointments/my"),
        axios.get("/api/doctors")
      ]);

      const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data : [];

      setAppointments(appointmentsData);
      setDoctors(doctorsData);

      // Calculate stats
      const now = new Date();
      const upcoming = appointmentsData.filter(apt => 
        new Date(apt.date) >= now && apt.status !== 'cancelled'
      );
      const completed = appointmentsData.filter(apt => apt.status === 'completed');
      const cancelled = appointmentsData.filter(apt => apt.status === 'cancelled');

      setStats({
        totalAppointments: appointmentsData.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        cancelledAppointments: cancelled.length
      });
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
        <p className="mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient-primary text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">Welcome back, {user.name}!</h4>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-calendar me-1"></i>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-end">
                  <i className="fas fa-user-circle fa-3x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.totalAppointments}</h4>
                  <p className="mb-0 small">Total Appointments</p>
                </div>
                <i className="fas fa-calendar-check fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.upcomingAppointments}</h4>
                  <p className="mb-0 small">Upcoming</p>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{stats.completedAppointments}</h4>
                  <p className="mb-0 small">Completed</p>
                </div>
                <i className="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{doctors.length}</h4>
                  <p className="mb-0 small">Available Doctors</p>
                </div>
                <i className="fas fa-user-md fa-2x opacity-75"></i>
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
                <i className="fas fa-tachometer-alt me-1"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
                onClick={() => setActiveTab("appointments")}
              >
                <i className="fas fa-calendar-alt me-1"></i>
                My Appointments
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "doctors" ? "active" : ""}`}
                onClick={() => setActiveTab("doctors")}
              >
                <i className="fas fa-user-md me-1"></i>
                Find Doctors
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "health" ? "active" : ""}`}
                onClick={() => setActiveTab("health")}
              >
                <i className="fas fa-heartbeat me-1"></i>
                Health Records
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <i className="fas fa-user me-1"></i>
                Profile
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {activeTab === "overview" && (
            <div>
              <div className="row g-4">
                {/* Quick Actions */}
                <div className="col-md-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="fas fa-bolt text-primary me-2"></i>
                        Quick Actions
                      </h5>
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-primary"
                          onClick={() => setActiveTab("doctors")}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Book New Appointment
                        </button>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setActiveTab("appointments")}
                        >
                          <i className="fas fa-calendar me-1"></i>
                          View My Appointments
                        </button>
                        <button className="btn btn-outline-info">
                          <i className="fas fa-download me-1"></i>
                          Download Health Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="col-md-6">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="fas fa-history text-success me-2"></i>
                        Recent Activity
                      </h5>
                      {appointments.slice(0, 3).map((appointment, index) => (
                        <div key={index} className="d-flex align-items-center mb-2 p-2 bg-white rounded">
                          <div className="flex-grow-1">
                            <small className="fw-bold">Dr. {appointment.doctorId?.name}</small>
                            <br />
                            <small className="text-muted">
                              {formatDate(appointment.date)} at {formatTime(appointment.time)}
                            </small>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      ))}
                      {appointments.length === 0 && (
                        <p className="text-muted text-center py-3">
                          <i className="fas fa-calendar-times fa-2x mb-2 d-block"></i>
                          No appointments yet. Book your first appointment!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Health Tips */}
                <div className="col-12">
                  <div className="card border-0 bg-gradient-info text-white">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="fas fa-lightbulb me-2"></i>
                        Daily Health Tip
                      </h5>
                      <p className="mb-0">
                        "Stay hydrated! Drinking 8 glasses of water daily helps maintain optimal body function and supports your immune system."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>My Appointments</h5>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab("doctors")}
                >
                  <i className="fas fa-plus me-1"></i>
                  Book New Appointment
                </button>
              </div>
              
              {appointments.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-4x text-muted mb-3"></i>
                  <h5 className="text-muted">No appointments yet</h5>
                  <p className="text-muted">Book your first appointment to get started</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab("doctors")}
                  >
                    Find Doctors
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Clinic</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary rounded-circle p-2 me-2">
                                <i className="fas fa-user-md text-white small"></i>
                              </div>
                              <div>
                                <strong>Dr. {appointment.doctorId?.name}</strong>
                                <br />
                                <small className="text-muted">{appointment.doctorId?.specialization}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{formatDate(appointment.date)}</strong>
                            <br />
                            <small className="text-muted">{formatTime(appointment.time)}</small>
                          </td>
                          <td>{appointment.clinicId?.name || 'N/A'}</td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{maxWidth: "150px"}}>
                              {appointment.reason}
                            </span>
                          </td>
                          <td>{getStatusBadge(appointment.status)}</td>
                          <td>
                            <div className="btn-group-sm">
                              {appointment.status === "pending" && (
                                <button className="btn btn-sm btn-outline-danger">
                                  <i className="fas fa-times"></i>
                                </button>
                              )}
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="fas fa-eye"></i>
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
          )}

          {activeTab === "doctors" && (
            <div>
              <h5 className="mb-3">Find & Book Doctors</h5>
              <div className="row g-3">
                {doctors.slice(0, 6).map((doctor) => (
                  <div key={doctor._id} className="col-md-6 col-lg-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary rounded-circle p-2 me-3">
                            <i className="fas fa-user-md text-white"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">Dr. {doctor.name}</h6>
                            <small className="text-muted">{doctor.specialization}</small>
                          </div>
                        </div>
                        <p className="small text-muted mb-2">
                          <i className="fas fa-clinic-medical me-1"></i>
                          {doctor.clinicId?.name}
                        </p>
                        <p className="small text-muted mb-3">
                          <i className="fas fa-rupee-sign me-1"></i>
                          ₹{doctor.consultationFee} consultation fee
                        </p>
                        <div className="d-grid">
                          <button className="btn btn-primary btn-sm">
                            <i className="fas fa-calendar-plus me-1"></i>
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {doctors.length === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-user-md fa-4x text-muted mb-3"></i>
                  <h5 className="text-muted">No doctors available</h5>
                  <p className="text-muted">Please check back later</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "health" && (
            <div>
              <h5 className="mb-3">Health Records</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="fas fa-file-medical fa-3x text-primary mb-3"></i>
                      <h6>Medical History</h6>
                      <p className="text-muted small">View your complete medical history and reports</p>
                      <button className="btn btn-outline-primary btn-sm">
                        View Records
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="fas fa-pills fa-3x text-success mb-3"></i>
                      <h6>Prescriptions</h6>
                      <p className="text-muted small">Track your current and past prescriptions</p>
                      <button className="btn btn-outline-success btn-sm">
                        View Prescriptions
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="fas fa-vial fa-3x text-info mb-3"></i>
                      <h6>Lab Reports</h6>
                      <p className="text-muted small">Access your laboratory test results</p>
                      <button className="btn btn-outline-info btn-sm">
                        View Reports
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="fas fa-syringe fa-3x text-warning mb-3"></i>
                      <h6>Vaccinations</h6>
                      <p className="text-muted small">Keep track of your vaccination history</p>
                      <button className="btn btn-outline-warning btn-sm">
                        View Vaccines
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h5 className="mb-3">Profile Settings</h5>
              <div className="row g-4">
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title">Personal Information</h6>
                      <form>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Full Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={user.name} 
                              readOnly 
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input 
                              type="email" 
                              className="form-control" 
                              value={user.email} 
                              readOnly 
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Phone</label>
                            <input 
                              type="tel" 
                              className="form-control" 
                              value={user.phone || ''} 
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Date of Birth</label>
                            <input 
                              type="date" 
                              className="form-control" 
                            />
                          </div>
                          <div className="col-12">
                            <button type="submit" className="btn btn-primary">
                              Update Profile
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body text-center">
                      <i className="fas fa-user-circle fa-4x text-muted mb-3"></i>
                      <h6>{user.name}</h6>
                      <p className="text-muted small">{user.email}</p>
                      <button className="btn btn-outline-primary btn-sm">
                        Change Avatar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;