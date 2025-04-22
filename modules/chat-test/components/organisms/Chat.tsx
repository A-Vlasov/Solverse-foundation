import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { MessageCircle, Send, Menu, Bell, Settings, Search, Heart, Image as ImageIcon, AtSign, DollarSign, Timer, Bot, AlertCircle, Info, Check, CheckCheck, X, ImagePlus, Upload, Trash2, ExternalLink, Eye, Loader, LogOut, Paperclip, Clock, PartyPopper } from 'lucide-react'; 
import { useRouter } from 'next/navigation'; 
import { userPrompts, getPromptSummary } from '@/old_project/src/data/userPrompts'; 
import PromptModal from '@/old_project/src/components/PromptModal'; 
import type { DialogAnalysisResult, ChatMessage as SupabaseChatMessage, TestResult } from '@/old_project/src/lib/supabase'; 

import { chatService, testSessionService, testResultService, grokService, geminiService } from '@/old_project/src/services/api'; 

import { getTestSession, saveTestResult } from '@/old_project/src/lib/supabase'; 
import { useLocale } from '../../contexts/LocaleContext';
import { t as localesT, TranslationKeys } from '../../locales'; 
import { preloadedImages } from '@/old_project/src/data/preloadedImages'; 
import { ChatMessage } from '../../types/supabase'; 

import { useChatTimer } from '../../hooks/useChatTimer';
import UserList, { UserDataForListItem } from './UserList'; 
import ChatHeader from '../molecules/ChatHeader'; 
import MessageList from './MessageList'; 


export interface Message { 
  id: string;
  sender: string; 
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
  isTyping?: boolean;
  error?: boolean;
  errorDetails?: string;
  imageUrl?: string;
  price?: string;
  imageComment?: string;
  purchased?: boolean;
  pending?: boolean;
  bought?: boolean;
  
  sender_id?: string; 
  recipient_id?: string; 
}

export interface ChatHistory { 
  [key: string]: Message[]; 
}

interface LoadingStates {
  [key: string]: boolean;
}

export interface UserStatus { 
  [key: string]: {
    isTyping: boolean;
    unreadCount: number;
    lastMessageId: string | null;
  };
}

interface CustomImage {
  id: string;
  url: string;
  thumbnail: string;
  description: string;
  prompt: string;
}


interface GrokConversation {
  conversationId: string;
  parentResponseId: string;
  chatLink?: string;
}

interface UserConversations {
  [key: string]: GrokConversation;
}


const toast = ({ title, variant = "default" }: { title: string, variant?: "default" | "destructive" }) => {
  if (variant === 'destructive') {
      console.error(title);
  } else {
      console.log(title);
  }
  
};


interface ChatProps {
  sessionId: string; 
}


