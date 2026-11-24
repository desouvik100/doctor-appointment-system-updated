/**
 * EMR Footer Component
 * Subtle "EMR powered by HealthSync" branding
 * Requirements: 8.2
 */

import React from 'react';
import './EMRFooter.css';

const EMRFooter = ({ variant = 'default', showVersion = false }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`emr-footer emr-footer--${variant}`}>
      <div className="emr-footer__content">
        <span className="emr-footer__brand">
          <span className="emr-footer__logo">🏥</span>
          <span className="emr-footer__text">
            EMR powered by <strong>HealthSync</strong>
          </span>
        </span>
        
        {showVersion && (
          <span className="emr-footer__version">v1.0</span>
        )}
        
        <span className="emr-footer__copyright">
          © {currentYear}
        </span>
      </div>
    </footer>
  );
};

export default EMRFooter;
