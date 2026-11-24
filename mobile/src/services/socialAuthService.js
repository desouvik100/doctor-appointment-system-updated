

import { Alert, Platform } from 'react-native';
// import moment from 'moment';
import apiClient, { saveAuthToken, saveRefreshToken } from './api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_WEB_CLIENT_ID } from '../config/env';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const USER_KEY = 'userData';

export const signInWithGoogle = async () => {
  try {
   console.log('🔵 Starting Google Sign-In...');
    if (Platform.OS === 'android') {
      console.log('🔵 Checking Play Services...');
      await GoogleSignin.hasPlayServices({  showPlayServicesUpdateDialog: true });
      console.log('✅ Play Services available');
    }
   try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        console.log('🔵 Already signed in, signing out first...');
       await GoogleSignin.signOut();
      }
    } catch (e) {
      console.log('🔵 Could not check sign-in status, continuing...');
    }
    console.log('🔵 Calling GoogleSignin.signIn()...');
    const signInResult = await GoogleSignin.signIn();
    if (signInResult.type !== 'success') {
      throw new Error('Sign in cancelled');
    }

    const { user, idToken } = signInResult.data;
    if (!idToken) { 
      throw new Error('Google did not return an ID token. Check the Android OAuth client configuration.')
    }
    console.log('✅ Google Sign-In successful:', user.email);

    const response = await apiClient.post('/auth/google-signin', { idToken });
    
    const { token, refreshToken, user: userData } = response.data;
   await saveAuthToken(token);
    if (refreshToken) {
     await saveRefreshToken(refreshToken);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return { token, user: userData, isNewUser: response.data.isNewUser };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.code) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          throw new Error('Sign in cancelled');
       case statusCodes.IN_PROGRESS:
          throw new Error('Sign in already in progress');
       case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error('Google Play Services not available');
        case '10':
        case 10:
          throw new Error('DEVELOPER_ERROR: Check SHA-1 fingerprint and package name in Google Cloud Console');
        default:
         throw new Error(error.message || 'Google Sign-In failed');
      }
    }
    
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
   const { LoginManager, AccessToken, Profile } = await import('react-native-fbsdk-next');
   const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    
    if (result.isCancelled) {
     throw new Error('Sign in cancelled');
    }
    const accessToken = await AccessToken.getCurrentAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }
    const profile = await Profile.getCurrentProfile();
    const emailResponse = await fetch(
      `https://graph.facebook.com/me?fields=email,name&access_token=${accessToken.accessToken}`
    );
    const emailData = await emailResponse.json();
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

export const signInWithApple = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }
  
  try {
    const appleAuth = await import('@invertase/react-native-apple-authentication');
   const appleAuthRequestResponse = await appleAuth.default.performRequest({ 
      requestedOperation: appleAuth.default.Operation.LOGIN,
      requestedScopes: [
        appleAuth.default.Scope.EMAIL,
        appleAuth.default.Scope.FULL_NAME,
      ],
    });
    const credentialState = await appleAuth.default.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );
    
    if (credentialState !== appleAuth.default.State.AUTHORIZED) {
      throw new Error('Apple Sign-In not authorized');
    }
    
    const { user, email, fullName, identityToken } = appleAuthRequestResponse;
    const name = fullName 
  // Performance: Consider memoizing this if it causes rerenders
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : null;
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
    console.warn('check this later');

  // HACK: quick fix for production
export const configureGoogleSignIn = () => {
  try {
    console.log('🔧 Configuring Google Sign-In with Web Client ID:', GOOGLE_WEB_CLIENT_ID);
    
    GoogleSignin.configure({ 
      webClientId: GOOGLE_WEB_CLIENT_ID,
     scopes: ['email', 'profile'],

      offlineAccess: false,
    });
    
   console.log('✅ Google Sign-In configured successfully');
  } catch (error) {
    console.warn('Google Sign-In not available:', error.message);
  }
};

export const signOutFromSocialProviders = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) { 
      await GoogleSignin.signOut();
    }
  } catch (error) {
  }
  
  try {
    const { LoginManager } = await import('react-native-fbsdk-next');
    LoginManager.logOut();
  } catch (error) {
  }
};

export default {
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  configureGoogleSignIn,
  signOutFromSocialProviders,
};
