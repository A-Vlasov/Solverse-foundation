import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { MessageCircle, Send, Menu, Bell, Settings, Search, Heart, Image, AtSign, DollarSign, Timer, Bot, AlertCircle, Info, Check, CheckCheck, X, ImagePlus, Upload, Trash2, ExternalLink, Eye, Loader, LogOut } from 'lucide-react';
import { useNavigation, useParams } from '../../app/components/SimpleNavigation';
import { userPrompts, getPromptSummary } from '../data/userPrompts';
import PromptModal from './PromptModal';
import type { DialogAnalysisResult, ChatMessage as SupabaseChatMessage, TestResult } from '../lib/supabase';
// Импортируем сервисы для API
import { chatService, testSessionService, testResultService, grokService, geminiService } from '../services/api';
// Добавляем импорт функций для работы с сессиями и результатами тестов
import { getTestSession, saveTestResult } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { preloadedImages } from '../data/preloadedImages';
import { ChatMessage } from '../lib/supabase';
// Импортируем константу для таймера
import { TIMER_DURATION_SECONDS } from '../constants/time';

// Типы сообщений
interface Message {
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
}

interface ChatHistory {
  [key: string]: Message[];
}

interface LoadingStates {
  [key: string]: boolean;
}

interface UserStatus {
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

// Add new interface for Grok conversation details
interface GrokConversation {
  conversationId: string;
  parentResponseId: string;
  chatLink?: string;
}

interface UserConversations {
  [key: string]: GrokConversation;
}

// Простая реализация toast-уведомлений
const toast = ({ title, variant = "default" }: { title: string, variant?: "default" | "destructive" }) => {
  console.error(title); // Используем console.error для логирования ошибок
  // В реальном проекте здесь была бы полноценная реализация toast-уведомлений
};

function Chat() {
  const { navigate } = useNavigation();
  const params = useParams();
  const { t, locale } = useLocale();
  
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('Marcus');
  const [timeRemaining, setTimeRemaining] = useState<number>(TIMER_DURATION_SECONDS); // Используем константу вместо 180
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null>(null);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
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

  // Add new state for Grok conversations
  const [userConversations, setUserConversations] = useState<UserConversations>({});
  
  // Добавляем состояние для модального окна промпта
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  const [imageComment, setImageComment] = useState<string>(''); // Добавляем состояние для комментария
  const [selectedImageComment, setSelectedImageComment] = useState<string>(''); // Комментарий для выбранного изображения в предпросмотре
  
  const users = [
    { name: 'Marcus', status: t('online'), lastMessage: t('passionateClient') },
    { name: 'Shrek', status: t('online'), lastMessage: t('capriciousClient') },
    { name: 'Oliver', status: t('away'), lastMessage: t('bargainingClient') },
    { name: 'Alex', status: t('online'), lastMessage: t('testingBoundaries') },
  ];

  const [isMounted, setIsMounted] = useState(false);
  
  // Состояние для хранения функций навигации и параметров
  const [navigation, setNavigation] = useState<{
    navigate: ((path: string) => void) | null;
    params: { sessionId?: string } | null;
  }>({
    navigate: null,
    params: null
  });
  
  // Получаем sessionId из параметров URL или DOM-элемента (для совместимости с Next.js)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // Добавим переменные для контроля таймера
  const timeRemainingRef = useRef<number>(TIMER_DURATION_SECONDS);
  // Будем хранить время окончания, а не оставшееся время
  const endTimeRef = useRef<number>(Date.now() + TIMER_DURATION_SECONDS * 1000);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTimerActiveRef = useRef<boolean>(true);
  const lastSyncTimeRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false);
  
