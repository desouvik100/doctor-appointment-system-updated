/**
 * WhatsApp API Service - Backend WhatsApp Integration
 * 
 * Provides functions for sending WhatsApp messages via the backend API.
 * This service wraps the backend WhatsApp routes for prescription sharing,
 * appointment reminders, and other notifications.
 * 
 * Production-ready with error handling, retry logic, and offline support.
 * 
 * @module whatsappApiService
 */

import apiClient, { isNetworkError, getErrorMessage } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

// Cache keys
const WHATSAPP_QUEUE_KEY = 'whatsapp_offline_queue';
const WHATSAPP_HISTORY_KEY = 'whatsapp_send_history';

/**
 * @typedef {Object} WhatsAppResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [message] - Status message
 * @property {string} [provider] - WhatsApp provider used (meta, twilio, walink)
 * @property {string} [link] - wa.me link if manual send required
 * @property {boolean} [requiresManualSend] - Whether user needs to click link
 * @property {string} [messageId] - Message ID if sent via API
 * @property {boolean} [queued] - Whether message was queued for later
 */

/**
 * Queue a WhatsApp message for later sending (offline support)
 * @private
 */
const queueMessage = async (type, data) => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(WHATSAPP_QUEUE_KEY) || '[]');
    queue.push({
      type,
      data,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(WHATSAPP_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to queue WhatsApp message:', error);
    return false;
  }
};

/**
 * Log WhatsApp send history for analytics
 * @private
 */
const logSendHistory = async (type, success, details = {}) => {
  try {
    const history = JSON.parse(await AsyncStorage.getItem(WHATSAPP_HISTORY_KEY) || '[]');
    history.unshift({
      type,
      success,
      timestamp: new Date().toISOString(),
      ...details,
    });
    // Keep only last 100 entries
    if (history.length > 100) history.length = 100;
    await AsyncStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    // Silent fail for logging
  }
};

/**
 * Open WhatsApp link directly on device (fallback for manual send)
 * 
 * @param {string} link - wa.me link to open
 * @returns {Promise<boolean>} Whether WhatsApp was opened successfully
 */
export const openWhatsAppLink = async (link) => {
  try {
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) {
      await Linking.openURL(link);
      return true;
    }
    // Try web fallback
    const webLink = link.replace('whatsapp://', 'https://wa.me/');
    await Linking.openURL(webLink);
    return true;
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    return false;
  }
};

/**
 * Check if WhatsApp is installed on device
 * 
 * @returns {Promise<boolean>}
 */
