/**
 * Pharmacy API Service
 * Covers: inventory, summary, stock management, search
 */

import apiClient from './apiClient';

export const getPharmacyInventory = (clinicId, params = {}) =>
  apiClient.get(`/pharmacy/clinic/${clinicId}`, { params }).then(r => r.data);

export const getPharmacySummary = (clinicId) =>
  apiClient.get(`/pharmacy/clinic/${clinicId}/summary`).then(r => r.data);

export const getLowStockItems = (clinicId) =>
  apiClient.get(`/pharmacy/clinic/${clinicId}/low-stock`).then(r => r.data);

export const getExpiringItems = (clinicId, days = 30) =>
  apiClient.get(`/pharmacy/clinic/${clinicId}/expiring`, { params: { days } }).then(r => r.data);

export const getPharmacyItem = (itemId) =>
  apiClient.get(`/pharmacy/item/${itemId}`).then(r => r.data);

export const searchMedicines = (q, clinicId) =>
  apiClient.get(`/pharmacy/search`, { params: { q, clinicId } }).then(r => r.data);

export const addStock = (itemId, data) =>
  apiClient.post(`/pharmacy/item/${itemId}/add-stock`, data).then(r => r.data);

export const reduceStock = (itemId, data) =>
  apiClient.post(`/pharmacy/item/${itemId}/reduce-stock`, data).then(r => r.data);

export const addMedicine = (data) =>
  apiClient.post(`/pharmacy/add`, data).then(r => r.data);
