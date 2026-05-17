/**
 * HealthSync Pro - Entry Point
 * @format
 */

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

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreLogs([
  'property is not configurable',
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

AppRegistry.registerComponent(appName, () => App);
