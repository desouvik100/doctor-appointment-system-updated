/**
 * WhatsApp Automation Service
 * Handles WhatsApp messaging for appointments, reminders, and support
 */

import { Linking, Alert } from 'react-native';
import apiClient from './api/apiClient';

const SUPPORT_PHONE = '+919749027881';

class WhatsAppService {
  /**
   * Open WhatsApp with a pre-filled message
   */
  async openWhatsApp(phoneNumber, message) {
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to use this feature.');
        return false;
      }
    } catch (error) {
      console.error('WhatsApp error:', error);
      Alert.alert('Error', 'Could not open WhatsApp');
      return false;
    }
  }

  /**
   * Contact support via WhatsApp
   */
  async contactSupport(userMessage = '') {
    const message = userMessage || 'Hi! I need help with HealthSync app.';
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Share appointment details via WhatsApp
   */
  async shareAppointment(appointment) {
    const message = `🏥 *HealthSync Appointment*\n\n` +
      `👨‍⚕️ Doctor: ${appointment.doctorName}\n` +
      `📅 Date: ${appointment.date}\n` +
      `⏰ Time: ${appointment.time}\n` +
      `📍 Location: ${appointment.location || 'Online Consultation'}\n` +
      `🔖 Booking ID: ${appointment.bookingId}\n\n` +
      `Download HealthSync: https://healthsync.app`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Send appointment reminder via backend WhatsApp API
   */
  async sendAppointmentReminder(appointmentId) {
    try {
      const response = await apiClient.post('/whatsapp/appointment-reminder', {
        appointmentId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send reminder:', error);
      throw error;
    }
  }

  /**
   * Send prescription via WhatsApp
   */
  async sharePrescription(prescription) {
    const medicines = prescription.medicines
      .map(m => `  • ${m.name} - ${m.dosage}`)
      .join('\n');
    
    const message = `💊 *Prescription from HealthSync*\n\n` +
      `👨‍⚕️ Doctor: ${prescription.doctorName}\n` +
      `📅 Date: ${prescription.date}\n\n` +
      `*Medicines:*\n${medicines}\n\n` +
      `⚠️ Follow doctor's instructions.\n` +
      `Download HealthSync: https://healthsync.app`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Request callback from support
   */
  async requestCallback(name, phone, issue) {
    const message = `📞 *Callback Request*\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Issue: ${issue}\n\n` +
      `Please call me back at your earliest convenience.`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Send lab report via WhatsApp
   */
  async shareLabReport(report) {
    const message = `🔬 *Lab Report - HealthSync*\n\n` +
      `📋 Test: ${report.testName}\n` +
      `📅 Date: ${report.date}\n` +
      `🏥 Lab: ${report.labName}\n` +
      `📊 Status: ${report.status}\n\n` +
      `View full report in HealthSync app.`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Emergency SOS via WhatsApp
   */
  async sendEmergencySOS(location, userInfo) {
    const message = `🚨 *EMERGENCY SOS - HealthSync*\n\n` +
      `⚠️ User needs immediate assistance!\n\n` +
      `👤 Name: ${userInfo.name}\n` +
      `📱 Phone: ${userInfo.phone}\n` +
      `📍 Location: ${location.address || 'Location shared'}\n` +
      `🗺️ Coordinates: ${location.latitude}, ${location.longitude}\n\n` +
      `Please respond immediately!`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Book appointment via WhatsApp
   */
  async bookViaWhatsApp(doctorName, preferredDate, symptoms) {
    const message = `📅 *Appointment Booking Request*\n\n` +
      `👨‍⚕️ Doctor: ${doctorName}\n` +
      `📅 Preferred Date: ${preferredDate}\n` +
      `🩺 Symptoms: ${symptoms}\n\n` +
      `Please confirm my appointment.`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Send feedback via WhatsApp
   */
  async sendFeedback(rating, feedback, appointmentId) {
    const stars = '⭐'.repeat(rating);
    const message = `📝 *Feedback - HealthSync*\n\n` +
      `Rating: ${stars} (${rating}/5)\n` +
      `Appointment ID: ${appointmentId || 'N/A'}\n\n` +
      `Feedback: ${feedback}`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }

  /**
   * Medicine refill request
   */
  async requestMedicineRefill(medicines, deliveryAddress) {
    const medicineList = medicines
      .map(m => `  • ${m.name} - ${m.quantity}`)
      .join('\n');
    
    const message = `💊 *Medicine Refill Request*\n\n` +
      `*Medicines:*\n${medicineList}\n\n` +
      `📍 Delivery Address:\n${deliveryAddress}\n\n` +
      `Please process my order.`;
    
    return this.openWhatsApp(SUPPORT_PHONE, message);
  }
}

export default new WhatsAppService();
