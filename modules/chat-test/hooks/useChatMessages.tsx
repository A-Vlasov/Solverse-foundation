
import { useState } from 'react';


interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
}

interface ChatHistory {
  [key: string]: Message[]; 
}

export function useChatMessages(sessionId: string | null, selectedUser: string | null) {
  const [chatHistories, setChatHistories] = useState<ChatHistory>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  
  
  

  return {
    messages: chatHistories[selectedUser || ''] || [],
    isLoadingHistory,
    sendingMessage,
    
  };
} 