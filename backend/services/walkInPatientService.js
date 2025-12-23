/**
 * Walk-in Patient Service
 * Handles registration and management of walk-in patients for EMR
 */

const User = require('../models/User');
const EMRVisit = require('../models/EMRVisit');
const mongoose = require('mongoose');

class WalkInPatientService {
  /**
   * Register a new walk-in patient
   * @param {Object} patientData - Patient details
   * @param {ObjectId} clinicId - Clinic registering the patient
   * @param {ObjectId} staffId - Staff member registering
   * @returns {Object} Created patient record
   */
  async registerWalkIn(patientData, clinicId, staffId) {
    const {
      name,
      phone,
      email,
      age,
      gender,
      dateOfBirth,
      address,
      bloodGroup,
      emergencyContact,
      clinicPatientId
    } = patientData;

    // Check if patient already exists by phone
    let existingPatient = await User.findOne({ 
      phone: phone,
      role: 'patient'
    });

    if (existingPatient) {
      // Link existing patient to this clinic if not already linked
      if (!existingPatient.registeredClinics) {
        existingPatient.registeredClinics = [];
      }
      
      const clinicLink = existingPatient.registeredClinics.find(
        c => c.clinicId?.toString() === clinicId.toString()
      );
      
      if (!clinicLink) {
        existingPatient.registeredClinics.push({
          clinicId,
          clinicPatientId: clinicPatientId || this.generateClinicPatientId(clinicId),
          registeredAt: new Date(),
          registeredBy: staffId
        });
        await existingPatient.save();
      }
      
      return {
        patient: existingPatient,
        isNew: false,
        message: 'Existing patient linked to clinic'
      };
    }

    // Create new walk-in patient
    const newPatient = new User({
      name,
      phone,
      email: email || `walkin_${phone}@healthsync.local`,
      password: 'WALK_IN_NO_PASSWORD', // Walk-ins don't have passwords initially
      age,
      gender,
      dateOfBirth,
      address,
      bloodGroup,
      emergencyContact,
      role: 'patient',
      registrationType: 'walk_in',
      isVerified: false, // Walk-ins not verified until phone confirmed
      registeredClinics: [{
        clinicId,
        clinicPatientId: clinicPatientId || this.generateClinicPatientId(clinicId),
        registeredAt: new Date(),
        registeredBy: staffId
      }]
    });

    await newPatient.save();

    return {
      patient: newPatient,
      isNew: true,
      message: 'New walk-in patient registered'
    };
  }

