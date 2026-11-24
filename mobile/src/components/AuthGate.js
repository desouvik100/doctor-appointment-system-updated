

import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import SplashScreen from '../screens/SplashScreen';

const AuthGate = ({ children }) => {
  const { loading: userLoading } = useUser();
  const [splashFinished, setSplashFinished] = useState(false);
  if (!splashFinished || userLoading) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return children;
};

export default AuthGate;

