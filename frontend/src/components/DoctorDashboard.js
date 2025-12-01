import React, { useState, useEffect } from "react";
import axios from "../api/config";
import toast from "react-hot-toast";
import "./ClinicDashboard.css"; // Reuse clinic dashboard styles

function DoctorDashboard({ doctor, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, completed: 0 });

  useEffect(() => {
    fetchAppointments();
  }, [doctor]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/appointments/doctor/${doctor.id}`);
      setAppointments(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const todayAppts = data.filter(a => new Date(a.date).toDateString() === today);
    setStats({
      total: data.length,
      today: todayAppts.length,
      pending: data.filter(a => a.status === "pending" || a.status === "confirmed").length,
      completed: data.filter(a => a.status === "completed").length
    });
  };

  const getFilteredAppointments = () => {
    const today = new Date().toDateString();
    switch (filter) {
      case "today":
        return appointments.filter(a => new Date(a.date).toDateString() === today);
      case "upcoming":
        return appointments.filter(a => new Date(a.date) >= new Date() && a.status !== "completed");
      case "completed":
        return appointments.filter(a => a.status === "completed");
      default:
        return appointments;
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: "bg-warning text-dark",
      confirmed: "bg-primary",
      in_progress: "bg-info",
      completed: "bg-success",
      cancelled: "bg-danger"
    };
    return <span className={`badge ${classes[status] || "bg-secondary"}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {doctor.profilePhoto ? (
                    <img src={doctor.profilePhoto} alt={doctor.name} className="rounded-circle me-3" style={{ width: "60px", height: "60px", objectFit: "cover", border: "3px solid white" }} />
                  ) : (
                    <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center me-3" style={{ width: "60px", height: "60px" }}>
                      <i className="fas fa-user-md fa-2x"></i>
                    </div>
                  )}
                  <div>
                    <h4 className="mb-0">Dr. {doctor.name}</h4>
                    <p className="mb-0 opacity-75">{doctor.specialization} | {doctor.clinicId?.name || "Clinic"}</p>
                  </div>
                </div>
                <button className="btn btn-light" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Today's Appointments", value: stats.today, icon: "calendar-day", color: "primary" },
          { label: "Pending", value: stats.pending, icon: "clock", color: "warning" },
          { label: "Completed", value: stats.completed, icon: "check-circle", color: "success" },
          { label: "Total Patients", value: stats.total, icon: "users", color: "info" }
        ].map((stat, i) => (
          <div key={i} className="col-md-3 col-6 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <i className={`fas fa-${stat.icon} fa-2x text-${stat.color} mb-2`}></i>
                <h3 className="mb-0">{stat.value}</h3>
                <small className="text-muted">{stat.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Appointments */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>Appointments</h5>
            <div className="btn-group btn-group-sm">
              {["today", "upcoming", "completed", "all"].map(f => (
                <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-body">
          {getFilteredAppointments().length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">No appointments found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAppointments().map(apt => (
                    <tr key={apt._id}>
                      <td>
                        <strong>{apt.userId?.name || "Unknown"}</strong>
                        <br /><small className="text-muted">{apt.userId?.phone}</small>
                      </td>
                      <td>{formatDate(apt.date)}</td>
                      <td>{formatTime(apt.time)}</td>
                      <td>
                        {apt.consultationType === "online" ? (
                          <span className="badge bg-info">
                            <i className="fas fa-video me-1"></i>Online
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="fas fa-hospital me-1"></i>In-Clinic
                          </span>
                        )}
                      </td>
                      <td><small>{apt.reason}</small></td>
                      <td>{getStatusBadge(apt.status)}</td>
                      <td>
                        {/* Google Meet Link for Online Appointments */}
                        {apt.consultationType === "online" && apt.googleMeetLink && (
                          <a 
                            href={apt.googleMeetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success me-1"
                            title="Join Google Meet"
                          >
                            <i className="fas fa-video"></i>
                          </a>
                        )}
                        {apt.consultationType === "online" && apt.meetingLink && !apt.googleMeetLink && (
                          <a 
                            href={apt.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success me-1"
                            title="Join Meeting"
                          >
                            <i className="fas fa-video"></i>
                          </a>
                        )}
                        {apt.status === "confirmed" && (
                          <button className="btn btn-sm btn-info me-1" onClick={() => updateAppointmentStatus(apt._id, "in_progress")} title="Start Appointment">
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        {apt.status === "in_progress" && (
                          <button className="btn btn-sm btn-success" onClick={() => updateAppointmentStatus(apt._id, "completed")} title="Complete">
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
