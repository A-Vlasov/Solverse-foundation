import React, { useEffect, useState } from 'react';
import AuthStatus from '../atoms/AuthStatus';
import AuthError from '../molecules/AuthError';

interface AuthRedirectProps {
  onComplete?: (success: boolean) => void;
  redirectPath?: string;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({
  onComplete,
  redirectPath = '/dashboard',
}) => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processAuthData = async () => {
      try {
        
        const urlParams = new URLSearchParams(window.location.search);
        const authData = {
          id: urlParams.get('id'),
          first_name: urlParams.get('first_name'),
          last_name: urlParams.get('last_name'),
          username: urlParams.get('username'),
          photo_url: urlParams.get('photo_url'),
          auth_date: urlParams.get('auth_date'),
          hash: urlParams.get('hash'),
        };

        
        
        
        
        if (!authData.id || !authData.hash || !authData.auth_date) {
          throw new Error('Отсутствуют необходимые параметры аутентификации');
        }
        
        
        
        
        
        const mockApiCall = () => {
          return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              
              localStorage.setItem('auth_token', 'mock_token_value');
              localStorage.setItem('user_id', authData.id || '');
              localStorage.setItem('user_name', authData.first_name || '');
              resolve();
            }, 1000);
          });
        };

        
        await mockApiCall();
        
        
        setStatus('authenticated');
        
        
        let count = 3;
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          
          if (count <= 0) {
            clearInterval(timer);
            
            window.location.href = redirectPath;
          }
        }, 1000);
        
        if (onComplete) {
          onComplete(true);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ошибка авторизации';
        setError(errorMessage);
        setStatus('unauthenticated');
        
        if (onComplete) {
          onComplete(false);
        }
      }
    };

    processAuthData();
  }, [onComplete, redirectPath]);

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-xl font-bold text-white mb-6">Авторизация через Telegram</h1>
      
      <div className="mb-6">
        <AuthStatus status={status} />
      </div>
      
      {status === 'loading' && (
        <div className="text-gray-300">
          Проверка данных авторизации...
        </div>
      )}
      
      {status === 'authenticated' && (
        <div className="text-green-400 text-center">
          <p>Вы успешно авторизованы!</p>
          <p className="mt-2">Перенаправление через {countdown} сек...</p>
        </div>
      )}
      
      {status === 'unauthenticated' && (
        <div className="text-center">
          <p className="text-red-400 mb-4">Авторизация не удалась</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Вернуться на страницу входа
          </button>
        </div>
      )}
      
      {error && (
        <AuthError
          message={error}
          className="mt-6 max-w-md"
        />
      )}
    </div>
  );
};

export default AuthRedirect; 