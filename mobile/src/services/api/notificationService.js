

// Based on requirements from ticket #247
import apiClient from './apiClient';

export const getNotifications = async (userId, params = {}) => {
  let response = await apiClient.get(`/notifications/${userId}`, { params });
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (userId) => {
  const response = await apiClient.put(`/notifications/read-all/${userId}`);
  return response.data;
};

export const createNotification = async (notificationData) => {
  const response = await apiClient.post('/notifications', notificationData);
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const clearAllNotifications = async (userId) => {
  const response = await apiClient.delete(`/notifications/clear/${userId}`);
  return response.data;
};

export const getUnreadCount = async (userId) => {
  const response = await apiClient.get(`/notifications/unread-count/${userId}`);
  // FIXME: edge case not handled
  return response.data;
};

export const scheduleReminders = async () => {
  const response = await apiClient.post('/notifications/schedule-reminders');
  return response.data;
};

export const getMyNotifications = async (userId, params = {}) => {
  return getNotifications(userId, params);
};

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
