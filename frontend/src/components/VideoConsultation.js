import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import './VideoConsultation.css';

const VideoConsultation = ({ appointmentId, user, userType, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const startTimeRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeConsultation();
    return () => {
      cleanup();
    };
  }, []);

  const initializeConsultation = async () => {
    try {
      // Get user media
      const stream = await getUserMedia();
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to socket
      const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5005', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('join-consultation', {
          appointmentId,
          userId: user.id,
          userType
        });
      });

      socket.on('existing-participants', (participants) => {
        console.log('Existing participants:', participants);
        participants.forEach(participant => {
          createPeerConnection(participant.socketId, true, stream);
        });
      });

      socket.on('user-joined', ({ socketId }) => {
        console.log('User joined:', socketId);
        setConnectionStatus('Peer connected');
        createPeerConnection(socketId, false, stream);
      });

      socket.on('offer', async ({ offer, from }) => {
        console.log('Received offer from:', from);
        await handleOffer(offer, from, stream);
      });

      socket.on('answer', async ({ answer, from }) => {
        console.log('Received answer from:', from);
        await handleAnswer(answer);
      });

      socket.on('ice-candidate', async ({ candidate, from }) => {
        console.log('Received ICE candidate from:', from);
        await handleIceCandidate(candidate);
      });

      socket.on('user-left', () => {
        console.log('User left');
        setConnectionStatus('Peer disconnected');
        setIsConnected(false);
        toast.error('The other participant has left the consultation');
      });

      socket.on('peer-audio-toggle', ({ enabled }) => {
        console.log('Peer audio toggled:', enabled);
      });

      socket.on('peer-video-toggle', ({ enabled }) => {
        console.log('Peer video toggled:', enabled);
      });

      setConsultationStarted(true);
      startTimeRef.current = new Date();
      toast.success('Consultation started!', { icon: '🎥' });

    } catch (error) {
      console.error('Error initializing consultation:', error);
      handleMediaError(error);
    }
  };

  const getUserMedia = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      // Fallback to audio only
      console.warn('Video not available, falling back to audio only:', error);
      setAudioOnly(true);
      toast('Video unavailable. Using audio-only mode.', { icon: '🎤' });
      
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (audioError) {
        throw new Error('Unable to access microphone or camera');
      }
    }
  };

  const handleMediaError = (error) => {
    if (error.name === 'NotAllowedError') {
      toast.error('Camera/microphone access denied. Please allow permissions.');
    } else if (error.name === 'NotFoundError') {
      toast.error('No camera or microphone found.');
    } else {
      toast.error('Failed to access media devices: ' + error.message);
    }
    setTimeout(() => onClose(), 3000);
  };

  const createPeerConnection = (socketId, isInitiator, stream) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
      setConnectionStatus('Connected');
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          appointmentId,
          candidate: event.candidate,
          to: socketId
        });
      }
    };

    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true);
        setConnectionStatus('Connected');
      } else if (peerConnection.connectionState === 'disconnected') {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      }
    };

    // Create offer if initiator
    if (isInitiator) {
      createOffer(socketId, peerConnection);
    }
  };

  const createOffer = async (socketId, peerConnection) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', {
        appointmentId,
        offer,
        to: socketId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer, from, stream) => {
    try {
      if (!peerConnectionRef.current) {
        createPeerConnection(from, false, stream);
      }
      
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        appointmentId,
        answer,
        to: from
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socketRef.current.emit('toggle-audio', {
          appointmentId,
          enabled: audioTrack.enabled
        });
        toast(audioTrack.enabled ? 'Microphone on' : 'Microphone off', {
          icon: audioTrack.enabled ? '🎤' : '🔇'
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socketRef.current.emit('toggle-video', {
          appointmentId,
          enabled: videoTrack.enabled
        });
        toast(videoTrack.enabled ? 'Camera on' : 'Camera off', {
          icon: videoTrack.enabled ? '📹' : '📷'
        });
      }
    }
  };

  const endConsultation = async () => {
    try {
      const duration = startTimeRef.current 
        ? Math.floor((new Date() - startTimeRef.current) / 1000)
        : 0;

      // Notify backend
      await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5005'}/api/consultations/${appointmentId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      toast.success(`Consultation completed! Duration: ${formatDuration(duration)}`, {
        icon: '✅',
        duration: 5000
      });

      cleanup();
      onClose();
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast.error('Failed to end consultation properly');
      cleanup();
      onClose();
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-consultation', { appointmentId });
      socketRef.current.disconnect();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="video-consultation-container">
      <div className="video-consultation-header">
        <div className="header-info">
          <h3>
            <i className="fas fa-video me-2"></i>
            Video Consultation
          </h3>
          <span className={`status-badge ${isConnected ? 'connected' : 'connecting'}`}>
            <i className={`fas fa-circle me-1 ${isConnected ? 'pulse' : ''}`}></i>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div className="video-grid">
        {/* Remote Video (Doctor/Patient) */}
        <div className="video-container remote-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-element"
          />
          {!isConnected && (
            <div className="video-placeholder">
              <i className="fas fa-user-circle fa-5x"></i>
              <p>Waiting for other participant...</p>
            </div>
          )}
          <div className="video-label">
            {userType === 'patient' ? 'Doctor' : 'Patient'}
          </div>
        </div>

        {/* Local Video (You) */}
        <div className="video-container local-video">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
          />
          {!isVideoEnabled && (
            <div className="video-off-overlay">
              <i className="fas fa-video-slash fa-3x"></i>
            </div>
          )}
          <div className="video-label">You</div>
        </div>
      </div>

      {audioOnly && (
        <div className="audio-only-banner">
          <i className="fas fa-info-circle me-2"></i>
          Audio-only mode active
        </div>
      )}

      <div className="video-controls">
        <button
          className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <i className={`fas ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
        </button>

        <button
          className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          disabled={audioOnly}
        >
          <i className={`fas ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
        </button>

        <button
          className="control-btn end-call"
          onClick={endConsultation}
          title="End consultation"
        >
          <i className="fas fa-phone-slash"></i>
        </button>
      </div>
    </div>
  );
};

export default VideoConsultation;
