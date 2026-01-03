/**
 * API Services Index - Export all services from single entry point
 * 
 * This module provides a centralized export for all API services,
 * ensuring consistent access patterns across the mobile application.
 * 
 * @module api
 */

// Core API Client
export { default as apiClient } from './apiClient';
export * from './apiClient';

// Authentication Service
export { default as authService } from './authService';
export * from './authService';

// Appointment Service
export { default as appointmentService } from './appointmentService';
export * from './appointmentService';

// Doctor Service
export { default as doctorService } from './doctorService';
export * from './doctorService';

// Wallet Service
export { default as walletService } from './walletService';
export * from './walletService';

// Health Record Service
export { default as healthRecordService } from './healthRecordService';
export * from './healthRecordService';

// Family Service
export { default as familyService } from './familyService';
export * from './familyService';

// Profile Service
export { default as profileService } from './profileService';
export * from './profileService';

// Imaging Service (Medical Imaging & DICOM)
export { default as imagingService } from './imagingService';
export * from './imagingService';

// Prescription Service
export { default as prescriptionService } from './prescriptionService';
export * from './prescriptionService';

// Insurance Service
export { default as insuranceService } from './insuranceService';
export * from './insuranceService';

// Notification Service
export { default as notificationService } from './notificationService';
export * from './notificationService';

// WhatsApp API Service (Backend Integration)
export { default as whatsappApiService } from './whatsappApiService';
export * from './whatsappApiService';

// Push Notification API Service (Device Registration)
export { default as pushNotificationApiService } from './pushNotificationApiService';
export * from './pushNotificationApiService';

// Socket Manager (Real-time Communication)
export { default as socketManager } from './socketManager';
export * from './socketManager';

// Import all services for default export
import authService from './authService';
import appointmentService from './appointmentService';
import doctorService from './doctorService';
import walletService from './walletService';
import healthRecordService from './healthRecordService';
import familyService from './familyService';
import profileService from './profileService';
import imagingService from './imagingService';
import prescriptionService from './prescriptionService';
import insuranceService from './insuranceService';
import notificationService from './notificationService';
import whatsappApiService from './whatsappApiService';
import pushNotificationApiService from './pushNotificationApiService';
import socketManager from './socketManager';

/**
 * Default export containing all API services
 * Provides convenient access via api.serviceName pattern
 */
export default {
  auth: authService,
  appointments: appointmentService,
  doctors: doctorService,
  wallet: walletService,
  healthRecords: healthRecordService,
  family: familyService,
  profile: profileService,
  imaging: imagingService,
  prescriptions: prescriptionService,
  insurance: insuranceService,
  notifications: notificationService,
  whatsapp: whatsappApiService,
  pushNotifications: pushNotificationApiService,
  socket: socketManager,
};
