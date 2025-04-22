import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DEFAULT_LOCALE, Locale, locales, TranslationKeys } from '../locales';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') as Locale | null;
      
      
      if (langParam && (langParam === 'en' || langParam === 'ru')) {
        
        localStorage.setItem('locale', langParam);
        return langParam;
      }
      
      
      const savedLocale = localStorage.getItem('locale') as Locale;
      return savedLocale && (savedLocale === 'en' || savedLocale === 'ru') 
        ? savedLocale 
        : DEFAULT_LOCALE;
    }
    return DEFAULT_LOCALE;
  });

  
  const t = (key: TranslationKeys): string => {
    const value = locales[locale][key] || locales[DEFAULT_LOCALE][key];
    
    if (typeof value === 'string') {
      return value;
    }
    
    return key;
  };

  
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};


export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}; 