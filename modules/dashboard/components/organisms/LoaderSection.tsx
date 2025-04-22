import React from 'react';

const LoaderSection: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 bg-[#232323] rounded-2xl shadow-lg">
    <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full mb-4"></div>
    <div className="text-gray-400 text-lg">Загрузка данных...</div>
  </div>
);

export default LoaderSection; 