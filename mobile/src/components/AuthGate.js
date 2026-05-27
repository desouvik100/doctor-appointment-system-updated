/**
 * AuthGate - Prevents navigation before auth is resolved
 * Wraps the app to show the premium SplashScreen on startup
 */

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import SplashScreen from '../screens/SplashScreen';

const AuthGate = ({ children }) => {
  const { loading: userLoading } = useUser();
  const [splashFinished, setSplashFinished] = useState(false);

  // Render animated splash screen initially on app launch
  if (!splashFinished || userLoading) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return children;
};

export default AuthGate;

