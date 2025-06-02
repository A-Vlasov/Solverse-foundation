import en from './en';
import ru from './ru';

export type Locale = 'en' | 'ru';
export type TranslationKeys = keyof typeof en;

export const locales: Record<Locale, Record<TranslationKeys, string>> = {
  en,
  ru,
};

export { en, ru };

export const DEFAULT_LOCALE: Locale = 'en';

// Получаем список доступных языков для отображения в селекторе
export const availableLocales = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
];

// Функция для получения перевода по ключу
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  // Разбиваем ключ на сегменты, например "candidateForm.errors.missingToken" -> ["candidateForm", "errors", "missingToken"]
  const segments = key.split('.');
  
  // Получаем объект переводов для указанного языка
  const translations = locales[locale];
  
  // Если переводы не найдены, возвращаем ключ
  if (!translations) {
    return key;
  }
  
  // Пытаемся найти перевод по ключу
  try {
    let result = translations;
    for (const segment of segments) {
      // @ts-ignore - Динамический доступ к свойствам
      result = result[segment];
      if (result === undefined) {
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  } catch (error) {
    console.error(`Translation error for key "${key}":`, error);
    return key;
  }
} 