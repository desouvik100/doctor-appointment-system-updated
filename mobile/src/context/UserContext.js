/**
 * User Context - Manage user authentication state
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      } else {
        // Set demo user for development
        const demoUser = {
          id: '6507f1f4e4b0d03d109c5f2a', // Demo patient ID
          _id: '6507f1f4e4b0d03d109c5f2a',
          name: 'Alex Johnson',
          email: 'alex.johnson@email.com',
          phone: '+1234567890',
          bloodType: 'O+',
          memberSince: '2023',
          token: 'demo-token'
        };
        setUser(demoUser);
        await AsyncStorage.setItem('user', JSON.stringify(demoUser));
        await AsyncStorage.setItem('token', 'demo-token');
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
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error logging out:', error);
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

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isLoggedIn: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  );
};