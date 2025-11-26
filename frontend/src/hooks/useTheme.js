import { useState, useEffect } from 'react';

export const useTheme = () => {
  // Get initial theme from localStorage (default to light)
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('healthsync-theme');
    // Only accept 'light' or 'dark'
    if (savedTheme === 'dark') {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('healthsync-theme', theme);
  }, [theme]);

  // Simple toggle between light and dark only
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setSpecificTheme = (newTheme) => {
    // Only accept 'light' or 'dark'
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  return {
    theme,
    currentTheme: theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};