import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../api/config';
import toast from 'react-hot-toast';
import './EmergencySOS.css';

const EmergencySOS = ({ user, onClose }) => {
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [emergencyType, setEmergencyType] = useState('medical');

  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: 'fa-heartbeat', color: '#ef4444' },
    { id: 'cardiac', label: 'Cardiac/Heart', icon: 'fa-heart', color: '#dc2626' },
    { id: 'breathing', label: 'Breathing Problem', icon: 'fa-lungs', color: '#f97316' },
    { id: 'accident', label: 'Accident', icon: 'fa-car-crash', color: '#eab308' },
    { id: 'unconscious', label: 'Unconscious', icon: 'fa-bed', color: '#8b5cf6' },
    { id: 'other', label: 'Other Emergency', icon: 'fa-exclamation-triangle', color: '#64748b' }
  ];

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          setLocationError('Unable to get location. Please enable GPS.');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError('Geolocation not supported');
    }
  }, []);

  // Check for active SOS
  const checkActiveSOS = useCallback(async () => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/emergency-sos/active`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveSOS(data);
      }
    } catch (error) {
      console.error('Error checking active SOS:', error);
    }
  }, []);

  useEffect(() => {
    checkActiveSOS();
    
    // Poll for updates if there's an active SOS
    const interval = setInterval(() => {
      if (activeSOS) {
        checkActiveSOS();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [checkActiveSOS, activeSOS]);

  // Trigger SOS with countdown
  const startSOSCountdown = () => {
    if (!location) {
      toast.error('Location required for SOS. Please enable GPS.');
      return;
    }
    
    setCountdown(5);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const triggerSOS = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      // Get address from coordinates (reverse geocoding)
      let address = '';
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`
        );
        const geoData = await geoResponse.json();
        address = geoData.display_name;
      } catch (e) {
        address = `${location.latitude}, ${location.longitude}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emergency-sos/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: emergencyType,
          latitude: location.latitude,
          longitude: location.longitude,
          address,
          accuracy: location.accuracy
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveSOS(data);
        toast.success('SOS triggered! Help is on the way.');
        
        // Start location tracking
        startLocationTracking(data.sosId);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to trigger SOS');
      }
    } catch (error) {
      toast.error('Failed to trigger SOS. Please call emergency services directly.');
      console.error('SOS error:', error);
    } finally {
      setLoading(false);
      setCountdown(null);
    }
  };

  // Track location continuously
  const startLocationTracking = (sosId) => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const token = localStorage.getItem('user');
          const parsed = JSON.parse(token);
          
          await fetch(`${API_BASE_URL}/api/emergency-sos/${sosId}/location`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${parsed.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
        } catch (e) {
          console.error('Location update error:', e);
        }
      },
      null,
      { enableHighAccuracy: true }
    );
    
    // Store watch ID to clear later
    window.sosWatchId = watchId;
  };

  const cancelSOS = async () => {
    if (!activeSOS) return;
    
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/emergency-sos/${activeSOS.sosId || activeSOS._id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by user' })
      });
      
      if (response.ok) {
        setActiveSOS(null);
        toast.success('SOS cancelled');
        
        // Stop location tracking
        if (window.sosWatchId) {
          navigator.geolocation.clearWatch(window.sosWatchId);
        }
      }
    } catch (error) {
      toast.error('Failed to cancel SOS');
    }
  };

  // Render active SOS status
  if (activeSOS && activeSOS.status !== 'resolved' && activeSOS.status !== 'cancelled') {
    return (
      <div className="emergency-sos active-sos">
        <div className="sos-header">
          <div className="sos-pulse"></div>
          <h2>Emergency Active</h2>
        </div>

        <div className="sos-status-card">
          <div className="status-badge" data-status={activeSOS.status}>
            {activeSOS.status?.replace('_', ' ').toUpperCase()}
          </div>
          
          {activeSOS.ambulance?.vehicleNumber && (
            <div className="ambulance-info">
              <h3>🚑 Ambulance Details</h3>
              <div className="info-row">
                <span>Vehicle:</span>
                <strong>{activeSOS.ambulance.vehicleNumber}</strong>
              </div>
              <div className="info-row">
                <span>Driver:</span>
                <strong>{activeSOS.ambulance.driverName}</strong>
              </div>
              <div className="info-row">
                <span>Phone:</span>
                <a href={`tel:${activeSOS.ambulance.driverPhone}`}>
                  {activeSOS.ambulance.driverPhone}
                </a>
              </div>
              {activeSOS.ambulance.eta && (
                <div className="eta-badge">
                  ETA: {activeSOS.ambulance.eta} minutes
                </div>
              )}
            </div>
          )}

          <div className="timeline">
            <h4>Timeline</h4>
            {activeSOS.timeline?.map((event, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="event-name">{event.event?.replace('_', ' ')}</span>
                  <span className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="sos-actions">
            <a href="tel:102" className="call-btn">
              <i className="fas fa-phone"></i> Call 102
            </a>
            <button className="cancel-sos-btn" onClick={cancelSOS}>
              Cancel SOS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render SOS trigger screen
  return (
    <div className="emergency-sos">
      <div className="sos-header">
        <i className="fas fa-ambulance"></i>
        <h2>Emergency SOS</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <p className="sos-description">
        Press the SOS button to alert emergency services and your emergency contacts.
        Your location will be shared automatically.
      </p>

      {locationError && (
        <div className="location-error">
          <i className="fas fa-exclamation-triangle"></i>
          {locationError}
        </div>
      )}

      {location && (
        <div className="location-ready">
          <i className="fas fa-map-marker-alt"></i>
          Location ready (accuracy: {Math.round(location.accuracy)}m)
        </div>
      )}

      <div className="emergency-types">
        <h3>Select Emergency Type</h3>
        <div className="type-grid">
          {emergencyTypes.map(type => (
            <button
              key={type.id}
              className={`type-btn ${emergencyType === type.id ? 'selected' : ''}`}
              onClick={() => setEmergencyType(type.id)}
              style={{ '--type-color': type.color }}
            >
              <i className={`fas ${type.icon}`}></i>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {countdown !== null ? (
        <div className="countdown-overlay">
          <div className="countdown-content">
            <div className="countdown-number">{countdown}</div>
            <p>SOS will be triggered in {countdown} seconds</p>
            <button className="cancel-countdown-btn" onClick={cancelCountdown}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="sos-trigger-btn"
          onClick={startSOSCountdown}
          disabled={loading || !location}
        >
          {loading ? (
            <span className="loading">Triggering SOS...</span>
          ) : (
            <>
              <span className="sos-text">SOS</span>
              <span className="sos-subtext">Press & Hold</span>
            </>
          )}
        </button>
      )}

      <div className="emergency-numbers">
        <h4>Emergency Numbers</h4>
        <div className="numbers-grid">
          <a href="tel:102" className="number-btn ambulance">
            <i className="fas fa-ambulance"></i>
            <span>102</span>
            <small>Ambulance</small>
          </a>
          <a href="tel:100" className="number-btn police">
            <i className="fas fa-shield-alt"></i>
            <span>100</span>
            <small>Police</small>
          </a>
          <a href="tel:101" className="number-btn fire">
            <i className="fas fa-fire-extinguisher"></i>
            <span>101</span>
            <small>Fire</small>
          </a>
          <a href="tel:112" className="number-btn universal">
            <i className="fas fa-phone-alt"></i>
            <span>112</span>
            <small>Universal</small>
          </a>
        </div>
      </div>

      <div className="sos-note">
        <i className="fas fa-info-circle"></i>
        <p>
          Your emergency contacts will be notified with your live location.
          Make sure your emergency contact is set in your profile.
        </p>
      </div>
    </div>
  );
};

export default EmergencySOS;
