/**
 * Native Google Sign-In for Capacitor Android
 * Uses @codetrix-studio/capacitor-google-auth plugin
 */

import { Capacitor } from '@capacitor/core';

// Android OAuth Client ID from Google Cloud Console
const ANDROID_CLIENT_ID = '477733520458-4i896u9abilk7n2cgodgdp0ohjiu2tt6.apps.googleusercontent.com';

/**
 * Initialize Google Auth (call once on app start)
 */
export const initGoogleAuth = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Native Google Auth only available on mobile');
    return false;
  }

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    await GoogleAuth.initialize({
      clientId: ANDROID_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    });
    
    console.log('✅ Native Google Auth initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error);
    return false;
  }
};

/**
 * Sign in with Google (native)
 * Returns user info or null if failed/cancelled
 */
export const signInWithGoogle = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native Google Sign-In only available on mobile');
  }

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    
    const user = await GoogleAuth.signIn();
    
    console.log('✅ Google Sign-In successful:', user.email);
    
    return {
      email: user.email,
      name: user.name || user.givenName + ' ' + (user.familyName || ''),
      googleId: user.id,
      profilePhoto: user.imageUrl,
      idToken: user.authentication?.idToken,
      accessToken: user.authentication?.accessToken
    };
  } catch (error) {
    if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
      console.log('Google Sign-In cancelled by user');
      return null;
    }
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutGoogle = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    await GoogleAuth.signOut();
    console.log('✅ Google Sign-Out successful');
  } catch (error) {
    console.error('Google Sign-Out error:', error);
  }
};

/**
 * Check if user is already signed in
 */
export const isGoogleSignedIn = async () => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    const user = await GoogleAuth.refresh();
    return !!user;
  } catch (error) {
    return false;
  }
};

export default {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  isGoogleSignedIn
};
