'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, User, LogOut, ChevronDown, UserPlus } from 'lucide-react';
import NavLink from './NavLink';

export default function Header() {
  // Состояния для использования внутри компонента
  const [isClient, setIsClient] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Устанавливаем флаг клиента после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Хук для обработки клика вне выпадающего меню
  useEffect(() => {
    if (!isClient) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient]);
  
  // Функция для выхода из системы
  const handleLogout = () => {
    // Удаляем данные об авторизации из localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
    
    // Перенаправляем на страницу входа
    window.location.href = '/login';
  };
  
  // Получаем текущий путь
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Не показываем хедер на страницах входа и чата
  if (
    pathname === '/login' || 
    pathname.includes('/test-session/')
  ) {
    return null;
  }
  
  // Показываем только кнопку назад для страниц результатов тестирования
  if (
    pathname.includes('/test-results/') || 
    pathname.includes('/admin/session/')
  ) {
    return (
      <header className="bg-[#1a1a1a] border-b border-[#3d3d3d] p-4">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={() => window.location.href = '/admin'}
            className="p-2 rounded-lg hover:bg-[#3d3d3d] transition-colors flex items-center gap-2 text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>
      </header>
    );
  }

  // Проверяем, авторизован ли пользователь как администратор
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';

  // Рендерим основной заголовок
  return (
    <header className="bg-[#1a1a1a] border-b border-[#3d3d3d] p-4">
      <div className="container mx-auto flex items-center justify-between">
        {isClient ? (
          <NavLink 
            href={isAdmin ? "/admin" : "/"}
            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500"
          >
            OnlyFans Test System
          </NavLink>
        ) : (
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            OnlyFans Test System
          </span>
        )}
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors text-gray-300"
              >
                <User className="w-4 h-4 text-pink-500" />
                <span>Администратор</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && isClient && (
                <div className="absolute right-0 mt-2 w-64 bg-[#2d2d2d] rounded-lg border border-[#3d3d3d] shadow-xl z-10">
                  <div className="p-2">
                    <NavLink 
                      href="/admin/register-admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#3d3d3d] transition-colors text-gray-300 w-full text-left"
                      onClick={() => setShowDropdown(false)}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Регистрация администратора</span>
                    </NavLink>
                    
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#3d3d3d] transition-colors text-gray-300 w-full text-left mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выход</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 