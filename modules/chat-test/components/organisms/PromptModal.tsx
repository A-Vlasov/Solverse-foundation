
import React from 'react';
import { X } from 'lucide-react';



interface PromptData {
  title: string;
  description: string;
  persona: string;
  goal: string;
  rules: string[];
}

interface PromptModalProps {
  
  onClose: () => void;
  userPrompts: { [userName: string]: PromptData }; 
  getPromptSummary: (userName: string) => string; 
  
}

/**
 * Модальное окно для отображения системных промптов для разных ботов.
 * Needs refinement based on how userPrompts/getPromptSummary are handled.
 */
const PromptModal: React.FC<PromptModalProps> = ({ 
  onClose, 
  userPrompts, 
  getPromptSummary 
  
}) => {

  
  
  const exampleUserName = 'Marcus'; 
  const promptText = userPrompts[exampleUserName] ? getPromptSummary(exampleUserName) : 'Prompt not found.';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-xl border border-gray-200">
        {}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            Системные промпты {}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {}
        <div className="p-6 overflow-y-auto flex-1">
          {} 
          <p className="text-gray-600 mb-4">Здесь будут отображаться системные промпты, используемые для AI-ассистентов.</p>
          
          {}
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Пример: {exampleUserName}</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-600">
              {promptText}
            </pre>
          </div>
          {}
        </div>
        
        {}
        <div className="p-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Закрыть {}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal; 