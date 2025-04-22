
import { useState } from 'react';


interface User {
  name: string;
  status: string; 
  lastMessage?: string;
  unreadCount?: number;
  isTyping?: boolean;
}

export function useChatUsers() {
  const [users, setUsers] = useState<User[]>([]); 
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  
  

  return {
    users,
    selectedUser,
    loadingStates,
    handleUserSelect: setSelectedUser,
    
  };
} 