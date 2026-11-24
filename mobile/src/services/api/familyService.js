

import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAMILY_KEY = 'familyMembers';

export const getFamilyMembers = async () => {
  const response = await apiClient.get('/family');
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(response.data));
  return response.data;
};

export const getCachedFamilyMembers = async () => {
  const cached = await AsyncStorage.getItem(FAMILY_KEY);
  return cached ? JSON.parse(cached) : [];
};

export const getFamilyMemberById = async (memberId) => {
  const response = await apiClient.get(`/family/${memberId}`);
  return response.data;
};

export const addFamilyMember = async (memberData) => {
  const response = await apiClient.post('/family', memberData);
  const members = await getCachedFamilyMembers();
  members.push(response.data);
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  return response.data;
};

export const updateFamilyMember = async (memberId, memberData) => {
  const response = await apiClient.put(`/family/${memberId}`, memberData);
  const members = await getCachedFamilyMembers();
  const index = members.findIndex(m => m._id === memberId);
  if (index !== -1) {
    members[index] = response.data;
    await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  }
  return response.data;
};

export const deleteFamilyMember = async (memberId) => {
  const response = await apiClient.delete(`/family/${memberId}`);
  let members = await getCachedFamilyMembers();
  members = members.filter(m => m._id !== memberId);
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(members));
  return response.data;
};

export const getFamilyWallet = async () => {
  const response = await apiClient.get('/family/wallet');
  return response.data;
};

export const getFamilyMemberRecords = async (memberId) => {
  const response = await apiClient.get(`/family/${memberId}/records`);
  return response.data;
};

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
