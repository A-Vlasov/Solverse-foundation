import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

export default function Login() {
  const { login, isLoggedIn, userRole } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Если пользователь уже авторизован, перенаправляем на админ-панель
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isLoggedIn && isAdmin && userRole === 'admin') {
      navigate('/admin');
    }
  }, [isLoggedIn, userRole, navigate]);

  // Функция для создания MD5 хеша
  const generateMD5 = (text: string) => {
    return CryptoJS.MD5(text).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError('Введите имя пользователя и пароль');
        setLoading(false);
        return;
      }

      // Получаем хеш пароля
      const passwordHash = generateMD5(password);

      // Проверяем учетные данные в базе данных
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('id, username')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .single();

      if (dbError || !data) {
        console.error('Login error:', dbError);
        setError('Неверный логин или пароль');
        setLoading(false);
        return;
      }

      // Успешный вход в систему
      login(data.id, 'admin');
      
      // Сохраняем факт авторизации в localStorage для сохранения сессии
      localStorage.setItem('isAdmin', 'true');
      
      // Перенаправляем на страницу администратора
      navigate('/admin');
    } catch (err) {
      setError('Ошибка при входе в систему');
      console.error('Login error:', err);
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
        </form>
      </div>
    </div>
  );
} 