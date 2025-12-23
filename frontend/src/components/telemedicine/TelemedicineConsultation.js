/**
 * Telemedicine Consultation Component
 * Enhanced video consultation with EMR integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TelemedicineConsultation.css';

// Connection quality thresholds
const QUALITY_THRESHOLDS = {
  excellent: { packetLoss: 0.01, jitter: 30, rtt: 100 },
  good: { packetLoss: 0.03, jitter: 50, rtt: 200 },
  fair: { packetLoss: 0.05, jitter: 100, rtt: 400 },
  poor: { packetLoss: 1, jitter: 1000, rtt: 1000 }
};

/**
 * Calculate connection quality from WebRTC stats
 */
const calculateConnectionQuality = (stats) => {
  if (!stats) return 'unknown';
  
  const { packetLoss = 0, jitter = 0, rtt = 0 } = stats;
  
  if (packetLoss <= QUALITY_THRESHOLDS.excellent.packetLoss &&
      jitter <= QUALITY_THRESHOLDS.excellent.jitter &&
      rtt <= QUALITY_THRESHOLDS.excellent.rtt) {
    return 'excellent';
  }
  
  if (packetLoss <= QUALITY_THRESHOLDS.good.packetLoss &&
      jitter <= QUALITY_THRESHOLDS.good.jitter &&
      rtt <= QUALITY_THRESHOLDS.good.rtt) {
    return 'good';
  }
  
  if (packetLoss <= QUALITY_THRESHOLDS.fair.packetLoss &&
      jitter <= QUALITY_THRESHOLDS.fair.jitter &&
      rtt <= QUALITY_THRESHOLDS.fair.rtt) {
    return 'fair';
  }
  
  return 'poor';
};

