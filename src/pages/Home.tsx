import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      <div className="max-w-4xl mx-auto text-center pt-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
          Добро пожаловать в систему тестирования
        </h1>
        <p className="text-xl text-gray-300 mb-10">
          Здесь вы можете пройти тестирование для проверки ваших навыков
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] hover:border-pink-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-4">Я соискатель</h2>
            <p className="text-gray-400 mb-6">
              Пройдите тестирование и оцените свои навыки
            </p>
            <Link
              to="/candidate"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-block"
            >
              Начать тестирование
            </Link>
          </div>
          
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] hover:border-purple-500 transition-colors">
            <h2 className="text-2xl font-semibold mb-4">Я администратор</h2>
            <p className="text-gray-400 mb-6">
              Войдите в систему для просмотра результатов и управления
            </p>
            <Link
              to="/login"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-block"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 