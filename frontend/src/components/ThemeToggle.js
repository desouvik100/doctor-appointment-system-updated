// frontend/src/components/ThemeToggle.js
import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle = ({ compact = false }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('healthsync-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('healthsync-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a2e' : '#667eea');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('healthsync-theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (compact) {
    return (
      <button 
        className="theme-toggle-compact"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    );
  }

  return (
    <div className="theme-toggle">
      <button 
        className={`theme-toggle__btn ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
      >
        <i className="fas fa-sun"></i>
        <span>Light</span>
      </button>
      <button 
        className={`theme-toggle__btn ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
      >
        <i className="fas fa-moon"></i>
        <span>Dark</span>
      </button>
    </div>
  );
};

// Hook for using theme in components
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('healthsync-theme') || 'light';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('healthsync-theme') || 'light');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return theme;
};

export default ThemeToggle;
