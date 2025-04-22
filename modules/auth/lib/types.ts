/**
 * Типы для модуля авторизации
 */


export interface User {
  id: string;
  name: string;
  telegram_id?: string;
}


export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}


export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}


export interface AuthCheckOptions {
  redirectUrl?: string;
  silent?: boolean;
} 