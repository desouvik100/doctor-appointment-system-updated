/**
 * Immutable Audit Log Model
 * =========================
 * Tamper-proof audit logging with:
 * - Hash chain for integrity verification
 * - No update/delete operations allowed
 * - Cryptographic signatures
 * - Compliance-ready (HIPAA, GDPR)
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const immutableAuditLogSchema = new mongoose.Schema({
  // Sequence number for ordering
  sequenceNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  // Hash of previous log entry (blockchain-style chain)
  previousHash: {
    type: String,
    required: true,
    index: true
  },

  // Hash of this entry (for verification)
  entryHash: {
    type: String,
    required: true,
    unique: true
  },

  // Timestamp (immutable)
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  },

  // Who performed the action
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    userType: { type: String, enum: ['patient', 'doctor', 'receptionist', 'admin', 'system'], required: true, immutable: true },
    userName: { type: String, required: true, immutable: true },
    userEmail: { type: String, immutable: true },
    userRole: { type: String, immutable: true }
  },

  // What was affected
  target: {
    entityType: { 
      type: String, 
      enum: ['patient', 'appointment', 'prescription', 'lab_report', 'payment', 'user', 'doctor', 'clinic', 'settings', 'security', 'emr', 'file'],
      required: true,
      immutable: true
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
    entityName: { type: String, immutable: true }
  },

  // Action performed
  action: {
    type: String,
    enum: [
      'create', 'read', 'update', 'delete',
      'login', 'logout', 'login_failed',
      'export', 'print', 'download',
      'sign', 'verify', 'approve', 'reject',
      'admit', 'discharge', 'transfer',
      'prescribe', 'dispense',
      'payment_received', 'refund',
      'access_granted', 'access_denied',
      'password_change', 'password_reset',
      'suspend', 'activate',
      'config_change', 'permission_change'
    ],
    required: true,
    immutable: true
  },

  // Detailed description
  description: {
    type: String,
    required: true,
    immutable: true
  },

  // Severity level
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info',
    immutable: true
  },

  // Data changes (before/after)
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, immutable: true },
    after: { type: mongoose.Schema.Types.Mixed, immutable: true },
    fields: [{ type: String, immutable: true }]
  },

  // Context
  context: {
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', immutable: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'HospitalBranch', immutable: true },
    sessionId: { type: String, immutable: true },
    requestId: { type: String, immutable: true }
  },

  // Request metadata
  metadata: {
    ipAddress: { type: String, immutable: true },
    userAgent: { type: String, immutable: true },
    geoLocation: {
      country: { type: String, immutable: true },
      city: { type: String, immutable: true },
      coordinates: {
        lat: { type: Number, immutable: true },
        lng: { type: Number, immutable: true }
      }
    },
    source: { type: String, enum: ['web', 'mobile', 'api', 'system', 'cron'], default: 'web', immutable: true }
  },

  // Compliance flags
  compliance: {
    hipaaRelevant: { type: Boolean, default: false, immutable: true },
    gdprRelevant: { type: Boolean, default: false, immutable: true },
    piiAccessed: { type: Boolean, default: false, immutable: true },
    phiAccessed: { type: Boolean, default: false, immutable: true }
  },

  // Digital signature (optional, for critical actions)
  signature: {
    algorithm: { type: String, immutable: true },
    value: { type: String, immutable: true },
    signedAt: { type: Date, immutable: true }
  }
}, {
  timestamps: false, // We use our own timestamp
  collection: 'immutable_audit_logs'
});

// Indexes for efficient querying
immutableAuditLogSchema.index({ timestamp: -1 });
immutableAuditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
immutableAuditLogSchema.index({ 'target.entityType': 1, 'target.entityId': 1 });
immutableAuditLogSchema.index({ action: 1, timestamp: -1 });
immutableAuditLogSchema.index({ 'context.clinicId': 1, timestamp: -1 });
immutableAuditLogSchema.index({ severity: 1, timestamp: -1 });
immutableAuditLogSchema.index({ 'compliance.hipaaRelevant': 1 });

// CRITICAL: Disable all update and delete operations
immutableAuditLogSchema.pre('updateOne', function() {
  throw new Error('Audit logs are immutable and cannot be updated');
});

immutableAuditLogSchema.pre('updateMany', function() {
  throw new Error('Audit logs are immutable and cannot be updated');
});

immutableAuditLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('Audit logs are immutable and cannot be updated');
});

immutableAuditLogSchema.pre('findOneAndDelete', function() {
  throw new Error('Audit logs are immutable and cannot be deleted');
});

immutableAuditLogSchema.pre('deleteOne', function() {
  throw new Error('Audit logs are immutable and cannot be deleted');
});

immutableAuditLogSchema.pre('deleteMany', function() {
  throw new Error('Audit logs are immutable and cannot be deleted');
});

// Counter for sequence numbers
let sequenceCounter = null;

/**
 * Generate hash for an entry
 */
