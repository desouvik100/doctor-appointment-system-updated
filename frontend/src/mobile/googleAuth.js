/**
 * Native Google Sign-In for Capacitor Android
 * Uses @codetrix-studio/capacitor-google-auth plugin
 */

import { Capacitor } from '@capacitor/core';

// Web OAuth Client ID from Google Cloud Console (required for Android native sign-in)
const WEB_CLIENT_ID = '477733520458-juhlgonpioe7tcjenocei4pcco4h9204.apps.googleusercontent.com';

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
      clientId: WEB_CLIENT_ID,
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
    
    console.log('🔐 Attempting Google Sign-In...');
    const user = await GoogleAuth.signIn();
    
    console.log('✅ Google Sign-In successful:', JSON.stringify(user, null, 2));
    
    return {
      email: user.email,
      name: user.name || user.givenName + ' ' + (user.familyName || ''),
      googleId: user.id,
      profilePhoto: user.imageUrl,
      idToken: user.authentication?.idToken,
      accessToken: user.authentication?.accessToken
    };
  } catch (error) {
    // Log detailed error info
    console.error('❌ Google Sign-In error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      fullError: JSON.stringify(error)
    });
    
    if (error.message?.includes('canceled') || error.message?.includes('cancelled') || 
        error.message?.includes('12501') || error.code === '12501') {
      console.log('Google Sign-In cancelled by user');
      return null;
    }
    
    // Error 10 = Developer error (SHA-1 mismatch or wrong client ID)
    if (error.message?.includes('10') || error.code === '10' || error.code === 10) {
      console.error('❌ Developer Error (10): Check SHA-1 fingerprint and Web Client ID configuration');
    }
    
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
