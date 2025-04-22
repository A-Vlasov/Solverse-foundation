'use client';

import React, { useState } from 'react';
import { LoginButton, type TelegramAuthData } from '@telegram-auth/react';
import { useRouter } from 'next/navigation';
import AuthStatus from '../atoms/AuthStatus';
import AuthError from '../molecules/AuthError';
import { useAuth } from '../../hooks/useAuth';

interface TelegramAuthProps {
  className?: string;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ className = '' }) => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (data: TelegramAuthData) => {
    setIsLoading(true);
    setError(null);
    console.log('Telegram Auth Data Received:', data);

    try {
      
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify(data), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка верификации на сервере');
      }

      console.log('Server verification successful');
      
      
      
      
      
      window.location.reload(); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обработки авторизации Telegram';
      console.error('handleAuth Error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
    
  };

  const clearError = () => setError(null);

  
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!botUsername) {
     
     return <AuthError message="Ошибка: Не указан NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env" />;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4">
        <AuthStatus status={authLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'} />
      </div>

      {!authLoading && !isAuthenticated && (
        <div className="w-full max-w-xs flex flex-col items-center">
          <p className="text-gray-400 text-center mb-4">
            Войдите в систему, используя свой аккаунт Telegram
          </p>
          {}
          <LoginButton
            botUsername={botUsername}
            onAuthCallback={handleAuth} 
            buttonSize="large"
            cornerRadius={8}
            showAvatar={true}
            lang="ru" 
          />
          {isLoading && (
             <p className="text-gray-400 mt-4">Проверка...</p>
          )}
        </div>
      )}

      {!authLoading && isAuthenticated && (
        <div className="text-green-400 mt-4">
          Вы успешно авторизованы!
        </div>
      )}

      {error && (
        <AuthError
          message={error}
          onClose={clearError}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default TelegramAuth; 