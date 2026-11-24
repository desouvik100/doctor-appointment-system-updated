import React, { useState, useEffect } from 'react';
import OnlineConsultation from './OnlineConsultation';

/**
 * ConsultationButton Component
 * 
 * Add this to your appointment cards to enable video consultations
 * 
 * Usage:
 * <ConsultationButton appointment={appointment} user={user} onComplete={refreshAppointments} />
 */
const ConsultationButton = ({ appointment, user, onComplete }) => {
  const [showConsultation, setShowConsultation] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState('');

  useEffect(() => {
    checkAvailability();
    const interval = setInterval(checkAvailability, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  const checkAvailability = () => {
    // Only for online consultations
    if (appointment.consultationType !== 'online') {
      setCanStart(false);
      return;
    }

    // Must be approved
    if (appointment.status !== 'approved' && appointment.status !== 'confirmed') {
      setCanStart(false);
      return;
    }

    // Check 15-minute window
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    const fifteenMinutesBefore = new Date(appointmentDateTime.getTime() - 15 * 60000);
    const sixtyMinutesAfter = new Date(appointmentDateTime.getTime() + 60 * 60000);

    if (now < fifteenMinutesBefore) {
      setCanStart(false);
      const minutesUntil = Math.ceil((fifteenMinutesBefore - now) / 60000);
      setTimeUntilStart(`Available in ${minutesUntil} min`);
    } else if (now > sixtyMinutesAfter) {
      setCanStart(false);
      setTimeUntilStart('Window closed');
    } else {
      setCanStart(true);
      setTimeUntilStart('Available now');
    }
  };

  const handleStartConsultation = () => {
    setShowConsultation(true);
  };

  const handleCloseConsultation = () => {
    setShowConsultation(false);
    if (onComplete) {
      onComplete();
    }
  };

  // Don't show button for in-person appointments
  if (appointment.consultationType !== 'online') {
    return null;
  }

  return (
    <>
      <div className="consultation-button-container">
        <button
          className={`btn ${canStart ? 'btn-success' : 'btn-secondary'}`}
          onClick={handleStartConsultation}
          disabled={!canStart}
          title={timeUntilStart}
        >
          <i className="fas fa-video me-2"></i>
          {canStart ? 'Start Consultation' : timeUntilStart}
        </button>
        
        {appointment.status !== 'approved' && appointment.status !== 'confirmed' && (
          <small className="text-muted d-block mt-1">
            <i className="fas fa-info-circle me-1"></i>
            Waiting for approval
          </small>
        )}
      </div>

      {showConsultation && (
        <OnlineConsultation
          appointmentId={appointment._id}
          user={user}
          onClose={handleCloseConsultation}
        />
      )}
    </>
  );
};

export default ConsultationButton;
