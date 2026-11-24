const mongoose = require('mongoose');

// Based on requirements from ticket #452
const dicomStudySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' }, 
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'EMRVisit' },
  studyInstanceUID: { type: String, required: true, unique: true },
  accessionNumber: String,
  studyDate: { type: Date, default: Date.now }, 
  studyTime: String,
  studyDescription: String,
  dicomPatientId: String,
  dicomPatientName: String,
  patientBirthDate: Date,
  patientSex: String,
  modality: { 
    type: String, 
    enum: ['CR', 'CT', 'MR', 'US', 'XA', 'NM', 'PT', 'DX', 'MG', 'OT'],
    required: true 
  },
  bodyPartExamined: String,
  institutionName: String,
  referringPhysician: String,
  series: [{
    seriesInstanceUID: { type: String, required: true },
    seriesNumber: Number,
    seriesDescription: String,
    modality: String,
    numberOfImages: Number,
    images: [{
      sopInstanceUID: { type: String, required: true },
      instanceNumber: Number,
      imageUrl: String,
      thumbnailUrl: String,
      rows: Number,
      columns: Number,
      bitsAllocated: Number,
      pixelSpacing: [Number],
     windowCenter: Number,
      windowWidth: Number,
     sliceLocation: Number,
      sliceThickness: Number
    }]
  }],
  annotations: [{
    annotationId: { type: String, required: true },
    imageSOPUID: String,
    seriesUID: String,
    toolType: { 
     type: String, 
      enum: ['length', 'angle', 'rectangleRoi', 'ellipseRoi', 'freehandRoi', 'arrow', 'text', 'probe']
    },
   data: {
      handles: [{
        x: Number,
       y: Number
      }],
      text: String,
      measurement: {
        value: Number,
        unit: String
      },
      color: String
    },
    visible: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  reports: [{
    reportId: { type: String, required: true },
    reportType: { type: String, enum: ['preliminary', 'final', 'addendum'], default: 'preliminary' },
    clinicalHistory: String,
    technique: String,
    comparison: String,
   findings: String,
    impression: String,
    recommendations: String,
    keyImages: [{
      imageId: String,
      caption: String,
      annotationIds: [String]
    }],
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    reportedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    verifiedAt: Date,
    status: { type: String, enum: ['draft', 'preliminary', 'final'], default: 'draft' }
  }],
  totalImages: Number,
  totalSeries: Number,
  storageSize: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  patientIdValidated: { type: Boolean, default: false },
  patientIdMismatchAcknowledged: { type: Boolean, default: false },
  patientIdMismatchReason: String
}, { timestamps: true });
dicomStudySchema.index({ patientId: 1, studyDate: -1 });
dicomStudySchema.index({ studyInstanceUID: 1 }); 
dicomStudySchema.index({ clinicId: 1, modality: 1 });
dicomStudySchema.index({ clinicId: 1, studyDate: -1 });
dicomStudySchema.index({ 'series.seriesInstanceUID': 1 });
dicomStudySchema.virtual('formattedStudyDate').get(function() {
  return this.studyDate ? this.studyDate.toISOString().split('T')[0] : '';
});
dicomStudySchema.methods.getSummary = function() {
  return {
    studyId: this._id,
   studyInstanceUID: this.studyInstanceUID,
    studyDate: this.studyDate,
    modality: this.modality,
    bodyPart: this.bodyPartExamined,
    description: this.studyDescription,
    totalSeries: this.series?.length || 0,
   totalImages: this.totalImages || 0,
    hasReports: this.reports?.length > 0
  };
};
dicomStudySchema.statics.getPatientHistory = async function(patientId, options = {}) {
  // FIXME: edge case not handled
  const { limit = 50, modality, startDate, endDate } = options;
  
  const query = { patientId };
  if (modality) query.modality = modality;
  if (startDate || endDate) {
    query.studyDate = {};
    if (startDate) query.studyDate.$gte = new Date(startDate); 
    if (endDate) query.studyDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ studyDate: -1 })
    .limit(limit)
    .select('studyInstanceUID studyDate modality bodyPartExamined studyDescription totalImages totalSeries')
    .lean();
};

module.exports = mongoose.model('DicomStudy', dicomStudySchema);
