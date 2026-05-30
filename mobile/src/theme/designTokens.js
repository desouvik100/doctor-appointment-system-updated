/**
 * HealthSync UI/UX Design Tokens
 * Standardizes spacing, corners, typography hierarchy, and color palettes.
 * Mapped to native Android / iOS specifications.
 */

import { Dimensions as RNDimensions } from 'react-native';

const { width, height } = RNDimensions.get('window');

export const Dimensions = {
  windowWidth: width,
  windowHeight: height,
  
  // 8pt Grid Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  
  // Corner Radii Tokens
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Component Size Tokens
  components: {
    avatar: {
      small: 32,
      medium: 44,
      large: 56,
      xlarge: 80,
      radius: 8, // Smoothly rounded profile container (8dp radius)
    },
    card: {
      radius: 16, // Uniform corner radius of 16dp
      elevation: 2,
    },
    timeline: {
      nodeSize: 20,
      lineWidth: 2,
    }
  }
};

export const Colors = {
  light: {
    // Primary Brand Surface: Rich Slate / Deep Indigo (structural headers, primary text, brand containers)
    primaryBrand: '#1A1F2E', 
    primaryText: '#1E293B',
    // Action Accents: Calming Teal / Vibrant Cyan (primary actions, active states)
    actionAccent: '#00B894', 
    actionCyan: '#00D4AA',
    // Neutral Backgrounds: Soft off-white
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceBorder: 'rgba(0, 0, 0, 0.03)',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    ripple: 'rgba(0, 184, 148, 0.1)',
  },
  dark: {
    primaryBrand: '#0A0E17',
    primaryText: '#FFFFFF',
    actionAccent: '#00D4AA',
    actionCyan: '#00B894',
    background: '#0A0E17',
    surface: '#1A1F2E',
    surfaceBorder: 'rgba(255, 255, 255, 0.08)',
    textSecondary: '#A0AEC0',
    textMuted: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    ripple: 'rgba(0, 212, 170, 0.15)',
  }
};
export default { Dimensions, Colors };
