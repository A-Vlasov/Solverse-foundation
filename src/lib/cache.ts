/**
 * Утилиты для кэширования данных на стороне клиента
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Кэш данных
 */
const cache = new Map<string, CacheEntry<any>>();

/**
 * Очищает кэш
 */
export function clearCache() {
  cache.clear();
}

/**
 * Удаляет устаревшие записи из кэша
 */
export function clearExpiredCache() {
  const now = Date.now();
  
  // Используем Array.from для совместимости со старыми версиями TypeScript
  Array.from(cache.entries()).forEach(([key, entry]) => {
    if (now > entry.timestamp + entry.expiresIn) {
      cache.delete(key);
      console.log(`Cache entry expired and deleted: ${key}`);
    }
  });
}

/**
 * Получает кэшированные данные или загружает их, если кэш отсутствует или устарел
 * @param key Ключ кэша
 * @param fetchFunction Функция для загрузки данных
 * @param expiresIn Время жизни кэша в миллисекундах (по умолчанию 5 минут)
 * @returns Кэшированные или свежезагруженные данные
 */
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expiresIn: number = 5 * 60 * 1000 // 5 минут по умолчанию
): Promise<T> {
  const now = Date.now();
  const cachedData = cache.get(key);
  
  // Проверяем наличие и актуальность кэша
  if (cachedData && now < cachedData.timestamp + cachedData.expiresIn) {
    console.log(`Using cached data for ${key}`);
    return cachedData.data as T;
  }
  
  console.log(`Fetching fresh data for ${key}`);
  
  try {
    // Загружаем новые данные
    const data = await fetchFunction();
    
    // Сохраняем в кэш только если данные не undefined и не null
    if (data !== undefined && data !== null) {
      cache.set(key, {
        data,
        timestamp: now,
        expiresIn
      });
      console.log(`Data cached for ${key}, expires in ${expiresIn/1000}s`);
    } else {
      console.warn(`Not caching empty/null data for ${key}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error in getCachedData for ${key}:`, error);
    // Если есть устаревшие данные в кэше, используем их вместо ошибки
    if (cachedData) {
      console.log(`Using stale cached data for ${key} due to fetch error`);
      return cachedData.data as T;
    }
    throw error;
  }
}

/**
 * Получает данные по URL с кэшированием
 * @param url URL для запроса
 * @param options Опции запроса fetch
 * @param expiresIn Время жизни кэша в миллисекундах
 * @returns JSON-данные ответа
 */
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  expiresIn: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  return getCachedData<T>(
    cacheKey,
    async () => {
      try {
        console.log(`Fetching data from ${url}`);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const responseText = await response.text();
          const errorMessage = `API error: ${response.status} - ${responseText}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log(`Data received from ${url}:`, data ? 'Success' : 'Empty');
        return data as T;
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
      }
    },
    expiresIn
  );
}

/**
 * Периодически очищает устаревший кэш
 */
setInterval(clearExpiredCache, 60 * 1000);

/**
 * Получает данные по URL без кэширования (для критичных запросов)
 * @param url URL для запроса
 * @param options Опции запроса fetch
 * @returns JSON-данные ответа
 */
export async function fetchWithoutCache<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    console.log(`Fetching data from ${url} (no cache)`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
} 