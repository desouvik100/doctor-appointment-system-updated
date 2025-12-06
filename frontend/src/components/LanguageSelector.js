import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSelector = ({ variant = 'dropdown', className = '', style = {}, darkMode = false }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Short codes for display
  const shortCodes = { en: 'EN', hi: 'हि', bn: 'বা' };

  // Dark mode = black button, Light mode = indigo button
  const buttonBg = darkMode ? '#000000' : '#6366f1';
  const buttonBgHover = darkMode ? '#1a1a1a' : '#4f46e5';
  const buttonBorder = darkMode ? '#000000' : '#6366f1';
  const buttonColor = '#ffffff';

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

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
              background: language === lang.code ? '#6366f1' : 'transparent',
              color: language === lang.code ? '#fff' : buttonColor
            }}
          >
            {shortCodes[lang.code] || lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  const dropdownMenu = isOpen ? createPortal(
    <>
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 999998 }}
        onClick={() => setIsOpen(false)}
      />
      <div style={{
        position: 'fixed',
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        background: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        zIndex: 999999,
        minWidth: '120px'
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
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: language === lang.code ? '#eef2ff' : '#ffffff',
              color: language === lang.code ? '#6366f1' : '#334155',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { if (language !== lang.code) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { if (language !== lang.code) e.currentTarget.style.background = '#ffffff'; }}
          >
            <span style={{ fontWeight: '600', minWidth: '24px' }}>{shortCodes[lang.code] || lang.code.toUpperCase()}</span>
            <span>{lang.nativeName}</span>
            {language === lang.code && <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: '10px' }}></i>}
          </button>
        ))}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 10px',
          fontSize: '12px',
          fontWeight: '600',
          background: buttonBg,
          border: `1px solid ${buttonBorder}`,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: buttonColor
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = buttonBgHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = buttonBg; }}
      >
        <i className="fas fa-globe" style={{ fontSize: '11px', opacity: 0.8 }}></i>
        <span>{shortCodes[language] || language.toUpperCase()}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '8px', opacity: 0.7 }}></i>
      </button>
      {dropdownMenu}
    </div>
  );
};

export default LanguageSelector;
