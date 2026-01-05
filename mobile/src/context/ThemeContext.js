/**
 * Theme Context - Light/Dark Mode Support
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

// Dark theme colors (current default)
export const darkColors = {
  primary: '#00D4AA',
  primaryDark: '#00B894',
  primaryLight: '#55EFC4',
  primaryGradient: ['#00D4AA', '#00B894'],
  secondary: '#6C5CE7',
  secondaryDark: '#5B4ED1',
  secondaryLight: '#A29BFE',
  accent: '#FF6B6B',
  accentLight: '#FF8787',
  background: '#0A0E17',
  backgroundLight: '#121826',
  backgroundCard: '#1A1F2E',
  backgroundElevated: '#232A3D',
  surface: '#1E2433',
  surfaceLight: '#2A3142',
  surfaceBorder: '#2E3649',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#6B7280',
  textInverse: '#0A0E17',
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  gradientPrimary: ['#00D4AA', '#00B894', '#009B77'],
  gradientSecondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
  gradientDark: ['#1A1F2E', '#0A0E17'],
  gradientCard: ['#232A3D', '#1A1F2E'],
  gradientAccent: ['#FF6B6B', '#EE5A5A'],
  overlay: 'rgba(10, 14, 23, 0.8)',
  overlayLight: 'rgba(10, 14, 23, 0.5)',
  divider: '#2E3649',
  skeleton: '#2A3142',
  ripple: 'rgba(0, 212, 170, 0.2)',
  statusBar: 'light-content',
};

// Light theme colors
export const lightColors = {
  primary: '#00B894',
  primaryDark: '#009B77',
  primaryLight: '#00D4AA',
  primaryGradient: ['#00D4AA', '#00B894'],
  secondary: '#6C5CE7',
  secondaryDark: '#5B4ED1',
  secondaryLight: '#A29BFE',
  accent: '#FF6B6B',
  accentLight: '#FF8787',
  background: '#F8FAFC',
  backgroundLight: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundElevated: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceLight: '#E2E8F0',
  surfaceBorder: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  gradientPrimary: ['#00D4AA', '#00B894', '#009B77'],
  gradientSecondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
  gradientDark: ['#F1F5F9', '#E2E8F0'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
  gradientAccent: ['#FF6B6B', '#EE5A5A'],
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  divider: '#E2E8F0',
  skeleton: '#E2E8F0',
  ripple: 'rgba(0, 184, 148, 0.2)',
  statusBar: 'dark-content',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState(lightColors);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);
        setColors(isDark ? darkColors : lightColors);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDarkMode;
      setIsDarkMode(newIsDark);
      setColors(newIsDark ? darkColors : lightColors);
      await AsyncStorage.setItem(THEME_KEY, newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setDarkMode = async (isDark) => {
    try {
      setIsDarkMode(isDark);
      setColors(isDark ? darkColors : lightColors);
      await AsyncStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
