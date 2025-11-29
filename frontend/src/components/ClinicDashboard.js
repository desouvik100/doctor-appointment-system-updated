import React, { useState, useEffect } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import './ClinicDashboard.css';

function ClinicDashboard({ receptionist, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [receptionist]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/receptionists/appointments/${receptionist.clinicId}`);
      setAppointments(response.data);
      setFilteredAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const response = await axios.get(`/api/receptionists/doctors/${receptionist.clinicId}`);
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const updateDoctorAvailability = async (doctorId, availability) => {
    try {
      await axios.put(`/api/receptionists/doctors/${doctorId}/availability`, {
        availability,
        clinicId: receptionist.clinicId
      });
      toast.success(`Doctor status updated to ${availability}`);
      fetchDoctors();
    } catch (error) {
      toast.error("Failed to update doctor availability");
      console.error("Error updating doctor availability:", error);
    }
  };

  useEffect(() => {
    filterAppointments();
  }, [appointments, filter, searchTerm]);

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter(appointment => appointment.status === filter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.userId?.name?.toLowerCase().includes(searchLower) ||
        appointment.doctorId?.name?.toLowerCase().includes(searchLower) ||
        appointment.reason?.toLowerCase().includes(searchLower) ||
        appointment.userId?.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(`/api/receptionists/appointments/${appointmentId}/status`, {
        status: newStatus
      });
      fetchAppointments(); // Refresh the list
      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      toast.error("Failed to update appointment status");
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


  const todayAppointments = appointments.filter(appointment => {
    const today = new Date().toDateString();
    const appointmentDate = new Date(appointment.date).toDateString();
    return today === appointmentDate;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Receptionist Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient-info text-white">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1">
                    <i className="fas fa-clinic-medical me-2"></i>
                    Clinic Management Dashboard
                  </h4>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-user me-1"></i>
                    Welcome, {receptionist.name} | {receptionist.clinicId?.name || 'Clinic'}
                  </p>
                </div>
                <div className="text-end">
                  <div className="badge bg-light text-dark mb-2">
                    <i className="fas fa-calendar me-1"></i>
                    {new Date().toLocaleDateString()}
                  </div>
                  <br />
                  <small className="opacity-75 d-block mb-2">
                    {todayAppointments.length} appointments today
                  </small>
                  {onLogout && (
                    <button className="btn btn-light btn-sm" onClick={onLogout}>
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  )}
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
                  <h4 className="mb-0">{todayAppointments.length}</h4>
                  <p className="mb-0 small">Today's Appointments</p>
                  <small className="opacity-75">
                    <i className="fas fa-clock me-1"></i>
                    {todayAppointments.filter(a => a.status === 'pending').length} pending
                  </small>
                </div>
                <i className="fas fa-calendar-day fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{appointments.filter(a => a.status === "pending").length}</h4>
                  <p className="mb-0 small">Pending</p>
                  <small className="opacity-75">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Needs attention
                  </small>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{appointments.filter(a => a.status === "confirmed").length}</h4>
                  <p className="mb-0 small">Confirmed</p>
                  <small className="opacity-75">
                    <i className="fas fa-check me-1"></i>
                    Ready to go
                  </small>
                </div>
                <i className="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-0">{doctors.filter(d => d.availability === "Available").length}/{doctors.length}</h4>
                  <p className="mb-0 small">Doctors Available</p>
                  <small className="opacity-75">
                    <i className="fas fa-user-md me-1"></i>
                    {doctors.filter(d => d.availability === "Busy").length} busy
                  </small>
                </div>
                <i className="fas fa-user-md fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <i className="fas fa-calendar-check me-2"></i>
            Appointments
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => setActiveTab("doctors")}
          >
            <i className="fas fa-user-md me-2"></i>
            Manage Doctors
            <span className="badge bg-primary ms-2">{doctors.length}</span>
          </button>
        </li>
      </ul>

      {/* Doctor Management Tab */}
      {activeTab === "doctors" && (
        <div className="card shadow-sm mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-user-md me-2"></i>
                Doctor Availability Management
              </h5>
              <button className="btn btn-sm btn-outline-primary" onClick={fetchDoctors}>
                <i className="fas fa-sync-alt me-1"></i>
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            {doctorsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading doctors...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                <p className="text-muted">No doctors found for this clinic.</p>
              </div>
            ) : (
              <div className="row g-3">
                {doctors.map((doctor) => (
                  <div key={doctor._id} className="col-md-6 col-lg-4">
                    <div className={`card h-100 border-2 ${
                      doctor.availability === 'Available' ? 'border-success' : 
                      doctor.availability === 'Busy' ? 'border-danger' : 'border-warning'
                    }`}>
                      <div className="card-body">
                        <div className="d-flex align-items-start mb-3">
                          <div className={`rounded-circle p-3 me-3 ${
                            doctor.availability === 'Available' ? 'bg-success' : 
                            doctor.availability === 'Busy' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            <i className="fas fa-user-md text-white fa-lg"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">Dr. {doctor.name}</h6>
                            <small className="text-muted">{doctor.specialization}</small>
                            <div className="mt-1">
                              <span className={`badge ${
                                doctor.availability === 'Available' ? 'bg-success' : 
                                doctor.availability === 'Busy' ? 'bg-danger' : 'bg-warning'
                              }`}>
                                {doctor.availability}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <i className="fas fa-envelope me-1"></i> {doctor.email}
                          </small>
                          <small className="text-muted d-block">
                            <i className="fas fa-phone me-1"></i> {doctor.phone}
                          </small>
                          <small className="text-muted d-block">
                            <i className="fas fa-rupee-sign me-1"></i> ₹{doctor.consultationFee} per visit
                          </small>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className={`btn btn-sm flex-fill ${doctor.availability === 'Available' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => updateDoctorAvailability(doctor._id, 'Available')}
                            disabled={doctor.availability === 'Available'}
                          >
                            <i className="fas fa-check me-1"></i>
                            Available
                          </button>
                          <button
                            className={`btn btn-sm flex-fill ${doctor.availability === 'Busy' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => updateDoctorAvailability(doctor._id, 'Busy')}
                            disabled={doctor.availability === 'Busy'}
                          >
                            <i className="fas fa-times me-1"></i>
                            Busy
                          </button>
                          <button
                            className={`btn btn-sm flex-fill ${doctor.availability === 'On Leave' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => updateDoctorAvailability(doctor._id, 'On Leave')}
                            disabled={doctor.availability === 'On Leave'}
                          >
                            <i className="fas fa-plane me-1"></i>
                            Leave
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointments Management */}
      {activeTab === "appointments" && (
      <div className="card shadow-sm">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">
              <i className="fas fa-calendar-check me-2"></i>
              Appointments Management
            </h5>
          </div>
          
          {/* Search Bar */}
          <div className="mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by patient name, doctor, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            
          <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`btn btn-sm ${filter === "pending" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => setFilter("pending")}
              >
                Pending
              </button>
              <button
                className={`btn btn-sm ${filter === "confirmed" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setFilter("confirmed")}
              >
                Confirmed
              </button>
              <button
                className={`btn btn-sm ${filter === "completed" ? "btn-info" : "btn-outline-info"}`}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>
        </div>
        
        <div className="card-body">
          {(filter !== "all" || searchTerm) && (
            <div className="mb-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                }}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </button>
              <span className="ms-2 text-muted small">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </span>
            </div>
          )}
          
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">No appointments found for the selected filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Contact</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td>
                        <div>
                          <strong>{appointment.userId?.name || "Unknown"}</strong>
                          <br />
                          <small className="text-muted">{appointment.userId?.email}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle p-1 me-2">
                            <i className="fas fa-user-md text-white small"></i>
                          </div>
                          <div>
                            <strong>Dr. {appointment.doctorId?.name || "Unknown"}</strong>
                            <br />
                            <small className="text-muted">{appointment.doctorId?.specialization}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{formatDate(appointment.date)}</strong>
                          <br />
                          <small className="text-muted">{formatTime(appointment.time)}</small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {appointment.userId?.phone || "No phone"}
                        </small>
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{maxWidth: "150px"}}>
                          {appointment.reason}
                        </span>
                      </td>
                      <td>{getStatusBadge(appointment.status)}</td>
                      <td>
                        <div className="btn-group-vertical btn-group-sm">
                          {appointment.status === "pending" && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => updateAppointmentStatus(appointment._id, "confirmed")}
                              >
                                <i className="fas fa-check me-1"></i>
                                Confirm
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updateAppointmentStatus(appointment._id, "cancelled")}
                              >
                                <i className="fas fa-times me-1"></i>
                                Cancel
                              </button>
                            </>
                          )}
                          {appointment.status === "confirmed" && (
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => updateAppointmentStatus(appointment._id, "completed")}
                            >
                              <i className="fas fa-check-double me-1"></i>
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default ClinicDashboard;