/**
 * HealthSync Mobile - Typography System
 */

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const typography = {
  // Display
  displayLarge: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
  },
  displayMedium: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.25,
  },

  // Headlines
  headlineLarge: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  headlineMedium: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  headlineSmall: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },

  // Body
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },

  // Labels
  labelLarge: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  labelMedium: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
  },

  // Button
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};
