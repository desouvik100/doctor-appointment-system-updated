import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSelector = ({ variant = 'dropdown', className = '', style = {}, darkMode = false }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Determine button styles based on context (darkMode = light text on dark bg)
  const buttonBg = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(99, 102, 241, 0.1)';
  const buttonBgHover = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(99, 102, 241, 0.2)';
  const buttonBorder = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(99, 102, 241, 0.3)';
  const buttonColor = darkMode ? '#ffffff' : '#1e293b';

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside or pressing Escape
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', ...style }} className={className}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: language === lang.code ? '#6366f1' : buttonBg,
              color: language === lang.code ? '#fff' : buttonColor
            }}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown menu rendered via portal to escape stacking context
  const dropdownMenu = isOpen ? createPortal(
    <>
      {/* Backdrop - fixed to cover entire screen */}
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 999998,
          background: 'transparent'
        }}
        onClick={() => setIsOpen(false)}
      />
      {/* Dropdown - fixed position calculated from button */}
      <div style={{
        position: 'fixed',
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        zIndex: 999999,
        minWidth: '160px'
      }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: language === lang.code ? '#eef2ff' : '#ffffff',
              color: language === lang.code ? '#6366f1' : '#334155',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { if (language !== lang.code) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { if (language !== lang.code) e.currentTarget.style.background = '#ffffff'; }}
          >
            <span style={{ fontSize: '18px' }}>{lang.flag}</span>
            <span>{lang.nativeName}</span>
            {language === lang.code && (
              <i className="fas fa-check" style={{ marginLeft: 'auto', color: '#6366f1' }}></i>
            )}
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
          gap: '8px',
          padding: '8px 14px',
          fontSize: '14px',
          fontWeight: '600',
          background: buttonBg,
          border: `1px solid ${buttonBorder}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: buttonColor
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = buttonBgHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = buttonBg; }}
      >
        <span style={{ fontSize: '18px' }}>{currentLang.flag}</span>
        <span style={{ fontWeight: '600' }}>{currentLang.nativeName}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '10px', opacity: 1 }}></i>
      </button>
      {dropdownMenu}
    </div>
  );
};

export default LanguageSelector;
