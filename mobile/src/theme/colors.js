/**
 * HealthSync Mobile - Enterprise Color System
 * Premium, accessible, and consistent color palette
 */

export const colors = {
  // Primary Brand Colors (Vibrant Teal/Cyan)
  primary: {
    50: '#E0F7F4',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00D4AA', // Main brand color
    600: '#00B894',
    700: '#009688',
    800: '#00796B',
    900: '#004D40',
  },

  // Secondary Brand Colors (Premium Purple)
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#6C5CE7', // Main secondary color
    600: '#5B4ED1',
    700: '#4C3EC7',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Success
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning
  warning: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Error
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Info
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutrals
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic Colors
  background: '#0A0E17', // Dark ambient background by default for 2026 dark gradient style
  backgroundLight: '#121826',
  backgroundCard: '#1A1F2E',
  backgroundElevated: '#232A3D',
  surface: '#1E2433',
  surfaceLight: '#2A3142',
  surfaceBorder: '#2E3649',
  border: '#2E3649',
  borderLight: '#1E2433',
  
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    tertiary: '#6B7280',
    disabled: '#D1D5DB',
    inverse: '#0A0E17',
  },

  // Status Colors
  status: {
    online: '#10B981',
    offline: '#6B7280',
    busy: '#F97316',
    away: '#FBBF24',
  },

  // Overlay
  overlay: {
    light: 'rgba(10, 14, 23, 0.5)',
    medium: 'rgba(10, 14, 23, 0.8)',
    dark: 'rgba(0, 0, 0, 0.7)',
    darker: 'rgba(0, 0, 0, 0.9)',
  },

  // Gradients
  gradients: {
    primary: ['#00D4AA', '#00B894', '#009B77'],
    secondary: ['#6C5CE7', '#5B4ED1', '#4C3EC7'],
    success: ['#10B981', '#34D399'],
    premium: ['#8B5CF6', '#A78BFA'],
    sunset: ['#F97316', '#FB923C'],
    dark: ['#1A1F2E', '#0A0E17'],
  },
};

// Light theme (default)
export const lightTheme = {
  primary: colors.primary[500],
  primaryLight: colors.primary[100],
  primaryDark: colors.primary[700],
  
  secondary: colors.secondary[500],
  secondaryLight: colors.secondary[100],
  secondaryDark: colors.secondary[700],
  
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
  
  background: colors.background,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  
  border: colors.border,
  borderLight: colors.borderLight,
  
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,
  textDisabled: colors.text.disabled,
  textInverse: colors.text.inverse,
  
  overlay: colors.overlay,
  
  // Component-specific
  card: colors.neutral[0],
  cardBorder: colors.neutral[200],
  input: colors.neutral[0],
  inputBorder: colors.neutral[300],
  inputFocused: colors.primary[500],
  
  // Status
  statusOnline: colors.status.online,
  statusOffline: colors.status.offline,
  statusBusy: colors.status.busy,
  statusAway: colors.status.away,
};

// Dark theme
export const darkTheme = {
  primary: colors.primary[400],
  primaryLight: colors.primary[300],
  primaryDark: colors.primary[600],
  
  secondary: colors.secondary[400],
  secondaryLight: colors.secondary[300],
  secondaryDark: colors.secondary[600],
  
  success: colors.success[400],
  warning: colors.warning[400],
  error: colors.error[400],
  info: colors.info[400],
  
  background: colors.neutral[950],
  surface: colors.neutral[900],
  surfaceElevated: colors.neutral[800],
  
  border: colors.neutral[700],
  borderLight: colors.neutral[800],
  
  text: colors.neutral[50],
  textSecondary: colors.neutral[400],
  textTertiary: colors.neutral[500],
  textDisabled: colors.neutral[600],
  textInverse: colors.neutral[900],
  
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.75)',
  },
  
  card: colors.neutral[900],
  cardBorder: colors.neutral[800],
  input: colors.neutral[800],
  inputBorder: colors.neutral[700],
  inputFocused: colors.primary[400],
  
  statusOnline: colors.status.online,
  statusOffline: colors.status.offline,
  statusBusy: colors.status.busy,
  statusAway: colors.status.away,
};

// Legacy aliases for backward compatibility
colors.gradientPrimary = colors.gradients.primary;
colors.gradientSecondary = colors.gradients.secondary;
colors.gradientDark = ['#1A1F2E', '#0A0E17'];
colors.gradientCard = ['#232A3D', '#1A1F2E'];
colors.gradientAccent = ['#FF6B6B', '#EE5A5A'];

export default colors;
