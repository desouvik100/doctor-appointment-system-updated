import React, { useState, useEffect } from "react";
import axios from "axios";

function MyAppointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/appointments/user/${user.id}`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await axios.put(`/api/appointments/${appointmentId}`, { status: "cancelled" });
      fetchAppointments(); // Refresh the list
      alert("Appointment cancelled successfully");
    } catch (error) {
      alert("Failed to cancel appointment");
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

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
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="fas fa-calendar-check me-2"></i>
          My Appointments
        </h5>
      </div>
      <div className="card-body">
        {appointments.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
            <p className="text-muted">No appointments found.</p>
            <p className="text-muted small">Book your first appointment from the "Find Doctors" section.</p>
          </div>
        ) : (
          <div className="row g-3">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-md-8">
                        <div className="d-flex align-items-center mb-2">
                          <div className="bg-primary rounded-circle p-2 me-3">
                            <i className="fas fa-user-md text-white"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">
                              Dr. {appointment.doctorId?.name || "Unknown Doctor"}
                            </h6>
                            <small className="text-muted">
                              {appointment.doctorId?.specialization || "General Practice"}
                            </small>
                          </div>
                        </div>
                        
                        <div className="row g-2 mb-2">
                          <div className="col-sm-6">
                            <small className="text-muted d-block">
                              <i className="fas fa-calendar me-1"></i>
                              {formatDate(appointment.date)}
                            </small>
                          </div>
                          <div className="col-sm-6">
                            <small className="text-muted d-block">
                              <i className="fas fa-clock me-1"></i>
                              {formatTime(appointment.time)}
                            </small>
                          </div>
                        </div>
                        
                        {appointment.reason && (
                          <p className="mb-2 small">
                            <i className="fas fa-notes-medical me-1"></i>
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="col-md-4 text-md-end">
                        <div className="mb-2">
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        {appointment.status === "pending" && (
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="btn btn-outline-danger btn-sm"
                          >
                            <i className="fas fa-times me-1"></i>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAppointments;