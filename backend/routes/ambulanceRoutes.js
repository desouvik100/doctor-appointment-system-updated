const express = require('express');
const router = express.Router();
const AmbulanceBooking = require('../models/AmbulanceBooking');

// Book ambulance
router.post('/book', async (req, res) => {
  try {
    const {
      userId, patientName, patientPhone, emergencyType,
      pickupLocation, destinationHospital, ambulanceType, notes
    } = req.body;

    const booking = new AmbulanceBooking({
      userId,
      patientName,
      patientPhone,
      emergencyType,
      pickupLocation,
      destinationHospital,
      ambulanceType: ambulanceType || 'Basic',
      notes,
      estimatedArrival: new Date(Date.now() + 15 * 60000) // 15 mins ETA
    });

    await booking.save();

    // Simulate dispatch (in production, integrate with ambulance service)
    setTimeout(async () => {
      await AmbulanceBooking.findByIdAndUpdate(booking._id, {
        status: 'Dispatched',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 98765 43210',
        vehicleNumber: 'WB-01-AB-1234'
      });
    }, 3000);

    res.status(201).json({
      success: true,
      message: 'Ambulance booked successfully! Help is on the way.',
      booking,
      emergencyNumbers: {
        ambulance: '102',
        nationalEmergency: '112',
        police: '100',
        fire: '101'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's ambulance bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await AmbulanceBooking.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get booking status
router.get('/status/:bookingId', async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel booking
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await AmbulanceBooking.findByIdAndUpdate(
      req.params.bookingId,
      { status: 'Cancelled' },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get nearby hospitals (mock data)
router.get('/nearby-hospitals', async (req, res) => {
  const { lat, lng } = req.query;
  
  // Mock nearby hospitals - in production, use Google Places API
  const hospitals = [
    { name: 'Bankura Sammilani Medical College', distance: '2.5 km', phone: '03242-255555', emergency: true },
    { name: 'District Hospital Bankura', distance: '3.1 km', phone: '03242-252222', emergency: true },
    { name: 'Bankura Christian Hospital', distance: '4.2 km', phone: '03242-253333', emergency: true },
    { name: 'Apollo Clinic', distance: '5.0 km', phone: '03242-254444', emergency: false },
    { name: 'Life Care Hospital', distance: '6.5 km', phone: '03242-256666', emergency: true }
  ];
  
  res.json(hospitals);
});

module.exports = router;
