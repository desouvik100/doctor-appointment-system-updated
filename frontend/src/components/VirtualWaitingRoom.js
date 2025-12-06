// frontend/src/components/VirtualWaitingRoom.js
// Virtual Waiting Room - Real-time queue status and estimated wait times
import { useState, useEffect, useCallback } from 'react';
import './VirtualWaitingRoom.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const VirtualWaitingRoom = ({ appointment, userId, userName, onClose, onConsultationStart }) => {
  const [queueStatus, setQueueStatus] = useState({
    position: 0,
    estimatedWait: 0,
    totalInQueue: 0,
    doctorStatus: 'available',
    patientStatus: 'not-joined',
    isYourTurn: false
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [consultationReady, setConsultationReady] = useState(false);

  // Fetch queue status
  const fetchQueueStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue/status/${appointment._id}`);
      if (response.ok) {
        const data = await response.json();
        setQueueStatus(data);
        
        // Check if it's user's turn
        if (data.isYourTurn) {
          setConsultationReady(true);
          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
        
        // Update joined status
        if (data.patientStatus !== 'not-joined') {
          setHasJoined(true);
        }
      }
    } catch (error) {
      console.error('Fetch queue status error:', error);
    } finally {
      setLoading(false);
    }
  }, [appointment._id]);

  // Join the queue
  const joinQueue = useCallback(async () => {
    setJoining(true);
    try {
      const response = await fetch(`${API_URL}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment._id,
          patientId: userId,
          patientName: userName || appointment.patientName
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueueStatus(prev => ({
          ...prev,
          position: data.position,
          estimatedWait: data.estimatedWait,
          totalInQueue: data.totalInQueue,
          doctorStatus: data.doctorStatus,
          patientStatus: 'waiting'
        }));
        setHasJoined(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join queue');
      }
    } catch (error) {
      console.error('Join queue error:', error);
      // Fallback to demo mode
      setQueueStatus({
        position: Math.floor(Math.random() * 5) + 1,
        estimatedWait: Math.floor(Math.random() * 20) + 5,
        totalInQueue: Math.floor(Math.random() * 10) + 3,
        doctorStatus: 'busy',
        patientStatus: 'waiting'
      });
      setHasJoined(true);
    } finally {
      setJoining(false);
    }
  }, [appointment._id, appointment.patientName, userId, userName]);

  // Leave the queue
  const leaveQueue = async () => {
    try {
      await fetch(`${API_URL}/api/queue/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment._id })
      });
    } catch (error) {
      console.error('Leave queue error:', error);
    }
    onClose && onClose();
  };

  useEffect(() => {
    // Initial status check
    fetchQueueStatus();
    
    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchQueueStatus, 15000);
    
    return () => clearInterval(interval);
  }, [fetchQueueStatus]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'patient',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Send to backend
    try {
      await fetch(`${API_URL}/api/queue/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment._id,
          message: newMessage,
          senderType: 'patient'
        })
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
    
    // Auto-reply acknowledgment
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: 'Thank you for your message. The clinic staff will respond shortly.',
        sender: 'system',
        timestamp: new Date().toISOString()
      }]);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'busy': return '#f59e0b';
      case 'ready': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="virtual-waiting-room">
        <div className="virtual-waiting-room__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Joining waiting room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="virtual-waiting-room">
      <div className="virtual-waiting-room__header">
        <h2><i className="fas fa-clock"></i> Virtual Waiting Room</h2>
        {onClose && (
          <button className="virtual-waiting-room__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Appointment Info */}
      <div className="appointment-info">
        <div className="appointment-info__doctor">
          <div className="doctor-avatar">
            {appointment.doctorPhoto ? (
              <img src={appointment.doctorPhoto} alt={appointment.doctorName} />
            ) : (
              <i className="fas fa-user-md"></i>
            )}
            <span 
              className="status-dot"
              style={{ background: getStatusColor(queueStatus.doctorStatus) }}
            ></span>
          </div>
          <div className="doctor-details">
            <h3>{appointment.doctorName || 'Dr. Smith'}</h3>
            <p>{appointment.specialization || 'General Physician'}</p>
            <span className="status-text">
              {queueStatus.doctorStatus === 'busy' ? 'In consultation' : 
               queueStatus.doctorStatus === 'ready' ? 'Ready for you' : 'Available'}
            </span>
          </div>
        </div>
        <div className="appointment-info__time">
          <i className="fas fa-calendar-alt"></i>
          <span>{new Date(appointment.date).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })}</span>
          <span className="time">{appointment.time || '10:00 AM'}</span>
        </div>
      </div>

      {/* Queue Status */}
      {!hasJoined ? (
        <div className="join-queue-section">
          <div className="join-queue-section__icon">
            <i className="fas fa-door-open"></i>
          </div>
          <h3>Ready to Join?</h3>
          <p>Click below to enter the virtual waiting room and wait for your turn</p>
          <button 
            className="join-queue-btn"
            onClick={joinQueue}
            disabled={joining}
          >
            {joining ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Joining...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Join Waiting Room
              </>
            )}
          </button>
        </div>
      ) : consultationReady ? (
        <div className="consultation-ready">
          <div className="consultation-ready__icon">
            <i className="fas fa-video"></i>
          </div>
          <h3>Your Turn!</h3>
          <p>The doctor is ready to see you now</p>
          <button 
            className="join-consultation-btn"
            onClick={() => onConsultationStart && onConsultationStart(appointment)}
          >
            <i className="fas fa-video"></i> Join Consultation
          </button>
        </div>
      ) : (
        <div className="queue-status">
          <div className="queue-status__position">
            <div className="position-circle">
              <span className="position-number">{queueStatus.position || '—'}</span>
              <span className="position-label">in queue</span>
            </div>
          </div>
          
          <div className="queue-status__details">
            <div className="detail-item">
              <i className="fas fa-hourglass-half"></i>
              <div>
                <span className="label">Estimated Wait</span>
                <span className="value">{formatWaitTime(queueStatus.estimatedWait)}</span>
              </div>
            </div>
            <div className="detail-item">
              <i className="fas fa-users"></i>
              <div>
                <span className="label">Patients Ahead</span>
                <span className="value">{Math.max(0, (queueStatus.position || 1) - 1)}</span>
              </div>
            </div>
          </div>

          <div className="queue-progress">
            <div className="queue-progress__bar">
              <div 
                className="queue-progress__fill"
                style={{ 
                  width: `${queueStatus.totalInQueue > 0 ? ((queueStatus.totalInQueue - (queueStatus.position || 0) + 1) / queueStatus.totalInQueue) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <span className="queue-progress__text">
              {Math.max(0, queueStatus.totalInQueue - (queueStatus.position || 0))} patients completed
            </span>
          </div>
        </div>
      )}

      {/* Tips While Waiting */}
      <div className="waiting-tips">
        <h4><i className="fas fa-lightbulb"></i> While You Wait</h4>
        <ul>
          <li>
            <i className="fas fa-check-circle"></i>
            Ensure your camera and microphone are working
          </li>
          <li>
            <i className="fas fa-check-circle"></i>
            Have your medical reports ready if needed
          </li>
          <li>
            <i className="fas fa-check-circle"></i>
            Find a quiet, well-lit space for the consultation
          </li>
          <li>
            <i className="fas fa-check-circle"></i>
            Note down any questions you want to ask
          </li>
        </ul>
      </div>

      {/* Quick Chat */}
      <div className="waiting-chat">
        <div className="waiting-chat__header">
          <h4><i className="fas fa-comments"></i> Quick Message</h4>
          <span className="chat-hint">Send a message to the clinic</span>
        </div>
        
        <div className="waiting-chat__messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <i className="fas fa-comment-dots"></i>
              <p>No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message message--${msg.sender}`}
              >
                <p>{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))
          )}
        </div>
        
        <div className="waiting-chat__input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="waiting-actions">
        <button className="action-btn action-btn--secondary" onClick={leaveQueue}>
          <i className="fas fa-arrow-left"></i> Leave Waiting Room
        </button>
        {hasJoined && !consultationReady && (
          <button 
            className="action-btn action-btn--refresh"
            onClick={fetchQueueStatus}
          >
            <i className="fas fa-sync-alt"></i> Refresh Status
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualWaitingRoom;
