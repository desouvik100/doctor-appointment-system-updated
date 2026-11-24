import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import VideoConsultation from './VideoConsultation';
import './OnlineConsultation.css';

const OnlineConsultation = ({ appointmentId, user, onClose }) => {
  const [appointment, setAppointment] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [inMeeting, setInMeeting] = useState(false);
  const [timeUntilOpen, setTimeUntilOpen] = useState(null);

  useEffect(() => {
    checkAccess();
    const interval = setInterval(checkAccess, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [appointmentId]);

  useEffect(() => {
    if (accessInfo && !accessInfo.accessible && accessInfo.opensAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const opensAt = new Date(accessInfo.opensAt);
        const diff = opensAt - now;
        
        if (diff <= 0) {
          checkAccess();
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeUntilOpen(`${minutes}m ${seconds}s`);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [accessInfo]);

  const checkAccess = async () => {
    try {
      const response = await axios.get(`/api/appointments/${appointmentId}/check-access`);
      setAccessInfo(response.data);
      setAppointment(response.data.appointment);
      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      toast.error('Failed to check consultation access');
      setLoading(false);
    }
  };

  const handleJoinConsultation = async () => {
    try {
      // Start consultation on backend
      const response = await axios.post(`/api/consultations/${appointmentId}/start`);

      if (response.data.success) {
        setInMeeting(true);
        toast.success('Consultation started!', {
          duration: 4000,
          icon: '🎥'
        });
      }
    } catch (error) {
      console.error('Error joining consultation:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join consultation';
      
      // Show specific error messages with appropriate styling
      if (errorMessage.includes('too early') || errorMessage.includes('15 minutes')) {
        toast.error('Too early! You can join 15 minutes before the scheduled time.', {
          duration: 5000,
          icon: '⏰'
        });
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized') || errorMessage.includes('not approved')) {
        toast.error('Unauthorized: Appointment must be approved first.', {
          duration: 5000,
          icon: '🔒'
        });
      } else if (errorMessage.includes('not found')) {
        toast.error('Consultation not found or has been cancelled.', {
          duration: 5000
        });
      } else {
        toast.error(errorMessage, {
          duration: 5000
        });
      }
    }
  };

  const handleEndConsultation = async () => {
    try {
      await axios.post(`/api/appointments/${appointmentId}/end-consultation`);
      toast.success('Consultation completed!', {
        duration: 4000,
        icon: '✅'
      });
      setInMeeting(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast.error(error.response?.data?.message || 'Failed to end consultation', {
        duration: 5000
      });
    }
  };

  if (loading) {
    return (
      <div className="online-consultation">
        <div className="online-consultation__container">
          <div className="online-consultation__loading">
            <div className="online-consultation__spinner"></div>
            <p>Loading consultation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!accessInfo) {
    return (
      <div className="online-consultation">
        <div className="online-consultation__container">
          <div className="online-consultation__error">
            <div className="online-consultation__error-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h3>Unable to load consultation</h3>
            <button className="online-consultation__error-btn" onClick={onClose}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!accessInfo.accessible) {
    return (
      <div className="online-consultation">
        <div className="online-consultation__container">
          <div className="online-consultation__unavailable">
            <div className="online-consultation__unavailable-header">
              <div className="online-consultation__unavailable-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h2 className="online-consultation__unavailable-title">Consultation Not Available Yet</h2>
              <p className="online-consultation__unavailable-reason">{accessInfo.reason}</p>
            </div>
            
            {timeUntilOpen && (
              <div className="online-consultation__countdown">
                <h3>Opens in: {timeUntilOpen}</h3>
              </div>
            )}

            <div className="online-consultation__details">
              <h4>Appointment Details</h4>
              <div className="online-consultation__detail-row">
                <span className="online-consultation__detail-label">Doctor:</span>
                <span className="online-consultation__detail-value">{appointment.doctor?.name}</span>
              </div>
              <div className="online-consultation__detail-row">
                <span className="online-consultation__detail-label">Specialization:</span>
                <span className="online-consultation__detail-value">{appointment.doctor?.specialization}</span>
              </div>
              <div className="online-consultation__detail-row">
                <span className="online-consultation__detail-label">Date:</span>
                <span className="online-consultation__detail-value">{new Date(appointment.date).toLocaleDateString()}</span>
              </div>
              <div className="online-consultation__detail-row">
                <span className="online-consultation__detail-label">Time:</span>
                <span className="online-consultation__detail-value">{appointment.time}</span>
              </div>
            </div>

            <button className="online-consultation__back-btn" onClick={onClose}>
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (inMeeting) {
    return (
      <VideoConsultation
        appointmentId={appointmentId}
        user={user}
        userType="patient"
        onClose={() => {
          setInMeeting(false);
          if (onClose) onClose();
        }}
      />
    );
  }

  return (
    <div className="online-consultation">
      <div className="online-consultation__container">
        <div className="online-consultation__ready">
          <div className="online-consultation__ready-header">
            <div className="online-consultation__ready-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 className="online-consultation__ready-title">Ready to Join Consultation</h2>
          </div>
          
          <div className="online-consultation__info-card">
            <h4>Appointment Details</h4>
            <div className="online-consultation__info-items">
              <div className="online-consultation__info-item">
                <i className="fas fa-user-md"></i>
                <div>
                  <small>Doctor</small>
                  <strong>{appointment.doctor?.name}</strong>
                </div>
              </div>
              <div className="online-consultation__info-item">
                <i className="fas fa-stethoscope"></i>
                <div>
                  <small>Specialization</small>
                  <strong>{appointment.doctor?.specialization}</strong>
                </div>
              </div>
              <div className="online-consultation__info-item">
                <i className="fas fa-calendar"></i>
                <div>
                  <small>Date</small>
                  <strong>{new Date(appointment.date).toLocaleDateString()}</strong>
                </div>
              </div>
              <div className="online-consultation__info-item">
                <i className="fas fa-clock"></i>
                <div>
                  <small>Time</small>
                  <strong>{appointment.time}</strong>
                </div>
              </div>
            </div>
          </div>

          {appointment.joinCode && (
            <div className="online-consultation__join-code">
              <p>Meeting Join Code</p>
              <h3>{appointment.joinCode}</h3>
            </div>
          )}

          <div className="online-consultation__actions">
            <button 
              className="online-consultation__join-btn"
              onClick={handleJoinConsultation}
            >
              <i className="fas fa-video"></i>
              Join Consultation
            </button>
            <button className="online-consultation__back-btn" onClick={onClose}>
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          </div>

          <div className="online-consultation__tips">
            <h5><i className="fas fa-lightbulb"></i>Tips for a better experience</h5>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Use headphones for better audio quality</li>
              <li>Find a quiet, well-lit space</li>
              <li>Have your medical records ready if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultation;


