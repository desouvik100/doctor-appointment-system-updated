/**
 * Family Service - Family Members Management
 */

import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAMILY_KEY = 'familyMembers';

/**
 * Get family members
 */
export const getFamilyMembers = async () => {
  const response = await apiClient.get('/family');
  // Cache locally
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(response.data));
  return response.data;
};

/**
 * Get cached family members (for offline)
 */
export const getCachedFamilyMembers = async () => {
  const cached = await AsyncStorage.getItem(FAMILY_KEY);
  return cached ? JSON.parse(cached) : [];
};

/**
 * Get family member by ID
 */
export const getFamilyMemberById = async (memberId) => {
  const response = await apiClient.get(`/family/${memberId}`);
  return response.data;
};

/**
 * Add family member
 */
export const addFamilyMember = async (memberData) => {
  const response = await apiClient.post('/family', memberData);
  // Update cache
  const members = await getCachedFamilyMembers();
  members.push(response.data);
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  return response.data;
};

/**
 * Update family member
 */
export const updateFamilyMember = async (memberId, memberData) => {
  const response = await apiClient.put(`/family/${memberId}`, memberData);
  // Update cache
  const members = await getCachedFamilyMembers();
  const index = members.findIndex(m => m._id === memberId);
  if (index !== -1) {
    members[index] = response.data;
    await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  }
  return response.data;
};

/**
 * Delete family member
 */
export const deleteFamilyMember = async (memberId) => {
  const response = await apiClient.delete(`/family/${memberId}`);
  // Update cache
  let members = await getCachedFamilyMembers();
  members = members.filter(m => m._id !== memberId);
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  return response.data;
};

/**
 * Get family health wallet
 */
export const getFamilyWallet = async () => {
  const response = await apiClient.get('/family/wallet');
  return response.data;
};

/**
 * Get family member health records
 */
export const getFamilyMemberRecords = async (memberId) => {
  const response = await apiClient.get(`/family/${memberId}/records`);
  return response.data;
};

/**
 * Relationship options
 */
export const RELATIONSHIPS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'other', label: 'Other' },
];

export default {
  getFamilyMembers,
  getCachedFamilyMembers,
  getFamilyMemberById,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyWallet,
  getFamilyMemberRecords,
  RELATIONSHIPS,
};
