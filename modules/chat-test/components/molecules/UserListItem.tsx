
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { UserStatus, Message, ChatHistory } from '../organisms/Chat'; 


interface UserData {
  name: string;
  status: string; 
  lastMessage?: string; 
}

interface UserListItemProps {
  user: UserData;
  userStatus: UserStatus[string]; 
  chatHistory: Message[]; 
  isSelected: boolean;
  onSelect: (userName: string) => void;
  t: (key: string) => string; 
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  userStatus,
  chatHistory,
  isSelected,
  onSelect,
  t,
}) => {
  const lastMsg = chatHistory?.[chatHistory.length - 1];
  const lastMessageTime = lastMsg?.time || '';
  const lastMessageText = userStatus?.isTyping ? (
    <span className="italic">{t('typing')}</span>
  ) : lastMsg?.error ? (
    <span className="text-red-500 flex items-center"><AlertCircle size={14} className="mr-1"/> {t('errorSendingMessage')}</span>
  ) : lastMsg?.imageUrl ? (
    `${lastMsg.isOwn ? `${t('you')}: ` : ''}[${t('photo')}] ${lastMsg.imageComment || ''}`
  ) : lastMsg?.content ? (
     `${lastMsg.isOwn ? `${t('you')}: ` : ''}${lastMsg.content}`
  ) : (
    user.lastMessage 
  );

  return (
    <div
      key={user.name} 
      className={`p-4 flex items-center border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
      onClick={() => onSelect(user.name)}
    >
      <div className="relative mr-3">
        <img src={`/foto/${user.name.toLowerCase()}.jpg`} alt={user.name} className="w-12 h-12 rounded-full" />
        {} 
        {user.status === t('online') && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
        )}
        {} 
        {userStatus?.isTyping && (
             <span className="absolute bottom-0 left-0 bg-gray-200 px-1 py-0.5 rounded text-xs text-gray-600 animate-pulse">
                 {t('typing')}
             </span>
         )}
         {} 
         {userStatus?.unreadCount > 0 && !isSelected && (
            <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {userStatus.unreadCount > 9 ? '9+' : userStatus.unreadCount}
            </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold truncate">{user.name}</span>
          <span className="text-xs text-gray-500">
            {lastMessageTime}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
            {lastMessageText}
        </p>
      </div>
    </div>
  );
};

export default UserListItem;
