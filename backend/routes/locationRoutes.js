const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update user location
router.post('/update-location', async (req, res) => {
  try {
    const { userId, latitude, longitude, address, city, state, country, pincode } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'User ID, latitude, and longitude are required' 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update location with full address details
    user.loginLocation = {
      latitude,
      longitude,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      pincode: pincode || null,
      lastUpdated: new Date()
    };
    
    // Mark location as captured
    user.locationCaptured = true;

    await user.save();

    res.json({ 
      success: true,
      message: 'Location updated successfully',
      location: user.loginLocation,
      locationCaptured: true
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating location', 
      error: error.message 
    });
  }
});

// Get user location
router.get('/get-location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('loginLocation locationCaptured');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      location: user.loginLocation || null,
      locationCaptured: user.locationCaptured || false
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      message: 'Error fetching location', 
      error: error.message 
    });
  }
});

// Check if user needs location setup (first-time login)
router.get('/check-location-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('locationCaptured loginLocation');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      needsLocationSetup: !user.locationCaptured,
      locationCaptured: user.locationCaptured || false,
      hasLocation: !!(user.loginLocation?.latitude && user.loginLocation?.longitude)
    });
  } catch (error) {
    console.error('Error checking location status:', error);
    res.status(500).json({ 
      message: 'Error checking location status', 
      error: error.message 
    });
  }
});

// Get nearby doctors based on user location
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get nearby doctors
router.get('/nearby-doctors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxDistance = 50, specialization } = req.query; // Default 50km radius

    console.log('📍 Nearby doctors request:', { userId, maxDistance, specialization });

    const user = await User.findById(userId).select('loginLocation');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(400).json({ 
        message: 'User not found. Please login again.' 
      });
    }
    
    if (!user.loginLocation?.latitude) {
      console.log('❌ User has no location:', user.loginLocation);
      return res.status(400).json({ 
        message: 'User location not available. Please update your location first.' 
      });
    }

    const userLat = user.loginLocation.latitude;
    const userLng = user.loginLocation.longitude;
    console.log('📍 User location:', { userLat, userLng });

    // Get all clinics with coordinates (removed isActive filter for debugging)
    const clinics = await Clinic.find({ 
      latitude: { $exists: true, $ne: null, $ne: 0 },
      longitude: { $exists: true, $ne: null, $ne: 0 }
    });
    
    console.log('🏥 Found clinics with coordinates:', clinics.length);

    // Calculate distance for each clinic
    const nearbyClinics = clinics
      .map(clinic => ({
        ...clinic.toObject(),
        distance: calculateDistance(userLat, userLng, clinic.latitude, clinic.longitude)
      }))
      .filter(clinic => clinic.distance <= parseFloat(maxDistance))
      .sort((a, b) => a.distance - b.distance);

    console.log('🏥 Nearby clinics within', maxDistance, 'km:', nearbyClinics.length);

    const nearbyClinicIds = nearbyClinics.map(c => c._id);

    // Get doctors from nearby clinics (removed isActive filter for debugging)
    const doctorQuery = { 
      clinicId: { $in: nearbyClinicIds }
    };
    
    console.log('🔍 Doctor query:', JSON.stringify(doctorQuery));
    
    if (specialization) {
      doctorQuery.specialization = specialization;
    }

    const doctors = await Doctor.find(doctorQuery)
      .populate('clinicId', 'name address city latitude longitude');

    // Add distance to each doctor
    const doctorsWithDistance = doctors.map(doctor => {
      const clinic = nearbyClinics.find(c => c._id.toString() === doctor.clinicId?._id?.toString());
      return {
        ...doctor.toObject(),
        distance: clinic ? clinic.distance : null,
        distanceText: clinic ? `${clinic.distance.toFixed(1)} km away` : 'Distance unknown'
      };
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));

    res.json({
      userLocation: {
        city: user.loginLocation.city,
        state: user.loginLocation.state
      },
      totalFound: doctorsWithDistance.length,
      maxDistance: parseFloat(maxDistance),
      doctors: doctorsWithDistance
    });
  } catch (error) {
    console.error('Error fetching nearby doctors:', error);
    res.status(500).json({ message: 'Error fetching nearby doctors', error: error.message });
  }
});

// Get nearby clinics
router.get('/nearby-clinics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxDistance = 50 } = req.query;

    const user = await User.findById(userId).select('loginLocation');
    
    if (!user || !user.loginLocation?.latitude) {
      return res.status(400).json({ 
        message: 'User location not available. Please update your location first.' 
      });
    }

    const userLat = user.loginLocation.latitude;
    const userLng = user.loginLocation.longitude;

    const clinics = await Clinic.find({ 
      isActive: true,
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });

    const nearbyClinics = clinics
      .map(clinic => ({
        ...clinic.toObject(),
        distance: calculateDistance(userLat, userLng, clinic.latitude, clinic.longitude),
        distanceText: `${calculateDistance(userLat, userLng, clinic.latitude, clinic.longitude).toFixed(1)} km away`
      }))
      .filter(clinic => clinic.distance <= parseFloat(maxDistance))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      userLocation: {
        city: user.loginLocation.city,
        state: user.loginLocation.state
      },
      totalFound: nearbyClinics.length,
      maxDistance: parseFloat(maxDistance),
      clinics: nearbyClinics
    });
  } catch (error) {
    console.error('Error fetching nearby clinics:', error);
    res.status(500).json({ message: 'Error fetching nearby clinics', error: error.message });
  }
});

module.exports = router;
