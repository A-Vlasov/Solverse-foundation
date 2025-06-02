'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '../hooks/useAuth';
import Loading from '../../src/components/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isLoggedIn, userRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию на стороне клиента
    const checkAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (!isLoggedIn) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        router.push('/login');
        return;
      }
      
      if (adminOnly && (!isAdmin || userRole !== 'admin')) {
        // Если требуются права администратора, но у пользователя их нет
        router.push('/login');
        return;
      }
      
      // Если пользователь имеет нужные права
      setLoading(false);
    };
    
    checkAuth();
  }, [isLoggedIn, userRole, router, adminOnly]);

  // Пока проверяем авторизацию, показываем индикатор загрузки
  if (loading) {
    return <Loading />;
  }

  // Если авторизация успешна, отображаем содержимое
  return <>{children}</>;
} 