function Chat({ sessionId }: ChatProps) {
  
  
  
  const { t, locale } = useLocale();
  const router = useRouter(); 
  
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('Marcus');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null | any>(null); 
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>(t('free'));
  const [showPriceModal, setShowPriceModal] = useState<boolean>(false);
  const [tempSelectedImage, setTempSelectedImage] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [activeTab, setActiveTab] = useState<'preloaded' | 'custom'>('preloaded');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    Marcus: false,
    Shrek: false,
    Oliver: false,
    Alex: false
  });
  const [userStatus, setUserStatus] = useState<UserStatus>({
    Marcus: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Shrek: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Oliver: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Alex: { isTyping: false, unreadCount: 0, lastMessageId: null }
  });
  const [retryingMessage, setRetryingMessage] = useState<Message | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory>({
    Marcus: [],
    Shrek: [],
    Oliver: [],
    Alex: [],
  });
  const [userConversations, setUserConversations] = useState<UserConversations>({});
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [imageComment, setImageComment] = useState<string>('');
  const [selectedImageComment, setSelectedImageComment] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null); 

  
  const staticUsers = [
    { id: 'marcus', name: 'Marcus', avatar: '/foto/marcus.webp', status: t('online') }, 
    { id: 'shrek', name: 'Shrek', avatar: '/foto/shrek.webp', status: t('online') }, 
    { id: 'oliver', name: 'Oliver', avatar: '/foto/oliver.webp', status: t('away') }, 
    { id: 'alex', name: 'Alex', avatar: '/foto/alex.webp', status: t('online') }, 
  ];

  
  const analyzeDialogsAndSaveResults = async (sessionId: string) => {
    if (!sessionId) return;

    console.log("Starting dialog analysis for session:", sessionId);
    setCalculatingResults(true); 
    setAnalysisComplete(false);
    setAnalysisResult(null);

    try {
        
        const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
        const employeeId = candidateData.employee_id || candidateData.userId;

        if (!employeeId) {
            throw new Error("Employee ID not found in session storage for analysis.");
        }

        
        const allHistories = Object.entries(chatHistories).map(([userId, messages]) => ({
            userId,
            messages
        })); 
        
        if (allHistories.length === 0) {
             console.warn("No chat histories found to analyze.");
             
             
             
             const emptyResult: any = {
                 
                 overall_feedback: "No interactions recorded.",
                 
             };
             
             
             console.warn("TODO: Implement saving empty analysis result via API");
             setAnalysisResult(emptyResult);
             setAnalysisComplete(true);
             setCalculatingResults(false);
             return;
        }

        
        
        console.log("Sending request to analyze chat histories:", allHistories);
        
        const analysisResponse = await fetch('/api/chat-test/analyze', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                sessionId: sessionId, 
                employeeId: employeeId,
                chatHistories: allHistories,
                grokConversations: userConversations 
            }),
        });

        if (!analysisResponse.ok) {
            const errorText = await analysisResponse.text();
            throw new Error(`Analysis request failed: ${analysisResponse.status} ${errorText}`);
        }

        
        const result: any = await analysisResponse.json(); 
        console.log("Analysis complete:", result);

        
        
        
        
        
        setAnalysisResult(result);
        setAnalysisComplete(true);
        
        
        
        console.log("Marking session as completed:", sessionId);
        
        console.warn("TODO: Implement marking session as complete via API");
        

    } catch (error: any) {
        console.error("Error analyzing dialogs and saving results:", error);
        toast({ title: "Ошибка при анализе результатов", variant: "destructive" });
        
        setAnalysisResult({ 
           overall_feedback: `Analysis failed: ${error.message}`,
        });
        setAnalysisComplete(true); 
    } finally {
        setCalculatingResults(false); 
    }
  };

  

  
  const handleSessionExpiration = useCallback(async (sid: string) => {
    if (isSessionComplete) return; 

    console.log("Executing session expiration logic for session:", sid);
    setIsSessionComplete(true); 
    setShowCongratulations(true);
    setCalculatingResults(true);

    try {
      
      await analyzeDialogsAndSaveResults(sid); 
    } catch (error) {
      console.error('Error during session expiration handling:', error);
    } finally {
      
    }
  }, [isSessionComplete, analyzeDialogsAndSaveResults]); 

  
  const { timeRemaining, isTimerActive, formattedTime } = useChatTimer({
    sessionId: sessionId,
    onExpire: handleSessionExpiration, 
    isEnabled: !isSessionComplete && isMounted, 
  });

  
  useEffect(() => {
    setIsMounted(true);
    
    
    
  }, []);

  
  useEffect(() => {
    if (!isMounted) return;
    
  }, [customImages, isMounted]);

  
  useEffect(() => {
    if (!isMounted || !sessionId) return;

    const initTestSession = async () => {
      
      
      const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
      const employeeId = candidateData.employee_id || candidateData.userId;
      console.log("Using employeeId:", employeeId); 

      if (!employeeId) {
          console.error("initTestSession: Employee ID not found in sessionStorage.");
          toast({ title: "Ошибка: Не удалось определить пользователя для инициализации сессии.", variant: "destructive" });
          setIsSessionComplete(true); 
          return;
      }

      let historyData: Message[] = [];
      try {
        
        
        
        let sessionData: any = null; 
        try {
            const sessionResponse = await fetch(`/api/chat-test/session/${sessionId}`);
            if (sessionResponse.ok) {
                sessionData = await sessionResponse.json();
                console.log("Session data loaded:", sessionData);
            } else {
                console.error(`Failed to load session data: ${sessionResponse.status} ${sessionResponse.statusText}`);
                toast({ title: t('errorFetchingData'), variant: "destructive" });
                setIsSessionComplete(true);
                return; 
            }
        } catch (sessionFetchError) {
            console.error("Error fetching session data:", sessionFetchError);
            toast({ title: t('errorFetchingData'), variant: "destructive" });
            setIsSessionComplete(true);
            return;
        }

        if (!sessionData) {
            console.error("Session data is null after fetch attempt.");
            setIsSessionComplete(true);
            return; 
        }

        if (sessionData.completed) {
          console.log("Session already completed.");
          setIsSessionComplete(true);
          
          
          const analysisResultFromApi = sessionData.analysis_result; 
          if (analysisResultFromApi) {
            setAnalysisResult(analysisResultFromApi as any); 
            setAnalysisComplete(true);
          } else {
             console.log("Analysis result not found...");
          }
        } else {
          console.log("Session is active. Timer will be started by useChatTimer.");
        }

        
        try {
          
          const response = await fetch(`/api/chat-test/history?sessionId=${sessionId}`); 
          if (response.ok) {
            const apiHistoryData: ChatMessage[] = await response.json();
            historyData = apiHistoryData.map((msg: ChatMessage): Message => {
              
              const isOwn = msg.sender_id === employeeId;
              const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return {
                id: msg.id || generateMessageId(), 
                sender: isOwn ? 'candidate' : msg.sender_id || 'unknown', 
                content: msg.content || '', 
                time: time,
                isOwn: isOwn,
                
                sender_id: msg.sender_id,
                recipient_id: msg.recipient_id,
                isRead: msg.isRead,
                isTyping: msg.isTyping,
                error: msg.error,
                errorDetails: msg.errorDetails,
                imageUrl: msg.imageUrl,
                price: msg.price,
                imageComment: msg.imageComment,
                purchased: msg.purchased,
                pending: msg.pending,
                bought: msg.bought,
              };
            });
            console.log("History loaded and mapped: ", historyData);
          } else {
            console.error(`Failed to load history: ${response.status} ${response.statusText}`);
            toast({ title: t('errorFetchingData'), variant: "destructive" });
          }
        } catch (fetchError) {
          console.error("Error fetching chat history:", fetchError);
          toast({ title: t('errorFetchingData'), variant: "destructive" });
        }

        
        const groupedHistory: ChatHistory = {
            Marcus: historyData.filter((msg: Message) => msg.sender === 'Marcus' || (msg.isOwn && msg.recipient_id === 'Marcus')),
            Shrek: historyData.filter((msg: Message) => msg.sender === 'Shrek' || (msg.isOwn && msg.recipient_id === 'Shrek')),
            Oliver: historyData.filter((msg: Message) => msg.sender === 'Oliver' || (msg.isOwn && msg.recipient_id === 'Oliver')),
            Alex: historyData.filter((msg: Message) => msg.sender === 'Alex' || (msg.isOwn && msg.recipient_id === 'Alex')),
        };
        setChatHistories(groupedHistory);

      } catch (error) {
        console.error("Error loading test session:", error);
        toast({ title: "Ошибка при загрузке тестовой сессии", variant: "destructive" });
        setIsSessionComplete(true);
      }
    };

    initTestSession();

  }, [isMounted, sessionId, t]); 

  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistories, selectedUser]);

  
  

  
  const markMessagesAsRead = () => {
    if (selectedUser && userStatus[selectedUser]?.unreadCount > 0) { 
      console.log(`Marking ${userStatus[selectedUser].unreadCount} messages as read for ${selectedUser}`);
      setUserStatus(prevStatus => ({
        ...prevStatus,
        [selectedUser]: { ...prevStatus[selectedUser], unreadCount: 0 }
      }));
      
    }
  };

  
  useEffect(() => {
    markMessagesAsRead();
  }, [selectedUser]);

  
  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  
  const generateImageId = () => `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  
  const simulateBotResponse = async (userMessage: string, userName: string) => {
    
    if (!sessionId) {
      console.error("Cannot simulate bot response: sessionId prop is null.");
      return;
    }
  
    
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    const employeeId = candidateData.employee_id || candidateData.userId;
  
    if (!employeeId) {
      console.error("Cannot simulate bot response: employee_id not found in sessionStorage.");
      toast({ title: "Ошибка: Не удалось определить пользователя.", variant: "destructive" });
      return;
    }
  
    setUserStatus(prevStatus => ({ ...prevStatus, [userName]: { ...prevStatus[userName], isTyping: true } }));
  
    try {
      
      
      
      
      
  
      
      const currentHistory = chatHistories[userName] || [];
      
      const conversationHistory = currentHistory.map(msg => ({
        role: msg.isOwn ? 'user' : 'model', 
        content: msg.content
      }));
  
      
      console.log("Conversation History:", conversationHistory);
      console.log("Current Message:", userMessage);
  
      
      
      
      
      
      
      
      
      
      let responseText = "TODO: Fetch bot response from /api/chat-test/generate";
      try {
          const apiResponse = await fetch('/api/chat-test/generate', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                  sessionId: sessionId, 
                  employeeId: employeeId,
                  recipient: userName, 
                  message: userMessage, 
                  history: conversationHistory, 
                  
              }),
          });
          if (apiResponse.ok) {
              const data = await apiResponse.json();
              responseText = data.response; 
              
              
          } else {
             console.error(`Failed to generate response: ${apiResponse.status} ${apiResponse.statusText}`);
             responseText = `Error: Failed to get response (${apiResponse.status})`;
          }
      } catch (fetchError) {
          console.error("Error fetching bot response:", fetchError);
          responseText = "Error: Could not connect to generation service.";
      }

      
      
      
      

      
      

      
      setUserStatus(prevStatus => ({ ...prevStatus, [userName]: { ...prevStatus[userName], isTyping: true } }));
      

      
      
      
      const botMessage: Message = {
        id: generateMessageId(), 
        sender_id: userName, 
        recipient_id: employeeId, 
        sender: userName, 
        content: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        isRead: selectedUser !== userName, 
      };
  
      setChatHistories(prevHistories => ({
        ...prevHistories,
        [userName]: [...(prevHistories[userName] || []), botMessage], 
      }));
  
      
      setUserStatus(prevStatus => ({
        ...prevStatus,
        [userName]: {
          isTyping: false,
          unreadCount: selectedUser === userName ? 0 : (prevStatus[userName]?.unreadCount || 0) + 1,
          lastMessageId: botMessage.id
        }
      }));
  
    } catch (error: any) {
      console.error(`Error getting response from ${userName}:`, error);
      
      const errorMessage: Message = {
        id: generateMessageId(),
        sender: userName,
        content: `Error: ${error.message || 'Failed to get response'}`, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        error: true,
        errorDetails: error.stack 
      };
      setChatHistories(prevHistories => ({
        ...prevHistories,
        [userName]: [...(prevHistories[userName] || []), errorMessage],
      }));
       setUserStatus(prevStatus => ({
         ...prevStatus,
         [userName]: {
           ...prevStatus[userName],
           isTyping: false,
           
           
           lastMessageId: errorMessage.id
         }
       }));
    }
  };
  
  
  

  
  const toggleImageGallery = () => {
    setShowImageGallery(!showImageGallery);
  };
  
  
  const selectImage = (imageUrl: string) => {
    setTempSelectedImage(imageUrl);
    setSelectedImageComment(''); 
    setShowPriceModal(true); 
  };
  
  
  const confirmImageSelection = () => {
    if (tempSelectedImage) {
      setSelectedImage(tempSelectedImage);
      
      setImageComment(selectedImageComment); 
      setShowPriceModal(false);
      setShowImageGallery(false); 
      setMessage(''); 
    }
  };
  
  
  const sendPhotoMessage = async (newMessage: Message) => {
      
      if (!sessionId || !newMessage.imageUrl) return;

      const imageUrl = newMessage.imageUrl;
      const price = newMessage.price;
      const comment = newMessage.imageComment;

      console.log(`Sending photo: ${imageUrl}, Price: ${price}, Comment: ${comment}, Session: ${sessionId}`);

      
      setChatHistories(prevHistories => ({
          ...prevHistories,
          [selectedUser]: [...prevHistories[selectedUser], { ...newMessage, pending: true }]
      }));
      setSelectedImage(null);
      setSelectedPrice(t('free'));
      setImageComment('');
      setSelectedImageComment('');

      try {
          
          const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
          const employeeId = candidateData.employee_id || candidateData.userId;

          if (!employeeId) {
              throw new Error("Employee ID not found in session storage.");
          }
          
          let finalImageUrl = imageUrl;
          
          
          if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
              console.log("Custom image detected, attempting upload...");
              setUploadingImage(true);
              try {
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const file = new File([blob], `upload_${Date.now()}.png`, { type: blob.type });
                  
                  
                  
                  const uploadResponse = await fetch(`/api/chat-test/images`, { 
                      method: 'POST',
                      headers: {
                          'Content-Type': file.type,
                          'X-Employee-Id': employeeId, 
                          'X-Session-Id': sessionId 
                      },
                      body: file
                  });
                  
                  if (!uploadResponse.ok) {
                      throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
                  }
                  
                  const uploadResult = await uploadResponse.json();
                  finalImageUrl = uploadResult.imageUrl; 
                  console.log("Image uploaded successfully:", finalImageUrl);
                  
                  
                  if (imageUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(imageUrl);
                  }
                  
              } catch (uploadError) {
                  console.error("Error uploading custom image:", uploadError);
                  throw new Error("Failed to upload custom image."); 
              } finally {
                  setUploadingImage(false);
              }
          }

          
          
          const response = await chatService.sendMessage(sessionId, employeeId, selectedUser, '', { 
              imageUrl: finalImageUrl,
              image_price: price, 
              image_comment: comment, 
              
          });

          if (!response || !response.message || !response.message.id) {
              throw new Error('Failed to send photo message or invalid response');
          }

          const sentMessage = response.message;

          
          setChatHistories(prevHistories => {
              const userHistory = [...prevHistories[selectedUser]];
              const messageIndex = userHistory.findIndex(m => m.id === newMessage.id);
              if (messageIndex !== -1) {
                  userHistory[messageIndex] = {
                      ...userHistory[messageIndex],
                      id: sentMessage.id, 
                      pending: false,
                      time: new Date(sentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      
                      imageUrl: sentMessage.image_url || finalImageUrl, 
                      price: sentMessage.image_price,
                      imageComment: sentMessage.image_comment,
                      bought: sentMessage.image_bought
                  };
              }
              return {
                  ...prevHistories,
                  [selectedUser]: userHistory
              };
          });
          
          
          

      } catch (error: any) {
          console.error('Error sending photo message:', error);
          toast({ title: t('errorSendingPhoto'), variant: "destructive" });
          
          setChatHistories(prevHistories => {
              const userHistory = [...prevHistories[selectedUser]];
              const messageIndex = userHistory.findIndex(m => m.id === newMessage.id);
              if (messageIndex !== -1) {
                  userHistory[messageIndex] = {
                      ...userHistory[messageIndex],
                      pending: false,
                      error: true,
                      errorDetails: error.message || 'Unknown error'
                  };
              }
              return {
                  ...prevHistories,
                  [selectedUser]: userHistory
              };
          });
      }
  };

  
  const cancelImageSelection = () => {
    setTempSelectedImage(null);
    setSelectedImageComment('');
    setShowPriceModal(false);
  };

  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedPrice(t('free'));
    setImageComment('');
    setSelectedImageComment('');
  };

  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      if (!isSessionComplete) {
          handleSendMessage(e as unknown as React.FormEvent); 
      } else {
          toast({ title: localesT('chat.timeExpired', locale), variant: "destructive" }); 
      }
    }
  };

  
  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    markMessagesAsRead(); 
    
    requestAnimationFrame(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    });
    
    
    
    
    
    
    
    
  };
  
  
  const handleOpenPromptModal = () => {
    setIsPromptModalOpen(true);
  };

  
  const handleClosePromptModal = () => {
    setIsPromptModalOpen(false);
  };
  
    
    const loadAnalysisResult = async (sid: string) => {
      if (!sid) return;
      console.log("Loading analysis result for session:", sid);
      try {
        
        const result: any = null; 
        if (result && result.analysis_result) {
          console.log("Analysis result loaded:", result.analysis_result);
          setAnalysisResult(result.analysis_result as DialogAnalysisResult); 
          setAnalysisComplete(true);
        } else {
          console.log("No analysis result found for this session.");
          
          
          
        }
      } catch (error) {
        console.error("Error loading analysis result:", error);
        
      }
    };
    
    
    const handleGoodbye = () => {
      console.log("Sending goodbye message and finishing test...");
      
      
      finishTest(); 
    };
    
    
    const handleCloseResults = () => {
        setShowCongratulations(false); 
        
        router.push('/dashboard'); 
    };

  
  const handleSendMessage = async (e: React.FormEvent, directMessage?: string) => {
    e.preventDefault();
    const messageContent = directMessage || message.trim();

    if (!isTimerActive || isSessionComplete) {
      toast({ title: localesT('chat.timeExpired', locale), variant: "destructive" }); 
      return;
    }

    if (!messageContent && !selectedImage) {
      return; 
    }

    if (!sessionId) {
      console.error("Cannot send message: sessionId is null.");
      toast({ title: "Ошибка: Сессия не найдена.", variant: "destructive" });
      return;
    }
    
    
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    const employeeId = candidateData.employee_id || candidateData.userId;
    
    if (!employeeId) {
      console.error("Cannot send message: employee_id not found in sessionStorage.");
      toast({ title: "Ошибка: Не удалось определить пользователя.", variant: "destructive" });
      return;
    }

    const newMessage: Message = {
      id: generateMessageId(), 
      sender: 'candidate', 
      content: messageContent,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      pending: true, 
      imageUrl: selectedImage || undefined,
      price: selectedImage ? selectedPrice : undefined,
      imageComment: selectedImage ? imageComment : undefined,
    };

    
    if (selectedImage) {
      sendPhotoMessage(newMessage); 
      return; 
    }

    
    setChatHistories(prevHistories => ({
      ...prevHistories,
      [selectedUser]: [...prevHistories[selectedUser], newMessage],
    }));
    setMessage(''); 

    try {
      
      
      let sentMessage: Message | null = null;
      try {
          
          
          const apiResponse = await fetch('/api/chat-test/message', { 
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  sessionId: sessionId,
                  employeeId: employeeId,
                  recipient: selectedUser,
                  message: messageContent,
              }),
          });
          
          if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              throw new Error(`Failed to send message: ${apiResponse.status} ${errorText}`);
          }
          
          const data = await apiResponse.json();
          const apiMsg: ChatMessage = data.message;
          if (!apiMsg) {
             throw new Error('Invalid API response: message data missing');
          }
          const isOwn = apiMsg.sender_id === employeeId;
          sentMessage = {
            id: apiMsg.id || newMessage.id,
            sender: isOwn ? 'candidate' : apiMsg.sender_id || 'unknown',
            content: apiMsg.content || '',
            time: apiMsg.created_at ? new Date(apiMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: isOwn,
            sender_id: apiMsg.sender_id,
            recipient_id: apiMsg.recipient_id,
            isRead: apiMsg.isRead,
            isTyping: apiMsg.isTyping,
            error: apiMsg.error,
            errorDetails: apiMsg.errorDetails,
            imageUrl: apiMsg.imageUrl,
            price: apiMsg.price,
            imageComment: apiMsg.imageComment,
            purchased: apiMsg.purchased,
            pending: false,
            bought: apiMsg.bought,
          };
          console.log("Message sent successfully via API:", sentMessage);
          
      } catch (fetchError) {
          console.error('Error sending message via API:', fetchError);
          throw fetchError; 
      }

      if (!sentMessage) return;
      
      
      setChatHistories(prevHistories => {
        const userHistory = [...prevHistories[selectedUser]];
        const messageIndex = userHistory.findIndex(m => m.id === newMessage.id);
        if (messageIndex !== -1) {
            userHistory[messageIndex] = sentMessage; 
        }
        return {
            ...prevHistories,
            [selectedUser]: userHistory
        };
      });
      
      
      simulateBotResponse(messageContent, selectedUser);

    } catch (error: any) {
      
      console.error('Error sending message:', error);
      toast({ title: t('errorSendingMessage'), variant: "destructive" });
      
      setChatHistories(prevHistories => {
          const userHistory = [...prevHistories[selectedUser]];
          const messageIndex = userHistory.findIndex(m => m.id === newMessage.id);
          if (messageIndex !== -1) {
              userHistory[messageIndex] = {
                  ...userHistory[messageIndex],
                  pending: false,
                  error: true,
                  errorDetails: error.message || 'Unknown error'
              };
          }
          return {
              ...prevHistories,
              [selectedUser]: userHistory
          };
      });
    }
  };

  
  const handleRetry = (msg: Message) => {
    console.log("Retrying message:", msg);
    setRetryingMessage(msg);

    
    setChatHistories(prevHistories => {
      const userHistory = prevHistories[selectedUser].filter(m => m.id !== msg.id);
      return {
        ...prevHistories,
        [selectedUser]: userHistory,
      };
    });

    
    
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    if (msg.imageUrl) {
        
        
        
         console.warn("Retrying photo messages is not fully implemented yet.");
         
    } else {
         handleSendMessage(fakeEvent, msg.content);
    }
    setRetryingMessage(null);
  };
  
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const newImage: CustomImage = {
          id: generateImageId(),
          url: reader.result as string, 
          thumbnail: reader.result as string, 
          description: file.name, 
          prompt: '', 
        };
        setCustomImages(prevImages => [...prevImages, newImage]);
      };
      
      reader.readAsDataURL(file);
      setActiveTab('custom'); 
    }
  };

  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  
  const handleDeleteCustomImage = (imageId: string) => {
    setCustomImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };
  
  
  const safeNavigate = (path: string) => {
    
    
    
    if (router) {
      router.push(path);
    } else if (typeof window !== 'undefined') {
      
      window.location.href = path;
    } else {
      console.error("Navigation is not available.");
    }
  };
  
  
  const finishTest = () => {
     
     if (!sessionId) {
         console.error("Cannot finish test: sessionId prop is missing.");
         toast({ title: "Ошибка: Не удалось определить сессию.", variant: "destructive" });
         return;
     }
     handleSessionExpiration(sessionId); 
  };

  
  const currentUser = staticUsers.find(u => u.name === selectedUser);
  const currentUserStatus = currentUser?.status || (t('status.offline') as string); 

  
  

  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); 
  useEffect(() => {
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {}
      <UserList
         usersData={staticUsers.map(u => { 
             const history = chatHistories[u.name] || [];
             const statusInfo = userStatus[u.name] || { isTyping: false, unreadCount: 0, lastMessageId: null };
             return {
                 user: { id: u.id, name: u.name, avatar: u.avatar, status: u.status },
                 isSelected: selectedUser === u.name,
                 isTyping: statusInfo.isTyping,
                 unreadCount: statusInfo.unreadCount,
                 chatHistory: history,
             };
         })}
         selectedUserName={selectedUser} 
         onSelectUser={handleUserSelect} 
         t={t} 
      />

      {}
      <div className="flex-1 flex flex-col">
         {selectedUser ? (
           <>
             {}
             <ChatHeader
               selectedUserName={selectedUser}
               userStatus={currentUserStatus} 
             />

             {}
             <MessageList
                messages={chatHistories[selectedUser] || []}
                selectedUser={selectedUser}
                userStatus={userStatus[selectedUser]} 
                sessionId={sessionId}
                onRetry={handleRetry} 
                
                containerRef={chatContainerRef} 
             />

             {}
             <div className="p-4 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
               {}
               {selectedImage && (
                  <div className="mb-2 p-2 border border-gray-300 rounded-lg flex items-start bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                      <img src={selectedImage} alt="Selected preview" className="w-16 h-16 rounded object-cover mr-3"/>
                      <div className="flex-1">
                         <p className="text-sm font-semibold dark:text-gray-200">{t('photo')}: {selectedPrice}</p>
                          <input
                             type="text"
                             value={imageComment}
                             onChange={(e) => setImageComment(e.target.value)}
                             placeholder={t('addPhotoComment')}
                             className="w-full text-sm p-1 border border-gray-300 rounded mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                             disabled={isSessionComplete}
                          />
                      </div>
                      <button onClick={handleRemoveImage} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                          <Trash2 size={18}/>
                      </button>
                  </div>
               )}

               <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                 <button type="button" onClick={toggleImageGallery} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" disabled={isSessionComplete}>
                   <ImageIcon size={24} /> {}
                 </button>
                 <input
                   ref={messageInputRef} 
                   type="text"
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   onKeyPress={handleKeyPress} 
                   placeholder={isSessionComplete ? localesT('chat.timeExpired', locale) : t('enterMessage')} 
                   className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-blue-600 dark:focus:border-transparent dark:disabled:bg-gray-800"
                   disabled={isSessionComplete || !!selectedImage} 
                 />
                 <button
                   type="submit"
                   className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
                   disabled={isSessionComplete || (!message.trim() && !selectedImage) || !!retryingMessage}
                 >
                   <Send size={20} />
                 </button>
               </form>
             </div>
           </>
         ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
              {t('select_a_user_to_start_chatting')}
            </div>
         )}
       </div> {}

       {}
       {showImageGallery && (
          <div className="absolute bottom-20 left-1/4 right-0 mx-auto w-3/4 max-w-2xl h-64 bg-white border border-gray-300 rounded-lg shadow-xl z-10 flex flex-col dark:bg-gray-800 dark:border-gray-700">
             <div className="p-2 border-b border-gray-200 flex justify-between items-center dark:border-gray-700">
                <div className="flex space-x-1">
                   <button 
                     onClick={() => setActiveTab('preloaded')}
                     className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'preloaded' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {t('readyPhotos')}
                   </button>
                   <button 
                     onClick={() => setActiveTab('custom')}
                     className={`px-3 py-1 rounded text-sm font-medium ${activeTab === 'custom' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                   >
                      Кастомные
                    </button>
                </div>
                <button onClick={toggleImageGallery} className="text-gray-400 hover:text-gray-600">
                   <X size={20} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-3">
                {activeTab === 'preloaded' && (
                   <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                       {preloadedImages.map((img) => (
                          <div key={img.id} className="relative group cursor-pointer" onClick={() => selectImage(img.thumbnail)}> 
                             <img src={img.thumbnail} alt={img.description} className="w-full h-24 object-cover rounded border border-gray-200 group-hover:opacity-75 transition-opacity dark:border-gray-700" />
                             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity">
                               <Eye size={24} className="text-white opacity-0 group-hover:opacity-100"/>
                             </div>
                             {} 
                          </div>
                       ))}
                   </div>
                )}
                {activeTab === 'custom' && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                       {customImages.map((img) => (
                           <div key={img.id} className="relative group cursor-pointer" > 
                               <img src={img.url} alt={img.description} className="w-full h-24 object-cover rounded border border-gray-200 group-hover:opacity-75 transition-opacity dark:border-gray-700" onClick={() => selectImage(img.url)}/>
                               <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity" onClick={() => selectImage(img.url)}>
                                   <Eye size={24} className="text-white opacity-0 group-hover:opacity-100"/>
                               </div>
                               <button onClick={() => handleDeleteCustomImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all">
                                   <Trash2 size={12}/>
                               </button>
                           </div>
                        ))}
                        {} 
                        <button 
                           onClick={handleUploadClick}
                           disabled={uploadingImage}
                           className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 dark:border-gray-600 dark:text-gray-500 dark:hover:border-blue-600 dark:hover:text-blue-600"
                        >
                            {uploadingImage ? <Loader size={24} className="animate-spin mb-1"/> : <Upload size={24} className="mb-1"/>}
                            <span className="text-xs">{uploadingImage ? 'Загрузка...' : 'Загрузить'}</span>
                        </button>
                        <input 
                           type="file"
                           ref={fileInputRef}
                           onChange={handleFileChange}
                           accept="image/*"
                           className="hidden"
                        />
                    </div>
                )}
             </div>
          </div>
       )}

       {}
       {showPriceModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
           <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl dark:bg-gray-800">
             <h4 className="text-lg font-semibold mb-4 dark:text-gray-100">{t('selectPhotoPrice')}</h4>
             {tempSelectedImage && 
               <img src={tempSelectedImage} alt="Selected" className="w-full max-h-48 object-contain rounded mb-4"/>
             }
             <input 
                 type="text"
                 value={selectedImageComment} 
                 onChange={(e) => setSelectedImageComment(e.target.value)} 
                 placeholder={t('addPhotoComment')}
                 className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
             />
             <div className="grid grid-cols-3 gap-2 mb-4">
               {['бесплатно', '$5', '$10', '$15', '$20', '$50'].map((price) => (
                 <button
                   key={price}
                   onClick={() => setSelectedPrice(price === 'бесплатно' ? t('free') : price)}
                   className={`p-2 border rounded text-sm font-medium transition-colors ${
                     selectedPrice === (price === 'бесплатно' ? t('free') : price)
                       ? 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600'
                       : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                   }`}
                 >
                   {price === 'бесплатно' ? t('free') : price}
                 </button>
               ))}
             </div>
             <div className="flex justify-end space-x-2">
               <button onClick={cancelImageSelection} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                 {t('cancel')}
               </button>
               <button onClick={confirmImageSelection} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                 {t('confirm')}
               </button>
             </div>
           </div>
         </div>
       )}

        {}
       {showCongratulations && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4">
             <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-xl text-center relative animate-fade-in-up dark:bg-gray-800">
                  <button onClick={handleCloseResults} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                     <X size={24} />
                  </button>

                 <h2 className="text-2xl font-bold text-green-600 mb-4 dark:text-green-500">{t('congratulations')}</h2>
                 <p className="text-gray-700 mb-6 dark:text-gray-300">{t('testCompletedSuccessfully')}</p>

                 {calculatingResults && (
                   <div className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-400">
                     <Loader size={40} className="animate-spin mb-4 text-blue-500 dark:text-blue-400" />
                     <p className="font-semibold mb-2">{t('calculatingResults')}</p>
                     <p className="text-sm">{t('itWillTakeSeconds')}</p>
                   </div>
                 )}

                 {!calculatingResults && analysisComplete && analysisResult && (
                   <div className="mt-6 text-left border-t pt-6 dark:border-gray-700">
                     <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">Результаты анализа</h3>
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
                         {}
                         <p className="font-semibold text-lg text-blue-800 dark:text-blue-300">Общая оценка: {analysisResult && analysisResult.overall_score ? analysisResult.overall_score : 'N/A'}/100</p>
                         <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{analysisResult && analysisResult.overall_feedback ? analysisResult.overall_feedback : 'Нет данных'}</p>
                      </div>
                     <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                       {}
                       {analysisResult && analysisResult.dialogs && Object.entries(analysisResult.dialogs).map(([userId, dialogAnalysis]: [string, any]) => (
                         <details key={userId} className="bg-gray-50 p-3 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                           <summary className="font-semibold text-gray-700 cursor-pointer hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Анализ диалога с {userId}</summary>
                           <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2 text-sm text-gray-600 dark:border-blue-700 dark:text-gray-400">
                             {}
                             <p><strong>Ошибки:</strong> {dialogAnalysis?.errors?.join(', ') || 'Нет'}</p>
                             <p><strong>Сильные стороны:</strong> {dialogAnalysis?.strengths?.join(', ') || 'Нет'}</p>
                             <p><strong>Области для улучшения:</strong> {dialogAnalysis?.areas_for_improvement?.join(', ') || 'Нет'}</p>
                             <p><strong>Оценка вовлеченности:</strong> {dialogAnalysis?.engagement_score ?? 'N/A'}/10</p>
                             <p><strong>Оценка тона:</strong> {dialogAnalysis?.tone_score ?? 'N/A'}/10</p>
                             <p><strong>Комментарий:</strong> {dialogAnalysis?.summary ?? 'Нет данных'}</p>
                           </div>
                         </details>
                       ))}
                     </div>
                   </div>
                 )}

                  {}
                  {!calculatingResults && analysisComplete && !analysisResult && (
                     <div className="mt-6 text-left border-t pt-6 dark:border-gray-700">
                        <p className="text-red-600 dark:text-red-500 text-center">Произошла ошибка при получении или отображении результатов анализа.</p>
                     </div>
                  )}

                   <div className="mt-8">
                       <button
                          onClick={handleCloseResults}
                          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
                       >
                          Перейти в панель
                       </button>
                   </div>
             </div>
           </div>
       )}

      {}
      {/* {isPromptModalOpen && ( 
        <PromptModal onClose={handleClosePromptModal} userPrompts={userPrompts} getPromptSummary={getPromptSummary} />
      )} */}

    </div> 
  );
}

export default Chat;

</rewritten_file>