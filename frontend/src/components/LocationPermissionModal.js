import React, { useState } from 'react';
import './LocationPermissionModal.css';

const LocationPermissionModal = ({ show, onAllow, onDeny, onClose }) => {
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleAllow = async () => {
    setLoading(true);
    await onAllow();
    setLoading(false);
  };

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-content">
        <div className="location-modal-icon">
          <i className="fas fa-map-marker-alt"></i>
        </div>
        
        <h3 className="location-modal-title">Enable Location Services</h3>
        
        <p className="location-modal-desc">
          HealthSync would like to access your location to help you find nearby doctors and clinics.
        </p>
        
        <div className="location-modal-benefits">
          <div className="location-benefit-item">
            <i className="fas fa-hospital"></i>
            <span>Find doctors near you</span>
          </div>
          <div className="location-benefit-item">
            <i className="fas fa-route"></i>
            <span>Get accurate distance estimates</span>
          </div>
          <div className="location-benefit-item">
            <i className="fas fa-star"></i>
            <span>Personalized recommendations</span>
          </div>
        </div>
        
        <div className="location-modal-actions">
          <button 
            className="location-btn-allow"
            onClick={handleAllow}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Getting Location...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Allow Location
              </>
            )}
          </button>
          
          <button 
            className="location-btn-deny"
            onClick={onDeny}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
        
        <p className="location-modal-privacy">
          <i className="fas fa-shield-alt"></i>
          Your location data is secure and private
        </p>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
