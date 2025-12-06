// frontend/src/components/DoctorQueueManager.js
// Doctor's Queue Management Panel - Manage virtual waiting room
import { useState, useEffect, useCallback } from 'react';
import './DoctorQueueManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const DoctorQueueManager = ({ doctorId, onStartConsultation, onClose }) => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalInQueue: 0,
    waiting: 0,
    completed: 0,
    avgConsultationTime: 15
  });
  const [doctorStatus, setDoctorStatus] = useState('offline');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Initialize queue - auto-sets doctor as available (host)
  const initializeQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/initialize`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorStatus(data.doctorStatus);
        console.log('Queue initialized:', data.message);
      }
    } catch (error) {
      console.error('Initialize queue error:', error);
    }
  }, [doctorId]);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
        setStats(data.stats || {});
        setDoctorStatus(data.doctorStatus);
        
        // Find current patient
        const inConsultation = data.queue?.find(q => q.status === 'in-consultation');
        setCurrentPatient(inConsultation || null);
      }
    } catch (error) {
      console.error('Fetch queue error:', error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    // Initialize queue first (sets doctor as available/host)
    initializeQueue().then(() => {
      fetchQueue();
    });
    
    const interval = setInterval(fetchQueue, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [initializeQueue, fetchQueue]);

  const updateStatus = async (status) => {
    setActionLoading('status');
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setDoctorStatus(status);
      }
    } catch (error) {
      console.error('Update status error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const callNextPatient = async () => {
    setActionLoading('call-next');
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/call-next`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.nextPatient) {
          setDoctorStatus('ready');
        }
        fetchQueue();
      }
    } catch (error) {
      console.error('Call next error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const startConsultation = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/start-consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentPatient(data.patient);
        setDoctorStatus('busy');
        fetchQueue();
        
        // Trigger video consultation
        if (onStartConsultation) {
          onStartConsultation(data.patient);
        }
      }
    } catch (error) {
      console.error('Start consultation error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const endConsultation = async () => {
    if (!currentPatient) return;
    
    setActionLoading('end');
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/end-consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: currentPatient.appointmentId })
      });
      if (response.ok) {
        setCurrentPatient(null);
        fetchQueue();
      }
    } catch (error) {
      console.error('End consultation error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const markNoShow = async (appointmentId) => {
    setActionLoading(appointmentId);
    try {
      const response = await fetch(`${API_URL}/api/queue/doctor/${doctorId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      if (response.ok) {
        fetchQueue();
      }
    } catch (error) {
      console.error('No-show error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'busy': return '#ef4444';
      case 'ready': return '#6366f1';
      case 'break': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPatientStatusBadge = (status) => {
    switch (status) {
      case 'waiting': return { color: '#f59e0b', bg: '#fef3c7', text: 'Waiting' };
      case 'called': return { color: '#6366f1', bg: '#eef2ff', text: 'Called' };
      case 'in-consultation': return { color: '#22c55e', bg: '#dcfce7', text: 'In Progress' };
      default: return { color: '#6b7280', bg: '#f3f4f6', text: status };
    }
  };

  if (loading) {
    return (
      <div className="doctor-queue-manager">
        <div className="doctor-queue-manager__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-queue-manager">
      <div className="doctor-queue-manager__header">
        <h2><i className="fas fa-users"></i> Patient Queue</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>


      {/* Doctor Status */}
      <div className="doctor-status-panel">
        <div className="status-indicator">
          <span 
            className="status-dot"
            style={{ background: getStatusColor(doctorStatus) }}
          ></span>
          <span className="status-text">{doctorStatus}</span>
        </div>
        <div className="status-buttons">
          <button 
            className={`status-btn ${doctorStatus === 'available' ? 'active' : ''}`}
            onClick={() => updateStatus('available')}
            disabled={actionLoading === 'status'}
          >
            <i className="fas fa-check-circle"></i> Available
          </button>
          <button 
            className={`status-btn ${doctorStatus === 'break' ? 'active' : ''}`}
            onClick={() => updateStatus('break')}
            disabled={actionLoading === 'status'}
          >
            <i className="fas fa-coffee"></i> Break
          </button>
          <button 
            className={`status-btn ${doctorStatus === 'offline' ? 'active' : ''}`}
            onClick={() => updateStatus('offline')}
            disabled={actionLoading === 'status'}
          >
            <i className="fas fa-power-off"></i> Offline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="queue-stats">
        <div className="stat-card">
          <i className="fas fa-users"></i>
          <div>
            <span className="value">{stats.waiting || 0}</span>
            <span className="label">Waiting</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-check-circle"></i>
          <div>
            <span className="value">{stats.completed || 0}</span>
            <span className="label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-clock"></i>
          <div>
            <span className="value">{stats.avgConsultationTime || 15}m</span>
            <span className="label">Avg Time</span>
          </div>
        </div>
      </div>

      {/* Current Patient */}
      {currentPatient && (
        <div className="current-patient">
          <div className="current-patient__header">
            <h4><i className="fas fa-user-md"></i> Current Consultation</h4>
          </div>
          <div className="current-patient__info">
            <div className="patient-avatar">
              {currentPatient.patientId?.profilePhoto ? (
                <img src={currentPatient.patientId.profilePhoto} alt="" />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="patient-details">
              <h5>{currentPatient.patientName || currentPatient.patientId?.name}</h5>
              <span>Started at {new Date(currentPatient.consultationStartedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <button 
              className="end-consultation-btn"
              onClick={endConsultation}
              disabled={actionLoading === 'end'}
            >
              {actionLoading === 'end' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-stop-circle"></i> End
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Call Next Button */}
      {!currentPatient && stats.waiting > 0 && (
        <button 
          className="call-next-btn"
          onClick={callNextPatient}
          disabled={actionLoading === 'call-next' || doctorStatus === 'offline'}
        >
          {actionLoading === 'call-next' ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Calling...
            </>
          ) : (
            <>
              <i className="fas fa-bell"></i> Call Next Patient
            </>
          )}
        </button>
      )}

      {/* Queue List */}
      <div className="queue-list">
        <h4>Waiting Patients ({queue.filter(q => q.status === 'waiting' || q.status === 'called').length})</h4>
        
        {queue.filter(q => q.status === 'waiting' || q.status === 'called').length === 0 ? (
          <div className="empty-queue">
            <i className="fas fa-inbox"></i>
            <p>No patients in queue</p>
          </div>
        ) : (
          <div className="queue-items">
            {queue
              .filter(q => q.status === 'waiting' || q.status === 'called')
              .map((patient, index) => {
                const statusBadge = getPatientStatusBadge(patient.status);
                return (
                  <div key={patient.appointmentId} className="queue-item">
                    <div className="queue-item__position">
                      {index + 1}
                    </div>
                    <div className="queue-item__avatar">
                      {patient.patientId?.profilePhoto ? (
                        <img src={patient.patientId.profilePhoto} alt="" />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="queue-item__info">
                      <h5>{patient.patientName || patient.patientId?.name}</h5>
                      <span>Scheduled: {patient.scheduledTime}</span>
                    </div>
                    <span 
                      className="queue-item__status"
                      style={{ color: statusBadge.color, background: statusBadge.bg }}
                    >
                      {statusBadge.text}
                    </span>
                    <div className="queue-item__actions">
                      {patient.status === 'called' && (
                        <button 
                          className="action-btn start"
                          onClick={() => startConsultation(patient.appointmentId)}
                          disabled={actionLoading === patient.appointmentId}
                        >
                          {actionLoading === patient.appointmentId ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-video"></i>
                          )}
                        </button>
                      )}
                      <button 
                        className="action-btn no-show"
                        onClick={() => markNoShow(patient.appointmentId)}
                        disabled={actionLoading === patient.appointmentId}
                        title="Mark as No-Show"
                      >
                        <i className="fas fa-user-slash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorQueueManager;
