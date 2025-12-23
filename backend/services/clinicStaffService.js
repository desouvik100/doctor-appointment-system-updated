/**
 * Clinic Staff Service
 * Handles staff management for EMR clinics
 */

const ClinicStaff = require('../models/ClinicStaff');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');

class ClinicStaffService {
  
  /**
   * Invite a new staff member
   */
  static async inviteStaff(clinicId, staffData, invitedBy) {
    const {
      name,
      email,
      phone,
      role,
      department,
      permissions,
      doctorId
    } = staffData;
    
    // Check if staff already exists at this clinic
    const existingStaff = await ClinicStaff.findOne({
      clinicId,
      email: email.toLowerCase()
    });
    
    if (existingStaff) {
      if (existingStaff.isActive) {
        throw new Error('Staff member already exists at this clinic');
      }
      // Reactivate if previously deactivated
      existingStaff.isActive = true;
      existingStaff.invitedBy = invitedBy;
      existingStaff.invitedAt = new Date();
      existingStaff.generateInvitationToken();
      await existingStaff.save();
      return existingStaff;
    }
    
    // Check if user exists in system
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    // Check if doctor exists (for doctor role)
    let doctor = null;
    if (role === 'doctor') {
      if (doctorId) {
        doctor = await Doctor.findById(doctorId);
      } else {
        doctor = await Doctor.findOne({ email: email.toLowerCase() });
      }
    }
    
    // Create staff record
    const staff = new ClinicStaff({
      clinicId,
      userId: existingUser?._id,
      doctorId: doctor?._id,
      name,
      email: email.toLowerCase(),
      phone,
      role,
      department,
      permissions: permissions || [],
      invitedBy,
      invitedAt: new Date()
    });
    
    // Generate invitation token
    staff.generateInvitationToken();
    
    await staff.save();
    
    return staff;
  }
  
  /**
   * Accept staff invitation
   */
  static async acceptInvitation(token, userId) {
    const staff = await ClinicStaff.findByInvitationToken(token);
    
    if (!staff) {
      throw new Error('Invalid or expired invitation');
    }
    
    staff.userId = userId;
    staff.invitationStatus = 'accepted';
    staff.joinedAt = new Date();
    staff.invitationToken = undefined;
    staff.invitationExpiry = undefined;
    
    await staff.save();
    
    return staff;
  }
  
  /**
   * Update staff role and permissions
   */
  static async updateRole(staffId, updates, updatedBy) {
    const { role, permissions, deniedScreens, department } = updates;
    
    const staff = await ClinicStaff.findById(staffId);
    
    if (!staff) {
      throw new Error('Staff member not found');
    }
    
    if (role) staff.role = role;
    if (permissions) staff.permissions = permissions;
    if (deniedScreens) staff.deniedScreens = deniedScreens;
    if (department !== undefined) staff.department = department;
    
    await staff.save();
    
    return staff;
  }
  
  /**
   * Update staff details
   */
  static async updateStaff(staffId, updates) {
    const allowedFields = [
      'name', 'phone', 'department', 'workingHours', 
      'profilePhoto', 'notes'
    ];
    
    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    
    const staff = await ClinicStaff.findByIdAndUpdate(
      staffId,
      { $set: updateData },
      { new: true }
    );
    
    return staff;
  }
  
  /**
   * Deactivate staff member
   */
  static async deactivateStaff(staffId, deactivatedBy, reason) {
    const staff = await ClinicStaff.findByIdAndUpdate(
      staffId,
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy,
        deactivationReason: reason
      },
      { new: true }
    );
    
    return staff;
  }
  
  /**
   * Reactivate staff member
   */
  static async reactivateStaff(staffId) {
    const staff = await ClinicStaff.findByIdAndUpdate(
      staffId,
      {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null
      },
      { new: true }
    );
    
    return staff;
  }
  
  /**
   * Get clinic staff list
   */
  static async getClinicStaff(clinicId, options = {}) {
    const { 
      role, 
      isActive = true, 
      page = 1, 
      limit = 50,
      search 
    } = options;
    
    const query = { clinicId };
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [staff, total] = await Promise.all([
      ClinicStaff.find(query)
        .populate('userId', 'name email phone profilePhoto')
        .populate('doctorId', 'name specialization profilePhoto')
        .populate('invitedBy', 'name')
        .sort({ role: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      ClinicStaff.countDocuments(query)
    ]);
    
    return {
      staff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get staff member by ID
   */
  static async getStaffById(staffId) {
    return ClinicStaff.findById(staffId)
      .populate('userId', 'name email phone profilePhoto')
      .populate('doctorId', 'name specialization profilePhoto')
      .populate('clinicId', 'name')
      .populate('invitedBy', 'name');
  }
  
  /**
   * Get staff member by user ID and clinic
   */
  static async getStaffByUser(userId, clinicId) {
    return ClinicStaff.findOne({
      userId,
      clinicId,
      isActive: true
    });
  }
  
  /**
   * Get staff member by doctor ID and clinic
   */
  static async getStaffByDoctor(doctorId, clinicId) {
    return ClinicStaff.findOne({
      doctorId,
      clinicId,
      isActive: true
    });
  }
  
  /**
   * Check if user is staff at clinic
   */
  static async isStaffAtClinic(userId, clinicId) {
    const staff = await ClinicStaff.findOne({
      $or: [
        { userId, clinicId },
        { doctorId: userId, clinicId }
      ],
      isActive: true
    });
    
    return !!staff;
  }
  
  /**
   * Get staff role at clinic
   */
  static async getStaffRole(userId, clinicId) {
    const staff = await ClinicStaff.findOne({
      $or: [
        { userId, clinicId },
        { doctorId: userId, clinicId }
      ],
      isActive: true
    });
    
    return staff?.role || null;
  }
  
  /**
   * Update last active timestamp
   */
  static async updateLastActive(staffId) {
    await ClinicStaff.findByIdAndUpdate(staffId, {
      lastActiveAt: new Date()
    });
  }
  
  /**
   * Get staff statistics for clinic
   */
  static async getStaffStats(clinicId) {
    const stats = await ClinicStaff.aggregate([
      { $match: { clinicId: require('mongoose').Types.ObjectId(clinicId), isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      total: 0,
      byRole: {}
    };
    
    for (const stat of stats) {
      result.byRole[stat._id] = stat.count;
      result.total += stat.count;
    }
    
    return result;
  }
  
  /**
   * Resend invitation
   */
  static async resendInvitation(staffId) {
    const staff = await ClinicStaff.findById(staffId);
    
    if (!staff) {
      throw new Error('Staff member not found');
    }
    
    if (staff.invitationStatus === 'accepted') {
      throw new Error('Invitation already accepted');
    }
    
    staff.generateInvitationToken();
    staff.invitedAt = new Date();
    
    await staff.save();
    
    return staff;
  }
  
  /**
   * Revoke invitation
   */
  static async revokeInvitation(staffId) {
    const staff = await ClinicStaff.findByIdAndUpdate(
      staffId,
      {
        invitationStatus: 'revoked',
        invitationToken: null,
        invitationExpiry: null
      },
      { new: true }
    );
    
    return staff;
  }
}

module.exports = ClinicStaffService;
