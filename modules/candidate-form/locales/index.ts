import en from './en';
import ru from './ru';



export type Locale = 'en' | 'ru';


export const locales: Record<Locale, Record<string, any>> = { 
  en,
  ru,
};

export { en, ru };

export const DEFAULT_LOCALE: Locale = 'ru'; 

