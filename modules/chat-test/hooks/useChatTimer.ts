import { useState, useEffect, useRef, useCallback } from 'react';


const TIMER_DURATION_SECONDS = 40 * 60; 
const SYNC_INTERVAL_MS = 30 * 1000; 
const MIN_SYNC_INTERVAL_MS = 10 * 1000; 

interface UseChatTimerProps {
  sessionId: string | null;
  onExpire?: (sessionId: string) => void;
  isEnabled?: boolean; 
}

interface UseChatTimerReturn {
  timeRemaining: number;
  isTimerActive: boolean;
  formattedTime: string;
}

export const useChatTimer = ({
  sessionId,
  onExpire,
  isEnabled = true,
}: UseChatTimerProps): UseChatTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState<number>(TIMER_DURATION_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  const endTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTimerActiveRef = useRef<boolean>(false); 
  const lastSyncTimeRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire); 

  useEffect(() => {
    onExpireRef.current = onExpire; 
  }, [onExpire]);

  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  

  const getCurrentTimeRemaining = useCallback((): number => {
    const now = Date.now();
    const remaining = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
    return remaining;
  }, []);

  const handleTimeExpiration = useCallback((sid: string) => {
    if (!isTimerActiveRef.current) return; 

    console.log("[useChatTimer] Timer expired for session:", sid);
    isTimerActiveRef.current = false; 
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    setTimeRemaining(0);
    setIsTimerActive(false);

    
    if (onExpireRef.current) {
      onExpireRef.current(sid);
    }
    
    
    
    console.log("[useChatTimer] Stopping timer on server for session:", sid);
    fetch(`/api/chat-test/session/${sid}/timer`, {
        method: 'DELETE'
    }).then(response => {
        if (!response.ok && response.status !== 404) {
            console.warn("[useChatTimer] Failed to stop timer on server. Status:", response.status);
        } else {
             console.log("[useChatTimer] Server timer stop request sent or session already ended.");
        }
    }).catch(error => {
        console.error("[useChatTimer] Error sending stop timer request:", error);
    });

  }, []); 

  const startLocalTimer = useCallback((sid: string) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      if (!isTimerActiveRef.current) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
      }

      const remaining = getCurrentTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleTimeExpiration(sid);
      }
    }, 1000);
  }, [getCurrentTimeRemaining, handleTimeExpiration]);

  const syncWithServer = useCallback(async (sid: string) => {
    if (!sid || !isTimerActiveRef.current || syncInProgressRef.current) return;

    const now = Date.now();
    if (now - lastSyncTimeRef.current < MIN_SYNC_INTERVAL_MS) {
      return; 
    }

    syncInProgressRef.current = true;
    lastSyncTimeRef.current = now;
    console.log("[useChatTimer] Syncing timer with server for session:", sid);

    try {
      
      const response = await fetch(`/api/chat-test/session/${sid}/timer`);
      if (response.ok) {
        const data = await response.json(); 
        console.log("[useChatTimer] Timer state synced from server:", data);
        if (data.endTime) {
          const serverEndTime = new Date(data.endTime).getTime();
          if (Math.abs(serverEndTime - endTimeRef.current) > 5000) {
            console.log("[useChatTimer] Adjusting local timer based on server time.");
            endTimeRef.current = serverEndTime;
          }
          const remaining = getCurrentTimeRemaining();
          setTimeRemaining(remaining);
          if (remaining <= 0 && isTimerActiveRef.current) {
            console.log("[useChatTimer] Timer expired based on sync.");
            handleTimeExpiration(sid);
          }
        } else {
          console.warn("[useChatTimer] Sync response missing endTime. Assuming timer stopped.");
          if (isTimerActiveRef.current) {
            handleTimeExpiration(sid);
          }
        }
      } else {
        console.error("[useChatTimer] Failed to sync timer with server. Status:", response.status);
        if (response.status === 404 && isTimerActiveRef.current) {
          console.log("[useChatTimer] Session not found during sync. Assuming it ended.");
          handleTimeExpiration(sid);
        }
      }
    } catch (error) {
      console.error("[useChatTimer] Error syncing timer with server:", error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [getCurrentTimeRemaining, handleTimeExpiration]);

  const startServerSync = useCallback((sid: string) => {
    if (!sid) return;
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    syncIntervalRef.current = setInterval(() => {
      syncWithServer(sid);
    }, SYNC_INTERVAL_MS);

    
    syncWithServer(sid);
  }, [syncWithServer]);

  const initializeTimer = useCallback(async (sid: string) => {
    if (!sid) return;
    console.log("[useChatTimer] Initializing timer for session:", sid);
    try {
      
      const response = await fetch(`/api/chat-test/session/${sid}/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: TIMER_DURATION_SECONDS }) 
      });

      if (!response.ok) {
        if (response.status === 409) { 
          console.log("[useChatTimer] Timer already initialized or session expired, fetching current state.");
          const currentStateResponse = await fetch(`/api/chat-test/session/${sid}/timer`);
          if (currentStateResponse.ok) {
            const data = await currentStateResponse.json();
            console.log("[useChatTimer] Current timer state fetched:", data);
            if (data.endTime) {
              endTimeRef.current = new Date(data.endTime).getTime();
              const remaining = getCurrentTimeRemaining();
              setTimeRemaining(remaining);
              if (remaining <= 0) {
                setIsTimerActive(false);
                isTimerActiveRef.current = false;
                console.log("[useChatTimer] Timer expired based on fetched state.");
                
              } else {
                setIsTimerActive(true);
                isTimerActiveRef.current = true;
                startLocalTimer(sid);
                startServerSync(sid);
              }
            } else {
              console.warn("[useChatTimer] Timer state fetched, but no endTime found.");
              setIsTimerActive(false);
              isTimerActiveRef.current = false;
            }
          } else {
            console.error("[useChatTimer] Failed to fetch current timer state.");
            setIsTimerActive(false);
            isTimerActiveRef.current = false;
          }
        } else {
          throw new Error(`Failed to initialize timer: ${response.statusText}`);
        }
      } else { 
        const data = await response.json(); 
        console.log("[useChatTimer] Timer initialized successfully:", data);
        if (data.endTime) {
             endTimeRef.current = new Date(data.endTime).getTime();
             const remaining = getCurrentTimeRemaining();
             setTimeRemaining(remaining);
             setIsTimerActive(true);
             isTimerActiveRef.current = true;
             startLocalTimer(sid);
             startServerSync(sid);
        } else {
            console.error("[useChatTimer] Timer initialization response missing endTime.");
            setIsTimerActive(false);
            isTimerActiveRef.current = false;
        }
      }
    } catch (error) {
      console.error("[useChatTimer] Error initializing timer:", error);
      setIsTimerActive(false);
      isTimerActiveRef.current = false;
    }
  }, [getCurrentTimeRemaining, startLocalTimer, startServerSync]);

  

  useEffect(() => {
    if (sessionId && isEnabled) {
      initializeTimer(sessionId);
    } else {
      console.log(`[useChatTimer] Timer disabled or sessionId missing.`);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      setIsTimerActive(false);
      isTimerActiveRef.current = false;
      setTimeRemaining(TIMER_DURATION_SECONDS);
    }

    return () => {
      console.log(`[useChatTimer] Cleaning up useEffect for session ${sessionId}`);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [sessionId, isEnabled, initializeTimer]);

  return {
    timeRemaining,
    isTimerActive,
    formattedTime: formatTime(timeRemaining),
  };
};




