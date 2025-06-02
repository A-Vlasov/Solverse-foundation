'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Пользовательский хук для навигации, который совместим с Next.js
 * и безопасен для использования как на сервере, так и на клиенте
 */
export function useNavigation() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Функция для безопасной навигации
  const navigate = (path: string) => {
    if (isClient) {
      // Используем Next.js router, который уже правильно настроен
      router.push(path);
      
      // Опционально: прокрутка страницы вверх после навигации
      window.scrollTo(0, 0);
    }
  };
  
  return {
    navigate,
    isReady: isClient
  };
}

export default useNavigation; 