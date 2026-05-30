import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Reset the navigation stack to a specific route
 * @param {string} routeName - Name of the route to reset to
 */
export const resetToRoute = (routeName) => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  } else {
    console.log('⚠️ [NAV] Navigation reference is not ready yet');
  }
};
