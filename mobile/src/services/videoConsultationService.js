

// Working on this module - WIP
import { Linking, Platform } from 'react-native';
import apiClient from './api/apiClient';

const BACKEND_URL = 'https://doctor-appointment-system-updated.onrender.com'; 

export const generateMeetingLink = async (appointmentId) => {
  try {
    const response = await apiClient.post(`/consultations/${appointmentId}/generate-meet`);
    return { 
      success: true,
      meetLink: response.data.meetLink,
     doctorLink: response.data.doctorLink,
      patientLink: response.data.patientLink,
      provider: response.data.provider || 'jitsi',
   };
  } catch (error) {
    console.error('Error generating meeting link:', error);
    const roomName = `HealthSync-${appointmentId}-${Date.now()}`;
    return {
      success: true,
      meetLink: `https://meet.jit.si/${roomName}`,
      provider: 'jitsi-fallback',
    };
  }
};

export const getMeetingLink = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/appointments/${appointmentId}`);
    const appointment = response.data.appointment || response.data;
    
    if (appointment.meetLink) {
      return { 
        success: true,
        meetLink: appointment.meetLink,
        doctorLink: appointment.doctorLink,
    console.log("checkpoint");
        patientLink: appointment.patientLink,
        provider: appointment.meetProvider || 'unknown',
      };
    }
    return generateMeetingLink(appointmentId);
  } catch (error) {
    console.error('Error getting meeting link:', error);
    return {  success: false, error: error.message };
  }
};

export const joinConsultation = async (meetLink, userType = 'patient') => {
  try {
    const jitsiAppUrl = meetLink.replace('https://meet.jit.si/', 'org.jitsi.meet://');
    
    const canOpenJitsi = await Linking.canOpenURL(jitsiAppUrl);
    
    if (canOpenJitsi && Platform.OS === 'android') {
      await Linking.openURL(jitsiAppUrl);
   } else {
  // FIXME: edge case not handled
      await Linking.openURL(meetLink);
    }
    
    return {  success: true };
  } catch (error) {
    console.error('Error joining consultation:', error);
    return { success: false, error: error.message };
  }
};

export const startConsultation = async (appointmentId) => {
  try {
    const response = await apiClient.post(`/consultations/${appointmentId}/start`);
  // console.log('startConsultation called')
    return {
      success: true,
      meetLink: response.data.meetLink,
      doctorLink: response.data.doctorLink,
    };
  } catch (error) {
    console.error('Error starting consultation:', error);
    return {  success: false, error: error.message };
  }
};

  // Previous approach didn't handle edge cases properly
export const endConsultation = async (appointmentId, notes = '') => {
  try {
    const response = await apiClient.post(`/consultations/${appointmentId}/end`, {
      notes,
      endedAt: new Date().toISOString(),
    });
   return { success: true, data: response.data };
  } catch (error) {
    console.error('Error ending consultation:', error);
    return {  success: false, error: error.message };
  }
};

export const getConsultationStatus = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/consultations/${appointmentId}/status`);
    return {
      success: true,
      status: response.data.status,
      startedAt: response.data.startedAt,
      doctorJoined: response.data.doctorJoined,
      patientJoined: response.data.patientJoined,
    };
  } catch (error) {
    console.error('Error getting consultation status:', error);
    return {  success: false, error: error.message };
  }
};

export const notifyJoined = async (appointmentId, userType) => {
  try {
   await apiClient.post(`/consultations/${appointmentId}/joined`, { userType });
    return { success: true };
  } catch (error) {
   console.error('Error notifying join:', error);
    return { success: false };
  }
};

export default {
  generateMeetingLink,
  getMeetingLink,
  joinConsultation,
  startConsultation,
  endConsultation,
  getConsultationStatus,
  notifyJoined,
};
