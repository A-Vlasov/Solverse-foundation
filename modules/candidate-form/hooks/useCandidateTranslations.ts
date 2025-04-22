'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { DEFAULT_LOCALE, Locale, locales } from '../locales';


const getNestedValue = (obj: Record<string, any>, keyPath: string): string | undefined => {
  const keys = keyPath.split('.');
  let current = obj;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[k];
  }
  return typeof current === 'string' ? current : undefined;
};

export function useCandidateTranslations() {
  const searchParams = useSearchParams();
  const params = useParams();

  const [locale, setLocale] = useState<Locale>(() => {
    
    if (typeof window !== 'undefined') {
      const langParam = params?.lang as Locale || searchParams?.get('lang') as Locale;
      if (langParam && locales[langParam]) {
        return langParam;
      }
      
      
      
      
      
    }
    return DEFAULT_LOCALE;
  });

  
  useEffect(() => {
    const langParam = params?.lang as Locale || searchParams?.get('lang') as Locale;
    if (langParam && locales[langParam] && langParam !== locale) {
        setLocale(langParam);
        
        
    }
  }, [params, searchParams, locale]);

  const t = useCallback((key: string): string => {
    const currentTranslations = locales[locale];
    const defaultTranslations = locales[DEFAULT_LOCALE];

    let translation = getNestedValue(currentTranslations, key);
    if (translation !== undefined) {
      return translation;
    }

    translation = getNestedValue(defaultTranslations, key);
    if (translation !== undefined) {
        
        
      return translation;
    }

    console.warn(`Translation key "${key}" not found.`);
    return key; 
  }, [locale]); 

  return { locale, t };
} 