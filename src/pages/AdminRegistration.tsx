import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

export default function AdminRegistration() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Функция для создания MD5 хеша
  const generateMD5 = (text: string) => {
    return CryptoJS.MD5(text).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Проверка входных данных
      if (!username || !password || !confirmPassword) {
        setError('Все поля обязательны для заполнения');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        setLoading(false);
        return;
      }

      // Проверка на существование пользователя
      const { data: existingUser, error: checkError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        setError('Пользователь с таким именем уже существует');
        setLoading(false);
        return;
      }

      // Получаем хеш пароля
      const passwordHash = generateMD5(password);

      // Добавляем нового администратора
      const { data, error: insertError } = await supabase
        .from('admin_users')
        .insert([
          { username, password_hash: passwordHash }
        ])
        .select();

      if (insertError) {
        console.error('Registration error:', insertError);
        setError('Ошибка при регистрации администратора');
        setLoading(false);
        return;
      }

      setSuccess('Администратор успешно зарегистрирован');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Ошибка при регистрации администратора');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#2d2d2d] rounded-2xl p-8 border border-[#3d3d3d]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6 text-center">
          Регистрация администратора
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
            {success}
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

          <div className="mb-4">
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
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-400 mb-2">
              Подтверждение пароля
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg focus:outline-none focus:border-pink-500"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 py-3 border border-[#3d3d3d] rounded-lg text-gray-300 font-semibold hover:bg-[#3d3d3d] transition-colors"
            >
              Назад
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Регистрация...' : 'Зарегистрировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 