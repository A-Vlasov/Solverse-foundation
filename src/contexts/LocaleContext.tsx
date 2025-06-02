import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DEFAULT_LOCALE, Locale, locales, TranslationKeys } from '../locales';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Пытаемся получить локаль из URL-параметра, localStorage или используем значение по умолчанию
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      // Проверяем наличие параметра lang в URL
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') as Locale | null;
      
      // Если параметр есть и он валидный, используем его
      if (langParam && (langParam === 'en' || langParam === 'ru')) {
        // Сохраняем в localStorage для будущих сессий
        localStorage.setItem('locale', langParam);
        return langParam;
      }
      
      // Иначе пробуем получить из localStorage
      const savedLocale = localStorage.getItem('locale') as Locale;
      return savedLocale && (savedLocale === 'en' || savedLocale === 'ru') 
        ? savedLocale 
        : DEFAULT_LOCALE;
    }
    return DEFAULT_LOCALE;
  });

  // Функция для перевода текста
  const t = (key: TranslationKeys): string => {
    return locales[locale][key] || locales[DEFAULT_LOCALE][key] || key;
  };

  // Функция для изменения локали с сохранением в localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  // Добавляем эффект для установки атрибута lang для HTML
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

// Хук для использования локализации
export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}; 