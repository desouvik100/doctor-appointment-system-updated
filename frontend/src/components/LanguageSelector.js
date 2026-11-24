import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSelector = ({ variant = 'dropdown', className = '', style = {}, darkMode = false }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Short codes for display
  const shortCodes = { en: 'EN', hi: 'हि', bn: 'বা' };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Match the landing page's premium btn-shadcn-secondary theme styles
  const buttonBg = darkMode ? 'transparent' : '#ffffff';
  const buttonBgHover = darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f4f4f5';
  const buttonBorder = darkMode ? 'rgba(255, 255, 255, 0.15)' : '#e4e4e7';
  const buttonColor = darkMode ? '#f1f5f9' : '#09090b';

  if (variant === 'buttons') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', ...style }} className={className}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: language === lang.code ? '#0ea5e9' : 'transparent',
              color: language === lang.code ? '#fff' : buttonColor
            }}
          >
            {shortCodes[lang.code] || lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', display: 'inline-block', zIndex: 50, ...style }} 
      className={className}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '500',
          background: buttonBg,
          border: `1px solid ${buttonBorder}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          color: buttonColor
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = buttonBgHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = buttonBg; }}
      >
        <i className="fas fa-globe" style={{ fontSize: '12px', opacity: 0.8 }}></i>
        <span>{shortCodes[language] || language.toUpperCase()}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '10px', opacity: 0.7 }}></i>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e4e7',
          overflow: 'hidden',
          zIndex: 100000,
          minWidth: '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '4px'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: language === lang.code 
                  ? (darkMode ? 'rgba(14, 165, 233, 0.15)' : '#eef2ff') 
                  : 'transparent',
                color: language === lang.code 
                  ? '#0ea5e9' 
                  : (darkMode ? '#f1f5f9' : '#334155'),
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { 
                if (language !== lang.code) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'; 
                }
              }}
              onMouseLeave={(e) => { 
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'transparent'; 
                }
              }}
            >
              <span style={{ fontWeight: '600', minWidth: '24px' }}>
                {shortCodes[lang.code] || lang.code.toUpperCase()}
              </span>
              <span>{lang.nativeName}</span>
              {language === lang.code && (
                <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: '10px' }}></i>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
