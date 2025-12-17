/**
 * Cloudinary Service
 * Handles secure file uploads to Cloudinary cloud storage
 * Never stores images locally or in database
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Check if Cloudinary is configured
const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path or base64 data
 * @param {object} options - Upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadFile = async (filePath, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }

  const defaultOptions = {
    folder: 'healthsync/medical-files',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp'],
    max_bytes: 10 * 1024 * 1024, // 10MB max
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  try {
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    return {
      success: true,
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
      sizeBytes: result.bytes,
      sizeKB: Math.round(result.bytes / 1024),
      width: result.width,
      height: result.height,
      originalFilename: result.original_filename
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload medical file with specific folder structure
 * @param {string} filePath - File path or base64
 * @param {string} patientId - Patient's user ID
 * @param {string} category - File category (prescription, lab_report, etc.)
 */
const uploadMedicalFile = async (filePath, patientId, category = 'general') => {
  const folder = `healthsync/patients/${patientId}/${category}`;
  
  return uploadFile(filePath, {
    folder,
    tags: ['medical', category, patientId],
    context: {
      patient_id: patientId,
      category: category,
      uploaded_at: new Date().toISOString()
    }
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
const deleteFile = async (publicId) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Generate a signed URL with expiration (for secure access)
 * @param {string} publicId - Cloudinary public ID
 * @param {number} expiresInSeconds - URL expiration time (default 1 hour)
 */
const getSignedUrl = (publicId, expiresInSeconds = 3600) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.round(Date.now() / 1000) + expiresInSeconds;
  
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    expires_at: timestamp,
    secure: true
  });
};

/**
 * Get optimized URL for displaying images
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Image transformations
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true
  };

  return cloudinary.url(publicId, { ...defaultTransformations, ...transformations });
};

/**
 * Get thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 */
const getThumbnailUrl = (publicId, width = 150, height = 150) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true
  });
};

// ============================================
// PROFILE PHOTO UPLOADS
// ============================================

/**
 * Upload profile photo with face detection & auto-crop
 * @param {string} filePath - File path or base64
 * @param {string} userId - User ID
 * @param {string} userType - 'patient', 'doctor', 'clinic'
 */
