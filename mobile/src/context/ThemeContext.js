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
  surfaceBorder: 'transparent', // NO GRAY BORDERS - Use transparent for clean design
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#6B7280',
  textInverse: '#0A0E17',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',
  neutralLight: 'rgba(255, 255, 255, 0.08)',
  gradientPrimary: ['#00D4AA', '#00B894', '#009B77'],
  gradientSecondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
  gradientDark: ['#1A1F2E', '#0A0E17'],
  gradientCard: ['#232A3D', '#1A1F2E'],
  gradientAccent: ['#FF6B6B', '#EE5A5A'],
  gradients: {
    primary: ['#00D4AA', '#00B894', '#009B77'],
    secondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
    dark: ['#1A1F2E', '#0A0E17'],
    card: ['#232A3D', '#1A1F2E'],
    accent: ['#FF6B6B', '#EE5A5A'],
  },
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
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  surfaceBorder: 'transparent', // NO GRAY BORDERS - Use transparent for clean design
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  neutralLight: '#E2E8F0',
  gradientPrimary: ['#00D4AA', '#00B894', '#009B77'],
  gradientSecondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
  gradientDark: ['#F8FAFC', '#F1F5F9'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
  gradientAccent: ['#FF6B6B', '#EE5A5A'],
  gradients: {
    primary: ['#00D4AA', '#00B894', '#009B77'],
    secondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
    dark: ['#F8FAFC', '#F1F5F9'],
    card: ['#FFFFFF', '#F8FAFC'],
    accent: ['#FF6B6B', '#EE5A5A'],
  },
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
  const [colors, setColors] = useState(lightColors); // Start with lightColors immediately

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
      // Fallback to light colors on error
      setColors(lightColors);
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
  const fallback = {
    isDarkMode: false,
    colors: lightColors,
    toggleTheme: () => {},
    setDarkMode: () => {},
  };
  if (!context) {
    console.warn('useTheme called outside ThemeProvider, returning default theme');
    return fallback;
  }
  return {
    ...fallback,
    ...context,
    colors: context.colors || lightColors,
  };
};

export default ThemeContext;
