import React, { useState, useEffect } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import OnlineConsultation from './OnlineConsultation';

function MyAppointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      console.log("Fetching appointments for user:", user.id);
      const response = await axios.get(`/api/appointments/user/${user.id}`);
      console.log("Appointments fetched:", response.data);
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      console.log("Cancelling appointment:", appointmentId);
      await axios.put(`/api/appointments/${appointmentId}`, { status: "cancelled" });
      fetchAppointments(); // Refresh the list
      toast.success("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-warning text-dark",
      confirmed: "bg-success",
      in_progress: "bg-info",
      cancelled: "bg-danger",
      completed: "bg-secondary"
    };

    const statusLabels = {
      in_progress: "In Progress"
    };

    return (
      <span className={`badge ${statusClasses[status] || "bg-secondary"}`}>
        {statusLabels[status] || (status.charAt(0).toUpperCase() + status.slice(1))}
      </span>
    );
  };

  const handleJoinConsultation = (appointmentId) => {
    setSelectedConsultation(appointmentId);
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusClasses = {
      pending: "bg-warning text-dark",
      completed: "bg-success",
      failed: "bg-danger",
      refunded: "bg-secondary"
    };

    return (
      <span className={`badge ${statusClasses[paymentStatus] || "bg-secondary"} ms-2`}>
        Payment: {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
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

  if (selectedConsultation) {
    return (
      <OnlineConsultation
        appointmentId={selectedConsultation}
        user={user}
        onClose={() => {
          setSelectedConsultation(null);
          fetchAppointments();
        }}
      />
    );
  }

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
                        
                        <div className="mb-2">
                          <span className={`badge ${appointment.consultationType === 'online' ? 'bg-info' : 'bg-secondary'} me-2`}>
                            <i className={`fas ${appointment.consultationType === 'online' ? 'fa-video' : 'fa-hospital'} me-1`}></i>
                            {appointment.consultationType === 'online' ? 'Online' : 'In-Person'}
                          </span>
                        </div>

                        {appointment.reason && (
                          <p className="mb-2 small">
                            <i className="fas fa-notes-medical me-1"></i>
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}

                        {appointment.payment && (
                          <div className="mb-2">
                            <small className="text-muted d-block">
                              <i className="fas fa-rupee-sign me-1"></i>
                              <strong>Total Amount:</strong> ₹{appointment.payment.totalAmount}
                            </small>
                            <small className="text-muted">
                              (Consultation: ₹{appointment.payment.consultationFee} + GST: ₹{appointment.payment.gst} + Platform Fee: ₹{appointment.payment.platformFee})
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-md-4 text-md-end">
                        <div className="mb-2">
                          {getStatusBadge(appointment.status)}
                          {appointment.payment && getPaymentStatusBadge(appointment.payment.paymentStatus)}
                        </div>
                        
                        <div className="d-flex flex-column gap-2">
                          {appointment.consultationType === 'online' && 
                           (appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                            <button
                              onClick={() => handleJoinConsultation(appointment._id)}
                              className="btn btn-primary btn-sm"
                            >
                              <i className="fas fa-video me-1"></i>
                              Join Consultation
                            </button>
                          )}
                          
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAppointments;
