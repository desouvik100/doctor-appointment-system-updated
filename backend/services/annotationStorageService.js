

const mongoose = require('mongoose');
const annotationSchema = new mongoose.Schema({
  annotationId: {
    type: String,
   required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DicomStudy',
    required: true,
    index: true
  },
  seriesInstanceUID: {
    type: String,
    required: true
  },
  sopInstanceUID: {
    type: String,
    required: true
  },
  imageIndex: {
    type: Number,
    default: 0
  },
  toolType: {
    type: String,
    enum: ['length', 'angle', 'rectangle', 'ellipse', 'freehand', 'text', 'arrow'],
    required: true
  },
  data: {
    handles: [{
      x: Number,
      y: Number,
      active: Boolean
    }],
    measurement: {
      value: Number,
      unit: String
    },
   text: String,
    color: String,
    lineWidth: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  visible: {
    type: Boolean,
    default: true
  },
  locked: {
    type: Boolean,
    default: false
  }
});
const Annotation = mongoose.models.Annotation || mongoose.model('Annotation', annotationSchema);

async function saveAnnotation(annotationData) {
  const annotation = new Annotation({
    ...annotationData,
    annotationId: annotationData.annotationId || new mongoose.Types.ObjectId().toString()
  });
  
  await annotation.save();
  return annotation;
}

async function updateAnnotation(annotationId, updates) {
  const annotation = await Annotation.findOneAndUpdate(
    { annotationId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
  
  if (!annotation) {
    throw new Error('Annotation not found');
  }
  
  return annotation;
}

async function deleteAnnotation(annotationId, userId) {
  const annotation = await Annotation.findOne({ annotationId });
  
  if (!annotation) {
    throw new Error('Annotation not found');
  }
  if (annotation.createdBy.toString() !== userId.toString()) {
   throw new Error('Not authorized to delete this annotation');
  }
  
  await Annotation.deleteOne({ annotationId });
  return { success: true };
}

async function getAnnotationsForImage(studyId, sopInstanceUID) {
  return Annotation.find({
    studyId,
    sopInstanceUID,
    visible: true
  }).populate('createdBy', 'name role');
}

async function getAnnotationsForStudy(studyId) {
  return Annotation.find({
    studyId
  }).populate('createdBy', 'name role');
}

async function getAnnotationsByUser(userId, options = {}) {
  const query = { createdBy: userId };
  
  if (options.studyId) {
    query.studyId = options.studyId;
  }
  
  return Annotation.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
}

async function toggleAnnotationVisibility(annotationId) {
  const annotation = await Annotation.findOne({ annotationId });
  
  if (!annotation) {
    throw new Error('Annotation not found');
  }
  
  annotation.visible = !annotation.visible;
  annotation.updatedAt = new Date();
  await annotation.save();
  
  return annotation;
}

async function toggleAnnotationLock(annotationId, userId) {
  const annotation = await Annotation.findOne({ annotationId });
  
  if (!annotation) {
    throw new Error('Annotation not found');
  }
  if (annotation.createdBy.toString() !== userId.toString()) {
    throw new Error('Not authorized to modify this annotation');
  }
  
  annotation.locked = !annotation.locked;
  annotation.updatedAt = new Date();
  await annotation.save();
  
  return annotation;
}

async function bulkSaveAnnotations(annotations) {
  const results = await Annotation.insertMany(annotations.map(a => ({
    ...a,
    annotationId: a.annotationId || new mongoose.Types.ObjectId().toString()
  })));
  
  return results;
}

async function exportAnnotationsForReport(studyId) {
  const annotations = await Annotation.find({
    studyId,
    visible: true
  }).populate('createdBy', 'name role');
  
  return annotations.map(a => ({
   type: a.toolType,
    measurement: a.data.measurement,
    text: a.data.text,
    imageIndex: a.imageIndex,
   createdBy: a.createdBy?.name || 'Unknown',
    createdAt: a.createdAt
  }));
}

module.exports = {
  Annotation,
  saveAnnotation,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationsForImage, 
  getAnnotationsForStudy,
  getAnnotationsByUser,
  toggleAnnotationVisibility,
  toggleAnnotationLock,
  bulkSaveAnnotations,
  exportAnnotationsForReport
};
