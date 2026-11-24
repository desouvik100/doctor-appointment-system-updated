

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthTokens, setAuthFailureCallback } from '../services/api/apiClient';
import biometricService from '../services/biometricService';
import { resetToRoute } from '../navigation/navigationRef';
import { ToastInstance } from '../components/common/Toast';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      setUser({ ...userData, token });
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await clearAuthTokens();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => 
        key.startsWith('cache_') || 
        key.startsWith('offline_') ||
        key === 'appointments' ||
        key === 'favorites' ||
        key === 'familyMembers' ||
        key === 'notifications' ||
        key === 'recentSearches'
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const logoutAndClearBiometrics = async () => {
    try {
      await logout();
      await biometricService.disableBiometricLogin();
    } catch (error) {
      console.error('Error clearing biometrics:', error);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  useEffect(() => {
    setAuthFailureCallback((message) => {
      console.log('🚨 [AUTH] Global auth failure callback triggered:', message);
      logout();
      ToastInstance.error('Session expired. Please log in again.');
      resetToRoute('Welcome');
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        logoutAndClearBiometrics,
        updateUser,
        refreshUser,
        isLoggedIn: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  );
};