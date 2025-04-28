import { FC, RefObject } from 'react';
import { ChatMessage } from '../../types/chat-message';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  formatTime: (date: Date) => string;
}

export const ChatMessages: FC<ChatMessagesProps> = ({ messages, loading, chatEndRef, formatTime }) => (
  <div className="flex-1 h-0 overflow-y-auto p-4 bg-gray-50">
    {messages.map((message, index) => (
      <div
        key={index}
        className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
            message.sender === 'user'
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p>{message.text}</p>
          <p className={`text-xs mt-1 text-right ${
            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    ))}
    {loading && (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none px-4 py-2">
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )}
    <div ref={chatEndRef} />
  </div>
); 