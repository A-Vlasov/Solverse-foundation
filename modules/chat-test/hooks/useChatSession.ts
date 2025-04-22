import { useState, useEffect, useCallback } from 'react';

import { useChatTimer } from './useChatTimer'; 


interface SessionData {
  id: string;
  employee_id: string;
  start_time: string;
  end_time?: string | null;
  completed: boolean;
  
}

interface DialogAnalysis {
  errors?: string[];
  strengths?: string[];
  areas_for_improvement?: string[];
  engagement_score?: number;
  tone_score?: number;
  summary?: string;
}
interface AnalysisResult {
  overall_score: number;
  overall_feedback: string;
  dialogs: { [userId: string]: DialogAnalysis };
}

interface UseChatSessionReturn {
  sessionId: string | null;
  sessionData: SessionData | null;
  isLoadingSession: boolean;
  sessionError: Error | null;
  isSessionComplete: boolean;
  isSessionActive: boolean; 
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisError: Error | null;
  showCongratulationsModal: boolean; 
  timeRemaining: number; 
  isTimerActive: boolean; 
  finishTest: () => Promise<void>; 
  closeCongratulationsModal: () => void;
}


const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    return candidateData.employee_id || candidateData.userId || null;
  }
  return null;
};

export const useChatSession = (initialSessionId: string | null): UseChatSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<Error | null>(null);

  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<Error | null>(null);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState<boolean>(false);
  
  

  
  const handleTimerExpire = useCallback(async () => {
    console.log('Timer expired callback triggered in useChatSession.');
    if (sessionId && !isSessionComplete) {
        await finishTestAndAnalyze(sessionId);
    }
  }, [sessionId, isSessionComplete]); 

  
  const { timeRemaining, isTimerActive, startTimer, stopTimer } = useChatTimer(handleTimerExpire);

  

  const fetchSession = useCallback(async (sid: string): Promise<SessionData | null> => {
    console.log(`Fetching session data for ${sid}...`);
    try {
      
      const response = await fetch(`/api/chat-test/session/${sid}`); 
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Session not found on server.');
          return null; 
        }
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }
      const data: SessionData = await response.json();
      console.log('Session data received:', data);
      return data;
    } catch (error) {
      console.error("Error fetching session:", error);
      setSessionError(error instanceof Error ? error : new Error('Failed to fetch session'));
      return null;
    }
  }, []);

  const createSession = useCallback(async (userId: string): Promise<SessionData | null> => {
    console.log(`Creating new session for user ${userId}...`);
    try {
      
      const response = await fetch(`/api/chat-test/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: userId }), 
      });
      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }
      const data: SessionData = await response.json(); 
      console.log('New session created:', data);
      return data;
    } catch (error) {
      console.error("Error creating session:", error);
      setSessionError(error instanceof Error ? error : new Error('Failed to create session'));
      return null;
    }
  }, []);

  const completeSession = useCallback(async (sid: string): Promise<boolean> => {
      console.log(`Marking session ${sid} as complete...`);
      try {
          
          const response = await fetch(`/api/chat-test/session/${sid}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true }),
          });
          if (!response.ok) {
              throw new Error(`Failed to mark session complete: ${response.statusText}`);
          }
          console.log(`Session ${sid} marked as complete.`);
          return true;
      } catch (error) {
          console.error("Error completing session:", error);
          
          return false;
      }
  }, []);

  const analyzeSession = useCallback(async (sid: string, employeeId: string): Promise<AnalysisResult | null> => {
      console.log(`Analyzing session ${sid} for employee ${employeeId}...`);
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
          
          
          const response = await fetch(`/api/chat-test/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sid, employeeId }),
          });
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Analysis request failed: ${response.status} ${errorText}`);
          }
          const result: AnalysisResult = await response.json();
          console.log("Analysis complete:", result);
          setAnalysisResult(result);
          return result;
      } catch (error) {
          console.error("Error analyzing session:", error);
          const analysisErr = error instanceof Error ? error : new Error('Failed to analyze session');
          setAnalysisError(analysisErr);
          setAnalysisResult({ 
             overall_score: 0,
             overall_feedback: `Analysis failed: ${analysisErr.message}`,
             dialogs: {}
          });
          return null;
      } finally {
          setIsAnalyzing(false);
      }
  }, []);
  
  

  
  const finishTestAndAnalyze = useCallback(async (sid: string) => {
      if (!sid || isSessionComplete) return;
      console.log("Finishing test and starting analysis...");
      stopTimer(); 
      setIsSessionComplete(true); 
      setShowCongratulationsModal(true);
      setIsAnalyzing(true); 

      const userId = getUserId();
      if (!userId) {
          console.error("Cannot analyze session: User ID not found.");
          setAnalysisError(new Error("User ID not found."));
          setIsAnalyzing(false);
          return;
      }

      
      const completed = await completeSession(sid);
      
      if (completed) {
          
          await analyzeSession(sid, userId);
          
      } else {
          console.error("Failed to mark session as complete on server. Analysis skipped.");
          setAnalysisError(new Error("Failed to save session completion status."));
          setIsAnalyzing(false);
      }
      

  }, [isSessionComplete, stopTimer, completeSession, analyzeSession]);

  
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoadingSession(true);
      setSessionError(null);
      setSessionData(null);
      setIsSessionComplete(false);
      setShowCongratulationsModal(false);
      setAnalysisResult(null);
      setAnalysisError(null);
      stopTimer(); 

      let currentSession: SessionData | null = null;
      let sidToUse = sessionId; 

      console.log("Initializing session. Current session ID state:", sidToUse);

      if (sidToUse) {
        currentSession = await fetchSession(sidToUse);
        if (!currentSession) {
          console.log(`Session ${sidToUse} not found or error occurred. Clearing ID.`);
          sidToUse = null; 
          setSessionId(null);
          
        } else {
           console.log(`Fetched existing session ${sidToUse}.`);
        }
      }

      
      if (!currentSession) {
        const userId = getUserId();
        if (userId) {
          console.log("No valid session found, attempting to create new one...");
          currentSession = await createSession(userId);
          if (currentSession) {
            sidToUse = currentSession.id;
            setSessionId(sidToUse);
            
             if (typeof window !== 'undefined') {
                 const currentUrl = new URL(window.location.href);
                 currentUrl.searchParams.set('sessionId', sidToUse);
                 window.history.replaceState({}, '', currentUrl.toString());
             }
          } else {
            console.error("Failed to create a new session.");
            setSessionError(new Error('Failed to create session'));
          }
        } else {
          console.error("Cannot create session: User ID not available.");
          setSessionError(new Error('User ID not found'));
        }
      }

      
      if (currentSession) {
        setSessionData(currentSession);
        if (currentSession.completed || currentSession.end_time) {
          console.log("Session is already completed.");
          setIsSessionComplete(true);
          stopTimer(); 
          
          setShowCongratulationsModal(true);
          const userId = getUserId();
          if (userId) await analyzeSession(currentSession.id, userId);
          else setAnalysisError(new Error("User ID not found for loading results."));
        } else {
          console.log("Session is active. Starting timer...");
          setIsSessionComplete(false);
          
          
          
          const duration = DEFAULT_TIMER_DURATION_SECONDS; 
          startTimer(duration); 
        }
      } else {
         console.log("No session available after initialization attempt.");
         stopTimer();
      }

      setIsLoadingSession(false);
    };

    initializeSession();
    
    
    
    
    

  }, [initialSessionId, fetchSession, createSession, startTimer, stopTimer, analyzeSession]); 

  const closeCongratulationsModal = () => {
    setShowCongratulationsModal(false);
  };

  
  const isSessionActive = !!sessionData && !isSessionComplete;

  return {
    sessionId,
    sessionData,
    isLoadingSession,
    sessionError,
    isSessionComplete,
    isSessionActive,
    analysisResult,
    isAnalyzing,
    analysisError,
    showCongratulationsModal,
    timeRemaining,
    isTimerActive,
    finishTest: () => finishTestAndAnalyze(sessionId || ''), 
    closeCongratulationsModal,
  };
}; 