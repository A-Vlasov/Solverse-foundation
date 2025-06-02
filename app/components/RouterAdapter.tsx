'use client';

import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useRouter } from 'next/navigation';

// Компонент-обертка для создания контекста react-router-dom
export default function RouterAdapter({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Монтируем компонент только после загрузки в браузере
  useEffect(() => {
    setMounted(true);
  }, []);

  // Не рендерим React Router на сервере
  if (!mounted) {
    return <>{children}</>;
  }

  // Оборачиваем содержимое в контекст React Router
  return (
    <BrowserRouter>
      <RouterSync />
      <Routes>
        {/* Используем звездочку для обработки всех маршрутов */}
        <Route path="*" element={children} />
      </Routes>
    </BrowserRouter>
  );
}

// Компонент для синхронизации Next.js router и React Router
function RouterSync() {
  const nextRouter = useRouter();
  const reactNavigate = useNavigate();
  
  useEffect(() => {
    // Перехватываем все клики по ссылкам внутри приложения
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestAnchor = target.closest('a');
      
      if (closestAnchor) {
        const href = closestAnchor.getAttribute('href');
        // Проверяем, является ли ссылка внутренней
        if (href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/api')) {
          e.preventDefault();
          
          // Добавляем данные в историю для React Router
          reactNavigate(href);
          
          // Обновляем URL с помощью Next.js
          nextRouter.push(href);
        }
      }
    };
    
    // В React 17+ нужно использовать капитализацию (Capture)
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [nextRouter, reactNavigate]);
  
  return null;
}

// Экспорт хуков для совместимости с React Router
export function useCustomNavigate() {
  const nextRouter = useRouter();
  const reactNavigate = useNavigate();
  
  return (path: string) => {
    reactNavigate(path);
    nextRouter.push(path);
  };
} 