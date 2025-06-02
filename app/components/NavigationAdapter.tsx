'use client';

import { ReactNode, createContext, useContext, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Создаем контекст для имитации функций react-router-dom
type NavigationContextType = {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  location: {
    pathname: string;
  };
};

const NavigationContext = createContext<NavigationContextType | null>(null);

// Хук для использования в компонентах вместо useNavigate из react-router-dom
export function useNavigate() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigate must be used within a NavigationAdapter');
  }
  return context.navigate;
}

// Хук для использования вместо useLocation из react-router-dom
export function useLocation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useLocation must be used within a NavigationAdapter');
  }
  return context.location;
}

// Компонент-адаптер
export default function NavigationAdapter({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Создаем функцию навигации, аналогичную react-router-dom
  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router]
  );

  // Значение контекста
  const contextValue: NavigationContextType = {
    navigate,
    location: {
      pathname: pathname || '/',
    },
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
} 