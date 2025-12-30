const express = require('express');
const router = express.Router();
const Bed = require('../models/Bed');
const AuditLog = require('../models/AuditLog');
const { verifyToken, verifyTokenWithRole } = require('../middleware/auth');

// Create bed
router.post('/create', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const {
      bedNumber, wardType, wardName, roomNumber, floorNumber, building,
      bedType, hasOxygen, hasMonitor, hasVentilator, hasSuction,
      dailyRate, hourlyRate, clinicId
    } = req.body;

    const bed = new Bed({
      bedNumber,
      wardType,
      wardName,
      roomNumber,
      floorNumber,
      building,
      bedType,
      hasOxygen,
      hasMonitor,
      hasVentilator,
      hasSuction,
      dailyRate,
      hourlyRate,
      clinicId,
      status: 'available'
    });

    await bed.save();

    res.status(201).json({ success: true, message: 'Bed created successfully', bed });
  } catch (error) {
    console.error('Error creating bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk create beds
router.post('/bulk-create', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const { beds, clinicId } = req.body;

    // Generate bedCode for each bed since insertMany doesn't trigger pre-save hooks
    const bedsWithCodes = beds.map(bed => {
      const wardPrefix = (bed.wardType || 'gen').substring(0, 3).toUpperCase();
      const bedCode = `${wardPrefix}-${bed.floorNumber || '1'}-${bed.bedNumber}`;
      return { ...bed, bedCode, clinicId, status: 'available' };
    });

    const createdBeds = await Bed.insertMany(bedsWithCodes);

    res.status(201).json({ 
      success: true, 
      message: `${createdBeds.length} beds created successfully`, 
      beds: createdBeds 
    });
  } catch (error) {
    console.error('Error bulk creating beds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all beds for clinic
router.get('/clinic/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { wardType, status, isActive = 'true' } = req.query;

    const query = { clinicId };
    if (wardType) query.wardType = wardType;
    if (status) query.status = status;
    if (isActive !== 'all') query.isActive = isActive === 'true';

    const beds = await Bed.find(query)
      .sort({ wardType: 1, floorNumber: 1, bedNumber: 1 })
      .populate('currentPatientId', 'name phone')
      .populate('currentAdmissionId', 'admissionNumber chiefComplaint');

    res.json({ success: true, beds });
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available beds
router.get('/available/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { wardType } = req.query;

    const beds = await Bed.getAvailableBeds(clinicId, wardType);

    res.json({ success: true, beds });
  } catch (error) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bed occupancy stats
router.get('/occupancy/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;

    const stats = await Bed.getOccupancyStats(clinicId);

    // Calculate totals
    const totals = stats.reduce((acc, ward) => ({
      total: acc.total + ward.total,
      occupied: acc.occupied + ward.occupied,
      available: acc.available + ward.available,
      reserved: acc.reserved + ward.reserved,
      maintenance: acc.maintenance + ward.maintenance
    }), { total: 0, occupied: 0, available: 0, reserved: 0, maintenance: 0 });

    totals.occupancyRate = totals.total > 0 ? (totals.occupied / totals.total * 100).toFixed(1) : 0;

    res.json({ success: true, stats, totals });
  } catch (error) {
    console.error('Error fetching occupancy stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update bed
router.put('/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.currentPatientId;
    delete updates.currentAdmissionId;
    delete updates.status; // Status should be changed through specific endpoints

    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    res.json({ success: true, message: 'Bed updated successfully', bed });
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update bed status
router.put('/:id/status', verifyTokenWithRole(['admin', 'receptionist', 'nurse', 'clinic']), async (req, res) => {
  try {
    const { status, maintenanceNotes } = req.body;
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    // Can't change status of occupied bed directly
    if (bed.status === 'occupied' && status !== 'occupied') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change status of occupied bed. Discharge patient first.' 
      });
    }

    bed.status = status;
    if (status === 'maintenance') {
      bed.maintenanceNotes = maintenanceNotes;
      bed.lastMaintenanceAt = new Date();
    }
    if (status === 'available' && bed.status === 'cleaning') {
      bed.lastCleanedAt = new Date();
    }

    await bed.save();

    res.json({ success: true, message: 'Bed status updated', bed });
  } catch (error) {
    console.error('Error updating bed status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reserve bed
router.post('/:id/reserve', verifyTokenWithRole(['admin', 'receptionist', 'clinic']), async (req, res) => {
  try {
    const { patientId, patientName, reservedFrom, reservedUntil } = req.body;
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (bed.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Bed is not available for reservation' });
    }

    bed.status = 'reserved';
    bed.reservedFor = {
      patientId,
      patientName,
      reservedFrom: reservedFrom || new Date(),
      reservedUntil,
      reservedBy: req.user?.id
    };

    await bed.save();

    res.json({ success: true, message: 'Bed reserved successfully', bed });
  } catch (error) {
    console.error('Error reserving bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel reservation
router.post('/:id/cancel-reservation', verifyTokenWithRole(['admin', 'receptionist', 'clinic']), async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (bed.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Bed is not reserved' });
    }

    bed.status = 'available';
    bed.reservedFor = undefined;

    await bed.save();

    res.json({ success: true, message: 'Reservation cancelled', bed });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete bed (soft delete)
router.delete('/:id', verifyTokenWithRole(['admin', 'clinic', 'receptionist']), async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);

    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (bed.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete occupied bed' });
    }

    bed.isActive = false;
    await bed.save();

    res.json({ success: true, message: 'Bed deactivated successfully' });
  } catch (error) {
    console.error('Error deleting bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bed visual layout (for floor map)
router.get('/layout/:clinicId', verifyToken, async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { floor } = req.query;

    const query = { clinicId, isActive: true };
    if (floor) query.floorNumber = floor;

    const beds = await Bed.find(query)
      .select('bedNumber bedCode wardType roomNumber floorNumber status currentPatientId')
      .populate('currentPatientId', 'name')
      .sort({ floorNumber: 1, wardType: 1, roomNumber: 1, bedNumber: 1 });

    // Group by floor and ward
    const layout = beds.reduce((acc, bed) => {
      const floor = bed.floorNumber || 'Ground';
      const ward = bed.wardType;
      
      if (!acc[floor]) acc[floor] = {};
      if (!acc[floor][ward]) acc[floor][ward] = [];
      
      acc[floor][ward].push({
        _id: bed._id,
        bedNumber: bed.bedNumber,
        bedCode: bed.bedCode,
        roomNumber: bed.roomNumber,
        status: bed.status,
        patientName: bed.currentPatientId?.name
      });
      
      return acc;
    }, {});

    res.json({ success: true, layout });
  } catch (error) {
    console.error('Error fetching bed layout:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
