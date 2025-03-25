'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import CryptoJS from 'crypto-js';

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { data, error } = await supabase.from('admin_users').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
          setSupabaseError(error.message);
        } else {
          console.log('Supabase connected successfully');
          setSupabaseStatus('connected');
          
          // Проверяем, есть ли уже админы
          const { count, error: countError } = await supabase
            .from('admin_users')
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.error('Error getting admin count:', countError);
          } else {
            setAdminCount(count);
          }
        }
      } catch (err) {
        console.error('Error checking Supabase:', err);
        setSupabaseStatus('error');
        setSupabaseError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    checkSupabase();
  }, []);
  
  const createTestAdmin = async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      // Проверяем, существует ли уже admin/admin
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', 'admin')
        .limit(1);
        
      if (checkError) {
        throw new Error(`Ошибка проверки существующего администратора: ${checkError.message}`);
      }
      
      if (existingAdmin && existingAdmin.length > 0) {
        setStatus('success');
        setMessage('Администратор admin/admin уже существует!');
        return;
      }
      
      // Создаем MD5 хеш пароля 'admin'
      const passwordHash = CryptoJS.MD5('admin').toString();
      
      // Создаем тестового администратора
      const { data, error } = await supabase
        .from('admin_users')
        .insert([
          { 
            username: 'admin',
            password_hash: passwordHash,
            email: 'admin@example.com',
            created_at: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) {
        throw new Error(`Ошибка создания администратора: ${error.message}`);
      }
      
      setStatus('success');
      setMessage('Администратор admin/admin успешно создан!');
      
      // Обновляем счетчик админов
      const { count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });
        
      setAdminCount(count);
    } catch (err) {
      console.error('Error creating test admin:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      <div className="max-w-md mx-auto bg-[#2d2d2d] rounded-2xl p-8 border border-[#3d3d3d]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6 text-center">
          Настройка приложения
        </h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Статус Supabase:</h2>
          {supabaseStatus === 'checking' && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin h-4 w-4 border-2 border-pink-500 rounded-full border-t-transparent"></div>
              Проверка соединения...
            </div>
          )}
          
          {supabaseStatus === 'connected' && (
            <div className="flex items-center gap-2 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Подключено к Supabase
            </div>
          )}
          
          {supabaseStatus === 'error' && (
            <div className="text-red-500">
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Ошибка подключения к Supabase
              </div>
              {supabaseError && <div className="text-sm text-red-400 ml-7">{supabaseError}</div>}
            </div>
          )}
          
          {adminCount !== null && (
            <div className="mt-2 text-gray-300">
              Количество администраторов в базе: <span className="font-semibold">{adminCount}</span>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Создать тестового администратора</h2>
          <p className="text-gray-400 mb-4">
            Создает администратора с логином <span className="font-mono bg-[#1a1a1a] px-1 rounded">admin</span> и паролем <span className="font-mono bg-[#1a1a1a] px-1 rounded">admin</span>
          </p>
          
          <button
            onClick={createTestAdmin}
            disabled={status === 'loading' || supabaseStatus !== 'connected'}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-opacity ${
              status === 'loading' || supabaseStatus !== 'connected'
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'
            }`}
          >
            {status === 'loading' ? 'Создание...' : 'Создать администратора'}
          </button>
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              status === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
              'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="border-t border-[#3d3d3d] pt-4">
          <h2 className="text-lg font-semibold mb-2">Дополнительная информация</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Не установлен'}</li>
            <li>Версия приложения: v1.0.0</li>
            <li>
              <a href="/login" className="text-pink-500 hover:underline">
                Перейти на страницу входа
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 