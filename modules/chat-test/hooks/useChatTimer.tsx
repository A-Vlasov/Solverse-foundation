
import { useState, useEffect, useRef } from 'react';

const TIMER_DURATION_SECONDS = 180; 

export function useChatTimer(sessionId: string | null, onTimerEnd: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  
  
  

  useEffect(() => {
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isTimerActive,
    
  };
} 