const uploadProfilePhoto = async (filePath, userId, userType = 'patient') => {
  const folder = `healthsync/profiles/${userType}s`;
  
  return uploadFile(filePath, {
    folder,
    public_id: `${userType}_${userId}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    tags: ['profile', userType, userId]
  });
};

/**
 * Get profile photo URL with different sizes
 */
const getProfilePhotoUrl = (publicId, size = 'medium') => {
  const sizes = {
    small: { width: 50, height: 50 },
    medium: { width: 150, height: 150 },
    large: { width: 300, height: 300 },
    original: {}
  };
  
  const dimensions = sizes[size] || sizes.medium;
  
  return cloudinary.url(publicId, {
    ...dimensions,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    default_image: 'healthsync/defaults/avatar_placeholder'
  });
};

// ============================================
// DOCTOR VERIFICATION DOCUMENTS
// ============================================

/**
 * Upload doctor verification document (license, degree, ID)
 */
const uploadVerificationDoc = async (filePath, doctorId, docType) => {
  const folder = `healthsync/verification/${doctorId}`;
  
  return uploadFile(filePath, {
    folder,
    public_id: `${docType}_${Date.now()}`,
    resource_type: 'auto',
    tags: ['verification', docType, doctorId],
    context: {
      doctor_id: doctorId,
      doc_type: docType,
      uploaded_at: new Date().toISOString(),
      status: 'pending_review'
    }
  });
};

// ============================================
// PRESCRIPTION UPLOADS WITH OCR
// ============================================

/**
 * Upload prescription image
 */
const uploadPrescription = async (filePath, appointmentId, uploadedBy) => {
  const folder = `healthsync/prescriptions/${appointmentId}`;
  
  return uploadFile(filePath, {
    folder,
    tags: ['prescription', appointmentId, uploadedBy],
    context: {
      appointment_id: appointmentId,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString()
    }
  });
};

/**
 * Extract text from prescription using Cloudinary OCR
 */
const extractTextFromImage = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      ocr: 'adv_ocr'
    });
    
    if (result.info && result.info.ocr && result.info.ocr.adv_ocr) {
      const textAnnotations = result.info.ocr.adv_ocr.data[0]?.textAnnotations || [];
      const fullText = textAnnotations[0]?.description || '';
      return { success: true, text: fullText, annotations: textAnnotations };
    }
    
    return { success: false, text: '', message: 'No text found' };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return { success: false, text: '', error: error.message };
  }
};

// ============================================
// CHAT ATTACHMENTS
// ============================================

/**
 * Upload chat attachment (image/document)
 */
const uploadChatAttachment = async (filePath, conversationId, senderId) => {
  const folder = `healthsync/chat/${conversationId}`;
  
  return uploadFile(filePath, {
    folder,
    tags: ['chat', conversationId, senderId],
    context: {
      conversation_id: conversationId,
      sender_id: senderId,
      sent_at: new Date().toISOString()
    }
  });
};

// ============================================
// CLINIC PHOTOS & LOGOS
// ============================================

/**
 * Upload clinic logo
 */
const uploadClinicLogo = async (filePath, clinicId) => {
  const folder = 'healthsync/clinics/logos';
  
  return uploadFile(filePath, {
    folder,
    public_id: `clinic_${clinicId}`,
    overwrite: true,
    transformation: [
      { width: 300, height: 300, crop: 'fit' },
      { quality: 'auto:good' }
    ],
    tags: ['clinic', 'logo', clinicId]
  });
};

/**
 * Upload clinic gallery photo
 */
const uploadClinicPhoto = async (filePath, clinicId, photoIndex) => {
  const folder = `healthsync/clinics/${clinicId}/gallery`;
  
  return uploadFile(filePath, {
    folder,
    public_id: `photo_${photoIndex}`,
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto:good' }
    ],
    tags: ['clinic', 'gallery', clinicId]
  });
};

// ============================================
// HEALTH ARTICLES / BLOG IMAGES
// ============================================

/**
 * Upload article featured image
 */
const uploadArticleImage = async (filePath, articleId) => {
  const folder = 'healthsync/articles';
  
  return uploadFile(filePath, {
    folder,
    public_id: `article_${articleId}`,
    overwrite: true,
    transformation: [
      { width: 1200, height: 630, crop: 'fill' }, // OG image size
      { quality: 'auto:good' }
    ],
    tags: ['article', 'blog', articleId]
  });
};

// ============================================
// WATERMARKING (for doctor uploads)
// ============================================

/**
 * Get watermarked image URL
 */
const getWatermarkedUrl = (publicId, watermarkText = 'HealthSync') => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto' },
      {
        overlay: {
          font_family: 'Arial',
          font_size: 20,
          text: watermarkText
        },
        gravity: 'south_east',
        opacity: 50,
        x: 10,
        y: 10
      }
    ],
    secure: true
  });
};

// ============================================
// PDF PREVIEW
// ============================================

/**
 * Get PDF preview as image (first page)
 */
const getPdfPreviewUrl = (publicId, page = 1) => {
  return cloudinary.url(publicId, {
    page: page,
    format: 'jpg',
    width: 400,
    crop: 'limit',
    quality: 'auto',
    secure: true
  });
};

// ============================================
// BULK DELETE
// ============================================

/**
 * Delete multiple files by prefix (folder)
 */
const deleteByPrefix = async (prefix) => {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix);
    return { success: true, deleted: result.deleted };
  } catch (error) {
    console.error('Bulk delete error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all files for a user (GDPR compliance)
 */
const deleteUserData = async (userId, userType = 'patient') => {
  const prefixes = [
    `healthsync/profiles/${userType}s/${userType}_${userId}`,
    `healthsync/patients/${userId}`,
    `healthsync/chat`
  ];
  
  const results = [];
  for (const prefix of prefixes) {
    const result = await deleteByPrefix(prefix);
    results.push({ prefix, ...result });
  }
  
  return results;
};

// ============================================
// VIDEO UPLOADS (for testimonials/consultations)
// ============================================

/**
 * Upload video file
 */
const uploadVideo = async (filePath, folder, options = {}) => {
  return uploadFile(filePath, {
    folder: `healthsync/videos/${folder}`,
    resource_type: 'video',
    eager: [
      { format: 'mp4', video_codec: 'h264' },
      { format: 'webm', video_codec: 'vp9' }
    ],
    eager_async: true,
    ...options
  });
};

/**
 * Get video thumbnail
 */
const getVideoThumbnail = (publicId, time = '0') => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    start_offset: time,
    width: 400,
    crop: 'fill',
    secure: true
  });
};

module.exports = {
  // Core
  isConfigured,
  uploadFile,
  deleteFile,
  getSignedUrl,
  getOptimizedUrl,
  getThumbnailUrl,
  cloudinary,
  
  // Medical Files
  uploadMedicalFile,
  
  // Profile Photos
  uploadProfilePhoto,
  getProfilePhotoUrl,
  
  // Doctor Verification
  uploadVerificationDoc,
  
  // Prescriptions & OCR
  uploadPrescription,
  extractTextFromImage,
  
  // Chat
  uploadChatAttachment,
  
  // Clinic
  uploadClinicLogo,
  uploadClinicPhoto,
  
  // Articles
  uploadArticleImage,
  
  // Transformations
  getWatermarkedUrl,
  getPdfPreviewUrl,
  
  // Cleanup
  deleteByPrefix,
  deleteUserData,
  
  // Video
  uploadVideo,
  getVideoThumbnail
};
