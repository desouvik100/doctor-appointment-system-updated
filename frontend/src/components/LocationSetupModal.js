import React, { useState } from 'react';
import { trackUserLocation, saveManualLocation, getAddressFromCoordinates } from '../utils/locationService';
import toast from 'react-hot-toast';
import './LocationSetupModal.css';

const LocationSetupModal = ({ userId, onComplete, userName, onBackToHome }) => {
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [manualForm, setManualForm] = useState({
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
  });
  const [step, setStep] = useState('initial'); // initial, detecting, detected, manual

  // Handle GPS location detection
  const handleDetectLocation = async () => {
    setLoading(true);
    setStep('detecting');
    
    try {
      const result = await trackUserLocation(userId);
      
      if (result.success) {
        setDetectedLocation(result.location);
        setStep('detected');
        toast.success('Location detected successfully!');
      } else {
        toast.error(result.error || 'Failed to detect location');
        setStep('initial');
        setShowManualEntry(true);
      }
    } catch (error) {
      console.error('Location detection error:', error);
      toast.error('Unable to detect location. Please enter manually.');
      setStep('initial');
      setShowManualEntry(true);
    } finally {
      setLoading(false);
    }
  };

  // Confirm detected location
  const handleConfirmLocation = () => {
    toast.success('Location saved successfully!');
    onComplete(detectedLocation);
  };

  // Handle manual form change
  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit manual location
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualForm.city || !manualForm.state || !manualForm.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await saveManualLocation(userId, manualForm);
      
      if (result.success) {
        toast.success('Location saved successfully!');
        onComplete(result.location);
      } else {
        toast.error(result.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Manual location save error:', error);
      toast.error('Failed to save location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-setup-overlay">
      <div className="location-setup-modal">
        {/* Back to Home Button */}
        {onBackToHome && (
          <button 
            className="location-setup-back-btn"
            onClick={onBackToHome}
            type="button"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
        )}

        {/* Header */}
        <div className="location-setup-header">
          <div className="location-setup-icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h2>Set Your Location</h2>
          <p>
            {userName ? `Welcome, ${userName}! ` : ''}
            We need your location to show you nearby clinics and doctors.
          </p>
        </div>

        {/* Initial Step */}
        {step === 'initial' && !showManualEntry && (
          <div className="location-setup-content">
            <div className="location-setup-info">
              <div className="info-item">
                <i className="fas fa-hospital"></i>
                <span>Find clinics near you</span>
              </div>
              <div className="info-item">
                <i className="fas fa-route"></i>
                <span>Get accurate distance estimates</span>
              </div>
              <div className="info-item">
                <i className="fas fa-user-md"></i>
                <span>Connect with local doctors</span>
              </div>
            </div>

            <button 
              className="location-setup-btn primary"
              onClick={handleDetectLocation}
              disabled={loading}
            >
              <i className="fas fa-crosshairs"></i>
              Detect My Location (GPS)
            </button>

            <button 
              className="location-setup-btn secondary"
              onClick={() => setShowManualEntry(true)}
              disabled={loading}
            >
              <i className="fas fa-keyboard"></i>
              Enter Location Manually
            </button>

            <p className="location-setup-privacy">
              <i className="fas fa-shield-alt"></i>
              Your location is secure and only used to find nearby healthcare services
            </p>
          </div>
        )}

        {/* Detecting Step */}
        {step === 'detecting' && (
          <div className="location-setup-content detecting">
            <div className="detecting-animation">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
              <i className="fas fa-satellite-dish"></i>
            </div>
            <p>Detecting your location...</p>
            <span className="detecting-hint">Please allow location access when prompted</span>
          </div>
        )}

        {/* Detected Step */}
        {step === 'detected' && detectedLocation && (
          <div className="location-setup-content">
            <div className="detected-location">
              <div className="detected-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Location Detected!</h3>
              
              <div className="location-details">
                {detectedLocation.address && (
                  <div className="detail-row">
                    <i className="fas fa-map-pin"></i>
                    <span>{detectedLocation.address}</span>
                  </div>
                )}
                <div className="detail-row">
                  <i className="fas fa-city"></i>
                  <span>{detectedLocation.city}, {detectedLocation.state}</span>
                </div>
                <div className="detail-row">
                  <i className="fas fa-globe"></i>
                  <span>{detectedLocation.country} {detectedLocation.pincode && `- ${detectedLocation.pincode}`}</span>
                </div>
              </div>
            </div>

            <button 
              className="location-setup-btn primary"
              onClick={handleConfirmLocation}
            >
              <i className="fas fa-check"></i>
              Confirm This Location
            </button>

            <button 
              className="location-setup-btn secondary"
              onClick={() => {
                setStep('initial');
                setShowManualEntry(true);
              }}
            >
              <i className="fas fa-edit"></i>
              Enter Different Location
            </button>
          </div>
        )}

        {/* Manual Entry */}
        {showManualEntry && step === 'initial' && (
          <div className="location-setup-content">
            <form onSubmit={handleManualSubmit} className="manual-location-form">
              <div className="form-group">
                <label>
                  <i className="fas fa-home"></i>
                  Address / Locality
                </label>
                <input
                  type="text"
                  name="address"
                  value={manualForm.address}
                  onChange={handleManualChange}
                  placeholder="Enter your street address or locality"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-city"></i>
                    City <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={manualForm.city}
                    onChange={handleManualChange}
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-map"></i>
                    State <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={manualForm.state}
                    onChange={handleManualChange}
                    placeholder="Enter state"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-globe"></i>
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={manualForm.country}
                    onChange={handleManualChange}
                    placeholder="Enter country"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-mail-bulk"></i>
                    Pincode <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={manualForm.pincode}
                    onChange={handleManualChange}
                    placeholder="Enter pincode"
                    required
                    maxLength="10"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="location-setup-btn primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Location
                  </>
                )}
              </button>

              <button 
                type="button"
                className="location-setup-btn secondary"
                onClick={() => setShowManualEntry(false)}
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i>
                Back to GPS Detection
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSetupModal;
