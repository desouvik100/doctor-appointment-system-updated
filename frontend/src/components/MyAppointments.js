import React, { useState, useEffect } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import OnlineConsultation from './OnlineConsultation';
import CancelAppointmentModal from './CancelAppointmentModal';
import './MyAppointments.css';

function MyAppointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

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

  // Separate appointments into upcoming (undone) and completed (done)
  const upcomingAppointments = appointments.filter(apt => 
    ['pending', 'confirmed', 'in_progress'].includes(apt.status)
  );
  
  const completedAppointments = appointments.filter(apt => 
    ['completed', 'cancelled'].includes(apt.status)
  );

  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelModalOpen(true);
  };

  const handleCancelComplete = (cancelledAppointment, refundInfo) => {
    fetchAppointments();
    setCancelModalOpen(false);
    setAppointmentToCancel(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "status-pending", icon: "fa-clock", label: "Pending" },
      confirmed: { class: "status-confirmed", icon: "fa-check-circle", label: "Confirmed" },
      in_progress: { class: "status-progress", icon: "fa-spinner", label: "In Progress" },
      cancelled: { class: "status-cancelled", icon: "fa-times-circle", label: "Cancelled" },
      completed: { class: "status-completed", icon: "fa-check-double", label: "Completed" }
    };

    const config = statusConfig[status] || { class: "status-default", icon: "fa-question", label: status };

    return (
      <span className={`appointment-status ${config.class}`}>
        <i className={`fas ${config.icon}`}></i>
        {config.label}
      </span>
    );
  };

  const handleJoinConsultation = (appointmentId) => {
    setSelectedConsultation(appointmentId);
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      pending: { class: "payment-pending", label: "Payment Pending" },
      completed: { class: "payment-completed", label: "Paid" },
      failed: { class: "payment-failed", label: "Payment Failed" },
      refunded: { class: "payment-refunded", label: "Refunded" }
    };

    const config = statusConfig[paymentStatus] || { class: "payment-default", label: paymentStatus };

    return (
      <span className={`payment-status ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  // Fetch live queue info for an appointment
  const fetchQueueInfo = async (appointment) => {
    setSelectedAppointment(appointment);
    setQueueLoading(true);
    try {
      const response = await axios.get(`/api/appointments/my-queue/${appointment._id}`);
      if (response.data.success) {
        setQueueInfo(response.data);
      } else {
        // Fallback to basic queue info
        const dateStr = new Date(appointment.date).toISOString().split('T')[0];
        const queueResponse = await axios.get(`/api/appointments/queue-info/${appointment.doctorId?._id}/${dateStr}`);
        setQueueInfo({
          ...queueResponse.data,
          yourQueueNumber: appointment.queueNumber || appointment.tokenNumber,
          yourEstimatedTime: appointment.time
        });
      }
    } catch (error) {
      console.error('Error fetching queue info:', error);
      setQueueInfo({
        yourQueueNumber: appointment.queueNumber || appointment.tokenNumber || 'N/A',
        yourEstimatedTime: appointment.time,
        currentQueueCount: 'N/A'
      });
    } finally {
      setQueueLoading(false);
    }
  };

  // Close queue modal
  const closeQueueModal = () => {
    setSelectedAppointment(null);
    setQueueInfo(null);
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
      <div className="appointments-loading">
        <div className="loading-spinner"></div>
        <p>Loading your appointments...</p>
      </div>
    );
  }

  const currentAppointments = activeTab === 'upcoming' ? upcomingAppointments : completedAppointments;

  const renderAppointmentCard = (appointment) => (
    <div 
      key={appointment._id} 
      className={`appointment-card ${appointment.status}`}
      onClick={() => ['pending', 'confirmed', 'in_progress'].includes(appointment.status) && fetchQueueInfo(appointment)}
      style={{ cursor: ['pending', 'confirmed', 'in_progress'].includes(appointment.status) ? 'pointer' : 'default' }}
    >
      {['pending', 'confirmed', 'in_progress'].includes(appointment.status) && (
        <div className="click-hint">
          <i className="fas fa-hand-pointer"></i> Tap for Live Queue
        </div>
      )}
      <div className="appointment-card-header">
        <div className="doctor-info">
          <div className="doctor-avatar">
            {appointment.doctorId?.profilePhoto ? (
              <img src={appointment.doctorId.profilePhoto} alt={appointment.doctorId?.name} />
            ) : (
              <i className="fas fa-user-md"></i>
            )}
          </div>
          <div className="doctor-details">
            <h4>Dr. {appointment.doctorId?.name || "Unknown Doctor"}</h4>
            <p>{appointment.doctorId?.specialization || "General Practice"}</p>
          </div>
        </div>
        <div className="appointment-badges">
          {getStatusBadge(appointment.status)}
          {appointment.payment && getPaymentStatusBadge(appointment.payment.paymentStatus)}
        </div>
      </div>

      <div className="appointment-card-body">
        <div className="appointment-info-grid">
          <div className="info-item">
            <i className="fas fa-calendar-alt"></i>
            <div>
              <span className="info-label">Date</span>
              <span className="info-value">{formatDate(appointment.date)}</span>
            </div>
          </div>
          <div className="info-item">
            <i className="fas fa-clock"></i>
            <div>
              <span className="info-label">Time</span>
              <span className="info-value">{formatTime(appointment.time)}</span>
            </div>
          </div>
          <div className="info-item">
            <i className={`fas ${appointment.consultationType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
            <div>
              <span className="info-label">Type</span>
              <span className="info-value">{appointment.consultationType === 'online' ? 'Online' : 'In-Person'}</span>
            </div>
          </div>
          {appointment.payment && (
            <div className="info-item">
              <i className="fas fa-rupee-sign"></i>
              <div>
                <span className="info-label">Amount</span>
                <span className="info-value">₹{appointment.payment.totalAmount}</span>
              </div>
            </div>
          )}
        </div>

        {appointment.reason && (
          <div className="appointment-reason">
            <i className="fas fa-notes-medical"></i>
            <span>{appointment.reason}</span>
          </div>
        )}
      </div>

      <div className="appointment-card-footer">
        {appointment.consultationType === 'online' && 
         (appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
          <button
            onClick={() => handleJoinConsultation(appointment._id)}
            className="btn-join"
          >
            <i className="fas fa-video"></i>
            Join Consultation
          </button>
        )}
        
        {(appointment.status === "pending" || appointment.status === "confirmed") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancelAppointment(appointment);
            }}
            className="btn-cancel"
          >
            <i className="fas fa-times"></i>
            Cancel Appointment
          </button>
        )}

        {appointment.status === "completed" && (
          <button className="btn-review" onClick={() => toast.success('Review feature coming soon!')}>
            <i className="fas fa-star"></i>
            Leave Review
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="my-appointments-container">
      <div className="appointments-header">
        <h2>
          <i className="fas fa-calendar-check"></i>
          My Appointments
        </h2>
        <p>Manage and track all your medical appointments</p>
      </div>

      {/* Tabs */}
      <div className="appointments-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <i className="fas fa-calendar-alt"></i>
          Upcoming
          {upcomingAppointments.length > 0 && (
            <span className="tab-count">{upcomingAppointments.length}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <i className="fas fa-check-circle"></i>
          Completed
          {completedAppointments.length > 0 && (
            <span className="tab-count">{completedAppointments.length}</span>
          )}
        </button>
      </div>

      {/* Appointments List */}
      <div className="appointments-list">
        {currentAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'upcoming' ? (
                <i className="fas fa-calendar-plus"></i>
              ) : (
                <i className="fas fa-history"></i>
              )}
            </div>
            <h3>
              {activeTab === 'upcoming' 
                ? 'No Upcoming Appointments' 
                : 'No Completed Appointments'}
            </h3>
            <p>
              {activeTab === 'upcoming'
                ? 'Book your first appointment from the "Find Doctors" section.'
                : 'Your completed appointments will appear here.'}
            </p>
          </div>
        ) : (
          currentAppointments.map(renderAppointmentCard)
        )}
      </div>

      {/* Summary Stats */}
      <div className="appointments-summary">
        <div className="summary-card">
          <i className="fas fa-calendar-check"></i>
          <div>
            <span className="summary-value">{upcomingAppointments.length}</span>
            <span className="summary-label">Upcoming</span>
          </div>
        </div>
        <div className="summary-card">
          <i className="fas fa-check-double"></i>
          <div>
            <span className="summary-value">{completedAppointments.filter(a => a.status === 'completed').length}</span>
            <span className="summary-label">Completed</span>
          </div>
        </div>
        <div className="summary-card">
          <i className="fas fa-times-circle"></i>
          <div>
            <span className="summary-value">{completedAppointments.filter(a => a.status === 'cancelled').length}</span>
            <span className="summary-label">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Live Queue Modal */}
      {selectedAppointment && (
        <div className="queue-modal-overlay" onClick={closeQueueModal}>
          <div className="queue-modal" onClick={(e) => e.stopPropagation()}>
            <button className="queue-modal-close" onClick={closeQueueModal}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="queue-modal-header">
              <div className="queue-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Live Queue Status</h3>
              <p>Dr. {selectedAppointment.doctorId?.name}</p>
            </div>

            {queueLoading ? (
              <div className="queue-loading">
                <div className="loading-spinner"></div>
                <p>Fetching queue status...</p>
              </div>
            ) : queueInfo ? (
              <div className="queue-modal-body">
                <div className="queue-stats">
                  <div className="queue-stat highlight">
                    <span className="queue-stat-value">{queueInfo.yourQueueNumber || queueInfo.queueNumber || 'N/A'}</span>
                    <span className="queue-stat-label">Your Token</span>
                  </div>
                  <div className="queue-stat">
                    <span className="queue-stat-value">{queueInfo.currentlyServing || queueInfo.currentQueueCount || '-'}</span>
                    <span className="queue-stat-label">Now Serving</span>
                  </div>
                  <div className="queue-stat">
                    <span className="queue-stat-value">{queueInfo.patientsAhead ?? queueInfo.currentQueueCount ?? '-'}</span>
                    <span className="queue-stat-label">Ahead of You</span>
                  </div>
                </div>

                <div className="queue-time-info">
                  <div className="time-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <span className="time-label">Estimated Time</span>
                      <span className="time-value">{queueInfo.yourEstimatedTime || queueInfo.estimatedTime || selectedAppointment.time}</span>
                    </div>
                  </div>
                  <div className="time-item">
                    <i className="fas fa-hourglass-half"></i>
                    <div>
                      <span className="time-label">Est. Wait</span>
                      <span className="time-value">{queueInfo.estimatedWaitMinutes ? `~${queueInfo.estimatedWaitMinutes} min` : 'Calculating...'}</span>
                    </div>
                  </div>
                </div>

                <div className="queue-tips">
                  <h4><i className="fas fa-lightbulb"></i> Tips</h4>
                  <ul>
                    <li>Arrive 10 minutes before your estimated time</li>
                    <li>Keep your phone handy for updates</li>
                    <li>Carry all relevant medical documents</li>
                  </ul>
                </div>

                <button className="btn-refresh-queue" onClick={() => fetchQueueInfo(selectedAppointment)}>
                  <i className="fas fa-sync-alt"></i> Refresh Status
                </button>
              </div>
            ) : (
              <div className="queue-error">
                <i className="fas fa-exclamation-circle"></i>
                <p>Unable to fetch queue status</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal with Refund Preview */}
      <CancelAppointmentModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        appointment={appointmentToCancel}
        onCancelled={handleCancelComplete}
        userType="patient"
      />
    </div>
  );
}

export default MyAppointments;
