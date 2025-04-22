
import React from 'react';
import { AlertCircle, Info, Check, CheckCheck, Loader, DollarSign, Eye } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';


export interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
  isTyping?: boolean;
  error?: boolean;
  errorDetails?: string;
  imageUrl?: string;
  price?: string;
  imageComment?: string;
  purchased?: boolean; 
  bought?: boolean; 
  pending?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  sessionId?: string;
  onRetry: (message: Message) => void;
}


const cleanDisplayContent = (content: string): string => {
  return content
    .replace(/\[\s*Bought\s*\]/gi, '')
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .replace(/\[[^\]]*\]/g, '') 
    .replace(/\s+/g, ' ')
    .trim();
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sessionId,
  onRetry,
}) => {
  const { t } = useLocale();

  
  const avatarUrl = message.isOwn ? undefined : `/foto/${message.sender.toLowerCase()}.jpg`;

  
  const displayImageUrl = message.imageUrl
    ? message.imageUrl.startsWith('blob:') || message.imageUrl.startsWith('data:')
      ? message.imageUrl
      
      : `/api/chat-test/images?sessionId=${sessionId}&messageId=${message.id}&url=${encodeURIComponent(message.imageUrl)}`
    : undefined;

  
  if (message.isTyping) {
    return (
      <div className="flex justify-start">
         <div className="flex items-end max-w-lg">
            {avatarUrl && <img src={avatarUrl} alt={message.sender} className="w-8 h-8 rounded-full mr-2 self-start" />}
             <div className="px-4 py-2 rounded-lg shadow-md bg-white text-gray-800 rounded-bl-none">
                 <p className="text-sm italic text-gray-500 animate-pulse">{t('typing')}</p>
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end max-w-lg ${message.isOwn ? 'flex-row-reverse' : ''}`}>
        {}
        {!message.isOwn && avatarUrl && (
          <img src={avatarUrl} alt={message.sender} className="w-8 h-8 rounded-full mr-2 self-start flex-shrink-0" />
        )}
        <div className={`relative px-4 py-2 rounded-lg shadow-md ${message.isOwn ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
          {} 
          {!message.isOwn && <p className="font-semibold text-sm mb-1 text-indigo-600">{message.sender}</p>}
          
          {}
          {displayImageUrl && (
              <div className="mb-2 relative group">
                  <img 
                      src={displayImageUrl} 
                      alt={t('photo')} 
                      className="max-w-xs max-h-60 rounded-lg cursor-pointer object-cover" 
                  />
                  {}
                  {message.price && message.price !== t('free') && !message.bought && !message.isOwn && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          <DollarSign size={12} className="inline mr-1"/> {message.price}
                      </div>
                  )}
                  {}
                  {message.bought && !message.isOwn && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          <CheckCheck size={12} className="inline mr-1"/> {t('bought')}
                      </div>
                  )}
                  {}
                  {message.price && message.price !== t('free') && !message.bought && !message.isOwn && (
                      <button 
                          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                          <Eye size={12} className="inline mr-1"/> Buy
                      </button>
                  )}
              </div>
          )}
          
          {} 
          {message.imageComment && (
              <p className={`text-sm italic ${message.isOwn ? 'text-blue-100' : 'text-gray-600'} mb-1`}>{message.imageComment}</p>
          )}
          
          {} 
          {message.content && (
              <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          {}
          <div className={`text-xs mt-1 ${message.isOwn ? 'text-blue-200' : 'text-gray-500'} ${message.isOwn ? 'text-right' : 'text-left'}`}>
              {message.time}
              {message.isOwn && (
              <span className="ml-1 inline-block align-middle">
                  {message.pending ? <Loader size={12} className="inline animate-spin" /> : 
                  message.error ? <AlertCircle size={12} className="inline text-red-300" /> : 
                  message.isRead ? <CheckCheck size={12} className="inline text-blue-300" /> : 
                  <Check size={12} className="inline text-blue-300" />
                  }
              </span>
              )}
          </div>

          {} 
          {message.isOwn && message.error && (
              <button 
                  onClick={() => onRetry(message)}
                  className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md text-xs"
                  title="Retry sending"
              >
                  <svg xmlns="http:
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 