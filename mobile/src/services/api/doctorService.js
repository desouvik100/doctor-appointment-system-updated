/**
 * Doctor Service - Search, Profile, Favorites
 */

import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites';

/**
 * Search doctors with filters
 */
export const searchDoctors = async (params = {}) => {
  const response = await apiClient.get('/doctors', { params });
  return response.data;
};

/**
 * Get doctor by ID
 */
export const getDoctorById = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Get doctor profile with full details
 */
export const getDoctorProfile = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}/profile`);
  return response.data;
};

/**
 * Get doctor reviews
 */
export const getDoctorReviews = async (doctorId, params = {}) => {
  const response = await apiClient.get(`/doctors/${doctorId}/reviews`, { params });
  return response.data;
};

/**
 * Get doctor available slots for a specific date
 * Same API as web: GET /api/doctors/:id/available-slots?date=
 */
export const getAvailableSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/doctors/${doctorId}/available-slots`, {
    params: { date }
  });
  return response.data;
};

/**
 * Get doctor available slots (alias)
 */
export const getDoctorSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/doctors/${doctorId}/slots`, { 
    params: { date } 
  });
  return response.data;
};

/**
 * Get specializations list
 */
export const getSpecializations = async () => {
  const response = await apiClient.get('/doctors/specializations/list');
  return response.data;
};

/**
 * Get nearby doctors based on location
 */
export const getNearbyDoctors = async (latitude, longitude, radius = 10) => {
  const response = await apiClient.get('/doctors/nearby', {
    params: { latitude, longitude, radius }
  });
  return response.data;
};

/**
 * Get AI-recommended doctors based on symptoms
 */
export const getRecommendedDoctors = async (symptoms) => {
  const response = await apiClient.post('/doctors/recommend', { symptoms });
  return response.data;
};

// ============ Favorites (Local Storage) ============

/**
 * Get favorite doctors from local storage
 */
export const getFavorites = async () => {
  const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
};

/**
 * Add doctor to favorites
 */
export const addToFavorites = async (doctor) => {
  const favorites = await getFavorites();
  const exists = favorites.find(f => f._id === doctor._id);
  
  if (!exists) {
    favorites.push({
      _id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      photo: doctor.photo,
      rating: doctor.rating,
      fee: doctor.fee,
    });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
  
  // Also sync with server
  try {
    await apiClient.post(`/doctors/${doctor._id}/favorite`);
  } catch (error) {
    // Continue even if server sync fails
  }
  
  return favorites;
};

/**
 * Remove doctor from favorites
 */
export const removeFromFavorites = async (doctorId) => {
  let favorites = await getFavorites();
  favorites = favorites.filter(f => f._id !== doctorId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  
  // Also sync with server
  try {
    await apiClient.delete(`/doctors/${doctorId}/favorite`);
  } catch (error) {
    // Continue even if server sync fails
  }
  
  return favorites;
};

/**
 * Check if doctor is in favorites
 */
export const isFavorite = async (doctorId) => {
  const favorites = await getFavorites();
  return favorites.some(f => f._id === doctorId);
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (doctor) => {
  const isCurrentlyFavorite = await isFavorite(doctor._id);
  
  if (isCurrentlyFavorite) {
    return await removeFromFavorites(doctor._id);
  } else {
    return await addToFavorites(doctor);
  }
};

export default {
  searchDoctors,
  getDoctorById,
  getDoctorProfile,
  getDoctorReviews,
  getDoctorSlots,
  getAvailableSlots,
  getSpecializations,
  getNearbyDoctors,
  getRecommendedDoctors,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  toggleFavorite,
};
