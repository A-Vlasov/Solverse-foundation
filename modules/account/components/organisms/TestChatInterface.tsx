'use client';

import React from 'react';


export default function TestChatInterface() {
  return (
    <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d] h-96 flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-purple-400">Тестовый чат</h2>
      <div className="flex-grow border border-[#444] rounded-lg p-4 mb-4 overflow-y-auto">
        <p className="text-gray-500 italic">Интерфейс чата будет здесь...</p>
        {}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="Введите сообщение..." 
          className="flex-grow px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          disabled 
        />
        <button 
          className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled 
        >
          Отправить
        </button>
      </div>
       <button 
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full disabled:opacity-50"
          
        >
          Начать тестовый чат
        </button>
    </div>
  );
} 