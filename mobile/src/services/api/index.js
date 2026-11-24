
export { default as apiClient } from './apiClient';
export * from './apiClient';
export { default as authService } from './authService';
export * from './authService';
export { default as appointmentService } from './appointmentService';
export * from './appointmentService';
export { default as doctorService } from './doctorService';
export * from './doctorService';
export { default as reviewService } from './reviewService';
export * from './reviewService';
export { default as walletService } from './walletService';
export * from './walletService';
export { default as healthRecordService } from './healthRecordService';
export * from './healthRecordService';
export { default as familyService } from './familyService';
export * from './familyService';
export { default as profileService } from './profileService';
export * from './profileService';
export { default as imagingService } from './imagingService';
export * from './imagingService';
export { default as prescriptionService } from './prescriptionService';
export * from './prescriptionService';
export { default as insuranceService } from './insuranceService';
export * from './insuranceService';
export { default as notificationService } from './notificationService';
export * from './notificationService';
export { default as whatsappApiService } from './whatsappApiService';
export * from './whatsappApiService';
export { default as pushNotificationApiService } from './pushNotificationApiService';
export * from './pushNotificationApiService';
export { default as socketManager } from './socketManager';
export * from './socketManager';
export { default as doctorDashboardApi } from './doctorDashboardApi';
export * from './doctorDashboardApi';

export { default as staffDashboardApi } from './staffDashboardApi';
export * from './staffDashboardApi';

export { default as adminDashboardApi } from './adminDashboardApi';
export * from './adminDashboardApi';
export { default as adminApi } from './adminApi';
export * from './adminApi';
import authService from './authService';
import appointmentService from './appointmentService';
import doctorService from './doctorService';
import reviewService from './reviewService';
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

export default {
  auth: authService,
  appointments: appointmentService,
  doctors: doctorService,
  reviews: reviewService,
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