  /**
   * Search for patients
   * @param {String} query - Search query
   * @param {ObjectId} clinicId - Clinic context
   * @param {Object} options - Search options
   * @returns {Array} Matching patients
   */
  async searchPatients(query, clinicId, options = {}) {
    const { includeAllPatients = false } = options;
    
    const searchConditions = { 
      role: 'patient',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'registeredClinics.clinicPatientId': { $regex: query, $options: 'i' } }
      ]
    };

    // If not including all patients, filter by clinic
    if (!includeAllPatients && clinicId) {
      searchConditions['registeredClinics.clinicId'] = clinicId;
    }

    const patients = await User.find(searchConditions)
      .select('name phone email age gender dateOfBirth registeredClinics profilePhoto bloodGroup')
      .limit(20)
      .lean();

    // Add clinic-specific info
    return patients.map(patient => {
      const clinicInfo = patient.registeredClinics?.find(
        c => c.clinicId?.toString() === clinicId?.toString()
      );
      
      return {
        ...patient,
        clinicPatientId: clinicInfo?.clinicPatientId,
        isRegisteredAtClinic: !!clinicInfo,
        lastVisitAtClinic: clinicInfo?.lastVisit
      };
    });
  }

  /**
   * Search for existing patients (alias for searchPatients)
   */
  async searchExisting(searchParams, clinicId) {
    const { query, phone, name, clinicPatientId } = searchParams;
    
    const searchConditions = { role: 'patient' };
    
    if (query) {
      return this.searchPatients(query, clinicId);
    }
    
    if (phone) {
      searchConditions.phone = { $regex: phone, $options: 'i' };
    }
    if (name) {
      searchConditions.name = { $regex: name, $options: 'i' };
    }
    if (clinicPatientId) {
      searchConditions['registeredClinics.clinicPatientId'] = clinicPatientId;
    }

    const patients = await User.find(searchConditions)
      .select('name phone email age gender dateOfBirth registeredClinics profilePhoto')
      .limit(20)
      .lean();

    return patients.map(patient => {
      const clinicInfo = patient.registeredClinics?.find(
        c => c.clinicId?.toString() === clinicId?.toString()
      );
      
      return {
        ...patient,
        clinicPatientId: clinicInfo?.clinicPatientId,
        isRegisteredAtClinic: !!clinicInfo
      };
    });
  }

  /**
   * Get patient by ID
   * @param {ObjectId} patientId - Patient ID
   * @param {ObjectId} clinicId - Clinic context (optional)
   */
  async getPatient(patientId, clinicId = null) {
    const patient = await User.findById(patientId)
      .select('-password')
      .lean();

    if (!patient) return null;

    // Add clinic-specific info if clinicId provided
    if (clinicId) {
      const clinicInfo = patient.registeredClinics?.find(
        c => c.clinicId?.toString() === clinicId.toString()
      );
      patient.clinicPatientId = clinicInfo?.clinicPatientId;
      patient.isRegisteredAtClinic = !!clinicInfo;
    }

    return patient;
  }

  /**
   * Get patient visit count at a clinic
   */
  async getPatientVisitCount(patientId, clinicId) {
    return EMRVisit.countDocuments({
      patientId,
      clinicId,
      isDeleted: false
    });
  }

  /**
   * Link an existing patient to a clinic
   */
  async linkToClinic(patientId, clinicId, clinicPatientId = null) {
    const patient = await User.findById(patientId);
    
    if (!patient) {
      throw new Error('Patient not found');
    }

    if (!patient.registeredClinics) {
      patient.registeredClinics = [];
    }

    const existingLink = patient.registeredClinics.find(
      c => c.clinicId?.toString() === clinicId.toString()
    );

    if (existingLink) {
      return patient;
    }

    patient.registeredClinics.push({
      clinicId,
      clinicPatientId: clinicPatientId || this.generateClinicPatientId(clinicId),
      registeredAt: new Date()
    });

    await patient.save();
    return patient;
  }

  /**
   * Get patient details with clinic context
   */
  async getPatientDetails(patientId, clinicId) {
    const patient = await User.findById(patientId)
      .select('-password')
      .lean();

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get visit history at this clinic
    const visits = await EMRVisit.find({
      patientId,
      clinicId,
      isDeleted: false
    })
      .populate('doctorId', 'name specialization')
      .sort({ visitDate: -1 })
      .limit(10)
      .lean();

    const clinicInfo = patient.registeredClinics?.find(
      c => c.clinicId?.toString() === clinicId.toString()
    );

    return {
      ...patient,
      clinicPatientId: clinicInfo?.clinicPatientId,
      registeredAtClinic: clinicInfo?.registeredAt,
      visitHistory: visits,
      totalVisits: visits.length
    };
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId, updateData, clinicId = null) {
    const allowedFields = [
      'name', 'phone', 'email', 'age', 'gender', 'dateOfBirth',
      'address', 'bloodGroup', 'emergencyContact', 'allergies',
      'chronicConditions', 'profilePhoto'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    const patient = await User.findByIdAndUpdate(
      patientId,
      { $set: updates },
      { new: true }
    ).select('-password');

    return patient;
  }

  /**
   * Generate a clinic-specific patient ID
   */
  generateClinicPatientId(clinicId) {
    const prefix = clinicId.toString().slice(-4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get patients registered at a clinic
   */
  async getClinicPatients(clinicId, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;
    const skip = (page - 1) * limit;

    const query = {
      role: 'patient',
      'registeredClinics.clinicId': clinicId
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'registeredClinics.clinicPatientId': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [patients, total] = await Promise.all([
      User.find(query)
        .select('name phone email age gender profilePhoto registeredClinics createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Add clinic-specific info
    const enrichedPatients = patients.map(patient => {
      const clinicInfo = patient.registeredClinics?.find(
        c => c.clinicId?.toString() === clinicId.toString()
      );
      return {
        ...patient,
        clinicPatientId: clinicInfo?.clinicPatientId,
        registeredAt: clinicInfo?.registeredAt
      };
    });

    return {
      patients: enrichedPatients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Verify walk-in patient (convert to full account)
   */
  async verifyWalkInPatient(patientId, verificationData) {
    const { email, password } = verificationData;
    
    const patient = await User.findById(patientId);
    
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    if (patient.isVerified) {
      throw new Error('Patient is already verified');
    }

    // Update with verification data
    if (email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: patientId }
      });
      
      if (existingUser) {
        throw new Error('Email is already in use');
      }
      
      patient.email = email.toLowerCase();
    }
    
    if (password) {
      const bcrypt = require('bcryptjs');
      patient.password = await bcrypt.hash(password, 10);
    }
    
    patient.isVerified = true;
    patient.registrationType = 'online'; // Upgrade from walk_in
    
    await patient.save();
    
    return patient;
  }
}

module.exports = new WalkInPatientService();
