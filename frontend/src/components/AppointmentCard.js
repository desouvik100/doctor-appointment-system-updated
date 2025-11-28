// frontend/src/components/AppointmentCard.js
import React from 'react';
import './AppointmentCard.css';

const AppointmentCard = ({ appointment }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: 'clock', text: 'Pending' },
      confirmed: { color: 'success', icon: 'check-circle', text: 'Confirmed' },
      in_progress: { color: 'info', icon: 'video', text: 'In Progress' },
      completed: { color: 'secondary', icon: 'check', text: 'Completed' },
      cancelled: { color: 'danger', icon: 'times-circle', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`status-badge status-${config.color}`}>
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const handleJoinMeeting = () => {
    const meetLink = appointment.googleMeetLink || appointment.meetingLink;
    if (meetLink) {
      window.open(meetLink, '_blank', 'noopener,noreferrer');
    }
  };

  const canJoinMeeting = () => {
    if (appointment.consultationType !== 'online') return false;
    if (!appointment.googleMeetLink && !appointment.meetingLink) return false;
    if (appointment.status === 'cancelled' || appointment.status === 'completed') return false;
    
    // Check if within time window (15 minutes before to 60 minutes after)
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDate.getTime() - 15 * 60 * 1000);
    const sixtyMinutesAfter = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
    
    return now >= fifteenMinutesBefore && now <= sixtyMinutesAfter;
  };

  const getTimeUntilAppointment = () => {
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const diff = appointmentDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Past appointment';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hoursLeft > 0) return `In ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
    if (minutesLeft > 0) return `In ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  const meetLink = appointment.googleMeetLink || appointment.meetingLink;
  const isOnline = appointment.consultationType === 'online';

  return (
    <div className="appointment-card-modern">
      <div className="appointment-card-header">
        <div className="appointment-type-badge">
          {isOnline ? (
            <>
              <i className="fas fa-video"></i>
              <span>Online Consultation</span>
            </>
          ) : (
            <>
              <i className="fas fa-hospital"></i>
              <span>In-Person Visit</span>
            </>
          )}
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="appointment-card-body">
        <div className="doctor-info-section">
          <div className="doctor-avatar">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="doctor-details">
            <h4>Dr. {appointment.doctorId?.name || 'Unknown'}</h4>
            <p className="specialization">{appointment.doctorId?.specialization || 'General'}</p>
          </div>
        </div>

        <div className="appointment-details-grid">
          <div className="detail-item">
            <i className="fas fa-calendar"></i>
            <div>
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(appointment.date)}</span>
            </div>
          </div>

          <div className="detail-item">
            <i className="fas fa-clock"></i>
            <div>
              <span className="detail-label">Time</span>
              <span className="detail-value">{appointment.time}</span>
            </div>
          </div>

          <div className="detail-item">
            <i className="fas fa-hospital"></i>
            <div>
              <span className="detail-label">Clinic</span>
              <span className="detail-value">{appointment.clinicId?.name || 'N/A'}</span>
            </div>
          </div>

          {appointment.reason && (
            <div className="detail-item full-width">
              <i className="fas fa-notes-medical"></i>
              <div>
                <span className="detail-label">Reason</span>
                <span className="detail-value">{appointment.reason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Google Meet Section */}
        {isOnline && (
          <div className="meet-link-section">
            {meetLink ? (
              <>
                <div className="meet-link-header">
                  <i className="fas fa-video me-2"></i>
                  <span>Video Consultation Link</span>
                  {appointment.meetLinkGenerated && (
                    <span className="link-generated-badge">
                      <i className="fas fa-check-circle"></i>
                      Generated
                    </span>
                  )}
                </div>

                <div className="meet-link-box">
                  <div className="meet-link-url">
                    <i className="fas fa-link me-2"></i>
                    <span>{meetLink}</span>
                  </div>
                  <button
                    className="copy-link-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(meetLink);
                      alert('Link copied to clipboard!');
                    }}
                    title="Copy link"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>

                {canJoinMeeting() ? (
                  <button
                    className="join-meeting-btn"
                    onClick={handleJoinMeeting}
                  >
                    <i className="fas fa-video me-2"></i>
                    Join Meeting Now
                  </button>
                ) : (
                  <div className="meeting-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <span>
                      {appointment.status === 'completed' 
                        ? 'Meeting has ended'
                        : appointment.status === 'cancelled'
                        ? 'Appointment cancelled'
                        : `Meeting opens 15 minutes before appointment (${getTimeUntilAppointment()})`
                      }
                    </span>
                  </div>
                )}

                {appointment.joinCode && (
                  <div className="join-code-section">
                    <span className="join-code-label">Join Code:</span>
                    <span className="join-code">{appointment.joinCode}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="meet-link-pending">
                <i className="fas fa-clock me-2"></i>
                <span>
                  Meeting link will be generated 18 minutes before your appointment
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="appointment-card-footer">
        <div className="countdown-badge">
          <i className="fas fa-hourglass-half me-2"></i>
          {getTimeUntilAppointment()}
        </div>
        
        {appointment.payment?.totalAmount && (
          <div className="payment-badge">
            <i className="fas fa-rupee-sign me-1"></i>
            ₹{appointment.payment.totalAmount}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
