import { useState, useEffect } from 'react';

export const useTheme = () => {
  // Get initial theme from localStorage or system preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('healthsync-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      // Remove data-theme attribute to use system preference
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    // Save to localStorage
    localStorage.setItem('healthsync-theme', theme);
  }, [theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        // Force re-render when system theme changes
        setTheme('auto');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      switch (prevTheme) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const getCurrentTheme = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  return {
    theme,
    currentTheme: getCurrentTheme(),
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: getCurrentTheme() === 'dark',
    isLight: getCurrentTheme() === 'light',
    isAuto: theme === 'auto'
  };
};