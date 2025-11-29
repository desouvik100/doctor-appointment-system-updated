import axios from '../api/config';

// Request location permission and get coordinates
export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Get full address details from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HealthSync-App'
        }
      }
    );
    
    const data = await response.json();
    const addr = data.address || {};
    
    return {
      address: data.display_name || null,
      city: addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Unknown',
      state: addr.state || addr.region || null,
      country: addr.country || 'Unknown',
      pincode: addr.postcode || null,
      locality: addr.suburb || addr.neighbourhood || addr.locality || null
    };
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return {
      address: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      locality: null
    };
  }
};

// Legacy function for backward compatibility
export const getCityFromCoordinates = async (latitude, longitude) => {
  const result = await getAddressFromCoordinates(latitude, longitude);
  return {
    city: result.city,
    country: result.country
  };
};

// Update user location in database
export const updateUserLocation = async (userId, locationData) => {
  try {
    const response = await axios.post('/api/location/update-location', {
      userId,
      ...locationData
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
};

// Get user location from database
export const getUserLocation = async (userId) => {
  try {
    const response = await axios.get(`/api/location/get-location/${userId}`);
    return response.data.location;
  } catch (error) {
    console.error('Error fetching user location:', error);
    throw error;
  }
};

// Check if user needs location setup
export const checkLocationStatus = async (userId) => {
  try {
    const response = await axios.get(`/api/location/check-location-status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking location status:', error);
    return { needsLocationSetup: true, locationCaptured: false };
  }
};

// Complete flow: Request permission, get coordinates, reverse geocode, and save
export const trackUserLocation = async (userId) => {
  try {
    // Request location permission
    const coords = await requestLocationPermission();
    
    // Get full address details
    const addressData = await getAddressFromCoordinates(
      coords.latitude,
      coords.longitude
    );
    
    // Update in database with full details
    const result = await updateUserLocation(userId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      country: addressData.country,
      pincode: addressData.pincode
    });
    
    return {
      success: true,
      location: result.location,
      locationCaptured: result.locationCaptured
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Save manual location entry
export const saveManualLocation = async (userId, manualData) => {
  try {
    const result = await updateUserLocation(userId, {
      latitude: manualData.latitude || 0,
      longitude: manualData.longitude || 0,
      address: manualData.address,
      city: manualData.city,
      state: manualData.state,
      country: manualData.country,
      pincode: manualData.pincode
    });
    
    return {
      success: true,
      location: result.location,
      locationCaptured: result.locationCaptured
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
