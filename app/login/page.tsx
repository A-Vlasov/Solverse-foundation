'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TelegramAuth, AuthError } from '@/modules/auth';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  
  useEffect(() => {
    if (searchParams) {
      const errorParam = searchParams.get('error');
      if (errorParam) {
        switch (errorParam) {
          case 'missing_data':
            setError('Отсутствуют необходимые данные для авторизации');
            break;
          case 'validation_failed':
            setError('Не удалось подтвердить данные авторизации');
            break;
          case 'server_error':
            setError('Произошла ошибка сервера');
            break;
          default:
            setError('Произошла ошибка при авторизации');
        }
      }
    }
  }, [searchParams]);

  const handleAuthSuccess = (userData: any) => {
    console.log('Auth success:', userData);
  };

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-dark-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {error && (
          <AuthError
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}
        
        <TelegramAuth
          botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'your_bot'}
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          redirectUrl="/auth/callback"
        />
      </div>
    </div>
  );
} 