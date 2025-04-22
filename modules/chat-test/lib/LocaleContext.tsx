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
      const savedLocale = localStorage.getItem('locale') as Locale;
      return savedLocale && (savedLocale === 'en' || savedLocale === 'ru') 
        ? savedLocale 
        : DEFAULT_LOCALE;
    }
    return DEFAULT_LOCALE;
  });

  
  const t = (key: TranslationKeys): string => {
    
    
    return locales[locale]?.[key] || locales[DEFAULT_LOCALE]?.[key] || key;
  };

  
  const setLocale = (newLocale: Locale) => {
    if (newLocale === 'en' || newLocale === 'ru') { 
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
          localStorage.setItem('locale', newLocale);
        }
    } else {
        console.warn(`Attempted to set invalid locale: ${newLocale}`);
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
    
    console.error('useLocale must be used within a LocaleProvider. Falling back to default.');
    const defaultLocale = DEFAULT_LOCALE;
    return {
        locale: defaultLocale,
        setLocale: (l: Locale) => console.warn('LocaleProvider not found, cannot set locale to', l),
        
        t: (key: TranslationKeys) => locales[defaultLocale]?.[key] || key,
    };
    
  }
  return context;
}; 