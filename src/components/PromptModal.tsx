import React from 'react';
import { X } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  promptText: string;
}

/**
 * Модальное окно для отображения промпта пользователя
 */
const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, userName, promptText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2d2d2d] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#3d3d3d] flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Промпт для пользователя <span className="text-pink-500">{userName}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3d3d3d]">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
              {promptText}
            </pre>
          </div>
          
          <div className="mt-6 text-gray-400 text-sm">
            <p>Этот промпт используется для задания контекста и стиля общения для Grok API.</p>
            <p className="mt-2">Промпт отправляется только с первым сообщением в новом чате.</p>
          </div>
        </div>
        
        <div className="p-4 border-t border-[#3d3d3d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal; 