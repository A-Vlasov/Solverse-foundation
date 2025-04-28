import { useMemo } from 'react';

const CHAT_ID_KEY = 'chatId';

export const useChatId = () => {
  return useMemo(() => {
    // Проверяем, что код выполняется в браузере
    if (typeof window === 'undefined') {
      return 'server-side';
    }
    
    let chatId = localStorage.getItem(CHAT_ID_KEY);
    if (!chatId) {
      chatId = crypto.randomUUID();
      localStorage.setItem(CHAT_ID_KEY, chatId);
    }
    return chatId;
  }, []);
}; 