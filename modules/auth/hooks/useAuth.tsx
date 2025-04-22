import { useContext } from 'react';
import { AuthContext } from '../lib/AuthContext';

/**
 * Хук для доступа к данным авторизации
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 