const TelemedicineConsultation = ({
  appointmentId,
  patient,
  doctor,
  onSessionEnd,
  onEMRAction
}) => {
  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [connectionStats, setConnectionStats] = useState(null);
  
  // Media state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  
  // Screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState({ doctor: false, patient: false });
  
  // EMR sidebar
  const [showEMRSidebar, setShowEMRSidebar] = useState(true);
  const [activeEMRTab, setActiveEMRTab] = useState('summary');
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Initialize media
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Failed to access media devices:', error);
      }
    };
    
    initMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Session duration timer
  useEffect(() => {
    let interval;
    if (isConnected && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, sessionStartTime]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
    }
  }, []);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, [screenStream]);

  // Start recording (requires both consents)
  const startRecording = useCallback(() => {
    if (recordingConsent.doctor && recordingConsent.patient) {
      setIsRecording(true);
      // Recording implementation would go here
    }
  }, [recordingConsent]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    // Save recording implementation would go here
  }, []);

  // End session
  const endSession = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    
    if (onSessionEnd) {
      onSessionEnd({
        appointmentId,
        duration: sessionDuration,
        wasRecorded: isRecording
      });
    }
  }, [localStream, screenStream, appointmentId, sessionDuration, isRecording, onSessionEnd]);

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get quality indicator color
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'fair': return '#eab308';
      case 'poor': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="telemedicine-consultation">
      {/* Main video area */}
      <div className={`video-area ${showEMRSidebar ? 'with-sidebar' : ''}`}>
        {/* Remote video (patient) */}
        <div className="remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          {!isConnected && (
            <div className="video-placeholder">
              <i className="fas fa-user-circle"></i>
              <p>Waiting for patient to connect...</p>
            </div>
          )}
          
          {/* Connection quality indicator */}
          <div className="quality-indicator" title={`Connection: ${connectionQuality}`}>
            <div 
              className="quality-dot"
              style={{ backgroundColor: getQualityColor(connectionQuality) }}
            />
            <span>{connectionQuality}</span>
          </div>
          
          {/* Screen share indicator */}
          {isScreenSharing && (
            <div className="sharing-indicator">
              <i className="fas fa-desktop"></i>
              <span>Screen Sharing Active</span>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot" />
              <span>Recording</span>
            </div>
          )}
        </div>

        {/* Local video (doctor) */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          {isVideoMuted && (
            <div className="video-muted-overlay">
              <i className="fas fa-video-slash"></i>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="video-controls">
          <button
            className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            <i className={`fas fa-microphone${isAudioMuted ? '-slash' : ''}`}></i>
          </button>
          
          <button
            className={`control-btn ${isVideoMuted ? 'muted' : ''}`}
            onClick={toggleVideo}
            title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          >
            <i className={`fas fa-video${isVideoMuted ? '-slash' : ''}`}></i>
          </button>
          
          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <i className="fas fa-desktop"></i>
          </button>
          
          <button
            className="control-btn"
            onClick={() => setShowEMRSidebar(!showEMRSidebar)}
            title={showEMRSidebar ? 'Hide EMR' : 'Show EMR'}
          >
            <i className="fas fa-notes-medical"></i>
          </button>
          
          <button
            className="control-btn end-call"
            onClick={endSession}
            title="End consultation"
          >
            <i className="fas fa-phone-slash"></i>
          </button>
        </div>

        {/* Session info */}
        <div className="session-info">
          <span className="duration">{formatDuration(sessionDuration)}</span>
        </div>
      </div>

      {/* EMR Sidebar */}
      {showEMRSidebar && (
        <div className="emr-sidebar">
          <div className="sidebar-header">
            <h3>Patient EMR</h3>
            <button className="close-sidebar" onClick={() => setShowEMRSidebar(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Patient info */}
          <div className="patient-info">
            <div className="patient-avatar">
              {patient?.profilePhoto ? (
                <img src={patient.profilePhoto} alt={patient.name} />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="patient-details">
              <h4>{patient?.name || 'Patient Name'}</h4>
              <span>{patient?.age} years • {patient?.gender}</span>
            </div>
          </div>

          {/* EMR tabs */}
          <div className="emr-tabs">
            <button
              className={`tab-btn ${activeEMRTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveEMRTab('summary')}
            >
              Summary
            </button>
            <button
              className={`tab-btn ${activeEMRTab === 'vitals' ? 'active' : ''}`}
              onClick={() => setActiveEMRTab('vitals')}
            >
              Vitals
            </button>
            <button
              className={`tab-btn ${activeEMRTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveEMRTab('notes')}
            >
              Notes
            </button>
            <button
              className={`tab-btn ${activeEMRTab === 'rx' ? 'active' : ''}`}
              onClick={() => setActiveEMRTab('rx')}
            >
              Rx
            </button>
          </div>

          {/* Tab content */}
          <div className="emr-content">
            {activeEMRTab === 'summary' && (
              <div className="tab-content">
                <div className="info-section">
                  <h5>Medical History</h5>
                  <ul>
                    {patient?.medicalHistory?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>No history recorded</li>}
                  </ul>
                </div>
                <div className="info-section">
                  <h5>Allergies</h5>
                  <ul>
                    {patient?.allergies?.map((item, i) => (
                      <li key={i} className="allergy">{item}</li>
                    )) || <li>No known allergies</li>}
                  </ul>
                </div>
                <div className="info-section">
                  <h5>Current Medications</h5>
                  <ul>
                    {patient?.medications?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>No current medications</li>}
                  </ul>
                </div>
              </div>
            )}

            {activeEMRTab === 'vitals' && (
              <div className="tab-content">
                <div className="vitals-grid">
                  <div className="vital-card">
                    <span className="vital-label">Blood Pressure</span>
                    <span className="vital-value">{patient?.vitals?.bp || '--/--'}</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">Heart Rate</span>
                    <span className="vital-value">{patient?.vitals?.hr || '--'} bpm</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">Temperature</span>
                    <span className="vital-value">{patient?.vitals?.temp || '--'}°F</span>
                  </div>
                  <div className="vital-card">
                    <span className="vital-label">SpO2</span>
                    <span className="vital-value">{patient?.vitals?.spo2 || '--'}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeEMRTab === 'notes' && (
              <div className="tab-content">
                <textarea
                  className="notes-input"
                  placeholder="Enter consultation notes..."
                  rows={10}
                />
                <button className="save-notes-btn">
                  <i className="fas fa-save"></i>
                  Save Notes
                </button>
              </div>
            )}

            {activeEMRTab === 'rx' && (
              <div className="tab-content">
                <button className="action-btn">
                  <i className="fas fa-prescription"></i>
                  New Prescription
                </button>
                <button className="action-btn">
                  <i className="fas fa-flask"></i>
                  Order Lab Tests
                </button>
                <button className="action-btn">
                  <i className="fas fa-x-ray"></i>
                  Order Imaging
                </button>
              </div>
            )}
          </div>

          {/* Recording consent */}
          <div className="recording-consent">
            <h5>Recording Consent</h5>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={recordingConsent.doctor}
                onChange={(e) => setRecordingConsent(prev => ({ ...prev, doctor: e.target.checked }))}
              />
              <span>Doctor consents to recording</span>
            </label>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                checked={recordingConsent.patient}
                onChange={(e) => setRecordingConsent(prev => ({ ...prev, patient: e.target.checked }))}
              />
              <span>Patient consents to recording</span>
            </label>
            {recordingConsent.doctor && recordingConsent.patient && !isRecording && (
              <button className="start-recording-btn" onClick={startRecording}>
                <i className="fas fa-circle"></i>
                Start Recording
              </button>
            )}
            {isRecording && (
              <button className="stop-recording-btn" onClick={stopRecording}>
                <i className="fas fa-stop"></i>
                Stop Recording
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export for testing
export { calculateConnectionQuality };

export default TelemedicineConsultation;
