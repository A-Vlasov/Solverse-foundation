import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface UseAuthRequiredOptions {
  redirectTo?: string;
}

/**
 * Хук для защиты страниц, требующих авторизации
 * Перенаправляет неавторизованных пользователей на страницу входа
 */
export function useAuthRequired(options: UseAuthRequiredOptions = {}) {
  const { redirectTo = '/login' } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isLoading, isAuthenticated };
} 