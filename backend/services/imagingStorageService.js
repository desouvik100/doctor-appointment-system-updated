/**
 * Imaging Storage Service
 * Handles DICOM file storage and retrieval with Cloudinary integration
 */

const cloudinary = require('cloudinary').v2;
const DicomStudy = require('../models/DicomStudy');
const { parseDicomFile, parseMultipleDicomFiles, validateDicomFile } = require('./dicomParserService');
const { validatePatientById } = require('./patientValidationService');
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary (should be done in app initialization)
// cloudinary.config is expected to be set via environment variables

/**
 * Upload a single DICOM file
 * @param {Buffer} fileBuffer - The DICOM file buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
async function uploadDicomFile(fileBuffer, options = {}) {
  const { patientId, clinicId, visitId, folder = 'dicom' } = options;
  
  // Validate DICOM file
  const validation = validateDicomFile(fileBuffer);
  if (!validation.isValid) {
    throw new Error(`Invalid DICOM file: ${validation.error}`);
  }
  
  // Parse metadata
  const parseResult = parseDicomFile(fileBuffer);
  if (!parseResult.success) {
    throw new Error(`Failed to parse DICOM file: ${parseResult.error}`);
  }
  
  const { metadata } = parseResult;
  
  // Generate unique filename
  const filename = `${metadata.image.sopInstanceUID || uuidv4()}.dcm`;
  const uploadPath = `${folder}/${clinicId}/${patientId}/${metadata.study.studyInstanceUID}/${filename}`;
  
  try {
    // Upload to Cloudinary as raw file
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: uploadPath,
          folder: folder,
          tags: ['dicom', metadata.series.modality],
          context: {
            patientId: patientId,
            studyDate: metadata.study.studyDate?.toISOString(),
            modality: metadata.series.modality
          }
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      uploadStream.end(fileBuffer);
    });
    
    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      metadata: metadata,
      size: fileBuffer.length
    };
  } catch (error) {
    throw new Error(`Failed to upload DICOM file: ${error.message}`);
  }
}

/**
 * Upload multiple DICOM files as a study
 * @param {Array<Buffer>} fileBuffers - Array of DICOM file buffers
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Study creation result
 */
async function uploadDicomStudy(fileBuffers, options = {}) {
  const { patientId, clinicId, visitId, validatePatient = true, acknowledgedMismatch = false } = options;
  
  if (!fileBuffers || fileBuffers.length === 0) {
    throw new Error('No DICOM files provided');
  }
  
  // Parse all files to get study metadata
  const parseResult = parseMultipleDicomFiles(fileBuffers);
  if (!parseResult.success) {
    throw new Error(parseResult.error);
  }
  
  const { study } = parseResult;
  
  // Validate patient if required
  let patientValidation = null;
  if (validatePatient && patientId) {
    patientValidation = await validatePatientById(study.patient, patientId);
    
    if (!patientValidation.isMatch && !acknowledgedMismatch) {
      return {
        success: false,
        requiresConfirmation: true,
        patientValidation: patientValidation,
        studyInfo: {
          studyDate: study.studyDate,
          modality: study.modality,
          description: study.studyDescription,
          totalImages: study.totalImages
        }
      };
    }
  }
  
  // Upload all files
  const uploadResults = [];
  const errors = [];
  
  for (let i = 0; i < fileBuffers.length; i++) {
    try {
      const result = await uploadDicomFile(fileBuffers[i], {
        patientId,
        clinicId,
        visitId,
        folder: 'dicom'
      });
      uploadResults.push(result);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }
  
  if (uploadResults.length === 0) {
    throw new Error('Failed to upload any DICOM files');
  }
  
  // Organize images by series
  const seriesMap = new Map();
  
  uploadResults.forEach(result => {
    const seriesUID = result.metadata.series.seriesInstanceUID;
    
    if (!seriesMap.has(seriesUID)) {
      seriesMap.set(seriesUID, {
        seriesInstanceUID: seriesUID,
        seriesNumber: result.metadata.series.seriesNumber,
        seriesDescription: result.metadata.series.seriesDescription,
        modality: result.metadata.series.modality,
        numberOfImages: 0,
        images: []
      });
    }
    
    const series = seriesMap.get(seriesUID);
    series.numberOfImages++;
    series.images.push({
      sopInstanceUID: result.metadata.image.sopInstanceUID,
      instanceNumber: result.metadata.image.instanceNumber,
      imageUrl: result.url,
      rows: result.metadata.image.rows,
      columns: result.metadata.image.columns,
      bitsAllocated: result.metadata.image.bitsAllocated,
      pixelSpacing: result.metadata.image.pixelSpacing,
      windowCenter: result.metadata.image.windowCenter,
      windowWidth: result.metadata.image.windowWidth,
      sliceLocation: result.metadata.image.sliceLocation,
      sliceThickness: result.metadata.image.sliceThickness
    });
  });
  
  // Sort images within each series by instance number
  seriesMap.forEach(series => {
    series.images.sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));
  });
  
  // Create study record in database
  const studyRecord = new DicomStudy({
    patientId: patientId,
    clinicId: clinicId,
    visitId: visitId,
    
    studyInstanceUID: study.studyInstanceUID,
    accessionNumber: study.accessionNumber,
    studyDate: study.studyDate,
    studyTime: study.studyTime,
    studyDescription: study.studyDescription,
    
    dicomPatientId: study.patient.patientId,
    dicomPatientName: study.patient.patientName,
    patientBirthDate: study.patient.birthDate,
    patientSex: study.patient.sex,
    
    modality: study.modality,
    bodyPartExamined: study.bodyPartExamined,
    
    institutionName: study.institution?.institutionName,
    referringPhysician: study.institution?.referringPhysician,
    
    series: Array.from(seriesMap.values()),
    
    totalImages: uploadResults.length,
    totalSeries: seriesMap.size,
    storageSize: uploadResults.reduce((sum, r) => sum + (r.size || 0), 0),
    
    patientIdValidated: patientValidation?.isMatch || false,
    patientIdMismatchAcknowledged: acknowledgedMismatch
  });
  
  await studyRecord.save();
  
  return {
    success: true,
    studyId: studyRecord._id,
    studyInstanceUID: study.studyInstanceUID,
    totalImages: uploadResults.length,
    totalSeries: seriesMap.size,
    errors: errors.length > 0 ? errors : undefined,
    patientValidation: patientValidation
  };
}


