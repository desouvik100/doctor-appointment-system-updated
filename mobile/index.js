/**
 * @format
 */

// Polyfill for TextEncoder/TextDecoder (required by qrcode library)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      const utf8 = unescape(encodeURIComponent(str));
      const result = new Uint8Array(utf8.length);
      for (let i = 0; i < utf8.length; i++) {
        result[i] = utf8.charCodeAt(i);
      }
      return result;
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(bytes) {
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      return decodeURIComponent(escape(str));
    }
  };
}

// Polyfill to fix "property is not configurable" error
// Must be before any other imports
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

// Fix for "property is not configurable" error with Hermes
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

import 'react-native-gesture-handler'; // MUST BE FIRST
import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  'property is not configurable',
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Global error handler to suppress Hermes "property is not configurable" errors
const originalErrorHandler = global.ErrorUtils?.getGlobalHandler?.();
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Suppress the Hermes "property is not configurable" error
    if (error?.message?.includes('property is not configurable')) {
      console.log('Suppressed Hermes error:', error.message);
      return;
    }
    // Call original handler for other errors
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}

AppRegistry.registerComponent(appName, () => App);
