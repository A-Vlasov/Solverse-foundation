import en from './en';
import ru from './ru';

export type Locale = 'en' | 'ru';


export type TranslationKeys = keyof typeof en | keyof typeof ru;

export const locales = {
  en,
  ru,
};

export { en, ru };

export const DEFAULT_LOCALE: Locale = 'en';


export const availableLocales = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
];


export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  
  const segments = key.split('.');
  
  
  
  const translations = locales[locale];
  
  
  if (!translations) {
    
    translations = locales[DEFAULT_LOCALE];
    if (!translations) return key;
  }
  
  
  try {
    let result: any = translations; 
    for (const segment of segments) {
      result = result[segment];
      if (result === undefined) {
        
        
        let defaultResult: any = locales[DEFAULT_LOCALE];
        for (const defaultSegment of segments) {
          defaultResult = defaultResult[defaultSegment];
          if (defaultResult === undefined) return key;
        }
        return typeof defaultResult === 'string' ? defaultResult : key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  } catch (error) {
    console.error(`Translation error for key "${key}":`, error);
    
    try {
      
      let defaultResult: any = locales[DEFAULT_LOCALE];
      for (const segment of segments) {
        defaultResult = defaultResult[segment];
        if (defaultResult === undefined) return key;
      }
      return typeof defaultResult === 'string' ? defaultResult : key;
    } catch (defaultError) {
      console.error(`Fallback translation error for key "${key}":`, defaultError);
      return key;
    }
  }
} 