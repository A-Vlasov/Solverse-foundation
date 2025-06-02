import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NavigationManager() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // В прототипе всегда перенаправляем на дашборд с главной страницы
    if (location.pathname === '/') {
      navigate('/admin');
    }
  }, [location.pathname, navigate]);

  return null; // Компонент не рендерит UI
} 