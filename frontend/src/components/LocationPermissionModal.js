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
    <div >
      <div >
        <div >
          <i ></i>
        </div>
        
        <h3 >Enable Location Services</h3>
        
        <p >
          HealthSync would like to access your location to help you find nearby doctors and clinics.
        </p>
        
        <div >
          <div >
            <i ></i>
            <span>Find doctors near you</span>
          </div>
          <div >
            <i ></i>
            <span>Get accurate distance estimates</span>
          </div>
          <div >
            <i ></i>
            <span>Personalized recommendations</span>
          </div>
        </div>
        
        <div >
          <button 
             
            onClick={handleAllow}
            disabled={loading}
          >
            {loading ? (
              <>
                <i ></i>
                Getting Location...
              </>
            ) : (
              <>
                <i ></i>
                Allow Location
              </>
            )}
          </button>
          
          <button 
             
            onClick={onDeny}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
        
        <p >
          <i ></i>
          Your location data is secure and private
        </p>
      </div>
    </div>
  );
};

export default LocationPermissionModal;