/**
 * Get study by ID
 * @param {string} studyId - Study MongoDB ID
 * @returns {Promise<Object>} Study details
 */
async function getStudyById(studyId) {
  const study = await DicomStudy.findById(studyId)
    .populate('patientId', 'name email phone')
    .populate('uploadedBy', 'name')
    .lean();
  
  if (!study) {
    throw new Error('Study not found');
  }
  
  return study;
}

/**
 * Get study by Study Instance UID
 * @param {string} studyInstanceUID - DICOM Study Instance UID
 * @returns {Promise<Object>} Study details
 */
async function getStudyByUID(studyInstanceUID) {
  const study = await DicomStudy.findOne({ studyInstanceUID })
    .populate('patientId', 'name email phone')
    .lean();
  
  if (!study) {
    throw new Error('Study not found');
  }
  
  return study;
}

/**
 * Get patient's imaging history
 * @param {string} patientId - Patient MongoDB ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of studies
 */
async function getPatientImagingHistory(patientId, options = {}) {
  const { limit = 50, modality, startDate, endDate, includeReports = false } = options;
  
  const query = { patientId };
  
  if (modality) {
    query.modality = modality;
  }
  
  if (startDate || endDate) {
    query.studyDate = {};
    if (startDate) query.studyDate.$gte = new Date(startDate);
    if (endDate) query.studyDate.$lte = new Date(endDate);
  }
  
  let projection = 'studyInstanceUID studyDate modality bodyPartExamined studyDescription totalImages totalSeries';
  if (includeReports) {
    projection += ' reports';
  }
  
  const studies = await DicomStudy.find(query)
    .sort({ studyDate: -1 })
    .limit(limit)
    .select(projection)
    .lean();
  
  return studies;
}

/**
 * Get image data for viewing
 * @param {string} studyId - Study ID
 * @param {string} seriesUID - Series Instance UID (optional)
 * @param {number} imageIndex - Image index within series (optional)
 * @returns {Promise<Object>} Image data with URL
 */
async function getImageData(studyId, seriesUID = null, imageIndex = 0) {
  const study = await DicomStudy.findById(studyId).lean();
  
  if (!study) {
    throw new Error('Study not found');
  }
  
  let series;
  if (seriesUID) {
    series = study.series.find(s => s.seriesInstanceUID === seriesUID);
  } else {
    series = study.series[0];
  }
  
  if (!series) {
    throw new Error('Series not found');
  }
  
  const image = series.images[imageIndex];
  if (!image) {
    throw new Error('Image not found');
  }
  
  return {
    studyId: study._id,
    seriesUID: series.seriesInstanceUID,
    imageIndex: imageIndex,
    totalImages: series.images.length,
    imageUrl: image.imageUrl,
    metadata: {
      rows: image.rows,
      columns: image.columns,
      pixelSpacing: image.pixelSpacing,
      windowCenter: image.windowCenter,
      windowWidth: image.windowWidth,
      sliceLocation: image.sliceLocation
    }
  };
}

/**
 * Delete a study and its files
 * @param {string} studyId - Study ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteStudy(studyId) {
  const study = await DicomStudy.findById(studyId);
  
  if (!study) {
    throw new Error('Study not found');
  }
  
  // Delete files from Cloudinary
  const deletePromises = [];
  
  study.series.forEach(series => {
    series.images.forEach(image => {
      if (image.imageUrl) {
        // Extract public ID from URL and delete
        const publicId = extractPublicIdFromUrl(image.imageUrl);
        if (publicId) {
          deletePromises.push(
            cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
              .catch(err => console.error(`Failed to delete ${publicId}:`, err))
          );
        }
      }
    });
  });
  
  await Promise.all(deletePromises);
  
  // Delete database record
  await DicomStudy.findByIdAndDelete(studyId);
  
  return { success: true, deletedImages: deletePromises.length };
}

/**
 * Extract Cloudinary public ID from URL
 */
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/v{version}/'
    const pathParts = urlParts.slice(uploadIndex + 2);
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
    
    return publicId;
  } catch {
    return null;
  }
}

/**
 * Generate thumbnail for a DICOM image
 * @param {string} studyId - Study ID
 * @param {string} seriesUID - Series UID
 * @param {number} imageIndex - Image index
 * @returns {Promise<string>} Thumbnail URL
 */
async function generateThumbnail(studyId, seriesUID, imageIndex = 0) {
  // For DICOM files, we'd need to render them server-side
  // This is a placeholder - actual implementation would use a DICOM rendering library
  const imageData = await getImageData(studyId, seriesUID, imageIndex);
  
  // Return the original URL for now - in production, you'd generate an actual thumbnail
  return imageData.imageUrl;
}

module.exports = {
  uploadDicomFile,
  uploadDicomStudy,
  getStudyById,
  getStudyByUID,
  getPatientImagingHistory,
  getImageData,
  deleteStudy,
  generateThumbnail
};
