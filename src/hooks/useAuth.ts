import { useState, useEffect } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  userRole: string | null;
  userId: string | null;
}

export default function useAuth() {
  // Проверяем, есть ли данные в localStorage
  const isLoggedInFromStorage = localStorage.getItem('isLoggedIn') === 'true';
  const userRoleFromStorage = localStorage.getItem('userRole');
  const userIdFromStorage = localStorage.getItem('userId');
  
  // Инициализируем состояние данными из localStorage, если они есть
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: isLoggedInFromStorage,
    userRole: userRoleFromStorage,
    userId: userIdFromStorage,
  });

  // Обновляем localStorage только если состояние авторизации изменилось вручную
  // через методы login и logout, а не при инициализации
  useEffect(() => {
    // Этот эффект не должен выполняться при первом рендере
  }, [authState]);

  const login = (userId: string, role: string) => {
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