  // Устанавливаем флаг монтирования компонента
  useEffect(() => {
    setIsMounted(true);
    
    // Получение параметров URL
    if (typeof window !== 'undefined') {
      try {
        // Получаем userId из URL-параметров, если он есть
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        if (userId) {
          console.log('Found userId in URL parameters:', userId);
          // Проверяем, есть ли данные кандидата в sessionStorage
          const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
          
          // Если данные кандидата отсутствуют или у них нет userId, добавляем его
          if (!candidateData.userId && !candidateData.employee_id) {
            console.log('Adding userId to candidateData:', userId);
            sessionStorage.setItem('candidateData', JSON.stringify({
              ...candidateData,
              userId: userId
            }));
          }
        }
        
        // Импортируем динамически для избежания ошибок SSR
        import('react-router-dom').then(({ useNavigate, useParams }) => {
          // Создаем компонент для вызова хуков
          const RouterHookComponent = () => {
            try {
              const navigate = useNavigate();
              const params = useParams<{ sessionId: string }>();
              
              // Сохраняем результаты в состояние
              useEffect(() => {
                setNavigation({
                  navigate,
                  params
                });
              }, [navigate, params]);
              
              return null;
            } catch (error) {
              console.error('Failed to use React Router hooks', error);
              return null;
            }
          };
          
          // Сохраняем компонент для использования в JSX
          setRouterHookComponent(() => RouterHookComponent);
        }).catch(error => {
          console.error('Failed to import react-router-dom', error);
        });
      } catch (e) {
        console.error('Error setting up router', e);
      }
    }
    
    // Получаем sessionId из DOM-элемента для Next.js
    if (typeof window !== 'undefined') {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        const sessionIdFromData = chatContainer.getAttribute('data-session-id');
        if (sessionIdFromData) {
          setSessionId(sessionIdFromData);
        }
      }
    }
  }, []);
  
  // Компонент для безопасного использования хуков React Router
  const [RouterHookComponent, setRouterHookComponent] = useState<React.ComponentType | null>(null);
  
  // Обновляем sessionId при изменении параметров маршрута
  useEffect(() => {
    if (navigation.params && navigation.params.sessionId) {
      setSessionId(navigation.params.sessionId);
    }
  }, [navigation.params]);

  // Load custom images from localStorage on component mount
  useEffect(() => {
    if (!isMounted) return;
    
    const savedImages = localStorage.getItem('customImages');
    if (savedImages) {
      try {
        setCustomImages(JSON.parse(savedImages));
      } catch (error) {
        console.error('Error loading custom images:', error);
      }
    }
  }, [isMounted]);

  // Save custom images to localStorage whenever they change
  useEffect(() => {
    if (!isMounted) return;
    
    if (customImages.length > 0) {
      localStorage.setItem('customImages', JSON.stringify(customImages));
    }
  }, [customImages, isMounted]);

  // Функция для обновления отображаемого времени
  const updateDisplayTime = (seconds: number) => {
    // Обновляем UI только при изменении целого числа секунд
    if (Math.floor(seconds) !== timeRemainingRef.current) {
      timeRemainingRef.current = Math.floor(seconds);
      setTimeRemaining(timeRemainingRef.current);
    }
  };
  
  // Функция для получения текущего оставшегося времени
  const getCurrentTimeRemaining = (): number => {
    if (!isTimerActiveRef.current) return 0;
    
    const now = Date.now();
    const diffMs = Math.max(0, endTimeRef.current - now);
    return Math.ceil(diffMs / 1000); // округляем вверх до секунды
  };
  
  // Инициализация таймера
  const initTimer = (sid: string) => {
    // console.log('🕒 Инициализация таймера для сессии:', sid);
    
    // Очищаем существующие интервалы
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (syncIntervalRef.current !== null) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    // Устанавливаем флаг активности таймера
    isTimerActiveRef.current = true;
    
    // Получаем начальное время с сервера
    const initializeTimerFromServer = async () => {
      try {
        // Вызываем getRemainingTime только с sessionId
        const response = await testSessionService.getRemainingTime(sid);
        // console.log('🕒 Получено начальное время с сервера:', response);
        
        if (response && response.remainingTime !== undefined) {
          // Устанавливаем время окончания на основе полученного с сервера времени
          // Если сервер вернул 0 или меньше, используем наши 180 секунд по умолчанию
          const serverSeconds = response.remainingTime > 0 ? response.remainingTime : TIMER_DURATION_SECONDS;
          const initialSeconds = Math.max(0, serverSeconds);
          endTimeRef.current = Date.now() + initialSeconds * 1000;
          lastSyncTimeRef.current = Date.now();
          
          // Обновляем UI с начальным временем
          timeRemainingRef.current = initialSeconds;
          setTimeRemaining(initialSeconds);
          
          // Если время = 0, значит тест уже завершен
          if (initialSeconds <= 0) {
            handleTimeExpiration(sid);
            return;
          }
          
          // Запускаем локальный таймер с интервалом в 1 секунду
          startLocalTimer(sid);
          
          // Запускаем периодическую синхронизацию с сервером
          startServerSync(sid);
        }
      } catch (error) {
        console.error('❌ Ошибка при получении начального времени:', error);
      }
    };
    
    initializeTimerFromServer();
    
    // Функция для очистки таймеров
    return () => {
      // console.log('🧹 Очистка таймеров при размонтировании компонента');
      
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      
      isTimerActiveRef.current = false;
    };
  };
  
  // Запуск локального отсчета времени с интервалом в 1 секунду
  const startLocalTimer = (sid: string) => {
    // console.log('▶️ Запуск локального таймера');
    
    // Сначала запускаем немедленное обновление UI
    const currentTimeRemaining = getCurrentTimeRemaining();
    updateDisplayTime(currentTimeRemaining);
    
    // Затем запускаем интервал, который будет обновлять UI каждую секунду
    timerIntervalRef.current = setInterval(() => {
      if (!isTimerActiveRef.current) {
        // Если таймер неактивен, очищаем интервал
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        return;
      }
      
      // Получаем текущее оставшееся время
      const timeRemaining = getCurrentTimeRemaining();
      
      // Обновляем UI
      updateDisplayTime(timeRemaining);
      
      // Проверяем, не закончилось ли время
      if (timeRemaining <= 0) {
        // console.log('⏱️ Время локально истекло');
        handleTimeExpiration(sid);
        return;
      }
      
      // Проверяем особые случаи, например, печатающееся сообщение на последней секунде
      if (timeRemaining === 1) {
        const hasTypingMessages = Object.values(userStatus).some(status => status.isTyping);
        if (hasTypingMessages) {
          // console.log('⏸️ Печатается сообщение, задерживаем таймер на 1 секунде');
          // Продлеваем время окончания, чтобы оно не упало ниже 1 секунды
          endTimeRef.current = Date.now() + 1000;
        }
      }
    }, 1000);
  };
  
  // Запуск периодической синхронизации с сервером
  const startServerSync = (sid: string) => {
    // console.log('🔄 Запуск синхронизации с сервером');
    
    // Устанавливаем интервал для синхронизации (каждые 60 секунд)
    syncIntervalRef.current = setInterval(() => {
      if (!isTimerActiveRef.current || syncInProgressRef.current) return;
      
      syncWithServer(sid);
    }, 60000); // 1 минута между синхронизациями
  };
  
  // Синхронизация с сервером
  const syncWithServer = async (sid: string) => {
    if (!isTimerActiveRef.current || syncInProgressRef.current) return;
    
    // Устанавливаем флаг, что синхронизация в процессе
    syncInProgressRef.current = true;
    
    try {
      // Вызываем getRemainingTime только с sessionId
      const response = await testSessionService.getRemainingTime(sid);
      
      if (response && response.remainingTime !== undefined) {
        const serverSeconds = response.remainingTime;
        const clientSeconds = getCurrentTimeRemaining();
        
        // console.log(`🔄 Синхронизация с сервером: клиент ${clientSeconds}с, сервер ${serverSeconds}с`);
        
        // Проверяем наличие печатающих сообщений
        const hasTypingMessages = Object.values(userStatus).some(status => status.isTyping);
        
        // Если время на сервере истекло и нет печатающих сообщений, завершаем тест
        if (serverSeconds <= 0 && !hasTypingMessages) {
          // console.log('⏱️ Время на сервере истекло, завершаем тест');
          handleTimeExpiration(sid);
          return;
        }
        
        // Если осталось мало времени и печатаются сообщения, задерживаем таймер
        if (serverSeconds <= 3 && hasTypingMessages) {
          // console.log('⏸️ Печатаются сообщения, задерживаем таймер');
          // Не даем времени упасть ниже 1 секунды
          if (serverSeconds < 1) {
            endTimeRef.current = Date.now() + 1000; // 1 секунда
            updateDisplayTime(1);
            syncInProgressRef.current = false;
            return;
          }
        }
        
        // Проверяем разницу между локальным и серверным временем
        const diffSeconds = serverSeconds - clientSeconds;
        
        // Если разница более 3 секунд, корректируем время окончания
        if (Math.abs(diffSeconds) > 3) {
          // console.log(`🔄 Существенная разница времени: ${diffSeconds}с, корректируем время окончания`);
          
          // Корректируем время окончания
          // Если разница большая, делаем резкую коррекцию, но постепенное изменение UI будет обеспечено setInterval
          endTimeRef.current = Date.now() + serverSeconds * 1000;
        }
        
        // Обновляем время последней синхронизации
        lastSyncTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('❌ Ошибка при синхронизации с сервером:', error);
    } finally {
      // Сбрасываем флаг синхронизации
      syncInProgressRef.current = false;
    }
  };
  
  // Обработка истечения времени
  const handleTimeExpiration = async (sid: string) => {
    // Проверяем, был ли уже завершен таймер
    if (!isTimerActiveRef.current) return;
    
    // console.log('⏱️ Обработка завершения времени для сессии:', sid);
    
    // Останавливаем таймер
    isTimerActiveRef.current = false;
    
    // Очищаем все интервалы
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (syncIntervalRef.current !== null) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    // Устанавливаем время в 0
    updateDisplayTime(0);
    
    // Очищаем демо-сессию, если это она
    if (sid.startsWith('demo-session-')) {
      localStorage.removeItem('activeDemoSessionId');
    }
    
    // Показываем окно поздравления
    setShowCongratulations(true);
    setCalculatingResults(true);
    setIsSessionComplete(true);
    
    try {
      // Завершаем сессию на сервере
      await testSessionService.complete(sid);
      console.log('✅ Сессия успешно завершена на сервере');
      
      // Запускаем анализ диалогов если это не было сделано ранее
      if (!isSessionComplete) {
        await analyzeDialogsAndSaveResults(sid);
      }
    } catch (error) {
      console.error('❌ Ошибка при завершении сессии:', error);
    }
  };

  // Настраиваем таймер для автоматического окончания тестирования
  useEffect(() => {
    if (!isMounted) return;
    
    // Функция для инициализации сессии
    let isInitializing = false;
    
    const initTestSession = async () => {
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        console.log('🔄 Starting test session initialization');
        
        // Проверяем наличие ID сессии в URL
        if (sessionId) {
          console.log('🔍 Found sessionId in URL:', sessionId);

          // Проверяем, является ли это демо-сессией (формат: demo-session-timestamp)
          const isDemoSession = sessionId.startsWith('demo-session-');
          
          if (isDemoSession) {
            console.log('🔍 This is a demo session:', sessionId);
            
            // Проверяем, есть ли уже активная сессия в localStorage или sessionStorage
            const existingDemoId = localStorage.getItem('activeDemoSessionId');
            
            if (existingDemoId && existingDemoId !== sessionId) {
              console.log('⚠️ Another demo session was already started:', existingDemoId);
              // Перенаправляем на существующую активную демо-сессию
              navigate(`/test-session/${existingDemoId}?lang=${locale}`);
              isInitializing = false;
              return;
            }
            
            // Если демо-сессия новая или это та же самая, сохраняем её ID
            localStorage.setItem('activeDemoSessionId', sessionId);
          }
          
          try {
            // Проверяем, существует ли сессия с таким ID
            const session = await testSessionService.getById(sessionId);
            
            if (session && !session.completed) {
              console.log('✅ Using session from URL parameter:', sessionId);
              setTestSessionId(sessionId);
              sessionStorage.setItem('currentTestSessionId', sessionId);
              localStorage.setItem('currentTestSessionId', sessionId); // Дублируем в localStorage для восстановления при перезагрузке
              
              // Проверяем, существуют ли чаты для этой сессии
              const sessionChats = await chatService.getHistory(sessionId);
              
              if (sessionChats && sessionChats.length > 0) {
                console.log('📋 Session has', sessionChats.length, 'chats');
                isInitializing = false;
                
                // Инициализируем таймер для существующей сессии
                initTimer(sessionId);
                return;
              } else {
                console.warn('⚠️ Session from URL has no chats, will proceed to create new session');
              }
            } else if (session && session.completed) {
              console.warn('⚠️ Session from URL is already completed:', sessionId);
              
              // Если это демо-сессия, удаляем её из локального хранилища
              if (isDemoSession) {
                localStorage.removeItem('activeDemoSessionId');
              }
              
              // Если сессия завершена, перенаправляем на результаты с языковым параметром
              navigate(`/test-results/${sessionId}?lang=${locale}`);
              return;
            } else {
              console.warn('⚠️ Session from URL not found:', sessionId);
            }
          } catch (error) {
            console.error('❌ Error checking session from URL:', error);
          }
        }
        
        // Если URL не содержит sessionId или сессия не найдена, проверяем sessionStorage и localStorage
        const storageSessionId = sessionStorage.getItem('currentTestSessionId') || localStorage.getItem('currentTestSessionId');
        
        if (storageSessionId) {
          console.log('🔍 Found existing session ID in storage:', storageSessionId);
          // Проверяем, существуют ли чаты для этой сессии
          try {
            const existingChats = await chatService.getHistory(storageSessionId);
            console.log('📋 Existing chats found:', existingChats.length, 'with messages:',
              existingChats.map(c => ({ chatNumber: c.chat_number, messageCount: c.messages?.length || 0 })));
            
            // Получаем данные текущего соискателя
            const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
            console.log('👤 Current candidate data:', candidateData);
            const candidateId = candidateData.userId;
            
            if (existingChats && existingChats.length > 0) {
              // Проверяем, что сессия принадлежит текущему соискателю
              // Получаем данные о сессии
              try {
                const session = await testSessionService.getById(storageSessionId);
                console.log('🔍 Session details:', {
                  id: session.id,
                  employeeId: session.employee_id,
                  candidateId: candidateId,
                  match: session.employee_id === candidateId,
                  complete: session.completed
                });
                
                if (session && session.employee_id === candidateId) {
                  // Проверка, завершена ли сессия
                  if (session.completed) {
                    console.log('⚠️ Found completed session, creating new one');
                    sessionStorage.removeItem('currentTestSessionId');
                    localStorage.removeItem('currentTestSessionId');
                  } else {
                  // Если сессия и чаты существуют и принадлежат текущему соискателю, используем их
                    setTestSessionId(storageSessionId);
                    console.log('✅ Using existing test session:', storageSessionId, 'for candidate:', candidateId);
                  isInitializing = false;
                    
                    // Инициализируем таймер для существующей сессии с новой улучшенной версией
                    initTimer(storageSessionId);
                  return;
                  }
                } else {
                  console.log('⚠️ Session belongs to a different candidate, creating new one');
                  sessionStorage.removeItem('currentTestSessionId');
                  localStorage.removeItem('currentTestSessionId');
                }
              } catch (sessionError) {
                console.error('❌ Error checking session ownership:', sessionError);
                sessionStorage.removeItem('currentTestSessionId');
                localStorage.removeItem('currentTestSessionId');
              }
            } else {
              console.log('⚠️ No chats found for existing session, will create new one');
              // Сессия существует, но чаты не найдены - удаляем ID сессии
              sessionStorage.removeItem('currentTestSessionId');
              localStorage.removeItem('currentTestSessionId');
            }
          } catch (error) {
            console.error('❌ Error checking existing session:', error);
            // В случае ошибки удаляем ID сессии
            sessionStorage.removeItem('currentTestSessionId');
            localStorage.removeItem('currentTestSessionId');
          }
        } else {
          console.log('🆕 No existing session found, will create new one');
        }

        // Получаем ID соискателя из sessionStorage
        const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
        console.log('👤 Candidate data for new session:', candidateData);
        const candidateId = candidateData.userId;
        
        if (!candidateId) {
          console.error('❌ No candidate ID found in session storage!');
          throw new Error('No candidate ID found in session storage');
        }
        
        console.log('Looking for employee with ID:', candidateId);
        
        // Создаем новую сессию через API
        try {
          const sessionResponse = await testSessionService.create(candidateId);
          
          if (!sessionResponse.success || !sessionResponse.session) {
            throw new Error('Failed to create test session');
          }
          
          const session = sessionResponse.session;
          const newSessionId = session.id;
          setTestSessionId(newSessionId);
          sessionStorage.setItem('currentTestSessionId', newSessionId);
          localStorage.setItem('currentTestSessionId', newSessionId); // Дублируем в localStorage
          console.log('✅ Test session created and saved to storage:', newSessionId);
          
          // Сбрасываем информацию о разговорах с Grok при создании новой сессии
          setUserConversations({});
          
          // Инициализируем таймер для новой сессии с новой улучшенной версией
          initTimer(newSessionId);
        } catch (sessionError) {
          console.error('❌ Error creating session:', sessionError);
          throw sessionError;
        }
      } catch (error) {
        console.error('Error in session initialization:', error);
      } finally {
        isInitializing = false;
      }
    };
    
    // Если есть testSessionId, инициализируем таймер, иначе инициализируем сессию
    if (testSessionId) {
      initTimer(testSessionId);
    } else {
    initTestSession();
    }
    
    // Функция очистки при размонтировании компонента
    return () => {
      // console.log('🧹 Очистка ресурсов при размонтировании компонента');
      
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      
      isTimerActiveRef.current = false;
    };
  }, [isMounted, sessionId, testSessionId, isSessionComplete, locale, navigate]);
  
  // Обновляем эффект для завершения сессии при печатающихся сообщениях
  useEffect(() => {
    // Проверяем только если таймер на последней секунде и сессия не завершена
    if (timeRemaining === 1 && !isSessionComplete && testSessionId) {
      const hasTypingMessages = Object.values(userStatus).some(status => status.isTyping);
      
      if (!hasTypingMessages) {
        // console.log('⏱️ Таймер = 1, нет печатающих сообщений, завершаем сессию');
        handleTimeExpiration(testSessionId);
      }
    }
  }, [timeRemaining, userStatus, testSessionId, isSessionComplete]);

  // Функция для форматирования времени в формат MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const markMessagesAsRead = () => {
      const container = chatContainerRef.current;
      if (!container) return;

      const unreadMessages = chatHistories[selectedUser]
        .filter(msg => !msg.isOwn && !msg.isRead);

      if (unreadMessages.length === 0) return;

      setChatHistories(prev => ({
        ...prev,
        [selectedUser]: prev[selectedUser].map(msg => 
          !msg.isOwn ? { ...msg, isRead: true } : msg
        )
      }));

      setUserStatus(prev => ({
        ...prev,
        [selectedUser]: { 
          ...prev[selectedUser], 
          unreadCount: 0,
          lastMessageId: unreadMessages[unreadMessages.length - 1].id 
        }
      }));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            markMessagesAsRead();
          }
        });
      },
      { threshold: 0.5 }
    );

    const container = chatContainerRef.current;
    if (container) {
      observer.observe(container);
    }

    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [selectedUser, chatHistories]);

  // Сбрасываем счетчик непрочитанных сообщений при смене пользователя
  useEffect(() => {
    // Отмечаем все сообщения как прочитанные
    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: prev[selectedUser].map(msg => 
        !msg.isOwn ? { ...msg, isRead: true } : msg
      )
    }));

    // Сбрасываем счетчик непрочитанных сообщений
    setUserStatus(prev => ({
      ...prev,
      [selectedUser]: { ...prev[selectedUser], unreadCount: 0 }
    }));
  }, [selectedUser]);

  // Отслеживаем новые сообщения от ассистента и увеличиваем счетчик непрочитанных сообщений
  useEffect(() => {
    // Для каждого пользователя проверяем, есть ли новые сообщения от ассистента
    Object.keys(chatHistories).forEach(userName => {
      // Пропускаем текущего выбранного пользователя
      if (userName === selectedUser) return;
      
      const messages = chatHistories[userName];
      if (messages.length === 0) return;
      
      // Получаем последнее сообщение
      const lastMessage = messages[messages.length - 1];
      
      // Используем функциональное обновление состояния, чтобы избежать зависимости от userStatus
      setUserStatus(prevStatus => {
        // Если последнее сообщение от ассистента, не прочитано и его ID не совпадает с lastMessageId
        if (!lastMessage.isOwn && !lastMessage.isRead && lastMessage.id !== prevStatus[userName].lastMessageId) {
          return {
            ...prevStatus,
            [userName]: {
              ...prevStatus[userName],
              unreadCount: prevStatus[userName].unreadCount + 1,
              lastMessageId: lastMessage.id
            }
          };
        }
        return prevStatus;
      });
    });
  }, [chatHistories, selectedUser]);

  const simulateTypingDelay = async (character: string): Promise<void> => {
    const initialDelay = Math.random() * (10000 - 5000) + 5000;
    await new Promise(resolve => setTimeout(resolve, initialDelay));

    // Создаем временное сообщение с анимацией печатания
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      sender: character,
      content: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: false,
      isTyping: true,
      isRead: true
    };

    // Добавляем сообщение с анимацией печатания в историю чата
    setChatHistories(prev => ({
      ...prev,
      [character]: [...prev[character], typingMessage]
    }));

    setUserStatus(prev => ({
      ...prev,
      [character]: { ...prev[character], isTyping: true }
    }));

    // Увеличиваем продолжительность отображения состояния "печатает"
    let typingDuration;
    
    if (character === 'Shrek') {
      // Для Шрека оставляем длительное время печатания
      typingDuration = Math.random() * (30000 - 15000) + 15000;
    } else if (character === 'Grok') {
      // Для Grok делаем среднюю длительность
      typingDuration = Math.random() * (15000 - 8000) + 8000;
    } else {
      // Для всех остальных персонажей увеличиваем минимальное время
      typingDuration = Math.random() * (12000 - 5000) + 5000;
    }

    await new Promise(resolve => setTimeout(resolve, typingDuration));

    // Удаляем сообщение с анимацией печатания из истории чата
    setChatHistories(prev => ({
      ...prev,
      [character]: prev[character].filter(msg => msg.id !== typingMessage.id)
    }));

    setUserStatus(prev => ({
      ...prev,
      [character]: { ...prev[character], isTyping: false }
    }));
  };

  const toggleImageGallery = () => {
    console.log('Нажата кнопка выбора фото, текущее состояние:', showImageGallery);
    setShowImageGallery(prev => !prev);
  };

  // Модифицируем функцию selectImage для открытия модального окна с ценой
  const selectImage = (imageUrl: string) => {
    // Блокируем выбор изображения, если время истекло или есть активная загрузка
    if (timeRemaining <= 0 || loadingStates[selectedUser]) {
      return;
    }
    
    setTempSelectedImage(imageUrl);
    setShowPriceModal(true);
    setSelectedPrice(t('free')); // Сбрасываем цену при каждом выборе изображения
    setImageComment(''); // Сбрасываем комментарий
    setShowImageGallery(false); // Закрываем галерею после выбора фото
  };

  // Функция для подтверждения выбора изображения и цены
  const confirmImageSelection = () => {
    // Блокируем подтверждение выбора изображения, если время истекло или есть активная загрузка
    if (timeRemaining <= 0 || loadingStates[selectedUser]) {
      setShowPriceModal(false);
      setTempSelectedImage(null);
      return;
    }
    
    if (tempSelectedImage) {
      // Явно закрываем модальное окно перед всеми действиями
      setShowPriceModal(false);
      setShowImageGallery(false); // Убедимся, что галерея тоже закрыта
      
      // Напрямую отправляем изображение в чат без прикрепления
      if (!tempSelectedImage) return;
      
      // Получаем ID текущей тестовой сессии из sessionStorage
      let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
      
      // Проверяем существование тестовой сессии
      if (!currentTestSessionId) {
        console.error('No test session ID found in storage. Please reload the page to create a new session.');
        return;
      }
      
      // Формируем контент сообщения с учетом ценника
      const priceInfo = selectedPrice ? ` [Price: ${selectedPrice}]` : '';
      
      // Создаем объект сообщения с изображением и ценой
      const newMessage = {
        id: `user-${Date.now()}`,
        sender: 'You',
        content: '',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        isOwn: true,
        isRead: true,
        imageUrl: tempSelectedImage,
        price: selectedPrice,
        imageComment: imageComment // Добавляем комментарий к изображению
      };
      
      setChatHistories(prev => ({
        ...prev,
        [selectedUser]: [...prev[selectedUser], newMessage]
      }));
      
      // Сбрасываем временное изображение и цену
      setTempSelectedImage(null);
      setSelectedPrice(t('free'));
      setImageComment(''); // Сбрасываем комментарий
      
      setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));
      
      sendPhotoMessage(newMessage, currentTestSessionId);
    }
  };

  // Создаем отдельную вспомогательную функцию для отправки фото как обычного сообщения
  const sendPhotoMessage = async (newMessage: Message, sessionId: string) => {
    try {
      // Определяем номер чата на основе выбранного пользователя
      const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
      if (chatNumber < 1 || chatNumber > 4) {
        throw new Error('Invalid chat number');
      }

      // Формируем комментарий к фото, если он есть
      const commentInfo = newMessage.imageComment ? ` [Comment: ${newMessage.imageComment}]` : '';
      const priceInfo = newMessage.price ? ` [Price: ${newMessage.price}]` : ' [Price: FREE]';

      // Формируем содержимое сообщения с фото
      const photoMessageContent = `[Photo ${newMessage.imageUrl?.match(/\/(\d+)\.jpg$/)?.[1] || ''}] [${preloadedImages.find(img => img.url === newMessage.imageUrl)?.prompt || 'User sent an image'}]${priceInfo}${commentInfo} [chatter sent photo]`;
      
      console.log('Отправляем фото-сообщение через стандартный API:', photoMessageContent.substring(0, 50) + '...');
      
      // Проверяем, есть ли уже начатый разговор с этим пользователем в Grok
      const existingConversation = userConversations[selectedUser];
      console.log('Существующие детали разговора для фото:', existingConversation);

      // ВАЖНО: Отправляем через тот же API-метод, что и для обычных сообщений
      const chatResponse = await chatService.sendMessage(
        sessionId,
        photoMessageContent, // Отправляем фото в виде текстового сообщения
        '', // employeeId пустой, так как мы используем sessionId
        chatNumber,
        existingConversation && existingConversation.conversationId && existingConversation.parentResponseId
          ? {
              conversationId: existingConversation.conversationId,
              parentResponseId: existingConversation.parentResponseId
            } 
          : undefined
      );
      
      if (chatResponse.error) {
        throw new Error(chatResponse.error);
      }
      
      console.log('Ответ API на фото-сообщение:', chatResponse);
      
      const { botResponse } = chatResponse;
      
      if (botResponse && botResponse.error) {
        throw new Error(botResponse.error);
      }

      // Обрабатываем ответ так же, как в handleSendMessage
      if (botResponse && botResponse.response) {
        // Имитируем печатание ответа перед его отображением
        await simulateTypingDelay(selectedUser);
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: botResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));
        
        // Если ответ содержит тег [Bought], обновляем статус фото
        if (botResponse.boughtTag) {
          console.log('Обнаружен тег [Bought] в ответе на фото');
          
          setChatHistories(prev => {
            const newHistory = [...prev[selectedUser]];
            const photoIndex = newHistory.findIndex(msg => msg.id === newMessage.id);
            
            if (photoIndex !== -1 && newMessage.price && newMessage.price !== 'FREE') {
              console.log('Обновляем статус фото на bought=true');
              newHistory[photoIndex] = {
                ...newMessage,
                bought: true,
                pending: true,
                purchased: true
              };
            }
            return {
              ...prev,
              [selectedUser]: newHistory
            };
          });
        }
        
        // Сохраняем информацию о разговоре для будущих сообщений
        if (botResponse.conversation_id && botResponse.parent_response_id) {
          setUserConversations(prev => ({
            ...prev,
            [selectedUser]: {
              conversationId: botResponse.conversation_id,
              parentResponseId: botResponse.parent_response_id,
              chatLink: botResponse.chat_link
            }
          }));
        }
      }
      
      // Обновляем статус пользователя
      setUserStatus(prev => ({
        ...prev,
        [selectedUser]: {
          ...prev[selectedUser],
          isTyping: false,
          lastMessageId: `assistant-${Date.now()}`
        }
      }));
      
      // Обновляем статус через API
      try {
        await chatService.updateStatus(
          sessionId,
          chatNumber,
          { isTyping: false }
        );
      } catch (statusError) {
        console.warn('Не удалось обновить статус чата:', statusError);
      }
    } catch (error) {
      console.error('Error in sending photo message:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: selectedUser,
        content: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        isOwn: false,
        isRead: false,
        error: true
      };

      setChatHistories(prev => ({
        ...prev,
        [selectedUser]: [...prev[selectedUser], errorMessage]
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [selectedUser]: false }));
    }
  };

  // Функция для отмены выбора изображения
  const cancelImageSelection = () => {
    setTempSelectedImage(null); // Очищаем временное изображение
    setSelectedPrice(t('free')); // Сбрасываем цену на FREE
    setImageComment(''); // Сбрасываем комментарий
    setShowPriceModal(false); // Закрываем модальное окно
    setShowImageGallery(false); // Закрываем галерею изображений
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedPrice('FREE'); // Сбрасываем цену на FREE
    setSelectedImageComment(''); // Сбрасываем комментарий
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Shift:', e.shiftKey);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter pressed without shift, calling handleSendMessage');
      e.preventDefault();
      
      // Блокируем отправку сообщений, если время истекло или идет загрузка
      if (timeRemaining <= 0 || loadingStates[selectedUser]) {
        return;
      }
      
      // Если выбрано изображение, обрабатываем особым способом
      if (selectedImage) {
        // Если есть выбранная фотография, используем sendPhotoMessage вместо handleSendMessage
        // Получаем ID текущей тестовой сессии из sessionStorage
        let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
        if (currentTestSessionId) {
          const photoMsg = {
            id: `user-${Date.now()}`,
            sender: 'You',
            content: '',
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            isOwn: true,
            isRead: true,
            imageUrl: selectedImage,
            price: selectedPrice,
            imageComment: selectedImageComment
          };
          
          sendPhotoMessage(photoMsg, currentTestSessionId);
          
          // Очищаем выбранное изображение после отправки
          setSelectedImage(null);
          setSelectedImageComment('');
          setSelectedPrice('FREE');
        }
      } else {
        // Отправляем как обычное текстовое сообщение
        handleSendMessage(e);
      }
    }
  };

  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    
    // Закрываем галерею изображений при переключении чата
    setShowImageGallery(false);
    
    // Отмечаем сообщения как прочитанные при выборе пользователя
    if (chatHistories[userName] && chatHistories[userName].length > 0) {
      setChatHistories(prev => ({
        ...prev,
        [userName]: prev[userName].map(msg => 
          !msg.isOwn ? { ...msg, isRead: true } : msg
        )
      }));
      
      setUserStatus(prev => ({
        ...prev,
        [userName]: { 
          ...prev[userName], 
          unreadCount: 0
        }
      }));
    }
    
    // Прокручиваем чат к последнему сообщению после переключения пользователя
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  const currentUser = users.find(user => user.name === selectedUser);

  // Стили компонента
  const styles = {
    // Удаляем стили для ссылки Grok
  };

  // Функция для открытия модального окна с промптом
  const handleOpenPromptModal = () => {
    setIsPromptModalOpen(true);
  };

  // Добавляем useEffect для автоматической прокрутки чата к последнему сообщению
  useEffect(() => {
    // Прокручиваем чат к последнему сообщению при изменении истории чата или смене пользователя
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistories, selectedUser]);

  // Добавляем эффект для проверки и загрузки результатов анализа, если они не загружены
  useEffect(() => {
    if (showCongratulations && !calculatingResults && !analysisResult && testSessionId) {
      console.log('Modal is shown but no analysis result is available, trying to load it...');
      const loadAnalysisResult = async () => {
        try {
          // Создаем базовый результат анализа для отображения до загрузки реальных результатов
          const tempResult: DialogAnalysisResult = {
            dialog_analysis: {
              metrics: {
                engagement: { score: 3.0, verdict: "Загрузка результатов..." },
                charm_and_tone: { score: 3.0, verdict: "Загрузка результатов..." },
                creativity: { score: 3.0, verdict: "Загрузка результатов..." },
                adaptability: { score: 3.0, verdict: "Загрузка результатов..." },
                self_promotion: { score: 3.0, verdict: "Загрузка результатов..." },
                pricing_policy: { score: 3.0, verdict: "Загрузка результатов...", strengths: [], improvements: [] }
              },
              overall_conclusion: "Загрузка результатов анализа, пожалуйста подождите..."
            }
          };
          
          // Устанавливаем временный результат
          setAnalysisResult(tempResult);
          
          // Пытаемся загрузить реальные результаты
          await analyzeDialogsAndSaveResults(testSessionId);
        } catch (error) {
          console.error('Error loading analysis results:', error);
        }
      };
      
      loadAnalysisResult();
    }
  }, [showCongratulations, calculatingResults, analysisResult, testSessionId]);

  // Обработчик для кнопки "До свидания"
  const handleGoodbye = () => {
    console.log('Completing test session and redirecting to completion page');
    // Перенаправляем на страницу завершения теста вместо результатов
    navigate(`/test-completed?lang=${locale}`);
  };

  // Добавляем обработчик для закрытия окна результатов
  const handleCloseResults = () => {
    console.log('Closing results window and redirecting to home page');
    setShowCongratulations(false);
    // Перенаправляем на главную страницу
    navigate('/');
  };

  // Отслеживание состояния анализа для каждой сессии
  const activeAnalysisSessions = new Set<string>();

  // Обработчик для анализа диалогов и сохранения результатов
  const analyzeDialogsAndSaveResults = async (sessionId: string) => {
    setCalculatingResults(true);
    
    try {
      if (!sessionId) {
        console.error('Не указан ID сессии для сохранения результатов');
        toast({ title: 'Не указан ID сессии', variant: "destructive" });
        setCalculatingResults(false);
        return;
      }
      
      // Получаем ID сотрудника из данных, загруженных из sessionStorage
      const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
      const userIdToUse = candidateData.userId || candidateData.employee_id;
      
      if (!userIdToUse) {
        console.error('Не указан ID пользователя для сохранения результатов');
        toast({ title: 'Не указан ID пользователя', variant: "destructive" });
        setCalculatingResults(false);
        return;
      }
      
      console.log('Запуск анализа диалогов для сессии:', sessionId, 'и пользователя:', userIdToUse);
      
      // ЕДИНСТВЕННЫЙ способ сохранения - через API с флагом analyzeNow
      try {
        const apiParams = {
          sessionId,
          employeeId: userIdToUse,
          analyzeNow: true // Этот флаг указывает API выполнить анализ и сохранение одной операцией
        };
        
        console.log('Запускаем единый запрос для анализа и сохранения:', apiParams);
        
        // Устанавливаем флаг, что сохранение уже выполняется
        const saveInProgress = sessionStorage.getItem(`saving_results_${sessionId}`);
        if (saveInProgress) {
          console.warn('Сохранение для этой сессии уже выполняется:', saveInProgress);
          toast({ title: 'Результаты уже сохраняются, ожидайте завершения', variant: "destructive" });
          setCalculatingResults(false);
          return;
        }
        
        // Устанавливаем флаг, что мы начали сохранение
        sessionStorage.setItem(`saving_results_${sessionId}`, new Date().toISOString());
        
        const apiResponse = await fetch('/api/test-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiParams),
        });
        
        // Сохранение завершено, удаляем флаг
        sessionStorage.removeItem(`saving_results_${sessionId}`);
        
        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`Ошибка при анализе и сохранении (HTTP ${apiResponse.status}):`, errorText);
          throw new Error(`Ошибка HTTP: ${apiResponse.status} ${apiResponse.statusText}`);
        }
        
        const result = await apiResponse.json();
        console.log('Результаты успешно проанализированы и сохранены:', result);
        
        if (result.analysisResult) {
          // Устанавливаем результат анализа в состояние
          setAnalysisResult(result.analysisResult);
          setAnalysisComplete(true);
          console.log('Анализ успешно получен и установлен в состояние');
        } else {
          console.warn('API вернул успешный результат, но без данных анализа');
        }
        
        console.log('Процесс анализа и сохранения результатов успешно завершен');
        
        // Перенаправляем на страницу завершения теста
        window.location.href = `/test-completed?lang=${locale}`;
      } catch (apiError) {
        // Если произошла ошибка, удаляем флаг
        sessionStorage.removeItem(`saving_results_${sessionId}`);
        
        console.error('Ошибка при анализе и сохранении результатов:', apiError);
        toast({ title: 'Произошла ошибка при анализе диалогов', variant: "destructive" });
        
        // НЕ используем запасной метод через testResultService
        // Вместо этого просто уведомляем пользователя и завершаем функцию
        setCalculatingResults(false);
      }
    } catch (commonError) {
      console.error('Критическая ошибка в analyzeDialogsAndSaveResults:', commonError);
      toast({ 
        title: `Произошла ошибка: ${commonError instanceof Error ? commonError.message : 'Неизвестная ошибка'}`,
        variant: "destructive" 
      });
      
      setCalculatingResults(false);
    } finally {
      // Удаляем сессию из списка активных
      if (sessionId && typeof activeAnalysisSessions !== 'undefined') {
        activeAnalysisSessions.delete(sessionId);
        console.log(`Анализ для сессии ${sessionId} завершен. Осталось активных анализов: ${activeAnalysisSessions.size}`);
      }
    }
  };

  // Функция для отправки сообщения пользователем
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    // Получаем ID текущей тестовой сессии из sessionStorage
    let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
    
    // Проверяем существование тестовой сессии
    if (!currentTestSessionId) {
      console.error(t('sessionNotFound'));
      toast({
        title: t('sessionNotFound'),
        variant: "destructive"
      });
      return;
    }
    
    // Создаем новое сообщение пользователя
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'You',
      content: message,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
      isOwn: true,
      isRead: true
    };
    
    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: [...prev[selectedUser], newMessage]
    }));
    
    setMessage('');
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));
    
    // Определяем номер чата на основе выбранного пользователя
    const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
    if (chatNumber < 1 || chatNumber > 4) {
      console.error(`Invalid chat number: ${chatNumber}`);
      setLoadingStates(prev => ({ ...prev, [selectedUser]: false }));
      return;
    }
    
    try {
      // Обновляем статус, что пользователь печатает
      try {
        await chatService.updateStatus(
          currentTestSessionId,
          chatNumber,
          { isTyping: true }
        );
      } catch (statusError) {
        console.warn('Не удалось обновить статус чата:', statusError);
      }
      
      // Проверяем, есть ли уже начатый разговор с этим пользователем в Grok
      const existingConversation = userConversations[selectedUser];
      console.log('Существующие детали разговора:', existingConversation);
      
      // Определяем, какие сообщения отправлять на API
      // Для продолжения существующего разговора отправляем только текущее сообщение
      const messagesToSend = existingConversation?.conversationId && existingConversation?.parentResponseId 
        ? [newMessage.content]
        : chatHistories[selectedUser]
            .filter(msg => msg.isOwn || (msg.sender === selectedUser && !msg.error))
            .map(msg => msg.content)
            .slice(-10); // Ограничиваем количество сообщений для модели
      
      // Проверяем, есть ли хотя бы одно сообщение от пользователя
      let hasUserMessage = messagesToSend.length > 0;
      
      if (!hasUserMessage) {
        // Если нет сообщений от пользователя, добавляем текущее сообщение
        messagesToSend.push(newMessage.content);
      }
      
      console.log('Отправляемые сообщения:', messagesToSend);
      
      // Отправляем сообщение через API
      const chatResponse = await chatService.sendMessage(
        currentTestSessionId,
        newMessage.content,
        '',
        chatNumber,
        existingConversation && existingConversation.conversationId && existingConversation.parentResponseId
          ? {
              conversationId: existingConversation.conversationId,
              parentResponseId: existingConversation.parentResponseId
            } 
          : undefined
      );
      
      if (chatResponse.error) {
        throw new Error(chatResponse.error);
      }
      
      console.log('Chat response:', chatResponse);
      
      const { botResponse } = chatResponse;
      
      if (botResponse && botResponse.error) {
        throw new Error(botResponse.error);
      }

      if (botResponse && botResponse.response) {
        await simulateTypingDelay(selectedUser);
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: botResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));
        
        // Сохраняем информацию о разговоре для будущих сообщений
        if (botResponse.conversation_id && botResponse.parent_response_id) {
          console.log('Обновление деталей разговора:', {
            conversationId: botResponse.conversation_id,
            parentResponseId: botResponse.parent_response_id
          });
          
          setUserConversations(prev => ({
            ...prev,
            [selectedUser]: {
              conversationId: botResponse.conversation_id,
              parentResponseId: botResponse.parent_response_id,
              chatLink: botResponse.chat_link
            }
          }));
        }
      }
      
      // Обновляем статус пользователя
      setUserStatus(prev => ({
        ...prev,
        [selectedUser]: {
          ...prev[selectedUser],
          isTyping: false,
          lastMessageId: `assistant-${Date.now()}`
        }
      }));
      
      // Обновляем статус через API
      try {
        await chatService.updateStatus(
          currentTestSessionId,
          chatNumber,
          { isTyping: false }
        );
      } catch (statusError) {
        console.warn('Не удалось обновить статус чата:', statusError);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: selectedUser,
        content: 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        isOwn: false,
        isRead: false,
        error: true,
        errorDetails: error instanceof Error ? error.message : String(error)
      };

      setChatHistories(prev => ({
        ...prev,
        [selectedUser]: [...prev[selectedUser], errorMessage]
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [selectedUser]: false }));
    }
  };

  // Функция для повторной отправки сообщения в случае ошибки
  const handleRetry = (msg: Message) => {
    if (!msg.error) return;
    
    // Находим сообщение перед сообщением об ошибке
    const messageIndex = chatHistories[selectedUser].findIndex(m => m.id === msg.id);
    if (messageIndex <= 0) return;
    
    const prevMessage = chatHistories[selectedUser][messageIndex - 1];
    if (!prevMessage.isOwn) return;
    
    // Удаляем сообщение об ошибке из истории
    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: prev[selectedUser].filter(m => m.id !== msg.id)
    }));
    
    // Устанавливаем сообщение для повторной отправки
    setRetryingMessage(prevMessage);
    
    // Если сообщение содержит изображение, восстанавливаем его
    if (prevMessage.imageUrl) {
      setSelectedImage(prevMessage.imageUrl);
      setSelectedPrice(prevMessage.price || 'FREE');
      setMessage('');
    } else {
      setMessage(prevMessage.content);
      setSelectedImage(null);
      setSelectedPrice('FREE');
    }
  };

  // Обработчик для загрузки файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    
    // Здесь должна быть логика загрузки файла
    // Для упрощения, заглушка, которая создает локальный URL
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage: CustomImage = {
            id: `custom-${Date.now()}`,
            url: event.target.result as string,
            thumbnail: event.target.result as string,
            description: file.name,
            prompt: 'Пользовательское изображение'
          };
          
          setCustomImages(prev => [...prev, newImage]);
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  // Обработчик для клика по кнопке загрузки
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Обработчик для удаления пользовательского изображения
  const handleDeleteCustomImage = (imageId: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Безопасное перенаправление, работающее как с react-router, так и с Next.js
  const safeNavigate = (path: string) => {
    if (!isMounted) return;
    
    navigate(path);
  };

  // Если компонент не смонтирован, показываем заглушку
  if (!isMounted) {
    return <div className="flex min-h-screen items-center justify-center">
      <p>Загрузка чата...</p>
    </div>;
  }

  // Функция для завершения теста и перехода к результатам
  const finishTest = () => {
    console.log("Finishing test and navigating to completion page");
    navigate(`/test-completed?lang=${locale}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-gray-200 relative">
      {/* Окно поздравления */}
      {showCongratulations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d2d2d] rounded-xl border border-pink-500/20 p-8 max-w-md w-full shadow-2xl transform animate-scale-in-center relative">
            {/* Добавляем кнопку закрытия в правом верхнем углу */}
            <button 
              onClick={handleCloseResults}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
                {t('congratulations')}
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                {t('testCompletedSuccessfully')}
              </p>
              
              {calculatingResults ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                  <p className="text-gray-400">{t('calculatingResults')}</p>
                  <p className="text-gray-400 text-sm mt-2">{t('itWillTakeSeconds')}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                  <p className="text-gray-400">{t('redirecting')}</p>
                  <p className="text-gray-400 text-sm mt-2">{t('pleaseWait')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <nav className="bg-[#2d2d2d] border-b border-[#3d3d3d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Удален значок меню (гармошки) */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            FanChat AI
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-[#1a1a1a] px-4 py-2 rounded-full border border-[#3d3d3d]">
            <Timer className="w-5 h-5 text-pink-500 mr-2" />
            <span className={`font-mono font-bold ${timeRemaining <= 300 ? 'text-red-500' : 'text-gray-100'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-80 bg-[#2d2d2d] border-r border-[#3d3d3d] p-4">
          {/* Удаляю поле поиска чатов */}
          <div className="space-y-4">
            {users.map((user) => {
              const lastMessage = chatHistories[user.name]?.slice(-1)[0];
              const isTyping = userStatus[user.name]?.isTyping;
              const unreadCount = userStatus[user.name]?.unreadCount || 0;

              return (
                <div
                  key={user.name}
                  onClick={() => handleUserSelect(user.name)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedUser === user.name ? 'bg-[#3d3d3d]' : 'hover:bg-[#3d3d3d]'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                      {user.name[0]}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{user.name}</h3>
                    <div className="text-sm text-gray-400 truncate">
                      {isTyping ? (
                        <span className="text-pink-500">печатает...</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {lastMessage?.isOwn && <span>Вы: </span>}
                          <span className="truncate">{lastMessage?.content}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400">{lastMessage?.time}</span>
                    {user.status === 'Online' && (
                      <span className="w-2 h-2 mt-1 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[#3d3d3d] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                {selectedUser[0]}
              </div>
              <div>
                <h2 className="font-semibold">{selectedUser}</h2>
              </div>
            </div>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatHistories[selectedUser].map((msg) => {
              const imagePrompt = msg.content.match(/\[Photo \d+\] \[(.*?)\]/)?.[1];
              const priceMatch = msg.content.match(/\[Price: (.*?)\]/);
              const price = msg.price || (priceMatch ? priceMatch[1] : null);
              
              // Очищаем текст от тегов [Купил] и [Не купил] непосредственно при рендеринге
              let displayContent = msg.content;
              if (!msg.isOwn && !msg.isTyping) {
                // Только для сообщений от бота, убираем все теги
                displayContent = displayContent
                  .replace(/\[\s*Bought\s*\]/gi, '')  // Более точное удаление тега [Bought]
                  .replace(/\[\s*Not\s*Bought\s*\]/gi, '')  // Более точное удаление тега [Not Bought]
                  .replace(/\[[^\]]*\]/g, '')  // Удаляем все оставшиеся теги в формате [текст]
                  .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на один
                  .trim();
                
                // Проверяем наличие тегов [Bought] для обновления статуса фото
                if (msg.content.includes('[Bought]')) {
                  // Находим последнее фото от пользователя
                  const chatIndex = chatHistories[selectedUser].indexOf(msg);
                  if (chatIndex > 0) {
                    for (let i = chatIndex - 1; i >= 0; i--) {
                      const photoMsg = chatHistories[selectedUser][i];
                      if (photoMsg.isOwn && (photoMsg.imageUrl || photoMsg.content.includes('[Photo'))) {
                        // Если найдено фото и оно имеет цену, обновляем статус
                        if (photoMsg.price && photoMsg.price !== 'FREE' && !photoMsg.bought) {
                          // Используем setTimeout, чтобы обновить состояние после рендеринга
                          setTimeout(() => {
                            setChatHistories(prev => {
                              const newHistory = [...prev[selectedUser]];
                              newHistory[i] = {
                                ...photoMsg,
                                bought: true // Добавляем флаг, что фото куплено
                              };
                              console.log('Обновлен статус фото на "купленное":', newHistory[i]);
                              return {
                                ...prev,
                                [selectedUser]: newHistory
                              };
                            });
                          }, 0);
                        }
                        break;
                      }
                    }
                  }
                }
              }
              
              return (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                onClick={() => msg.error && handleRetry(msg)}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-3 ${
                    msg.isOwn
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                      : msg.error
                      ? 'bg-red-500/20 border border-red-500/40 cursor-pointer hover:bg-red-500/30'
                      : msg.isTyping
                      ? 'bg-[#2d2d2d] border border-[#3d3d3d]'
                      : 'bg-[#3d3d3d]'
                  }`}
                >
                  {msg.error && (
                    <div className="space-y-2 mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-400">Ошибка отправки</span>
                      </div>
                      {msg.errorDetails && (
                        <div className="flex items-start gap-2 bg-red-500/10 p-2 rounded">
                          <Info className="w-4 h-4 text-red-400 mt-0.5" />
                          <p className="text-xs text-red-400">{msg.errorDetails}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  ) : (
                    <>
                        <p>{imagePrompt ? '' : displayContent}</p>
                        {(msg.imageUrl || imagePrompt) && (
                          <div className="mt-1 rounded-md overflow-hidden">
                            <div className="relative">
                              <img 
                                src={msg.imageUrl || `/foto/${msg.content.match(/\[Photo (\d+)\]/)?.[1]}.jpg`} 
                                alt="Отправленное изображение" 
                                className="max-w-[300px] max-h-[300px] object-contain bg-black rounded-md border border-[#3d3d3d]"
                              />
                            </div>
                            {/* Отображаем комментарий к фото, если он есть */}
                            {msg.imageComment && (
                              <div className="mt-1 text-sm text-white bg-transparent p-1 rounded-b-md">
                                {msg.imageComment}
                              </div>
                            )}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-1">
                          {price && price !== 'FREE' && (
                            <>
                              <span className="text-xs text-white font-bold flex items-center gap-1">
                                ${price} • {msg.purchased ? 'paid' : 'not paid'}
                                {msg.purchased ? (
                                  <CheckCheck className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Check className="w-3 h-3 text-gray-400" />
                                )}
                              </span>
                            </>
                          )}
                        <p className="text-xs text-gray-300">{msg.time}</p>
                        {msg.isOwn && (
                          msg.isRead ? (
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Check className="w-4 h-4 text-gray-500" />
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {/* Модальное окно для установки цены */}
          {showPriceModal && tempSelectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#2d2d2d] p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">{t('selectPhotoPrice')}</h3>
                
                <div className="mb-6">
                  <img 
                    src={tempSelectedImage} 
                    alt={t('photo')} 
                    className="w-full h-64 object-contain bg-black rounded-md mb-4" 
                  />
                  
                  <div className="space-y-4">
                    <div>
                      {/* Удаляем надпись Photo Price */}
                      {/* <label className="block text-sm font-medium text-gray-400 mb-1">
                        Photo Price
                      </label> */}
                      {/* Удаляем блок с кнопками предопределенных цен
                      <div className="flex flex-wrap gap-2">
                        {['FREE', '3.99', '7.99', '9.99', '14.99', '19.99'].map(price => (
                          <button
                            key={price}
                            onClick={() => setSelectedPrice(price)}
                            className={`px-3 py-1.5 rounded text-sm ${
                              selectedPrice === price
                                ? 'bg-pink-500 text-white'
                                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#3d3d3d]'
                            }`}
                          >
                            {price}
                          </button>
                        ))}
                      </div>
                      */}

                      {/* Поле для ручного ввода цены */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          {t('photoPrice')}
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            placeholder={t('price')}
                            value={selectedPrice}
                            disabled={timeRemaining <= 0 || loadingStates[selectedUser]}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const rawValue = e.target.value;
                                // 1. Немедленно заменяем запятую на точку
                                const processedValue = rawValue.replace(',', '.');

                                const currentValueInState = selectedPrice;

                                // 2. Обрабатываем полное стирание поля
                                if (processedValue === '') {
                                    setSelectedPrice(''); // Разрешаем пустую строку во время ввода
                                    return;
                                }

                                // 3. Обрабатываем ввод, когда текущее состояние = 'FREE'
                                if (currentValueInState === t('free')) {
                                    if (/^[0-9]$/.test(processedValue)) {
                                        setSelectedPrice(processedValue); // Начинаем с цифры
                                    } else if (processedValue === '.') {
                                        setSelectedPrice('0.'); // Начинаем с точки
                                    }
                                    // Игнорируем другие символы при старте с 'FREE'
                                    return;
                                }

                                // 4. Валидация ввода (после обработки 'FREE' и стирания)
                                // Разрешаем: цифры, опционально точка, опционально 0-2 цифры после точки
                                // Также разрешаем промежуточный ввод типа "12."
                                const pattern = /^(0|[1-9][0-9]*)(\.(|([0-9]{0,2})))?$/;
                                const endsWithDotPattern = /^(0|[1-9][0-9]*)\.$/;

                                // Обновляем состояние, только если ОБРАБОТАННОЕ значение соответствует паттернам
                                if (pattern.test(processedValue) || endsWithDotPattern.test(processedValue)) {
                                    setSelectedPrice(processedValue);
                                }
                                // Если processedValue не соответствует (например, буквы), ввод игнорируется,
                                // и selectedPrice остается прежним (React должен обновить input).
                            }}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                let value = e.target.value.trim().replace(',', '.'); // Убираем пробелы, заменяем запятую

                                // Если пусто или осталось FREE - ставим FREE
                                if (value === t('free') || value === '') {
                                    setSelectedPrice(t('free'));
                                    return;
                                }

                                // Обрабатываем случаи вроде '.', '0.', '12.'
                                if (value === '.' || value.endsWith('.')) {
                                    value = value.substring(0, value.length - 1); // Убираем точку в конце
                                    // Если остался 0 или пусто после удаления точки
                                    if (value === '' || parseFloat(value) <= 0) { 
                                        setSelectedPrice(t('free'));
                                        return;
                                    }
                                    // Иначе обрабатываем число перед точкой ниже
                                }

                                const numValue = parseFloat(value);

                                if (isNaN(numValue)) {
                                    setSelectedPrice(t('free')); // Невалидное число
                                } else if (numValue < 0.01) {
                                    setSelectedPrice(t('free')); // Меньше минимума (0 тоже сюда попадает)
                                } else {
                                    setSelectedPrice(numValue.toFixed(2)); // Форматируем валидное число
                                }
                            }}
                            // Стили для скрытия стрелок
                            className={`w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-md px-3 py-2 ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'text-gray-500 cursor-not-allowed' : 'text-white'} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          />
                          <span className="ml-2 text-white">$</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        {t('photoComment')}
                      </label>
                      <textarea 
                        value={imageComment} 
                        onChange={(e) => setImageComment(e.target.value)}
                        placeholder={t('addPhotoComment')}
                        disabled={timeRemaining <= 0 || loadingStates[selectedUser]}
                        className={`w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-md px-3 py-2 ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'text-gray-500 cursor-not-allowed' : 'text-white'} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none overflow-y-auto`}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={cancelImageSelection}
                    className={`px-4 py-2 ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#3d3d3d] hover:bg-[#4d4d4d]'} text-white rounded-md`}
                    disabled={timeRemaining <= 0 || loadingStates[selectedUser]}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      if (timeRemaining <= 0 || loadingStates[selectedUser]) return;
                      confirmImageSelection();
                      setShowPriceModal(false); // Дополнительно закрываем окно после вызова функции
                    }} 
                    className={`px-4 py-2 ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'} text-white font-semibold rounded-md`}
                    disabled={timeRemaining <= 0 || loadingStates[selectedUser]}
                  >
                    {t('confirm')}
                  </button>
                </div>
                
                {(timeRemaining <= 0 || loadingStates[selectedUser]) && (
                  <div className="mt-4 text-yellow-500 text-sm text-center">
                    {timeRemaining <= 0 ? (
                      locale === 'ru' ? 'Время истекло. Отправка фото невозможна.' : 'Time expired. Photo sending is disabled.'
                    ) : (
                      locale === 'ru' ? 'Отправляется сообщение. Пожалуйста, подождите.' : 'Sending message. Please wait.'
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Image preview - удаляем поле для ввода цены, так как теперь используем модальное окно */}
          {selectedImage && (
            <div className="p-2 border-t border-[#3d3d3d] bg-[#2d2d2d]">
              <div className="flex items-center gap-3">
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt={t('photo')} 
                  className="h-20 max-w-[150px] object-contain bg-black rounded-md border border-[#3d3d3d]" 
                />
                <button 
                  onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                >
                    <X className="w-3 h-3" />
                </button>
                </div>
                
                {/* Отображаем выбранную цену и комментарий рядом с превью */}
                <div className="flex-1">
                  <div className="flex flex-col space-y-1">
                    <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold inline-block w-fit">
                      {selectedPrice}
                    </span>
                    {selectedImageComment && (
                      <span className="text-xs text-gray-300 line-clamp-2">
                        {selectedImageComment}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Галерея изображений */}
          {showImageGallery && (
            <div className="fixed bottom-20 left-80 right-4 z-50 bg-[#222222] border border-[#3d3d3d] p-4 rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-white text-lg font-medium mb-2">{t('readyPhotos')}</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {preloadedImages.map((image) => (
                      <div 
                        key={image.id}
                        onClick={() => timeRemaining > 0 && !loadingStates[selectedUser] ? selectImage(image.url) : null}
                        className={`relative group ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <img 
                          src={image.thumbnail} 
                          alt={image.description} 
                          className={`w-full h-24 object-contain bg-black rounded-lg border border-[#3d3d3d] transition-all duration-200 ${timeRemaining > 0 && !loadingStates[selectedUser] ? 'group-hover:border-pink-500' : ''}`}
                        />
                        <div className={`absolute inset-0 bg-black bg-opacity-0 ${timeRemaining > 0 && !loadingStates[selectedUser] ? 'group-hover:bg-opacity-30' : ''} transition-all duration-200 flex items-center justify-center rounded-lg`}>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ImagePlus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              console.log('Form submitted');
              // Блокируем отправку, если время истекло
              if (timeRemaining <= 0) {
                e.preventDefault();
                return;
              }
              
              if (selectedImage) {
                // Если есть выбранная фотография, используем sendPhotoMessage
                e.preventDefault();
                
                // Получаем ID текущей тестовой сессии из sessionStorage
                let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
                if (currentTestSessionId) {
                  const photoMsg = {
                    id: `user-${Date.now()}`,
                    sender: t('you'),
                    content: '',
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                    isOwn: true,
                    isRead: true,
                    imageUrl: selectedImage,
                    price: selectedPrice,
                    imageComment: selectedImageComment
                  };
                  
                  sendPhotoMessage(photoMsg, currentTestSessionId);
                  
                  // Очищаем выбранное изображение после отправки
                  setSelectedImage(null);
                  setSelectedImageComment('');
                  setSelectedPrice(t('free'));
                }
              } else {
                // Обычное текстовое сообщение
                handleSendMessage(e);
              }
            }} 
            className="p-4 border-t border-[#3d3d3d]"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-[#2d2d2d] rounded-full flex items-center">
                {selectedImage && (
                  <div className="relative flex items-center ml-2">
                    <img 
                      src={selectedImage} 
                      alt={t('photo')}
                      className="w-8 h-8 object-contain bg-black rounded-md mr-2"
                    />
                    <button 
                      type="button" 
                      onClick={handleRemoveImage}
                      className={`absolute -top-1 -right-1 ${timeRemaining <= 0 ? 'bg-gray-600' : 'bg-gray-800'} rounded-full p-0.5 text-xs text-white`}
                      disabled={timeRemaining <= 0}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedImage ? t('addPhotoComment') : t('enterMessage')}
                  className={`flex-1 bg-transparent px-4 py-2 focus:outline-none ${timeRemaining <= 0 ? 'text-gray-500 cursor-not-allowed' : ''}`}
                  disabled={loadingStates[selectedUser] || timeRemaining <= 0}
                />
                <div className="flex items-center space-x-2 px-3">
                  <Image 
                    className={`w-5 h-5 ${timeRemaining <= 0 || loadingStates[selectedUser] ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-pointer hover:text-pink-500'} transition-colors`} 
                    onClick={(e) => {
                      if (timeRemaining <= 0 || loadingStates[selectedUser]) return; // Блокируем действие при истекшем таймере или загрузке
                      console.log('Клик по кнопке изображения');
                      toggleImageGallery();
                    }}
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!message.trim() || loadingStates[selectedUser] || timeRemaining <= 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
                  !message.trim() || loadingStates[selectedUser] || timeRemaining <= 0
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'
                }`}
              >
                <Send className={`w-5 h-5 ${timeRemaining <= 0 ? 'text-gray-400' : 'text-white'}`} />
              </button>
            </div>
            {timeRemaining <= 0 && (
              <div className="mt-2 text-yellow-500 text-sm text-center">
                {locale === 'ru' ? 'Время истекло. Отправка сообщений невозможна.' : 'Time expired. Message sending is disabled.'}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Модальное окно для просмотра промпта */}
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        userName={selectedUser}
        promptText={userPrompts[selectedUser]}
      />
    </div>
  );
}

export default Chat;