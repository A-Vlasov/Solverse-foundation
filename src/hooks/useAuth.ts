import { useState, useEffect } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  userRole: string | null;
  userId: string | null;
}

export default function useAuth() {
  // Всегда устанавливаем авторизацию администратора для прототипа
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: true,
    userRole: 'admin',
    userId: 'demo-admin-id',
  });

  // В прототипе автоматически авторизуем пользователя при загрузке
  useEffect(() => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userId', 'demo-admin-id');
  }, []);

  const login = (userId: string, role: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', userId);
    
    setAuthState({
      isLoggedIn: true,
      userRole: role,
      userId,
    });
  };

  const logout = () => {
    // Для прототипа отключаем настоящий выход из системы
    console.log('Выход из системы отключен в прототипе');
    
    // Если нужно будет включить реальный выход, раскомментируйте код ниже
    /*
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    setAuthState({
      isLoggedIn: false,
      userRole: null,
      userId: null,
    });
    */
  };

  return {
    ...authState,
    login,
    logout,
  };
} 