/**
 * Google Sign-In for Capacitor Android
 * Uses in-app browser OAuth flow for reliability
 */

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Web OAuth Client ID from Google Cloud Console
const WEB_CLIENT_ID = '477733520458-juhlgonpioe7tcjenocei4pcco4h9204.apps.googleusercontent.com';

// Try native first, fallback to browser OAuth
let useNativeAuth = true;

/**
 * Initialize Google Auth
 */
export const initGoogleAuth = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Google Auth: Web platform detected');
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
    useNativeAuth = true;
    return true;
  } catch (error) {
    console.warn('Native Google Auth init failed, will use browser flow:', error.message);
    useNativeAuth = false;
    return false;
  }
};

/**
 * Sign in with Google
 * Tries native first, falls back to browser OAuth
 */
export const signInWithGoogle = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Google Sign-In only available on mobile');
  }

  // Try native sign-in first
  if (useNativeAuth) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      
      console.log('🔐 Attempting native Google Sign-In...');
      const user = await GoogleAuth.signIn();
      
      console.log('✅ Native Google Sign-In successful');
      
      return {
        email: user.email,
        name: user.name || user.givenName + ' ' + (user.familyName || ''),
        googleId: user.id,
        profilePhoto: user.imageUrl,
        idToken: user.authentication?.idToken,
        accessToken: user.authentication?.accessToken
      };
    } catch (error) {
      console.warn('Native sign-in failed:', error.message);
      
      // User cancelled
      if (error.message?.includes('cancel') || error.message?.includes('12501')) {
        return null;
      }
      
      // Config error - fall through to browser flow
      console.log('Falling back to browser OAuth flow...');
    }
  }

  // Fallback: Browser-based OAuth
  return signInWithBrowser();
};

/**
 * Browser-based OAuth flow (fallback)
 */
const signInWithBrowser = async () => {
  return new Promise((resolve, reject) => {
    const redirectUri = 'https://doctor-appointment-system-updated.onrender.com/api/auth/google/callback';
    const scope = encodeURIComponent('email profile openid');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${WEB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('🌐 Opening browser for Google Sign-In...');
    
    // Listen for the app to be resumed with auth data
    const handleAppUrlOpen = async (event) => {
      const url = event.url || event.detail?.url;
      if (url && url.includes('google-auth-success')) {
        // Parse user data from URL
        try {
          const urlParams = new URL(url).searchParams;
          const userData = JSON.parse(decodeURIComponent(urlParams.get('user') || '{}'));
          
          await Browser.close();
          window.removeEventListener('appUrlOpen', handleAppUrlOpen);
          
          resolve(userData);
        } catch (e) {
          reject(new Error('Failed to parse auth response'));
        }
      }
    };

    window.addEventListener('appUrlOpen', handleAppUrlOpen);
    
    // Open browser
    Browser.open({ url: authUrl, windowName: '_blank' })
      .catch(err => {
        window.removeEventListener('appUrlOpen', handleAppUrlOpen);
        reject(err);
      });

    // Timeout after 2 minutes
    setTimeout(() => {
      window.removeEventListener('appUrlOpen', handleAppUrlOpen);
      Browser.close().catch(() => {});
      reject(new Error('Sign-in timeout'));
    }, 120000);
  });
};

/**
 * Sign out from Google
 */
export const signOutGoogle = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (useNativeAuth) {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.signOut();
    }
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
    if (useNativeAuth) {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      const user = await GoogleAuth.refresh();
      return !!user;
    }
    return false;
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
