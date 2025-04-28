'use client';
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { ChatMessage } from '../../types/chat-message';
import { useChatStorage } from '../../hooks/useChatStorage';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { useChatId } from '../../hooks/useChatId';

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { saveMessages, loadMessages } = useChatStorage();
  const chatId = useChatId();

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
    const userMessage: ChatMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/telegram-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `chatId: ${chatId}\n${userMessage.text}` }),
      });
      const data = await response.json();
      if (data.status === 'ok') {
        const botMessage: ChatMessage = {
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
        };
        const newMessages = [...updatedMessages, botMessage];
        setMessages(newMessages);
        saveMessages(newMessages);
      } else {
        const errorMessage: ChatMessage = {
          text: `Ошибка: ${data.message || 'Не удалось получить ответ'}`,
          sender: 'bot',
          timestamp: new Date(),
        };
        const newMessages = [...updatedMessages, errorMessage];
        setMessages(newMessages);
        saveMessages(newMessages);
      }
    } catch {
      const errorMessage: ChatMessage = {
        text: 'Ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
        sender: 'bot',
        timestamp: new Date(),
      };
      const newMessages = [...updatedMessages, errorMessage];
      setMessages(newMessages);
      saveMessages(newMessages);
    } finally {
      setLoading(false);
    }
  }, [inputMessage, messages, saveMessages, chatId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const saved = loadMessages();
    if (saved.length === 0) {
      setMessages([
        { text: 'Привет! Я бот-помощник. Чем могу помочь?', sender: 'bot', timestamp: new Date() },
      ]);
    } else {
      setMessages(saved);
    }
  }, [loadMessages]);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col flex-1 h-full bg-white rounded-none shadow-none border-0">
      <ChatMessages messages={messages} loading={loading} chatEndRef={chatEndRef} formatTime={formatTime} />
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleKeyDown={handleKeyDown}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>
  );
}; 