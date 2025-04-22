import useSWR, { useSWRConfig } from 'swr';
import { fetcher } from '../lib/utils';
import { useState, useCallback, useEffect } from 'react'; 


export interface Message {
  id: string;
  sender: string; 
  content: string;
  time: string; 
  isOwn: boolean; 
  imageUrl?: string;
  price?: string;
  imageComment?: string;
  isRead?: boolean;
  isTyping?: boolean;
  error?: boolean;
  errorDetails?: string;
  bought?: boolean;
  pending?: boolean;
  
}

interface ChatHistory {
  [userName: string]: Message[];
}

interface SendMessageOptions {
  imageUrl?: string;
  image_price?: string; 
  image_comment?: string;
}

interface BotResponse {
    message?: Message; 
    error?: string; 
    
}

interface UseChatMessagesReturn {
  chatHistories: ChatHistory;
  setChatHistories: React.Dispatch<React.SetStateAction<ChatHistory>>; 
  isLoadingHistory: boolean;
  historyError: Error | null;
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  retryMessage: (failedMessage: Message) => Promise<void>;
  
}

/**
 * Hook to fetch chat history and send messages.
 * @param sessionId The ID of the chat session.
 * @param initialMessages Optional initial messages (e.g., from server props).
 */
export function useChatMessages(sessionId: string | null, selectedUserName: string): UseChatMessagesReturn {
  const { mutate } = useSWRConfig();
  const historyUrl = sessionId ? `/api/chat-test/history?sessionId=${sessionId}` : null;

  
  const { data: history, error, isLoading } = useSWR<Message[]>(historyUrl, fetcher, {
    
    fallbackData: [],
    
  });

  
  
  
  
  const [messages, setMessages] = useState<Message[]>(history || []);

  
  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  const [chatHistories, setChatHistories] = useState<ChatHistory>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<Error | null>(null);

  
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) {
        setChatHistories({}); 
        return;
      }
      console.log(`Fetching chat history for session ${sessionId}...`);
      setIsLoadingHistory(true);
      setHistoryError(null);
      try {
        
        const response = await fetch(`/api/chat-test/history?sessionId=${sessionId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chat history: ${response.statusText}`);
        }
        
        const historyData: Message[] = await response.json(); 
        console.log('History data received:', historyData);

        
        const formattedHistories: ChatHistory = {};
        historyData.forEach(msg => {
           
           const chatKey = msg.isOwn ? selectedUserName : msg.sender; 
           if (!formattedHistories[chatKey]) {
              formattedHistories[chatKey] = [];
           }
           
           formattedHistories[chatKey].push({ ...msg, pending: false, error: false });
        });
        
        
        
        const allUsers = Object.keys(formattedHistories); 
        allUsers.forEach(user => {
            if (!formattedHistories[user]) {
                formattedHistories[user] = [];
            }
        });

        console.log('Formatted chat histories:', formattedHistories);
        setChatHistories(formattedHistories);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setHistoryError(error instanceof Error ? error : new Error('Failed to load history'));
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [sessionId, selectedUserName]); 

  
  const sendMessage = useCallback(async (text: string, options?: SendMessageOptions) => {
    const employeeId = getUserId();
    if (!sessionId || !employeeId || !selectedUserName) {
      console.error('Cannot send message: Missing sessionId, employeeId, or selectedUserName');
      
      return;
    }

    const isPhoto = !!options?.imageUrl;
    const messageContent = isPhoto ? '' : text; 

    
    const tempId = generateTemporaryId(isPhoto ? 'img' : 'msg');
    const optimisticMessage: Message = {
      id: tempId,
      sender: 'candidate', 
      content: messageContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      pending: true,
      imageUrl: options?.imageUrl,
      price: options?.image_price,
      imageComment: options?.image_comment,
      
    };

    setChatHistories(prev => ({
      ...prev,
      [selectedUserName]: [...(prev[selectedUserName] || []), optimisticMessage],
    }));

    try {
      console.log(`Sending ${isPhoto ? 'photo' : 'message'} to ${selectedUserName}...`);
      
      const response = await fetch(`/api/chat-test/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          employeeId,
          recipientId: selectedUserName, 
          content: messageContent,
          
          ...(isPhoto && options ? {
             image_url: options.imageUrl, 
             image_price: options.image_price,
             image_comment: options.image_comment
          } : {})
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      
      const responseData: { message: Message, botResponse?: BotResponse } = await response.json(); 
      const sentMessage = responseData.message;

      console.log('Message sent successfully:', sentMessage);

      
      setChatHistories(prev => {
        const userHistory = prev[selectedUserName] || [];
        const updatedHistory = userHistory.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: sentMessage.id, pending: false, time: new Date(sentMessage.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } 
            : msg
        );
        return { ...prev, [selectedUserName]: updatedHistory };
      });
      
      
      if (responseData.botResponse?.message) {
         console.log('Received bot response:', responseData.botResponse.message);
         const botMsg = responseData.botResponse.message;
         
          setChatHistories(prev => ({
            ...prev,
            [selectedUserName]: [...(prev[selectedUserName] || []), { ...botMsg, isOwn: false, pending: false }],
          }));
         
      } else if (responseData.botResponse?.error) {
          console.error("Error in bot response:", responseData.botResponse.error);
          
      }

    } catch (error) {
      console.error("Error sending message:", error);
      
      setChatHistories(prev => {
        const userHistory = prev[selectedUserName] || [];
        const updatedHistory = userHistory.map(msg =>
          msg.id === tempId
            ? { ...msg, pending: false, error: true, errorDetails: (error as Error).message }
            : msg
        );
        return { ...prev, [selectedUserName]: updatedHistory };
      });
      
    }
  }, [sessionId, selectedUserName]);

  
  const retryMessage = useCallback(async (failedMessage: Message) => {
      console.log("Retrying message:", failedMessage.id);
      
      setChatHistories(prev => ({
          ...prev,
          [selectedUserName]: (prev[selectedUserName] || []).filter(m => m.id !== failedMessage.id),
      }));
      
      await sendMessage(failedMessage.content, {
          imageUrl: failedMessage.imageUrl,
          image_price: failedMessage.price,
          image_comment: failedMessage.imageComment,
      });
  }, [sendMessage, selectedUserName]);

  return {
    chatHistories,
    setChatHistories,
    isLoadingHistory,
    historyError,
    sendMessage,
    retryMessage,
  };
}


const generateTemporaryId = (prefix: string = 'msg') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;


const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    return candidateData.employee_id || candidateData.userId || null;
  }
  return null;
}; 