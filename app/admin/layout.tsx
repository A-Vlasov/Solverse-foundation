'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useAuth from '../hooks/useAuth';

// Динамический импорт компонентов
const Header = dynamic(() => import('../components/Header'), { ssr: false });
const Loading = dynamic(() => import('../../src/components/Loading'), { ssr: false });

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, userRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // Установка флага монтирования
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Проверка авторизации после монтирования
  useEffect(() => {
    if (!isMounted) return;
    
    // Безопасный доступ к localStorage
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
    
    if (!isLoggedIn || !isAdmin || userRole !== 'admin') {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, userRole, router, isMounted]);

  // До монтирования рендерим пустое пространство
  if (!isMounted) {
    return <div className="min-h-screen bg-[#1a1a1a]"></div>;
  }

  // Во время загрузки показываем индикатор
  if (isLoading) {
    return <Loading />;
  }

  // Рендерим админ-панель
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-4">{children}</main>
    </div>
  );
} 