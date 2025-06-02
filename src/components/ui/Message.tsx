import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface MessageProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

const Message: React.FC<MessageProps> = ({ type, message }) => {
  const configs = {
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      containerClass: 'bg-red-500/10 border-red-500/20 text-red-400',
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      containerClass: 'bg-green-500/10 border-green-500/20 text-green-400',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      containerClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    }
  };
  
  const { icon, containerClass } = configs[type];
  
  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${containerClass}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <p>{message}</p>
    </div>
  );
};

export default Message; 