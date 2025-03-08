import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, User } from 'lucide-react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Не показываем хедер на страницах входа и чата
  if (
    location.pathname === '/login' || 
    location.pathname.includes('/test-session/')
  ) {
    return null;
  }
  
  // Показываем только кнопку назад для страниц результатов тестирования
  if (
    location.pathname.includes('/test-results/') || 
    location.pathname.includes('/admin/session/')
  ) {
    return (
      <header className="bg-[#1a1a1a] border-b border-[#3d3d3d] p-4">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-[#3d3d3d] transition-colors flex items-center gap-2 text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Назад</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#1a1a1a] border-b border-[#3d3d3d] p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link 
          to="/admin"
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500"
        >
          OnlyFans Test System
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-5 h-5 text-pink-500" />
            <span>Администратор (демо-режим)</span>
          </div>
        </div>
      </div>
    </header>
  );
} 