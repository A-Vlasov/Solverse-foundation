import { useCallback } from 'react';
import { ChatMessage } from '../types/chat-message';

export const useChatStorage = () => {
  const saveMessages = useCallback((messages: ChatMessage[]) => {
    try {
      const messagesForStorage = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem('chatMessages', JSON.stringify(messagesForStorage));
    } catch {}
  }, []);

  const loadMessages = useCallback((): ChatMessage[] => {
    try {
      const stored = localStorage.getItem('chatMessages');
      if (!stored) return [];
      return JSON.parse(stored).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch {
      return [];
    }
  }, []);

  return { saveMessages, loadMessages };
}; 