import React from 'react';
import { AlertCircle } from 'lucide-react';

type ErrorMessageProps = {
  message: string;
  className?: string;
  children?: React.ReactNode;
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className, children }) => (
  <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-6 ${className || ''}`}>
    <div className="flex items-center gap-3 mb-4">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <h3 className="text-xl font-semibold">Ошибка загрузки данных</h3>
    </div>
    <p className="text-gray-400 mb-6">{message}</p>
    {children}
  </div>
); 