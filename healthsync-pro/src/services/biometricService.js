/**
 * Biometric Service - Fingerprint/Face Authentication
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

class BiometricService {
  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics();
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable() {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      let biometryName = 'Biometrics';
      if (biometryType === ReactNativeBiometrics.TouchID) {
        biometryName = 'Touch ID';
      } else if (biometryType === ReactNativeBiometrics.FaceID) {
        biometryName = 'Face ID';
      } else if (biometryType === ReactNativeBiometrics.Biometrics) {
        biometryName = 'Fingerprint';
      }

      return {
        available,
        biometryType,
        biometryName,
      };
    } catch (error) {
      console.error('Biometric check error:', error);
      return {
        available: false,
        biometryType: null,
        biometryName: null,
      };
    }
  }

  /**
   * Check if user has stored credentials for biometric login
   */
  async hasStoredCredentials() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: BIOMETRIC_CREDENTIALS_KEY,
      });
      return !!credentials;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable biometric login by storing credentials
   */
  async enableBiometricLogin(email, password) {
    try {
      // First verify biometric
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Confirm your identity',
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        throw new Error('Biometric authentication failed');
      }

      // Store credentials securely
      await Keychain.setGenericPassword(
        email,
        password,
        {
          service: BIOMETRIC_CREDENTIALS_KEY,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        }
      );

      return true;
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }

  /**
   * Disable biometric login
   */
  async disableBiometricLogin() {
    try {
      await Keychain.resetGenericPassword({
        service: BIOMETRIC_CREDENTIALS_KEY,
      });
      return true;
    } catch (error) {
      console.error('Disable biometric error:', error);
      return false;
    }
  }

  /**
   * Authenticate with biometrics and get stored credentials
   */
  async biometricLogin() {
    try {
      // Prompt for biometric
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Sign in with biometrics',
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        throw new Error('Biometric authentication failed');
      }

      // Get stored credentials
      const credentials = await Keychain.getGenericPassword({
        service: BIOMETRIC_CREDENTIALS_KEY,
      });

      if (!credentials) {
        throw new Error('No stored credentials found');
      }

      return {
        email: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      console.error('Biometric login error:', error);
      throw error;
    }
  }

  /**
   * Simple biometric prompt for verification
   */
  async authenticate(promptMessage = 'Verify your identity') {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });
      return success;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    }
  }
}

export default new BiometricService();
