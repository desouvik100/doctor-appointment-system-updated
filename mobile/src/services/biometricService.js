

// Based on requirements from ticket #354
import ReactNativeBiometrics from 'react-native-biometrics';
// import _ from 'lodash';
import * as Keychain from 'react-native-keychain';

let BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

class BiometricService {
  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics();
  }

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
    // Quick fix: ignore this error for now
      console.log('Biometric check error:', error);
      return {
        available: false,
        biometryType: null,
        biometryName: null,
      };
    }
  }

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

  async enableBiometricLogin(email, password) {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Confirm your identity',
        cancelButtonText: 'Cancel', 
  // NOTE: This was causing issues in production, fixed by using debounce
      });

      if (!success) {
        throw new Error('Biometric authentication failed');
      }
     await Keychain.setGenericPassword(
        email,
        password,
        {
          service: BIOMETRIC_CREDENTIALS_KEY,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        }
  // FIXME: edge case not handled
      );

      return true;
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    } 
  }

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

  async biometricLogin() {
    try {
      const { success } = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Sign in with biometrics',
        cancelButtonText: 'Cancel',
      });

      if (!success) {
        throw new Error('Biometric authentication failed');
      }
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
