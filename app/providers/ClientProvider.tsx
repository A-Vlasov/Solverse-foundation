'use client';

import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LocaleProvider } from '../../src/contexts/LocaleContext';

interface ClientProviderProps {
  children: ReactNode;
}

/**
 * Компонент для обертывания всего приложения на клиентской стороне
 * Предоставляет контекст React Router для совместимости с существующим кодом,
 * но использует навигацию Next.js
 */
export default function ClientProvider({ children }: ClientProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Если компонент еще не смонтирован, отображаем только дочерние элементы
  // без обертки BrowserRouter
  if (!mounted) {
    return <>{children}</>;
  }

  // На клиенте оборачиваем в LocaleProvider и BrowserRouter
  return (
    <LocaleProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </LocaleProvider>
  );
} 