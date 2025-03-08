import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

export default function NavigationManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuth();

  useEffect(() => {
    // Перенаправляем на страницу входа, если пользователь не авторизован
    // и пытается попасть на защищенные маршруты
    if (!isLoggedIn && location.pathname.startsWith('/admin')) {
      navigate('/login');
    }
    
    // Если пользователь на главной, всегда перенаправляем на дашборд
    if (location.pathname === '/') {
      navigate('/admin');
    }
  }, [location.pathname, isLoggedIn, userRole, navigate]);

  return null; // Компонент не рендерит UI
} 