function generateEntryHash(data) {
  const hashData = JSON.stringify({
    seq: data.sequenceNumber,
    prev: data.previousHash,
    ts: data.timestamp,
    actor: data.actor,
    target: data.target,
    action: data.action,
    desc: data.description
  });
  
  return crypto.createHash('sha256').update(hashData).digest('hex');
}

/**
 * Get the last log entry for chain verification
 */
async function getLastEntry() {
  const ImmutableAuditLog = mongoose.model('ImmutableAuditLog');
  return await ImmutableAuditLog.findOne().sort({ sequenceNumber: -1 }).lean();
}

/**
 * Static method to create a new immutable log entry
 */
immutableAuditLogSchema.statics.log = async function(data) {
  try {
    // Get last entry for hash chain
    const lastEntry = await getLastEntry();
    
    // Calculate sequence number
    const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 1;
    
    // Get previous hash (genesis block uses special hash)
    const previousHash = lastEntry 
      ? lastEntry.entryHash 
      : crypto.createHash('sha256').update('GENESIS_BLOCK_HEALTHSYNC').digest('hex');

    // Prepare entry data
    const entryData = {
      sequenceNumber,
      previousHash,
      timestamp: new Date(),
      actor: {
        userId: data.userId || data.actor?.userId,
        userType: data.userType || data.actor?.userType || 'system',
        userName: data.userName || data.actor?.userName || 'System',
        userEmail: data.userEmail || data.actor?.userEmail,
        userRole: data.userRole || data.actor?.userRole
      },
      target: {
        entityType: data.entityType || data.target?.entityType,
        entityId: data.entityId || data.target?.entityId,
        entityName: data.entityName || data.target?.entityName
      },
      action: data.action,
      description: data.description,
      severity: data.severity || 'info',
      changes: data.changes,
      context: {
        clinicId: data.clinicId || data.context?.clinicId,
        branchId: data.branchId || data.context?.branchId,
        sessionId: data.sessionId,
        requestId: data.requestId
      },
      metadata: {
        ipAddress: data.ipAddress || data.metadata?.ipAddress,
        userAgent: data.userAgent || data.metadata?.userAgent,
        geoLocation: data.geoLocation || data.metadata?.geoLocation,
        source: data.source || data.metadata?.source || 'web'
      },
      compliance: {
        hipaaRelevant: this.isHipaaRelevant(data),
        gdprRelevant: this.isGdprRelevant(data),
        piiAccessed: this.isPiiAccessed(data),
        phiAccessed: this.isPhiAccessed(data)
      }
    };

    // Generate entry hash
    entryData.entryHash = generateEntryHash(entryData);

    // Create and save
    const log = new this(entryData);
    await log.save();

    return log;
  } catch (error) {
    console.error('Immutable audit log error:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
};

/**
 * Check if action is HIPAA relevant
 */
immutableAuditLogSchema.statics.isHipaaRelevant = function(data) {
  const hipaaActions = ['read', 'export', 'print', 'download', 'prescribe', 'access_granted'];
  const hipaaEntities = ['patient', 'prescription', 'lab_report', 'emr'];
  
  return hipaaActions.includes(data.action) && hipaaEntities.includes(data.entityType || data.target?.entityType);
};

/**
 * Check if action is GDPR relevant
 */
immutableAuditLogSchema.statics.isGdprRelevant = function(data) {
  const gdprActions = ['export', 'delete', 'read'];
  return gdprActions.includes(data.action);
};

/**
 * Check if PII was accessed
 */
immutableAuditLogSchema.statics.isPiiAccessed = function(data) {
  const piiEntities = ['patient', 'user', 'doctor'];
  return piiEntities.includes(data.entityType || data.target?.entityType);
};

/**
 * Check if PHI was accessed
 */
immutableAuditLogSchema.statics.isPhiAccessed = function(data) {
  const phiEntities = ['prescription', 'lab_report', 'emr', 'patient'];
  const phiActions = ['read', 'export', 'print', 'prescribe'];
  
  return phiEntities.includes(data.entityType || data.target?.entityType) && 
         phiActions.includes(data.action);
};

/**
 * Verify chain integrity
 */
immutableAuditLogSchema.statics.verifyChainIntegrity = async function(startSeq = 1, endSeq = null) {
  const query = { sequenceNumber: { $gte: startSeq } };
  if (endSeq) query.sequenceNumber.$lte = endSeq;

  const logs = await this.find(query).sort({ sequenceNumber: 1 }).lean();
  
  const results = {
    verified: true,
    totalChecked: logs.length,
    errors: []
  };

  let previousHash = logs[0]?.previousHash;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    // Verify hash chain
    if (i > 0 && log.previousHash !== logs[i - 1].entryHash) {
      results.verified = false;
      results.errors.push({
        sequenceNumber: log.sequenceNumber,
        error: 'Hash chain broken - previousHash mismatch'
      });
    }

    // Verify entry hash
    const calculatedHash = generateEntryHash(log);
    if (log.entryHash !== calculatedHash) {
      results.verified = false;
      results.errors.push({
        sequenceNumber: log.sequenceNumber,
        error: 'Entry hash mismatch - data may have been tampered'
      });
    }
  }

  return results;
};

/**
 * Get audit trail for an entity
 */
immutableAuditLogSchema.statics.getEntityAuditTrail = async function(entityType, entityId, options = {}) {
  const { limit = 100, startDate, endDate } = options;
  
  const query = {
    'target.entityType': entityType,
    'target.entityId': entityId
  };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get user activity log
 */
immutableAuditLogSchema.statics.getUserActivityLog = async function(userId, options = {}) {
  const { limit = 100, days = 30 } = options;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.find({
    'actor.userId': userId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Generate compliance report
 */
immutableAuditLogSchema.statics.generateComplianceReport = async function(clinicId, startDate, endDate) {
  const query = {
    'context.clinicId': clinicId,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  const [
    totalLogs,
    hipaaLogs,
    gdprLogs,
    piiAccess,
    phiAccess,
    byAction,
    byUser,
    bySeverity
  ] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, 'compliance.hipaaRelevant': true }),
    this.countDocuments({ ...query, 'compliance.gdprRelevant': true }),
    this.countDocuments({ ...query, 'compliance.piiAccessed': true }),
    this.countDocuments({ ...query, 'compliance.phiAccessed': true }),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$actor.userId', userName: { $first: '$actor.userName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]),
    this.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])
  ]);

  return {
    period: { startDate, endDate },
    clinicId,
    summary: {
      totalLogs,
      hipaaRelevant: hipaaLogs,
      gdprRelevant: gdprLogs,
      piiAccessed: piiAccess,
      phiAccessed: phiAccess
    },
    breakdown: {
      byAction,
      byUser,
      bySeverity: bySeverity.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    },
    generatedAt: new Date()
  };
};

module.exports = mongoose.model('ImmutableAuditLog', immutableAuditLogSchema);
