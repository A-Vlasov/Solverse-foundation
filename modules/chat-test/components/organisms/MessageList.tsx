import React from 'react';
import { Loader, AlertCircle, CheckCheck, Check, DollarSign, Eye } from 'lucide-react';

import { Message, UserStatus } from './Chat';
import { useLocale } from '../../contexts/LocaleContext';

import { TranslationKeys } from '../../locales';

interface MessageListProps {
  messages: Message[];
  selectedUser: string;
  
  userStatus?: UserStatus[string];
  sessionId: string;
  onRetry: (msg: Message) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedUser,
  userStatus,
  sessionId,
  onRetry,
  containerRef,
}) => {
  const { t } = useLocale(); 
  const retryKey: TranslationKeys = 'retrySending'; 

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-end max-w-lg ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
            {!msg.isOwn && (
              <img src={`/foto/${msg.sender.toLowerCase()}.jpg`} alt={msg.sender} className="w-8 h-8 rounded-full mr-2 self-start" />
            )}
            <div className={`relative px-4 py-2 rounded-lg shadow-md ${msg.isOwn ? 'bg-blue-500 text-white rounded-br-none dark:bg-blue-700' : 'bg-white text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200'}`}>
              {!msg.isOwn && <p className="font-semibold text-sm mb-1 text-indigo-600 dark:text-indigo-400">{msg.sender}</p>}

              {}
              {msg.imageUrl && (
                  <div className="mb-2 relative group">
                     <img
                        src={msg.imageUrl.startsWith('blob:') || msg.imageUrl.startsWith('data:') ? msg.imageUrl : `/api/chat-test/images?sessionId=${sessionId}&messageId=${msg.id}&url=${encodeURIComponent(msg.imageUrl)}`}
                        alt={t('photo')}
                        className="max-w-xs max-h-60 rounded-lg cursor-pointer object-cover"
                        onClick={() => {  }}
                      />
                     {}
                      {msg.price && msg.price !== t('free') && !msg.bought && !msg.isOwn && (
                         <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                             <DollarSign size={12} className="inline mr-1"/> {msg.price}
                         </div>
                      )}
                      {}
                      {msg.bought && !msg.isOwn && (
                         <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded dark:bg-green-600">
                             <CheckCheck size={12} className="inline mr-1"/> {t('bought')}
                         </div>
                      )}
                      {}
                      {msg.price && msg.price !== t('free') && !msg.bought && !msg.isOwn && (
                         <button
                             onClick={() => alert(`TODO: Implement purchase for ${msg.id}`)}
                             className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
                         >
                             <Eye size={12} className="inline mr-1"/> Buy
                         </button>
                      )}
                  </div>
              )}

              {}
              {msg.imageComment && (
                  <p className={`text-sm italic ${msg.isOwn ? 'text-blue-100 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'} mb-1`}>{msg.imageComment}</p>
              )}

              {}
              {msg.content && (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              <div className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-200 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} ${msg.isOwn ? 'text-right' : 'text-left'}`}>
                 {msg.time}
                 {msg.isOwn && (
                   <span className="ml-1">
                     {msg.pending ? <Loader size={12} className="inline animate-spin" /> :
                      msg.error ? <AlertCircle size={12} className="inline text-red-300 dark:text-red-400" /> :
                      msg.isRead ? <CheckCheck size={12} className="inline text-blue-300 dark:text-blue-400" /> :
                      <Check size={12} className="inline text-blue-300 dark:text-blue-400" />
                     }
                   </span>
                 )}
              </div>
              {}
              {msg.isOwn && msg.error && (
                 <button
                     onClick={() => onRetry(msg)}
                     className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md text-xs dark:bg-red-600 dark:hover:bg-red-700"
                     title={msg.errorDetails || t(retryKey)}
                     disabled={false} 
                 >
                     <svg xmlns="http:
                 </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {}
      {userStatus?.isTyping && ( 
          <div className="flex justify-start">
             <div className="flex items-end max-w-lg">
                {}
                <img src={`/foto/${selectedUser.toLowerCase()}.jpg`} alt={selectedUser} className="w-8 h-8 rounded-full mr-2 self-start" />
                 <div className="px-4 py-2 rounded-lg shadow-md bg-white text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200">
                     <p className="text-sm italic text-gray-500 animate-pulse dark:text-gray-400">{t('typing')}</p>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default MessageList; 