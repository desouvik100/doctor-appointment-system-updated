/**
 * HealthSync Pro — Entry Point
 * @format
 */

// ── Polyfills (must be first) ─────────────────────────────────────────────
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

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

if (typeof global.performance === 'undefined') {
  global.performance = { now: () => Date.now() };
}

// ── React Native imports ──────────────────────────────────────────────────
import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// ── Suppress known harmless warnings ─────────────────────────────────────
LogBox.ignoreLogs([
  // React Navigation
  'Non-serializable values were found in the navigation state',
  // React Native internals
  'ViewPropTypes will be removed',
  'property is not configurable',
  // Firebase
  'AsyncStorage has been extracted',
  // Reanimated
  "[Reanimated] Couldn't determine the current value",
  // Socket.IO
  'WebSocket connection failed',
  // Keychain
  'Keychain is not available',
  // Deprecated APIs
  'componentWillReceiveProps',
  'componentWillMount',
  'componentWillUpdate',
  // Network
  'Network request failed',
  // Misc
  'Setting a timer',
  'EventEmitter.removeListener',
]);

// ── Global error handler (prevents red screen in production) ─────────────
if (!__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Still log to console but don't crash
    originalConsoleError(...args);
  };
}

// ── Register app ─────────────────────────────────────────────────────────
AppRegistry.registerComponent(appName, () => App);
