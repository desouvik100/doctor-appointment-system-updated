/**
 * @format
 */

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

AppRegistry.registerComponent(appName, () => App);
