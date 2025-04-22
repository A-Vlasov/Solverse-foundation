
import { useState } from 'react';

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  

  return {
    sessionId,
    isSessionActive,
    
  };
} 