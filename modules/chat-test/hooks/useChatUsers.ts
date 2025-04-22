import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/utils';


export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string; 
  isBot: boolean; 
  status: 'Online' | 'Away' | string; 
  
}



export interface UserStatus {
  isTyping: boolean;
  unreadCount: number;
  lastMessageId?: string | null; 
}



export interface UserStatusMap {
  [userId: string]: UserStatus;
}


interface UseChatUsersReturn {
  users: ChatUser[]; 
  selectedUser: ChatUser | null;
  userStatuses: UserStatusMap; 
  selectUser: (userId: string) => void;
  setTypingStatus: (userId: string, isTyping: boolean) => void;
  incrementUnreadCount: (userId: string) => void;
  resetUnreadCount: (userId: string) => void;
  isLoadingUsers: boolean;
  isLoadingStatuses: boolean;
  isErrorUsers: Error | undefined;
  isErrorStatuses: Error | undefined;
  
}



const DUMMY_USER_DATA: ChatUser[] = [
  { id: 'Marcus', name: 'Marcus', status: 'Online', isBot: false, avatarUrl: '/foto/marcus.jpg' },
  { id: 'Shrek', name: 'Shrek', status: 'Online', isBot: false, avatarUrl: '/foto/shrek.jpg' },
  { id: 'Oliver', name: 'Oliver', status: 'Away', isBot: false, avatarUrl: '/foto/oliver.jpg' },
  { id: 'Alex', name: 'Alex', status: 'Online', isBot: false, avatarUrl: '/foto/alex.jpg' },
];


/**
 * Hook to fetch users/models participating in the chat and their statuses.
 * @param sessionId The ID of the chat session.
 */
export const useChatUsers = (initialSelectedUserId?: string | null): UseChatUsersReturn => {
  
  const [users, setUsers] = useState<ChatUser[]>(DUMMY_USER_DATA);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialSelectedUserId || (users.length > 0 ? users[0].id : null));
  const [userStatuses, setUserStatuses] = useState<UserStatusMap>(() => {
    const initialStatuses: UserStatusMap = {};
    users.forEach(user => {
      initialStatuses[user.id] = { isTyping: false, unreadCount: 0, lastMessageId: null };
    });
    return initialStatuses;
  });

  
  useEffect(() => {
    if (initialSelectedUserId) {
        setSelectedUserId(initialSelectedUserId);
    } else if (!selectedUserId && users.length > 0) {
        setSelectedUserId(users[0].id);
    }
  }, [initialSelectedUserId, users, selectedUserId]);

  
  const selectUser = useCallback((userId: string) => {
    console.log(`Selecting user: ${userId}`);
    setSelectedUserId(userId);
    
    setUserStatuses(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || { isTyping: false, unreadCount: 0 }), unreadCount: 0 },
    }));
    
  }, []);

  
  const setTypingStatus = useCallback((userId: string, isTyping: boolean) => {
      setUserStatuses(prev => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isTyping: false, unreadCount: 0 }), isTyping },
      }));
      
      
      
  }, []);

  
  const incrementUnreadCount = useCallback((userId: string) => {
    
    if (userId !== selectedUserId) {
      setUserStatuses(prev => {
        const currentStatus = prev[userId] || { isTyping: false, unreadCount: 0 };
        return {
          ...prev,
          [userId]: { ...currentStatus, unreadCount: currentStatus.unreadCount + 1 },
        };
      });
    }
  }, [selectedUserId]);

  
  const resetUnreadCount = useCallback((userId: string) => {
     setUserStatuses(prev => ({
       ...prev,
       [userId]: { ...(prev[userId] || { isTyping: false, unreadCount: 0 }), unreadCount: 0 },
     }));
  }, []);

  
  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  
  
  

  return {
    users,
    selectedUser,
    userStatuses,
    selectUser,
    setTypingStatus,
    incrementUnreadCount,
    resetUnreadCount,
    isLoadingUsers: false,
    isLoadingStatuses: false,
    isErrorUsers: undefined,
    isErrorStatuses: undefined,
  };
} 