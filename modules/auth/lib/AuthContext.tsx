'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, TelegramAuthData } from './types';


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (response.status !== 401) { 
          const errorData = await response.json();
          setError(errorData.error || 'Ошибка проверки статуса авторизации');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
      setError('Сетевая ошибка при проверке статуса авторизации');
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  
  const logout = async () => {
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
      setError('Ошибка при выходе из системы');
    } finally {
      setUser(null); 
    }
  };

  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user && !isLoading, 
    error,
    logout,
    checkAuthStatus, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 