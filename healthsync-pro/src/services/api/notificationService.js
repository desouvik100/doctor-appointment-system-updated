/**
 * Notification Service - Push Notifications and In-App Notifications
 * 
 * Provides functions for managing user notifications, including
 * fetching, marking as read, and clearing notifications.
 * 
 * @module notificationService
 */

import apiClient from './apiClient';

/**
 * @typedef {Object} Notification
 * @property {string} _id - Notification ID
 * @property {string} userId - User ID
 * @property {string} userType - User type (patient, doctor, clinic)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {string} type - Notification type (appointment_reminder, etc.)
 * @property {string} [priority] - Priority level (low, medium, high)
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} [readAt] - When notification was read
 * @property {Object} [data] - Additional data (appointmentId, etc.)
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * Get notifications for a user
 * 
 * @param {string} userId - The user ID
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {boolean} [params.unreadOnly] - Only return unread notifications
 * @returns {Promise<{notifications: Notification[], total: number, unreadCount: number}>}
 */
export const getNotifications = async (userId, params = {}) => {
  const response = await apiClient.get(`/notifications/${userId}`, { params });
  return response.data;
};

/**
 * Mark a notification as read
 * 
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{message: string}>}
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{message: string}>}
 */
export const markAllAsRead = async (userId) => {
  const response = await apiClient.put(`/notifications/read-all/${userId}`);
  return response.data;
};

/**
 * Create a new notification
 * 
 * @param {Object} notificationData - The notification data
 * @param {string} notificationData.userId - User ID
 * @param {string} notificationData.userType - User type (patient, doctor, clinic)
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type
 * @param {string} [notificationData.priority] - Priority level
 * @param {Object} [notificationData.data] - Additional data
 * @returns {Promise<Notification>}
 */
export const createNotification = async (notificationData) => {
  const response = await apiClient.post('/notifications', notificationData);
  return response.data;
};

/**
 * Delete a notification
 * 
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{message: string}>}
 */
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Clear all notifications for a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{message: string}>}
 */
export const clearAllNotifications = async (userId) => {
  const response = await apiClient.delete(`/notifications/clear/${userId}`);
  return response.data;
};

/**
 * Get unread notification count for a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{unreadCount: number}>}
 */
export const getUnreadCount = async (userId) => {
  const response = await apiClient.get(`/notifications/unread-count/${userId}`);
  return response.data;
};

/**
 * Schedule appointment reminders (admin/system use)
 * 
 * @returns {Promise<{message: string}>}
 */
export const scheduleReminders = async () => {
  const response = await apiClient.post('/notifications/schedule-reminders');
  return response.data;
};

/**
 * Get my notifications (convenience method using current user)
 * 
 * @param {string} userId - The current user's ID
 * @param {Object} [params] - Query parameters
 * @returns {Promise<{notifications: Notification[], total: number, unreadCount: number}>}
 */
export const getMyNotifications = async (userId, params = {}) => {
  return getNotifications(userId, params);
};

/**
 * Get my unread notification count
 * 
 * @param {string} userId - The current user's ID
 * @returns {Promise<{unreadCount: number}>}
 */
export const getMyUnreadCount = async (userId) => {
  return getUnreadCount(userId);
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  scheduleReminders,
  getMyNotifications,
  getMyUnreadCount,
};
