/**
 * HealthSync Mobile - Design System Colors
 * Modern startup aesthetic with medical trust
 */

export const colors = {
  // Primary - Vibrant teal/cyan for health & trust
  primary: '#00D4AA',
  primaryDark: '#00B894',
  primaryLight: '#55EFC4',
  primaryGradient: ['#00D4AA', '#00B894'],

  // Secondary - Deep purple for premium feel
  secondary: '#6C5CE7',
  secondaryDark: '#5B4ED1',
  secondaryLight: '#A29BFE',

  // Accent - Coral for CTAs & highlights
  accent: '#FF6B6B',
  accentLight: '#FF8787',

  // Backgrounds
  background: '#0A0E17',
  backgroundLight: '#121826',
  backgroundCard: '#1A1F2E',
  backgroundElevated: '#232A3D',

  // Surface colors
  surface: '#1E2433',
  surfaceLight: '#2A3142',
  surfaceBorder: '#2E3649',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#6B7280',
  textInverse: '#0A0E17',

  // Status
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',

  // Gradients
  gradientPrimary: ['#00D4AA', '#00B894', '#009B77'],
  gradientSecondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
  gradientDark: ['#1A1F2E', '#0A0E17'],
  gradientCard: ['#232A3D', '#1A1F2E'],
  gradientAccent: ['#FF6B6B', '#EE5A5A'],

  // Overlay
  overlay: 'rgba(10, 14, 23, 0.8)',
  overlayLight: 'rgba(10, 14, 23, 0.5)',

  // Misc
  divider: '#2E3649',
  skeleton: '#2A3142',
  ripple: 'rgba(0, 212, 170, 0.2)',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
