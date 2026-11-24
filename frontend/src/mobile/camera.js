/**
 * Camera & File Upload - Capacitor Camera and Filesystem
 * For uploading prescription images and documents
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import axiosInstance from '../api/config';

/**
 * Take a photo or select from gallery
 * @param {object} options - Camera options
 * @returns {Promise<object>} Photo data
 */
export const captureImage = async (options = {}) => {
  const defaultOptions = {
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt, // Let user choose camera or gallery
    width: 1200,
    height: 1600,
    correctOrientation: true
  };

  try {
    const photo = await Camera.getPhoto({
      ...defaultOptions,
      ...options
    });

    return {
      success: true,
      base64: photo.base64String,
      format: photo.format,
      webPath: photo.webPath,
      dataUrl: `data:image/${photo.format};base64,${photo.base64String}`
    };
  } catch (error) {
    console.error('Camera error:', error);
    
    // User cancelled
    if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      return { success: false, cancelled: true };
    }
    
    throw new Error(error.message || 'Failed to capture image');
  }
};

/**
 * Take photo from camera only
 */
export const takePhoto = async (options = {}) => {
  return captureImage({
    ...options,
    source: CameraSource.Camera
  });
};

/**
 * Select photo from gallery
 */
export const selectFromGallery = async (options = {}) => {
  return captureImage({
    ...options,
    source: CameraSource.Photos
  });
};

/**
 * Upload prescription image to backend
 * @param {string} appointmentId - Appointment ID
 * @param {string} base64Image - Base64 encoded image
 * @param {string} format - Image format (jpeg, png)
 * @param {string} description - Optional description
 */
export const uploadPrescription = async (appointmentId, base64Image, format = 'jpeg', description = '') => {
  try {
    const response = await axiosInstance.post('/api/prescriptions/upload', {
      appointmentId,
      image: base64Image,
      format,
      description,
      uploadedFrom: Capacitor.getPlatform()
    });

    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload prescription');
  }
};

/**
 * Capture and upload prescription in one step
 */
export const captureAndUploadPrescription = async (appointmentId, description = '') => {
  // Capture image
  const photo = await captureImage();
  
  if (!photo.success) {
    return photo; // Return cancelled or error state
  }

  // Upload to backend
  const uploadResult = await uploadPrescription(
    appointmentId,
    photo.base64,
    photo.format,
    description
  );

  return {
    success: true,
    ...uploadResult,
    localPreview: photo.dataUrl
  };
};

/**
 * Save image to device gallery
 */
export const saveToGallery = async (base64Image, fileName = 'prescription') => {
  if (!Capacitor.isNativePlatform()) {
    // For web, trigger download
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = `${fileName}.jpg`;
    link.click();
    return { success: true };
  }

  try {
    const result = await Filesystem.writeFile({
      path: `${fileName}_${Date.now()}.jpg`,
      data: base64Image,
      directory: Directory.Documents
    });

    return {
      success: true,
      uri: result.uri
    };
  } catch (error) {
    console.error('Save to gallery error:', error);
    throw new Error('Failed to save image');
  }
};

/**
 * Read file as base64
 */
export const readFileAsBase64 = async (path) => {
  try {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Documents
    });

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Read file error:', error);
    throw new Error('Failed to read file');
  }
};

/**
 * Check camera permissions
 */
export const checkCameraPermissions = async () => {
  try {
    const permissions = await Camera.checkPermissions();
    return {
      camera: permissions.camera,
      photos: permissions.photos
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return { camera: 'prompt', photos: 'prompt' };
  }
};

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async () => {
  try {
    const permissions = await Camera.requestPermissions();
    return {
      camera: permissions.camera,
      photos: permissions.photos
    };
  } catch (error) {
    console.error('Permission request error:', error);
    throw new Error('Failed to request camera permissions');
  }
};

export default {
  captureImage,
  takePhoto,
  selectFromGallery,
  uploadPrescription,
  captureAndUploadPrescription,
  saveToGallery,
  readFileAsBase64,
  checkCameraPermissions,
  requestCameraPermissions
};
