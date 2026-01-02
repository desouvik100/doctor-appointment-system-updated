/**
 * API Services Index - Export all services
 */

export { default as apiClient } from './apiClient';
export * from './apiClient';

export { default as authService } from './authService';
export * from './authService';

export { default as appointmentService } from './appointmentService';
export * from './appointmentService';

export { default as doctorService } from './doctorService';
export * from './doctorService';

export { default as walletService } from './walletService';
export * from './walletService';

export { default as healthRecordService } from './healthRecordService';
export * from './healthRecordService';

export { default as familyService } from './familyService';
export * from './familyService';

// Re-export commonly used functions
import authService from './authService';
import appointmentService from './appointmentService';
import doctorService from './doctorService';
import walletService from './walletService';
import healthRecordService from './healthRecordService';
import familyService from './familyService';

export default {
  auth: authService,
  appointments: appointmentService,
  doctors: doctorService,
  wallet: walletService,
  healthRecords: healthRecordService,
  family: familyService,
};
