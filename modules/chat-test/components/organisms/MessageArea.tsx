
import React, { useRef, useEffect } from 'react';
import MessageBubble, { MessageBubbleProps } from '../molecules/MessageBubble';
import { Loader, AlertTriangle } from 'lucide-react'; 



type MessageData = MessageBubbleProps['message'];

interface MessageAreaProps {
  messages: MessageData[];
  sessionId?: string; 
  isTyping: boolean; 
  typingUser?: { name: string; avatarUrl?: string }; 
  onRetryMessage: (message: MessageData) => void;
  
}

const MessageArea: React.FC<MessageAreaProps> = ({
  messages,
  sessionId,
  isTyping,
  typingUser, 
  onRetryMessage,
}) => {
  const messageAreaRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (isTyping && messages.length === 0) { 
      return (
          <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
              <Loader className="w-10 h-10 text-pink-500 animate-spin" />
          </div>
      );
  }

  return (
    <div ref={messageAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id} 
          message={msg}
          sessionId={sessionId}
          onRetry={onRetryMessage}
          
        />
      ))}
      {}
      {isTyping && typingUser && (
        <MessageBubble
          key="typing-indicator"
          message={{
            id: 'typing-indicator',
            sender: typingUser.name, 
            content: '',
            time: '',
            isOwn: false,
            isTyping: true, 
          }}
          onRetry={() => {}} 
          
        />
      )}
    </div>
  );
};

export default MessageArea; 