'use client';

import { useState, useEffect } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  userRole: string | null;
  userId: string | null;
}

// Безопасная функция получения значений из localStorage
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
};

export default function useAuth() {
  // Создаем состояние с начальными значениями
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userRole: null,
    userId: null,
  });

  // Загружаем данные из localStorage при первом рендере (только на стороне клиента)
  useEffect(() => {
    const isLoggedInFromStorage = getLocalStorageItem('isLoggedIn') === 'true';
    const userRoleFromStorage = getLocalStorageItem('userRole');
    const userIdFromStorage = getLocalStorageItem('userId');
    
    setAuthState({
      isLoggedIn: isLoggedInFromStorage,
      userRole: userRoleFromStorage,
      userId: userIdFromStorage,
    });
  }, []);

  const login = (userId: string, role: string) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', userId);
    
    // Добавляем метку администратора если роль admin
    if (role === 'admin') {
      localStorage.setItem('isAdmin', 'true');
    }
    
    setAuthState({
      isLoggedIn: true,
      userRole: role,
      userId,
    });
  };

  const logout = () => {
    if (typeof window === 'undefined') return;
    
    // Удаляем все данные об авторизации из localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    
    // Сбрасываем состояние авторизации
    setAuthState({
      isLoggedIn: false,
      userRole: null,
      userId: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
} 