import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { login, isLoggedIn, userRole } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Инициализируем только на клиенте
  useEffect(() => {
    setIsMounted(true);
    
    // Проверка подключения к API
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        
        if (response.ok) {
          console.log('API connection successful');
          setDebugInfo(prev => prev + '\nAPI connection successful');
        } else {
          console.error('API connection error');
          setDebugInfo(prev => prev + '\nAPI connection error: ' + data.error);
        }
      } catch (err) {
        console.error('Error checking API connection:', err);
        setDebugInfo(prev => prev + `\nError checking API: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    checkConnection();
  }, []);
  
  // Если пользователь уже авторизован, перенаправляем на админ-панель
  useEffect(() => {
    if (!isMounted) return;
    
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
    if (isLoggedIn && isAdmin && userRole === 'admin') {
      console.log('User already logged in, redirecting to admin');
      setDebugInfo(prev => prev + '\nUser already logged in, redirecting to admin');
      window.location.href = '/admin';
    }
  }, [isLoggedIn, userRole, isMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    setDebugInfo(prev => prev + '\nForm submitted');
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError('Введите имя пользователя и пароль');
        setDebugInfo(prev => prev + '\nEmpty username or password');
        setLoading(false);
        return;
      }

      console.log('Sending auth request to server...');
      setDebugInfo(prev => prev + '\nSending auth request to server');
      
      // Вместо прямого обращения к базе данных, используем серверный API
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        console.log('Auth response:', response.status, data);
        setDebugInfo(prev => prev + `\nAuth response: ${response.status}, ${JSON.stringify(data)}`);

        if (!response.ok) {
          console.error('Login error:', data.error);
          setError(data.error || 'Ошибка аутентификации');
          setLoading(false);
          return;
        }

        // Успешный вход в систему
        console.log('Login successful, user ID:', data.user.id);
        setDebugInfo(prev => prev + `\nLogin successful, user ID: ${data.user.id}`);
        login(data.user.id, data.user.role);
        
        // Сохраняем факт авторизации в localStorage для сохранения сессии
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdmin', 'true');
        }
        
        // Перенаправляем на страницу администратора с использованием window.location
        console.log('Navigating to /admin');
        setDebugInfo(prev => prev + '\nNavigating to /admin');
        window.location.href = '/admin';
      } catch (apiError) {
        console.error('API error:', apiError);
        setDebugInfo(prev => prev + `\nAPI error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        setError('Ошибка при соединении с сервером');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setDebugInfo(prev => prev + `\nGeneral error: ${err instanceof Error ? err.message : String(err)}`);
      setError('Ошибка при входе в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#2d2d2d] rounded-2xl p-8 border border-[#3d3d3d]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6 text-center">
          Вход для администраторов
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-400 mb-2">
              Логин
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg focus:outline-none focus:border-pink-500"
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-400 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg focus:outline-none focus:border-pink-500"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
          
          {debugInfo && (
            <div className="mt-6 p-3 bg-gray-800 rounded-lg overflow-auto max-h-40 text-xs font-mono">
              <div className="text-gray-400 whitespace-pre-wrap">{debugInfo}</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 