export const isWhatsAppInstalled = async () => {
  try {
    const url = Platform.OS === 'ios' ? 'whatsapp://' : 'whatsapp://send';
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
};

/**
 * Send prescription via WhatsApp
 * 
 * @param {string} prescriptionId - The prescription ID
 * @param {string} [patientPhone] - Override patient phone number
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.openLink=true] - Auto-open WhatsApp link if manual send required
 * @param {boolean} [options.queueIfOffline=true] - Queue message if offline
 * @returns {Promise<WhatsAppResult>}
 */
export const sendPrescription = async (prescriptionId, patientPhone, options = {}) => {
  const { openLink = true, queueIfOffline = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-prescription', {
      prescriptionId,
      patientPhone,
    });
    
    const result = response.data;
    
    // Auto-open WhatsApp if manual send required
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('prescription', true, { prescriptionId });
    return result;
    
  } catch (error) {
    // Queue for later if offline
    if (isNetworkError(error) && queueIfOffline) {
      const queued = await queueMessage('prescription', { prescriptionId, patientPhone });
      await logSendHistory('prescription', false, { prescriptionId, queued, error: 'offline' });
      return {
        success: false,
        queued,
        message: queued ? 'Message queued for sending when online' : 'Failed to send',
      };
    }
    
    await logSendHistory('prescription', false, { prescriptionId, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send appointment reminder via WhatsApp
 * 
 * @param {string} appointmentId - The appointment ID
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.openLink=true] - Auto-open WhatsApp link if manual send required
 * @param {boolean} [options.queueIfOffline=true] - Queue message if offline
 * @returns {Promise<WhatsAppResult>}
 */
export const sendAppointmentReminder = async (appointmentId, options = {}) => {
  const { openLink = true, queueIfOffline = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-reminder', {
      appointmentId,
    });
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('reminder', true, { appointmentId });
    return result;
    
  } catch (error) {
    if (isNetworkError(error) && queueIfOffline) {
      const queued = await queueMessage('reminder', { appointmentId });
      await logSendHistory('reminder', false, { appointmentId, queued, error: 'offline' });
      return {
        success: false,
        queued,
        message: queued ? 'Reminder queued for sending when online' : 'Failed to send',
      };
    }
    
    await logSendHistory('reminder', false, { appointmentId, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send appointment confirmation via WhatsApp
 * 
 * @param {string} appointmentId - The appointment ID
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendAppointmentConfirmation = async (appointmentId, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-confirmation', {
      appointmentId,
    });
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('confirmation', true, { appointmentId });
    return result;
    
  } catch (error) {
    await logSendHistory('confirmation', false, { appointmentId, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send lab report notification via WhatsApp
 * 
 * @param {Object} reportData - Lab report data
 * @param {string} [reportData.patientId] - Patient ID
 * @param {string} [reportData.patientPhone] - Patient phone number
 * @param {string} reportData.testName - Name of the test
 * @param {Date|string} [reportData.reportDate] - Report date
 * @param {string} [reportData.reportUrl] - URL to download report
 * @param {string} [reportData.clinicName] - Clinic name
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendLabReportNotification = async (reportData, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-lab-report', reportData);
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('lab_report', true, { testName: reportData.testName });
    return result;
    
  } catch (error) {
    await logSendHistory('lab_report', false, { testName: reportData.testName, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send payment receipt via WhatsApp
 * 
 * @param {string} appointmentId - The appointment ID
 * @param {string} [patientPhone] - Override patient phone number
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendPaymentReceipt = async (appointmentId, patientPhone, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-payment-receipt', {
      appointmentId,
      patientPhone,
    });
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('receipt', true, { appointmentId });
    return result;
    
  } catch (error) {
    await logSendHistory('receipt', false, { appointmentId, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send follow-up reminder via WhatsApp
 * 
 * @param {Object} followUpData - Follow-up data
 * @param {string} [followUpData.patientId] - Patient ID
 * @param {string} [followUpData.patientPhone] - Patient phone number
 * @param {string} followUpData.doctorName - Doctor name
 * @param {Date|string} followUpData.followUpDate - Follow-up date
 * @param {string} [followUpData.reason] - Reason for follow-up
 * @param {string} [followUpData.clinicName] - Clinic name
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendFollowUpReminder = async (followUpData, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-followup-reminder', followUpData);
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('followup', true, { doctorName: followUpData.doctorName });
    return result;
    
  } catch (error) {
    await logSendHistory('followup', false, { error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send queue position update via WhatsApp
 * 
 * @param {string} appointmentId - The appointment ID
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendQueueUpdate = async (appointmentId, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-queue-update', {
      appointmentId,
    });
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    return result;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Send custom message via WhatsApp
 * 
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @param {string} [clinicName] - Clinic name for branding
 * @param {Object} [options] - Additional options
 * @returns {Promise<WhatsAppResult>}
 */
export const sendCustomMessage = async (phone, message, clinicName, options = {}) => {
  const { openLink = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-custom', {
      phone,
      message,
      clinicName,
    });
    
    const result = response.data;
    
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('custom', true, { phone });
    return result;
    
  } catch (error) {
    await logSendHistory('custom', false, { phone, error: getErrorMessage(error) });
    throw error;
  }
};

/**
 * Send bulk appointment reminders (admin/receptionist only)
 * 
 * @param {Object} [options] - Bulk reminder options
 * @param {string} [options.clinicId] - Filter by clinic ID
 * @param {Date|string} [options.date] - Target date (defaults to tomorrow)
 * @returns {Promise<{success: boolean, message: string, results: Object}>}
 */
export const sendBulkReminders = async (options = {}) => {
  const response = await apiClient.post('/whatsapp/bulk-reminder', options);
  await logSendHistory('bulk_reminder', true, { 
    total: response.data.results?.total,
    sent: response.data.results?.sent,
  });
  return response.data;
};

/**
 * Generate WhatsApp link for manual sending
 * 
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<WhatsAppResult>}
 */
export const generateWhatsAppLink = async (phone, message) => {
  const response = await apiClient.get('/whatsapp/generate-link', {
    params: { phone, message },
  });
  return response.data;
};

/**
 * Process queued WhatsApp messages (call when app comes online)
 * 
 * @returns {Promise<{processed: number, failed: number}>}
 */
export const processQueuedMessages = async () => {
  const results = { processed: 0, failed: 0 };
  
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(WHATSAPP_QUEUE_KEY) || '[]');
    if (queue.length === 0) return results;
    
    const remaining = [];
    
    for (const item of queue) {
      try {
        switch (item.type) {
          case 'prescription':
            await sendPrescription(item.data.prescriptionId, item.data.patientPhone, { queueIfOffline: false });
            break;
          case 'reminder':
            await sendAppointmentReminder(item.data.appointmentId, { queueIfOffline: false });
            break;
          default:
            remaining.push(item);
            continue;
        }
        results.processed++;
      } catch (error) {
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 3) {
          remaining.push(item);
        }
        results.failed++;
      }
    }
    
    await AsyncStorage.setItem(WHATSAPP_QUEUE_KEY, JSON.stringify(remaining));
    
  } catch (error) {
    console.error('Failed to process WhatsApp queue:', error);
  }
  
  return results;
};

/**
 * Get WhatsApp send history for analytics
 * 
 * @param {number} [limit=50] - Number of entries to return
 * @returns {Promise<Array>}
 */
export const getSendHistory = async (limit = 50) => {
  try {
    const history = JSON.parse(await AsyncStorage.getItem(WHATSAPP_HISTORY_KEY) || '[]');
    return history.slice(0, limit);
  } catch {
    return [];
  }
};

/**
 * Clear WhatsApp send history
 * 
 * @returns {Promise<void>}
 */
export const clearSendHistory = async () => {
  await AsyncStorage.removeItem(WHATSAPP_HISTORY_KEY);
};

/**
 * Get pending queued messages count
 * 
 * @returns {Promise<number>}
 */
export const getQueuedCount = async () => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(WHATSAPP_QUEUE_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
};

export default {
  // Core sending functions
  sendPrescription,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendLabReportNotification,
  sendPaymentReceipt,
  sendFollowUpReminder,
  sendQueueUpdate,
  sendCustomMessage,
  sendBulkReminders,
  generateWhatsAppLink,
  
  // Utility functions
  openWhatsAppLink,
  isWhatsAppInstalled,
  processQueuedMessages,
  getSendHistory,
  clearSendHistory,
  getQueuedCount,
};
