/**
 * Публичный API модуля авторизации
 * Все компоненты и функциональность авторизации доступны через этот файл
 */


export { useAuth } from './hooks/useAuth';
export { useAuthRequired } from './hooks/useAuthRequired';



export { default as AuthStatus } from './components/atoms/AuthStatus';

export { default as AuthError } from './components/molecules/AuthError';
export { default as UserProfile } from './components/molecules/UserProfile';
export { default as TelegramAuth } from './components/organisms/TelegramAuth';
export { default as AuthRedirect } from './components/organisms/AuthRedirect';
export { default as RequireAuth } from './lib/RequireAuth';


export { AuthProvider, AuthContext } from './lib/AuthContext';


export type { User, AuthContextType, TelegramAuthData, AuthCheckOptions } from './lib/types';


