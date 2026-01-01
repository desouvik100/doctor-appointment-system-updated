import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Location-Based Check-In Component
 * Verifies staff is at clinic location before allowing check-in
 */
const LocationCheckIn = ({ 
  clinicLocation, // { lat, lng, name, radius } - clinic coordinates and allowed radius in meters
  onCheckIn, 
  onCheckOut, 
  isCheckedIn,
  staffName 
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Default clinic location if not provided (can be configured per clinic)
  const defaultClinicLocation = {
    lat: 22.5726, // Default: Kolkata
    lng: 88.3639,
    name: 'Clinic',
    radius: 100 // 100 meters allowed radius
  };

  const clinic = clinicLocation || defaultClinicLocation;

  useEffect(() => {
    return () => {
      // Cleanup location watch on unmount
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Get current location
  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        
        // Calculate distance from clinic
        const dist = calculateDistance(latitude, longitude, clinic.lat, clinic.lng);
        setDistance(dist);
        setIsWithinRange(dist <= clinic.radius);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Start watching location
  const startWatchingLocation = () => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        const dist = calculateDistance(latitude, longitude, clinic.lat, clinic.lng);
        setDistance(dist);
        setIsWithinRange(dist <= clinic.radius);
      },
      (error) => console.error('Watch error:', error),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    setWatchId(id);
  };

  // Handle check-in with location
  const handleLocationCheckIn = async () => {
    if (!currentLocation) {
      toast.error('Please get your location first');
      return;
    }

    if (!isWithinRange) {
      toast.error(`You must be within ${clinic.radius}m of ${clinic.name} to check in`);
      return;
    }

    onCheckIn && onCheckIn('gps', {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      accuracy: currentLocation.accuracy,
      distance: distance
    });
  };

  // Handle check-out with location
  const handleLocationCheckOut = async () => {
    onCheckOut && onCheckOut('gps', currentLocation ? {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      accuracy: currentLocation.accuracy,
      distance: distance
    } : null);
  };

  // Format distance for display
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <i className="fas fa-map-marker-alt text-white text-xl"></i>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Location Check-In</h3>
            <p className="text-xs text-slate-500">Verify you're at {clinic.name}</p>
          </div>
        </div>
        {isWithinRange && currentLocation && (
          <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
            <i className="fas fa-check mr-1"></i>At Location
          </span>
        )}
      </div>

      {/* Location Status */}
      <div className="bg-white rounded-lg p-3 mb-4">
        {locationError ? (
          <div className="flex items-center gap-2 text-red-600">
            <i className="fas fa-exclamation-circle"></i>
            <span className="text-sm">{locationError}</span>
          </div>
        ) : currentLocation ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Your Location:</span>
              <span className="text-xs text-slate-400">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Distance from {clinic.name}:</span>
              <span className={`text-sm font-medium ${isWithinRange ? 'text-green-600' : 'text-red-600'}`}>
                {formatDistance(distance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Accuracy:</span>
              <span className="text-sm text-slate-600">±{Math.round(currentLocation.accuracy)}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Status:</span>
              {isWithinRange ? (
                <span className="text-sm text-green-600 font-medium">
                  <i className="fas fa-check-circle mr-1"></i>Within allowed range
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">
                  <i className="fas fa-times-circle mr-1"></i>Outside allowed range ({clinic.radius}m)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <i className="fas fa-location-arrow text-2xl text-slate-300 mb-2"></i>
            <p className="text-sm text-slate-500">Click "Get Location" to verify your position</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Getting Location...
            </>
          ) : (
            <>
              <i className="fas fa-crosshairs"></i>
              {currentLocation ? 'Refresh Location' : 'Get Location'}
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleLocationCheckIn}
            disabled={!currentLocation || !isWithinRange || isCheckedIn}
            className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
              !currentLocation || !isWithinRange || isCheckedIn
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            <i className="fas fa-sign-in-alt"></i>
            Check In
          </button>
          <button
            onClick={handleLocationCheckOut}
            disabled={!isCheckedIn}
            className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
              !isCheckedIn
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <i className="fas fa-sign-out-alt"></i>
            Check Out
          </button>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-xs text-slate-400 mt-3 text-center">
        <i className="fas fa-info-circle mr-1"></i>
        You must be within {clinic.radius}m of {clinic.name} to check in
      </p>
    </div>
  );
};

export default LocationCheckIn;
