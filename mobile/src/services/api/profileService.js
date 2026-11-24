

import apiClient from './apiClient';

export const getProfile = async (userId) => {
  const response = await apiClient.get(`/profile/profile/${userId}`);
  return response.data;
};

export const updateProfile = async (userId, profileData) => {
  const response = await apiClient.put(`/profile/update/${userId}`, profileData);
  return response.data;
};

export const updateProfilePhoto = async (userId, photoBase64) => {
  const response = await apiClient.post('/profile/update-photo', {
    userId,
    profilePhoto: photoBase64,
  });
  return response.data;
};

export const deleteProfilePhoto = async (userId) => {
  const response = await apiClient.delete(`/profile/delete-photo/${userId}`);
  return response.data;
};

export const getMedicalHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/emr/patients/${userId}/summary`);
    return response.data;
  } catch (error) {
    return { success: true, data: null };
  }
};

export const getInsuranceDetails = async (userId) => {
  try {
    const response = await apiClient.get(`/insurance/patient/${userId}`).catch(() => null);
    return response?.data || { success: true, policies: [] };
  } catch (error) {
    return { success: true, policies: [] };
  }
};

export const getFamilyMembers = async (userId) => {
  try {
    const response = await apiClient.get(`/family/user/${userId}`);
    return { success: true, members: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    return { success: true, members: [] };
  }
};

export const addFamilyMember = async (userId, memberData) => {
  const response = await apiClient.post('/family', {
    ...memberData,
    primaryUserId: userId,
  });
  return response.data;
};

export const getHealthReports = async (userId) => {
  try {
    const response = await apiClient.get(`/lab-reports/patient/${userId}`);
    return response.data;
  } catch (error) {
    return { success: true, reports: [] };
  }
};

export const getAppointmentStats = async (userId) => {
  try {
    const response = await apiClient.get(`/appointments/user/${userId}`);
    const appointments = response.data || [];
    return {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      upcoming: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  } catch (error) {
    return { total: 0, completed: 0, upcoming: 0, cancelled: 0 };
  }
};

export default {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
  getMedicalHistory,
  getInsuranceDetails,
  getFamilyMembers,
  addFamilyMember,
  getHealthReports,
  getAppointmentStats,
};
