/**
 * useCloudinaryUpload Hook
 * Unified hook for all Cloudinary upload operations
 */

import { useState, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Generic upload function
  const upload = useCallback(async (endpoint, file, additionalData = {}, options = {}) => {
    if (!file) {
      setError('No file selected');
      return null;
    }

    // Validate file size
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File must be less than ${maxMB}MB`);
      setError(`File too large (max ${maxMB}MB)`);
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);
    
    // Add additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      if (response.data.success) {
        if (!options.silent) {
          toast.success(options.successMessage || 'Upload successful!');
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMsg);
      if (!options.silent) {
        toast.error(errorMsg);
      }
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  // Specific upload functions
  const uploadProfilePhoto = useCallback((file) => {
    return upload('/api/upload/profile-photo', file, {}, {
      fieldName: 'photo',
      maxSize: 5 * 1024 * 1024,
      successMessage: 'Profile photo updated!'
    });
  }, [upload]);

  const uploadMedicalFile = useCallback((file, data) => {
    return upload('/api/medical-files/upload', file, data, {
      fieldName: 'file',
      maxSize: 10 * 1024 * 1024,
      successMessage: 'Medical file uploaded!'
    });
  }, [upload]);

  const uploadPrescription = useCallback((file, appointmentId) => {
    return upload('/api/upload/prescription', file, { appointmentId }, {
      fieldName: 'prescription',
      maxSize: 10 * 1024 * 1024,
      successMessage: 'Prescription uploaded!'
    });
  }, [upload]);

  const uploadChatAttachment = useCallback((file, conversationId) => {
    return upload('/api/upload/chat-attachment', file, { conversationId }, {
      fieldName: 'attachment',
      maxSize: 10 * 1024 * 1024,
      silent: true // Don't show toast for chat
    });
  }, [upload]);

  const uploadClinicLogo = useCallback((file, clinicId) => {
    return upload('/api/upload/clinic-logo', file, { clinicId }, {
      fieldName: 'logo',
      maxSize: 5 * 1024 * 1024,
      successMessage: 'Clinic logo updated!'
    });
  }, [upload]);

  const uploadClinicPhoto = useCallback((file, clinicId) => {
    return upload('/api/upload/clinic-photo', file, { clinicId }, {
      fieldName: 'photo',
      maxSize: 5 * 1024 * 1024,
      successMessage: 'Photo added to gallery!'
    });
  }, [upload]);

  const uploadVerificationDoc = useCallback((file, docType) => {
    return upload('/api/upload/verification-doc', file, { docType }, {
      fieldName: 'document',
      maxSize: 10 * 1024 * 1024,
      successMessage: 'Document uploaded for verification!'
    });
  }, [upload]);

  const uploadArticleImage = useCallback((file, articleId) => {
    return upload('/api/upload/article-image', file, { articleId }, {
      fieldName: 'image',
      maxSize: 5 * 1024 * 1024,
      successMessage: 'Article image uploaded!'
    });
  }, [upload]);

  // Delete file
  const deleteFile = useCallback(async (publicId) => {
    try {
      const response = await axios.delete(`/api/upload/file/${encodeURIComponent(publicId)}`);
      if (response.data.success) {
        toast.success('File deleted');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Failed to delete file');
      return false;
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    upload,
    uploadProfilePhoto,
    uploadMedicalFile,
    uploadPrescription,
    uploadChatAttachment,
    uploadClinicLogo,
    uploadClinicPhoto,
    uploadVerificationDoc,
    uploadArticleImage,
    deleteFile
  };
};

export default useCloudinaryUpload;
