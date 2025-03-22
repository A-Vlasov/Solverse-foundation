import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle } from 'lucide-react';

export default function TestCompleted() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#2d2d2d] rounded-2xl p-8 border border-[#3d3d3d] text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
          Тестирование завершено
        </h1>
        
        <p className="text-gray-300 mb-8">
          Благодарим за прохождение тестирования! Ваши ответы записаны.
        </p>
        
        <button
          onClick={handleBackToHome}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Вернуться на главную
        </button>
      </div>
    </div>
  );
} 