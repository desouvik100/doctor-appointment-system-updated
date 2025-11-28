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

// Get city and country from coordinates using reverse geocoding
export const getCityFromCoordinates = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HealthSync-App'
        }
      }
    );
    
    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
      country: data.address?.country || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting city from coordinates:', error);
    return {
      city: null,
      country: null
    };
  }
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

// Complete flow: Request permission, get coordinates, reverse geocode, and save
export const trackUserLocation = async (userId) => {
  try {
    // Request location permission
    const coords = await requestLocationPermission();
    
    // Get city and country
    const { city, country } = await getCityFromCoordinates(
      coords.latitude,
      coords.longitude
    );
    
    // Update in database
    const result = await updateUserLocation(userId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      city,
      country
    });
    
    return {
      success: true,
      location: result.location
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
