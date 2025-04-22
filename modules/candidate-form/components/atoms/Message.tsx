import React from 'react';
import { AlertCircle } from 'lucide-react';

interface MessageProps {
  type?: 'error' | 'success' | 'info';
  message: string;
}

const Message: React.FC<MessageProps> = ({ type = 'error', message }) => (
  <div className={`p-4 rounded-lg border flex items-center gap-2 ${
    type === 'error' 
      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
      : type === 'success'
        ? 'bg-green-500/10 border-green-500/20 text-green-400'
        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  }`}>
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p>{message}</p>
  </div>
);

export default Message; 