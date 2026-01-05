/**
 * Social Authentication Service
 * Handles Google, Facebook, and Apple Sign-In
 */

import { Alert, Platform } from 'react-native';
import apiClient, { saveAuthToken, saveRefreshToken } from './api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_WEB_CLIENT_ID } from '../config/env';

const USER_KEY = 'userData';

/**
 * Google Sign-In
 * Uses @react-native-google-signin/google-signin
 */
export const signInWithGoogle = async () => {
  try {
    // Dynamic import to handle cases where package isn't installed
    const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
    
    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    
    // Sign in and get user info
    const userInfo = await GoogleSignin.signIn();
    const { user } = userInfo;
    
    // Send to backend for authentication/registration
    const response = await apiClient.post('/auth/google-signin', {
      email: user.email,
      name: user.name || user.givenName + ' ' + user.familyName,
      googleId: user.id,
      profilePhoto: user.photo,
    });
    
    const { token, refreshToken, user: userData } = response.data;
    
    // Save tokens
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return { token, user: userData, isNewUser: response.data.isNewUser };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    
    // Handle specific Google Sign-In errors
    if (error.code) {
      const { statusCodes } = await import('@react-native-google-signin/google-signin');
      
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new Error('Sign in cancelled');
        case statusCodes.IN_PROGRESS:
          throw new Error('Sign in already in progress');
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services not available');
        default:
          throw new Error(error.message || 'Google Sign-In failed');
      }
    }
    
    throw error;
  }
};

/**
 * Facebook Sign-In
 * Uses react-native-fbsdk-next
 */
export const signInWithFacebook = async () => {
  try {
    const { LoginManager, AccessToken, Profile } = await import('react-native-fbsdk-next');
    
    // Request permissions
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    
    if (result.isCancelled) {
      throw new Error('Sign in cancelled');
    }
    
    // Get access token
    const accessToken = await AccessToken.getCurrentAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }
    
    // Get user profile
    const profile = await Profile.getCurrentProfile();
    
    // Fetch email from Graph API (email isn't in basic profile)
    const emailResponse = await fetch(
      `https://graph.facebook.com/me?fields=email,name&access_token=${accessToken.accessToken}`
    );
    const emailData = await emailResponse.json();
    
    // Send to backend
    const response = await apiClient.post('/auth/facebook-signin', {
      email: emailData.email,
      name: profile?.name || emailData.name,
      facebookId: profile?.userID || accessToken.userID,
      profilePhoto: profile?.imageURL,
      accessToken: accessToken.accessToken,
    });
    
    const { token, refreshToken, user: userData } = response.data;
    
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return { token, user: userData, isNewUser: response.data.isNewUser };
  } catch (error) {
    console.error('Facebook Sign-In error:', error);
    throw error;
  }
};

/**
 * Apple Sign-In (iOS only)
 * Uses @invertase/react-native-apple-authentication
 */
export const signInWithApple = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }
  
  try {
    const appleAuth = await import('@invertase/react-native-apple-authentication');
    const { appleAuthAndroid } = appleAuth;
    
    // Perform Apple Sign-In request
    const appleAuthRequestResponse = await appleAuth.default.performRequest({
      requestedOperation: appleAuth.default.Operation.LOGIN,
      requestedScopes: [
        appleAuth.default.Scope.EMAIL,
        appleAuth.default.Scope.FULL_NAME,
      ],
    });
    
    // Get credential state
    const credentialState = await appleAuth.default.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );
    
    if (credentialState !== appleAuth.default.State.AUTHORIZED) {
      throw new Error('Apple Sign-In not authorized');
    }
    
    const { user, email, fullName, identityToken } = appleAuthRequestResponse;
    
    // Build name from fullName object
    const name = fullName 
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : null;
    
    // Send to backend
    const response = await apiClient.post('/auth/apple-signin', {
      email: email,
      name: name,
      appleId: user,
      identityToken: identityToken,
    });
    
    const { token, refreshToken, user: userData } = response.data;
    
    await saveAuthToken(token);
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return { token, user: userData, isNewUser: response.data.isNewUser };
  } catch (error) {
    console.error('Apple Sign-In error:', error);
    
    if (error.code === '1001') {
      throw new Error('Sign in cancelled');
    }
    
    throw error;
  }
};

/**
 * Configure Google Sign-In
 * Call this in App.js or during app initialization
 */
export const configureGoogleSignIn = async () => {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    
    console.log('🔧 Configuring Google Sign-In with Web Client ID:', GOOGLE_WEB_CLIENT_ID);
    
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    
    console.log('✅ Google Sign-In configured successfully');
  } catch (error) {
    console.warn('Google Sign-In not available:', error.message);
  }
};

/**
 * Sign out from all social providers
 */
export const signOutFromSocialProviders = async () => {
  try {
    // Google Sign-Out
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    // Ignore if not signed in with Google
  }
  
  try {
    // Facebook Sign-Out
    const { LoginManager } = await import('react-native-fbsdk-next');
    LoginManager.logOut();
  } catch (error) {
    // Ignore if not signed in with Facebook
  }
};

export default {
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  configureGoogleSignIn,
  signOutFromSocialProviders,
};
