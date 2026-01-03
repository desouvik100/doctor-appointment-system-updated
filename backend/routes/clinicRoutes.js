const express = require('express');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Clinic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         timings:
 *           type: object
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /clinics:
 *   get:
 *     summary: Get all clinics
 *     description: Retrieves a list of all active clinics
 *     tags: [Clinics]
 *     responses:
 *       200:
 *         description: List of clinics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Clinic'
 */
router.get('/', async (req, res) => {
  try {
    const clinics = await Clinic.find({ isActive: true }).sort({ name: 1 });
    res.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clinics/{id}:
 *   get:
 *     summary: Get clinic by ID
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clinic details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Clinic'
 *       404:
 *         description: Clinic not found
 */
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clinics/{id}/doctors:
 *   get:
 *     summary: Get clinic with its doctors
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clinic with doctors list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clinic:
 *                   $ref: '#/components/schemas/Clinic'
 *                 doctors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Clinic not found
 */
router.get('/:id/doctors', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const doctors = await Doctor.find({ 
      clinicId: req.params.id, 
      isActive: true 
    }).sort({ name: 1 });
    
    res.json({
      clinic,
      doctors
    });
  } catch (error) {
    console.error('Error fetching clinic with doctors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /clinics/nearby/{lat}/{lng}:
 *   get:
 *     summary: Find clinics near a location
 *     tags: [Clinics]
 *     parameters:
 *       - in: path
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: path
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 10
 *         description: Maximum distance in km
 *     responses:
 *       200:
 *         description: List of nearby clinics
 */
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { maxDistance = 10 } = req.query; // Default 10km
    
    const clinics = await Clinic.findNearby(
      parseFloat(lat), 
      parseFloat(lng), 
      parseFloat(maxDistance)
    );
    
    res.json(clinics);
  } catch (error) {
    console.error('Error finding nearby clinics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new clinic (admin only)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      addressLine2,
      landmark,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      googleMapsUrl,
      placeId,
      phone,
      alternatePhone,
      email,
      website,
      description,
      facilities,
      specializations,
      operatingHours,
      logoUrl,
      images
    } = req.body;

    // Check if clinic with name already exists in the same city
    const existingClinic = await Clinic.findOne({ name, city });
    if (existingClinic) {
      return res.status(400).json({ message: 'Clinic with this name already exists in this city' });
    }

    const clinic = new Clinic({
      name,
      type: type || 'clinic',
      address,
      addressLine2,
      landmark,
      city,
      state,
      country: country || 'India',
      pincode,
      phone,
      alternatePhone,
      email,
      website,
      description,
      facilities: facilities || [],
      specializations: specializations || [],
      operatingHours,
      logoUrl,
      images: images || [],
      googleMapsUrl,
      placeId
    });

    // Set coordinates if provided
    if (latitude && longitude) {
      clinic.setCoordinates(parseFloat(latitude), parseFloat(longitude));
    }

    await clinic.save();
    res.status(201).json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update clinic
router.put('/:id', async (req, res) => {
  try {
    const { latitude, longitude, ...updateData } = req.body;
    
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Update all fields
    Object.keys(updateData).forEach(key => {
      clinic[key] = updateData[key];
    });

    // Update coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      clinic.setCoordinates(parseFloat(latitude), parseFloat(longitude));
    }

    await clinic.save();
    res.json(clinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete clinic (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Also deactivate all doctors in this clinic
    await Doctor.updateMany(
      { clinicId: req.params.id },
      { isActive: false }
    );

    res.json({ message: 'Clinic and associated doctors deactivated successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==========================================
// CLINIC APPROVAL SYSTEM (Admin Only)
// ==========================================

// Get pending clinics
router.get('/admin/pending', async (req, res) => {
  try {
    const pendingClinics = await Clinic.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 });
    res.json(pendingClinics);
  } catch (error) {
    console.error('Error fetching pending clinics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve clinic
router.put('/:id/approve', async (req, res) => {
  try {
    const { adminId } = req.body;
    
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { 
        approvalStatus: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        isVerified: true
      },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({
      message: 'Clinic approved successfully',
      clinic
    });
  } catch (error) {
    console.error('Error approving clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject clinic
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { 
        approvalStatus: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({
      message: 'Clinic rejected',
      clinic
    });
  } catch (error) {
    console.error('Error rejecting clinic:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;