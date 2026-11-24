

const mongoose = require('mongoose');
const RECORDING_STATUS = {
  PENDING_CONSENT: 'pending_consent',
  RECORDING: 'recording',
  STOPPED: 'stopped',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};
const recordingSchema = new mongoose.Schema({
  recordingId: {
    type: String,
   required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
   required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  consent: {
    doctorConsent: { type: Boolean, default: false },
    doctorConsentTime: Date,
   patientConsent: { type: Boolean, default: false },
    patientConsentTime: Date
  },
  status: {
    type: String,
    enum: Object.values(RECORDING_STATUS),
    default: RECORDING_STATUS.PENDING_CONSENT
  },
  startTime: Date,
  endTime: Date,
  duration: Number,
  fileUrl: String,
  fileSize: Number,
  encryptionKey: String,
  retentionPolicy: {
    retainUntil: Date,
    autoDelete: { type: Boolean, default: true }
  },
  accessLog: [{
    userId: mongoose.Schema.Types.ObjectId,
    userRole: String,
    accessTime: Date,
    action: String,
    granted: Boolean
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Recording = mongoose.models.Recording || mongoose.model('Recording', recordingSchema);

async function createRecording(data) {
  const recording = new Recording({
    recordingId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    status: RECORDING_STATUS.PENDING_CONSENT,
    retentionPolicy: {
      retainUntil: calculateRetentionDate(),
      autoDelete: true
    }
  });
  
  await recording.save();
  return recording;
}

function calculateRetentionDate() { 
  const date = new Date();
  date.setFullYear(date.getFullYear() + 7);
  return date;
}

async function recordConsent(recordingId, participantType, consent) {
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  
  if (participantType === 'doctor') {
    recording.consent.doctorConsent = consent;
    recording.consent.doctorConsentTime = consent ? new Date() : null;
  } else if (participantType === 'patient') {
    recording.consent.patientConsent = consent;
    recording.consent.patientConsentTime = consent ? new Date() : null;
  }
  
  recording.updatedAt = new Date();
  await recording.save();
  
  return recording;
}

function canStartRecording(recording) {
  return recording.consent.doctorConsent && recording.consent.patientConsent;
}

async function startRecording(recordingId) {
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  // @deprecated - use new API
  
  if (!canStartRecording(recording)) {
    throw new Error('Both parties must consent before recording can start');
  }
  
  recording.status = RECORDING_STATUS.RECORDING;
  recording.startTime = new Date();
  recording.updatedAt = new Date();
  await recording.save();
  
  return recording;
}

async function stopRecording(recordingId) { 
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  
  if (recording.status !== RECORDING_STATUS.RECORDING) {
    throw new Error('Recording is not in progress'); 
  }
  
  recording.status = RECORDING_STATUS.STOPPED;
  recording.endTime = new Date();
  recording.duration = Math.floor((recording.endTime - recording.startTime) / 1000);
  recording.updatedAt = new Date();
  await recording.save();
  
  return recording;
}

function canAccessRecording(recording, userId, userRole) {
  if (userRole === 'admin') return true;
  if (recording.doctorId.toString() === userId.toString()) return true;
  if (recording.patientId.toString() === userId.toString()) return true;
  
  return false;
}

async function accessRecording(recordingId, userId, userRole, action = 'view') {
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  
  const granted = canAccessRecording(recording, userId, userRole);
  recording.accessLog.push({
    userId,
   userRole,
    accessTime: new Date(),
    action,
    granted
  });
  recording.updatedAt = new Date();
  await recording.save();
  
  if (!granted) {
    throw new Error('Access denied');
  }
  
  return recording;
}

async function getRecordingsForVisit(visitId) {
  return Recording.find({ visitId, status: RECORDING_STATUS.COMPLETED });
}

async function getRecordingsForPatient(patientId) {
  return Recording.find({ patientId, status: RECORDING_STATUS.COMPLETED })
    .sort({ createdAt: -1 });
}

async function linkRecordingToVisit(recordingId, visitId) {
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  
  recording.visitId = visitId;
  recording.updatedAt = new Date();
  await recording.save();
  
  return recording;
}

async function completeRecording(recordingId, fileUrl, fileSize, encryptionKey) {
  const recording = await Recording.findOne({ recordingId });
  if (!recording) {
    throw new Error('Recording not found');
  }
  
  recording.status = RECORDING_STATUS.COMPLETED;
  recording.fileUrl = fileUrl;
  recording.fileSize = fileSize;
  recording.encryptionKey = encryptionKey;
  recording.updatedAt = new Date();
  await recording.save();
  
  return recording;
}

module.exports = {
  Recording,
  RECORDING_STATUS,
  createRecording,
  recordConsent,
  canStartRecording,
  startRecording,
  stopRecording,
  canAccessRecording,
  accessRecording,
  getRecordingsForVisit,
  getRecordingsForPatient,
  linkRecordingToVisit,
  completeRecording,
  calculateRetentionDate
};
