import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = ({ className = '', showLabel = false, position = 'fixed' }) => {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    return theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  };

  const getLabel = () => {
    return theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  };

  const getTooltip = () => {
    return theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  };

  const baseStyles = {
    width: showLabel ? 'auto' : '50px',
    height: '50px',
    border: 'none',
    borderRadius: showLabel ? '25px' : '50%',
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    zIndex: 10000,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: showLabel ? '0.5rem' : '0',
    padding: showLabel ? '0 1rem' : '0',
    fontSize: '1.2rem',
    fontWeight: '500'
  };

  const positionStyles = position === 'fixed' ? {
    position: 'fixed',
    top: '20px',
    right: '20px'
  } : {};

  const handleClick = () => {
    toggleTheme();
    
    // Add a subtle animation feedback
    const button = document.querySelector('.theme-toggle');
    if (button) {
      button.style.transform = 'scale(0.9)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);
    }
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={handleClick}
      title={getTooltip()}
      aria-label={getLabel()}
      style={{
        ...baseStyles,
        ...positionStyles
      }}
    >
      <i className={getIcon()}></i>
      {showLabel && <span>{getLabel()}</span>}
    </button>
  );
};

// Theme selector dropdown component - Only Light/Dark
export const ThemeSelector = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light Mode', icon: 'fas fa-sun' },
    { value: 'dark', label: 'Dark Mode', icon: 'fas fa-moon' }
  ];

  return (
    <div className={`theme-selector ${className}`}>
      <label htmlFor="theme-select" className="form-label">
        <i className="fas fa-palette me-2"></i>
        Theme
      </label>
      <select
        id="theme-select"
        className="form-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      >
        {themes.map(({ value, label, icon }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Inline theme toggle for navbar - Only Light/Dark
export const NavbarThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="navbar-theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        width: '40px',
        height: '40px',
        border: 'none',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
    </button>
  );
};

export default ThemeToggle;