

import apiClient, { isNetworkError, getErrorMessage } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
const WHATSAPP_QUEUE_KEY = 'whatsapp_offline_queue';
const WHATSAPP_HISTORY_KEY = 'whatsapp_send_history';

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

const logSendHistory = async (type, success, details = {}) => {
  try {
    const history = JSON.parse(await AsyncStorage.getItem(WHATSAPP_HISTORY_KEY) || '[]');
    history.unshift({
      type,
      success,
      timestamp: new Date().toISOString(),
      ...details,
    });
    if (history.length > 100) history.length = 100;
    await AsyncStorage.setItem(WHATSAPP_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
  }
};

export const openWhatsAppLink = async (link) => {
  try {
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) {
      await Linking.openURL(link);
      return true;
    }
    const webLink = link.replace('whatsapp://', 'https://wa.me/');
    await Linking.openURL(webLink);
    return true;
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    return false;
  }
};

export const isWhatsAppInstalled = async () => {
  try {
    const url = Platform.OS === 'ios' ? 'whatsapp://' : 'whatsapp://send';
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
};

export const sendPrescription = async (prescriptionId, patientPhone, options = {}) => {
  const { openLink = true, queueIfOffline = true } = options;
  
  try {
    const response = await apiClient.post('/whatsapp/send-prescription', {
      prescriptionId,
      patientPhone,
    });
    
    const result = response.data;
    if (result.requiresManualSend && result.link && openLink) {
      await openWhatsAppLink(result.link);
    }
    
    await logSendHistory('prescription', true, { prescriptionId });
    return result;
    
  } catch (error) {
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

export const sendBulkReminders = async (options = {}) => {
  const response = await apiClient.post('/whatsapp/bulk-reminder', options);
  await logSendHistory('bulk_reminder', true, { 
    total: response.data.results?.total,
    sent: response.data.results?.sent,
  });
  return response.data;
};

export const generateWhatsAppLink = async (phone, message) => {
  const response = await apiClient.get('/whatsapp/generate-link', {
    params: { phone, message },
  });
  return response.data;
};

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

export const getSendHistory = async (limit = 50) => {
  try {
    const history = JSON.parse(await AsyncStorage.getItem(WHATSAPP_HISTORY_KEY) || '[]');
    return history.slice(0, limit);
  } catch {
    return [];
  }
};

export const clearSendHistory = async () => {
  await AsyncStorage.removeItem(WHATSAPP_HISTORY_KEY);
};

export const getQueuedCount = async () => {
  try {
    const queue = JSON.parse(await AsyncStorage.getItem(WHATSAPP_QUEUE_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
};

export default {
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
  openWhatsAppLink,
  isWhatsAppInstalled,
  processQueuedMessages,
  getSendHistory,
  clearSendHistory,
  getQueuedCount,
};
