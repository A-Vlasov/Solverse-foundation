
import React from 'react';
import UserListItem from '../molecules/UserListItem';
import { Info, Settings, LogOut } from 'lucide-react';


interface UserDataForListItem {
  user: {
    name: string;
    status?: string; 
    lastMessageText?: string;
  };
  isSelected: boolean;
  isTyping: boolean;
  unreadCount: number;
  lastMessageTime?: string;
  lastMessageIsError?: boolean;
  lastMessageIsOwn?: boolean;
  lastMessageIsPhoto?: boolean;
  lastMessagePhotoComment?: string;
}

interface UserListProps {
  usersData: UserDataForListItem[]; 
  selectedUserName: string | null; 
  onSelectUser: (userName: string) => void;
  onOpenPromptModal: () => void;
  onLogout: () => void;
}

const UserList: React.FC<UserListProps> = ({
  usersData,
  selectedUserName,
  onSelectUser,
  onOpenPromptModal,
  onLogout,
}) => {

  return (
    <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col h-full">
      {}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h2 className="font-semibold text-lg">Чаты</h2> {}
        <div className="space-x-2">
          <button className="text-gray-500 hover:text-gray-700" onClick={onOpenPromptModal}>
            <Info size={20} />
          </button>
          {}
          <button className="text-gray-500 hover:text-gray-700">
            <Settings size={20} />
          </button>
           {}
           <button onClick={onLogout} className="text-gray-500 hover:text-red-500" title="Logout">
                <LogOut size={20} />
           </button>
        </div>
      </div>
      
      {}
      <div className="overflow-y-auto flex-1">
        {usersData.map((data) => (
          <UserListItem
            key={data.user.name} 
            user={{ 
              name: data.user.name,
              status: data.user.status || 'Away', 
              lastMessageText: data.user.lastMessageText 
            }}
            
            isSelected={selectedUserName === data.user.name}
            isTyping={data.isTyping}
            unreadCount={data.unreadCount}
            lastMessageTime={data.lastMessageTime}
            lastMessageIsError={data.lastMessageIsError}
            lastMessageIsOwn={data.lastMessageIsOwn}
            lastMessageIsPhoto={data.lastMessageIsPhoto}
            lastMessagePhotoComment={data.lastMessagePhotoComment}
            onClick={onSelectUser}
          />
        ))}
      </div>
    </div>
  );
};

export default UserList; 