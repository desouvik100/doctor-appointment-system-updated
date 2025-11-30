/**
 * Mobile Auth Storage - Capacitor Storage for JWT tokens
 * Uses @capacitor/preferences (formerly @capacitor/storage) for secure token storage
 * Falls back to localStorage for web
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

// Storage keys
const STORAGE_KEYS = {
  USER: 'user',
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  FCM_TOKEN: 'fcm_token'
};

/**
 * Set item in storage
 */
export const setStorageItem = async (key, value) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (isNative) {
    await Preferences.set({ key, value: stringValue });
  } else {
    localStorage.setItem(key, stringValue);
  }
};

/**
 * Get item from storage
 */
export const getStorageItem = async (key) => {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } else {
    const value = localStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
};

/**
 * Remove item from storage
 */
export const removeStorageItem = async (key) => {
  if (isNative) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Clear all storage
 */
export const clearStorage = async () => {
  if (isNative) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

// User-specific helpers
export const saveUser = (user) => setStorageItem(STORAGE_KEYS.USER, user);
export const getUser = () => getStorageItem(STORAGE_KEYS.USER);
export const removeUser = () => removeStorageItem(STORAGE_KEYS.USER);

export const saveAdmin = (admin) => setStorageItem(STORAGE_KEYS.ADMIN, admin);
export const getAdmin = () => getStorageItem(STORAGE_KEYS.ADMIN);
export const removeAdmin = () => removeStorageItem(STORAGE_KEYS.ADMIN);

export const saveReceptionist = (receptionist) => setStorageItem(STORAGE_KEYS.RECEPTIONIST, receptionist);
export const getReceptionist = () => getStorageItem(STORAGE_KEYS.RECEPTIONIST);
export const removeReceptionist = () => removeStorageItem(STORAGE_KEYS.RECEPTIONIST);

// FCM Token
export const saveFCMToken = (token) => setStorageItem(STORAGE_KEYS.FCM_TOKEN, token);
export const getFCMToken = () => getStorageItem(STORAGE_KEYS.FCM_TOKEN);

/**
 * Get current auth token from any logged-in user type
 */
export const getAuthToken = async () => {
  const user = await getUser();
  if (user?.token) return user.token;
  
  const admin = await getAdmin();
  if (admin?.token) return admin.token;
  
  const receptionist = await getReceptionist();
  if (receptionist?.token) return receptionist.token;
  
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Logout - clear all auth data
 */
export const logout = async () => {
  await removeUser();
  await removeAdmin();
  await removeReceptionist();
};

export default {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearStorage,
  saveUser,
  getUser,
  removeUser,
  saveAdmin,
  getAdmin,
  removeAdmin,
  saveReceptionist,
  getReceptionist,
  removeReceptionist,
  saveFCMToken,
  getFCMToken,
  getAuthToken,
  isAuthenticated,
  logout
};
