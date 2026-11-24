import React from 'react';
import './BackButton.css';

const BackButton = ({ onClick, label = 'Back', className = '' }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default: go back in browser history
      window.history.back();
    }
  };

  return (
    <button 
      className={`back-button ${className}`}
      onClick={handleClick}
      aria-label={label}
    >
      <i className="fas fa-arrow-left"></i>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
