import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    // Update document lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Get translation for a key
  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Change language
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  // Available languages - using letters instead of flags for neutrality
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', icon: 'EN', color: '#3b82f6' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', icon: 'हि', color: '#f59e0b' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: 'বা', color: '#10b981' },
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
