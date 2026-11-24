import axios from '../api/config';

// Request high-accuracy location with multiple attempts
export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // High accuracy options for precise GPS location
    const highAccuracyOptions = {
      enableHighAccuracy: true, // Use GPS for most accurate location
      timeout: 15000, // Wait up to 15 seconds
      maximumAge: 0 // Don't use cached location
    };

    // Try to get high accuracy location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Location accuracy:', position.coords.accuracy, 'meters');
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
      },
      (error) => {
        // If high accuracy fails, try with lower accuracy as fallback
        console.warn('High accuracy location failed, trying fallback...');
        
        const fallbackOptions = {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000 // Allow 1 minute old cached location
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Fallback location accuracy:', position.coords.accuracy, 'meters');
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            });
          },
          (fallbackError) => {
            let errorMessage = 'Unable to retrieve location';
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                break;
              case fallbackError.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your GPS/location settings.';
                break;
              case fallbackError.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while getting location';
            }
            reject(new Error(errorMessage));
          },
          fallbackOptions
        );
      },
      highAccuracyOptions
    );
  });
};

// Watch position for continuous updates (more accurate over time)
export const watchLocationUpdates = (onUpdate, onError) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      onError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );

  return watchId;
};

// Stop watching location
export const stopWatchingLocation = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Get full address details from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Try BigDataCloud API first (more accurate for India)
    try {
      const bdcResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const bdcData = await bdcResponse.json();
      
      if (bdcData && bdcData.city) {
        console.log('📍 Using BigDataCloud geocoding:', bdcData);
        return {
          address: bdcData.locality || bdcData.city || null,
          city: bdcData.city || bdcData.locality || 'Unknown',
          state: bdcData.principalSubdivision || null,
          country: bdcData.countryName || 'Unknown',
          pincode: bdcData.postcode || null,
          locality: bdcData.locality || bdcData.neighbourhood || null
        };
      }
    } catch (bdcError) {
      console.warn('BigDataCloud API failed, trying Nominatim...', bdcError);
    }

    // Fallback to OpenStreetMap Nominatim API
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
    
    console.log('📍 Using Nominatim geocoding:', addr);
    
    return {
      address: data.display_name || null,
      city: addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || 'Unknown',
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
    // Request location permission with high accuracy
    const coords = await requestLocationPermission();
    
    console.log('📍 GPS Coordinates:', {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy + ' meters'
    });
    
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
      location: {
        ...result.location,
        accuracy: coords.accuracy // Include accuracy in response
      },
      locationCaptured: result.locationCaptured,
      coordinates: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      }
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
