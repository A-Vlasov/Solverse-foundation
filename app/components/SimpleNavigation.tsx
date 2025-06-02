'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Типы для NavLink
interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

// Ключи для страниц, которые были предзагружены
const prefetchedPages = new Set<string>();

/**
 * Простой и надежный компонент для навигации через window.location
 */
export function NavLink({
  href,
  children,
  className = '',
  onClick,
}: NavLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }
    
    // Используем простую и надежную навигацию
    window.location.href = href;
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

/**
 * Функция для прямой навигации без необходимости использования хука
 */
export function navigate(path: string) {
  // Проверяем, содержит ли путь уже параметры
  // Если нет и в текущем URL есть параметр lang, добавляем его
  if (!path.includes('?') && typeof window !== 'undefined') {
    const currentUrlParams = new URLSearchParams(window.location.search);
    const langParam = currentUrlParams.get('lang');
    
    if (langParam) {
      path = `${path}${path.includes('?') ? '&' : '?'}lang=${langParam}`;
    }
  }

  // Используем прямую навигацию
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

/**
 * Хук для навигации в компонентах
 */
export function useNavigation() {
  const router = useRouter();

  const navigate = (path: string) => {
    // Добавляем проверку на корректность пути
    if (!path || typeof path !== 'string') {
      console.error('Invalid navigation path:', path);
      return;
    }

    // Проверяем, содержит ли путь уже параметры
    // Если нет и в текущем URL есть параметр lang, добавляем его
    if (!path.includes('?') && typeof window !== 'undefined') {
      const currentUrlParams = new URLSearchParams(window.location.search);
      const langParam = currentUrlParams.get('lang');
      
      if (langParam) {
        path = `${path}${path.includes('?') ? '&' : '?'}lang=${langParam}`;
      }
    }

    // Используем Next.js router для программной навигации
    try {
      router.push(path);
    } catch (e) {
      console.error('Navigation error:', e);
      // Fallback на обычную навигацию если router.push вызывает ошибку
      window.location.href = path;
    }
  };

  // Новая функция для предварительной загрузки страниц
  const prefetch = (path: string) => {
    if (!path || typeof path !== 'string' || prefetchedPages.has(path)) {
      return;
    }
    
    try {
      router.prefetch(path);
      prefetchedPages.add(path);
    } catch (error) {
      // Игнорируем ошибки предзагрузки для скорости
    }
  };

  return { navigate, prefetch };
}

/**
 * Хук для получения текущего пути
 */
export function useLocation() {
  return {
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    search: typeof window !== 'undefined' ? window.location.search : ''
  };
}

/**
 * Хук для получения параметров запроса
 */
export function useParams() {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  
  // Извлекаем значения из URL-пути
  const pathSegments = window.location.pathname.split('/');
  
  // Проверяем, есть ли в пути сегменты, которые могут быть параметрами
  // Например, /user/123 - где 123 может быть id
  if (pathSegments.length > 2) {
    // Простая эвристика: последний сегмент может быть id
    result.id = pathSegments[pathSegments.length - 1];
  }
  
  // Добавляем query-параметры
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
} 