import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { MessageCircle, Send, Menu, Bell, Settings, Search, Heart, Image, AtSign, DollarSign, Timer, Bot, AlertCircle, Info, Check, CheckCheck, X, ImagePlus, Upload, Trash2, ExternalLink, Eye, Loader, LogOut } from 'lucide-react';
import { useNavigation, useParams } from '../../app/components/SimpleNavigation';
import { userPrompts, getPromptSummary } from '../data/userPrompts';
import PromptModal from './PromptModal';
import type { DialogAnalysisResult, ChatMessage as SupabaseChatMessage } from '../lib/supabase';
// Импортируем сервисы для API
import { chatService, testSessionService, testResultService, grokService } from '../services/api';

// Типы для использования в Chat компоненте
type MessageRoleInternal = 'user' | 'assistant' | 'system';

// Интерфейс для сообщений API Grok
interface GrokMessage {
  role: MessageRoleInternal;
  content: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  isTyping?: boolean;
  isRead?: boolean;
  error?: boolean;
  errorDetails?: string;
  imageUrl?: string;
  price?: string; // Добавляем поле для цены
  bought?: boolean; // Добавляем поле для статуса покупки фото
  pending?: boolean; // Добавляем поле для статуса "в ожидании"
  purchased?: boolean; // Добавляем поле для статуса "куплено"
  imageComment?: string; // Добавляем поле для комментария к фото
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

// Pre-loaded images for the chat
const preloadedImages = [
  {
    id: 'img1',
    url: '/foto/1 (2).jpg',
    thumbnail: '/foto/1 (2).jpg',
    description: 'Фото 1',
    prompt: 'Сексуальная блондинка в цветочном платье с обнаженным плечом позирует, закрывая рот пальцем, создавая соблазнительный и игривый образ.(фото для знакомства)'
  },
  {
    id: 'img2',
    url: '/foto/2.jpg',
    thumbnail: '/foto/2.jpg',
    description: 'Фото 2',
    prompt: 'Блондинка в обтягивающем цветочном платье с открытым плечом соблазнительно позирует, подчеркивая свои изгибы.(фото для знакомства)'
  },
  {
    id: 'img3',
    url: '/foto/3.jpg',
    thumbnail: '/foto/3.jpg',
    description: 'Фото 3',
    prompt: 'Блондинка в коротком цветочном платье соблазнительно сидит, закинув ногу на ногу, демонстрируя свои стройные ножки.(фото для знакомства)'
  },
  {
    id: 'img4',
    url: '/foto/4.jpg',
    thumbnail: '/foto/4.jpg',
    description: 'Фото 4',
    prompt: 'Блондинка в коротком цветочном платье с открытым плечом сидит на полу, демонстрируя свои стройные ножки и соблазнительную улыбку.(фото для знакомства)'
  },
  {
    id: 'img5',
    url: '/foto/5.jpg',
    thumbnail: '/foto/5.jpg',
    description: 'Фото 5',
    prompt: 'Молодая женщина в лёгком цветочном платье расслабленно сидит в кресле, с изящно вытянутыми ногами и стаканом в руке, глядя в камеру с мягкой, томной улыбкой.(фото для знакомства)'
  },
  {
    id: 'img6',
    url: '/foto/6.jpg',
    thumbnail: '/foto/6.jpg',
    description: 'Фото 6',
    prompt: 'Молодая женщина в лёгком цветочном платье расслабленно сидит в кресле, с изящно вытянутыми ногами и стаканом в руке, глядя в камеру с мягкой, томной улыбкой в тёплой, интимной атмосфере. Показывает в камеру свой язык.(фото для знакомства)'
  },
  {
    id: 'img7',
    url: '/foto/7.jpg',
    thumbnail: '/foto/7.jpg',
    description: 'Фото 7',
    prompt: 'Женщина в коротком платье с открытыми плечами и розовым цветочным узором стоит на коленях на мягком голубом ковре. Она немного наклонена вперёд, её босые ноги скрещены в щиколотках и хорошо видны, на лице лёгкая улыбка.(фото для прогрева)'
  },
  {
    id: 'img8',
    url: '/foto/8.jpg',
    thumbnail: '/foto/8.jpg',
    description: 'Фото 8',
    prompt: 'Молодая женщина в платье с открытыми плечами и розово-белым цветочным узором стоит на коленях на мягком голубом ковре. Она слегка наклоняется к камере, игриво высовывая язык.(фото для прогрева)'
  },
  {
    id: 'img9',
    url: '/foto/9.jpg',
    thumbnail: '/foto/9.jpg',
    description: 'Фото 9',
    prompt: 'Молодая женщина в белом платье с открытыми плечами и стоит на коленях на мягком голубом ковре в уютной спальне. Она игриво приподнимает край платья, приоткрывая бедро.(фото для прогрева)'
  },
  {
    id: 'img10',
    url: '/foto/10.jpg',
    thumbnail: '/foto/10.jpg',
    description: 'Фото 10',
    prompt: 'Улыбающаяся молодая женщина в белом платье с открытыми плечами. Она стоит на одном колене на мягком голубом ковре, вторая нога согнута, обнажая гладкую кожу.(фото для прогрева)'
  },
  {
    id: 'img11',
    url: '/foto/11.jpg',
    thumbnail: '/foto/11.jpg',
    description: 'Фото 11',
    prompt: 'Молодая женщина в белом платье стоит на коленях на мягком голубом ковре припдняв юбку и показавая задницу в обтягивающих трусиках(фото для прогрева)'
  },
  {
    id: 'img12',
    url: '/foto/12.jpg',
    thumbnail: '/foto/12.jpg',
    description: 'Фото 12',
    prompt: 'Молодая женщина в белом платье стоит на коленях на мягком голубом ковре припдняв юбку,выгнув обнаженное бедро и показавая задницу в обтягивающих трусиках(фото для прогрева)'
  },
  {
    id: 'img13',
    url: '/foto/13.jpg',
    thumbnail: '/foto/13.jpg',
    description: 'Фото 13',
    prompt: 'Молодая женщина в белом платье сидит на мягком голубом ковре раздвинув ноги и показывает свои трусики(фото для прогрева)'
  },
  {
    id: 'img14',
    url: '/foto/14.jpg',
    thumbnail: '/foto/14.jpg',
    description: 'Фото 14',
    prompt: 'Молодая женщина в белом платье сидит на мягком голубом ковре раздвинув ноги и показывает свои трусики прикрывая трусики рукой(фото для прогрева)'
  },
  {
    id: 'img15',
    url: '/foto/15.jpg',
    thumbnail: '/foto/15.jpg',
    description: 'Фото 15',
    prompt: 'Молодая женщина в белом платье стоит спиной к камере и задирает юбку(фото для прогрева)'
  },
  {
    id: 'img16',
    url: '/foto/16.jpg',
    thumbnail: '/foto/16.jpg',
    description: 'Фото 16',
    prompt: 'Молодая женщина в белых трусиках сидит на голубом ковре и показывает обнаженную грудь(фото для продажи)'
  },
  {
    id: 'img17',
    url: '/foto/17.jpg',
    thumbnail: '/foto/17.jpg',
    description: 'Фото 17',
    prompt: 'Молодая женщина в белых трусиках лежит на кровати и полубоком показывает свою грудь(фото для продажи)'
  },
  {
    id: 'img18',
    url: '/foto/18.jpg',
    thumbnail: '/foto/18.jpg',
    description: 'Фото 18',
    prompt: 'Молодая женщина в белых трусиках лежит на кровати держа себя за бедра и показывает свои дырки(фото для продажи)'
  },
  {
    id: 'img19',
    url: '/foto/19.jpg',
    thumbnail: '/foto/19.jpg',
    description: 'Фото 19',
    prompt: 'Молодая женщина в белых трусиках лежит на кровати и руками раздвигает свои половые губы,грудь обнажена(фото для продажи)'
  },
  {
    id: 'img20',
    url: '/foto/20.jpg',
    thumbnail: '/foto/20.jpg',
    description: 'Фото 20',
    prompt: 'Голая молодая женщина показываетсвои половые губы крупным планом(фото для продажи)'
  },
  {
    id: 'img21',
    url: '/foto/21.jpg',
    thumbnail: '/foto/21.jpg',
    description: 'Фото 21',
    prompt: 'молодая женщина показываетсвои половые губы крупным планом засунув в них пальцы(фото для продажи)'
  },
  {
    id: 'img22',
    url: '/foto/22.jpg',
    thumbnail: '/foto/22.jpg',
    description: 'Фото 22',
    prompt: 'Голая молодая женщина стоит раком и показывает все свои дырки(фото для продажи)'
  },
  {
    id: 'img23',
    url: '/foto/23.jpg',
    thumbnail: '/foto/23.jpg',
    description: 'Фото 23',
    prompt: 'Голая молодая женщина стоя показывает свою обнаженную грудь крупным планом(фото для продажи)'
  },
  {
    id: 'img24',
    url: '/foto/24.jpg',
    thumbnail: '/foto/24.jpg',
    description: 'Фото 24',
    prompt: 'Молодая женщина вголая лежит на кровати и полубоком показывает свои дырки крупным планом(фото для продажи)'
  }
].sort(() => Math.random() - 0.5); // Перемешиваем массив в случайном порядке

// Функция для генерации UUID v4
function generateUUID() {
  // Шаблон для формирования UUID v4
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  console.log('Generated UUID:', uuid);
  return uuid;
}

function Chat() {
  const { navigate } = useNavigation();
  const params = useParams();
  
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('Marcus');
  const [timeRemaining, setTimeRemaining] = useState(1200); // Изменено с 300 секунд (5 минут) на 1200 секунд (20 минут)
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null>(null);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string>('FREE');
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
    { name: 'Marcus', status: 'Online', lastMessage: 'Страстный клиент' },
    { name: 'Shrek', status: 'Online', lastMessage: 'Капризный клиент' },
    { name: 'Oliver', status: 'Away', lastMessage: 'Торгуется о цене' },
    { name: 'Alex', status: 'Online', lastMessage: 'Проверяет границы' },
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
  
  // Устанавливаем флаг монтирования компонента
  useEffect(() => {
    setIsMounted(true);
    
    // Получение параметров URL
    if (typeof window !== 'undefined') {
      try {
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

  // Создаем новую сессию тестирования при загрузке компонента
  useEffect(() => {
    if (!isMounted) return;
    
    let isInitializing = false;
    
    const initTestSession = async () => {
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        console.log('🔄 Starting test session initialization');
        
        // Проверяем наличие ID сессии в URL
        if (sessionId) {
          console.log('🔍 Found sessionId in URL:', sessionId);
          try {
            // Проверяем, существует ли сессия с таким ID
            const session = await testSessionService.getById(sessionId);
            
            if (session && !session.completed) {
              console.log('✅ Using session from URL parameter:', sessionId);
              setTestSessionId(sessionId);
              sessionStorage.setItem('currentTestSessionId', sessionId);
              
              // Проверяем, существуют ли чаты для этой сессии
              const sessionChats = await chatService.getMessages(sessionId);
              
              if (sessionChats && sessionChats.length > 0) {
                console.log('📋 Session has', sessionChats.length, 'chats');
                isInitializing = false;
                return;
              } else {
                console.warn('⚠️ Session from URL has no chats, will proceed to create new session');
              }
            } else if (session && session.completed) {
              console.warn('⚠️ Session from URL is already completed:', sessionId);
              // Если сессия завершена, перенаправляем на результаты
              navigate(`/test-results/${sessionId}`);
              return;
            } else {
              console.warn('⚠️ Session from URL not found:', sessionId);
            }
          } catch (error) {
            console.error('❌ Error checking session from URL:', error);
          }
        }
        
        // Если URL не содержит sessionId или сессия не найдена, проверяем sessionStorage
        const existingSessionId = sessionStorage.getItem('currentTestSessionId');
        
        if (existingSessionId) {
          console.log('🔍 Found existing session ID in storage:', existingSessionId);
          // Проверяем, существуют ли чаты для этой сессии
          try {
            const existingChats = await chatService.getMessages(existingSessionId);
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
                const session = await testSessionService.getById(existingSessionId);
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
                  } else {
                  // Если сессия и чаты существуют и принадлежат текущему соискателю, используем их
                  setTestSessionId(existingSessionId);
                    console.log('✅ Using existing test session:', existingSessionId, 'for candidate:', candidateId);
                  isInitializing = false;
                  return;
                  }
                } else {
                  console.log('⚠️ Session belongs to a different candidate, creating new one');
                  sessionStorage.removeItem('currentTestSessionId');
                }
              } catch (sessionError) {
                console.error('❌ Error checking session ownership:', sessionError);
                sessionStorage.removeItem('currentTestSessionId');
              }
            } else {
              console.log('⚠️ No chats found for existing session, will create new one');
              // Сессия существует, но чаты не найдены - удаляем ID сессии
              sessionStorage.removeItem('currentTestSessionId');
            }
          } catch (error) {
            console.error('❌ Error checking existing session:', error);
            // В случае ошибки удаляем ID сессии
            sessionStorage.removeItem('currentTestSessionId');
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
          setTestSessionId(session.id);
          sessionStorage.setItem('currentTestSessionId', session.id);
          console.log('✅ Test session created and saved to sessionStorage:', session.id);
          
          // Сбрасываем информацию о разговорах с Grok при создании новой сессии
          setUserConversations({});
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
    
    initTestSession();
    
    // Очистка при размонтировании компонента
    return () => {
      if (testSessionId) {
        const completeSession = async () => {
          try {
            console.log('⏰ Time expired, completing test session:', testSessionId);
            
            // Используем API для завершения сессии
            const result = await testSessionService.complete(testSessionId);
            console.log('✅ Test session completed on time expiration:', result);
            
            // Запускаем анализ диалогов через API
            if (!isSessionComplete) {
              console.log('📊 Starting analysis for session:', testSessionId);
              await analyzeDialogsAndSaveResults(testSessionId);
            } else {
              console.log('ℹ️ Session already analyzed, skipping analysis');
            }
            
            setCalculatingResults(false);
          } catch (error) {
            console.error('❌ Error completing test session:', error);
            setCalculatingResults(false);
          }
        };
        
        completeSession();
      }
    };
  }, [sessionId, isMounted]);
  
  // Обновляем текущую сессию при смене персонажа
  useEffect(() => {
    const updateCharacter = async () => {
      if (testSessionId) {
        try {
          console.log('Selected character:', selectedUser);
        } catch (error) {
          console.error('Error with character selection:', error);
        }
      }
    };
    
    updateCharacter();
  }, [selectedUser, testSessionId]);

  // Настраиваем таймер для автоматического окончания тестирования
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          
          // Проверяем, есть ли незавершенные ответы
          const hasTypingMessages = Object.values(userStatus).some(status => status.isTyping);
          
          if (hasTypingMessages) {
            // Если есть печатающие сообщения, ждем их завершения
            return 1; // Оставляем 1 секунду
          }
          
          // Показываем окно поздравления и запускаем расчет результатов
          setShowCongratulations(true);
          setCalculatingResults(true);
          setIsSessionComplete(true);
          
          // Завершаем тестовую сессию
          if (testSessionId) {
            const completeSession = async () => {
              try {
                await testSessionService.complete(testSessionId);
                console.log('Test session completed on time expiration');
                
                // Запускаем анализ диалогов и сохранение результатов только если это первое завершение
                if (!isSessionComplete) {
                await analyzeDialogsAndSaveResults(testSessionId);
                }
              } catch (error) {
                console.error('Error completing test session:', error);
                setCalculatingResults(false);
              }
            };
            
            completeSession();
          }
          
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, testSessionId, userStatus, isSessionComplete]);

  // Обновляем сессию после добавления каждого сообщения
  useEffect(() => {
    const updateMessageCount = async () => {
      if (testSessionId) {
        try {
          // Подсчитываем общее количество сообщений
          const totalMessages = Object.values(chatHistories).reduce(
            (total, messages) => total + messages.length, 
            0
          );
          
          console.log('Total messages in session:', totalMessages);
        } catch (error) {
          console.error('Error counting messages:', error);
        }
      }
    };
    
    updateMessageCount();
  }, [chatHistories, testSessionId]);

  // Добавляем эффект для отслеживания завершения последнего сообщения
  useEffect(() => {
    if (timeRemaining === 1) {
      const hasTypingMessages = Object.values(userStatus).some(status => status.isTyping);
      
      if (!hasTypingMessages) {
        setTimeRemaining(0);
        setShowCongratulations(true);
        setCalculatingResults(true);
        setIsSessionComplete(true);
        
        if (testSessionId) {
          const completeSession = async () => {
            try {
              await testSessionService.complete(testSessionId);
              console.log('Test session completed after last message');
              
              // Запускаем анализ диалогов и сохранение результатов только если это первое завершение
              if (!isSessionComplete) {
                await analyzeDialogsAndSaveResults(testSessionId);
              }
            } catch (error) {
              console.error('Error completing test session:', error);
              setCalculatingResults(false);
            }
          };
          
          completeSession();
        }
      }
    }
  }, [userStatus, timeRemaining, testSessionId, isSessionComplete]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
    setShowImageGallery(prev => !prev);
  };

  // Модифицируем функцию selectImage для открытия модального окна с ценой
  const selectImage = (imageUrl: string) => {
    setTempSelectedImage(imageUrl);
    setShowPriceModal(true);
    setSelectedPrice('FREE'); // Сбрасываем цену при каждом выборе изображения
    setImageComment(''); // Сбрасываем комментарий
    setShowImageGallery(false); // Закрываем галерею после выбора фото
  };

  // Функция для подтверждения выбора изображения и цены
  const confirmImageSelection = () => {
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
    setSelectedPrice('FREE');
    setImageComment(''); // Сбрасываем комментарий
    
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));

    const sendPhotoMessage = async () => {
      try {
        // Определяем номер чата на основе выбранного пользователя
        const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
        if (chatNumber < 1 || chatNumber > 4) {
          throw new Error('Invalid chat number');
        }

        // Формируем комментарий к фото, если он есть
        const commentInfo = imageComment ? ` [Comment: ${imageComment}]` : '';

        // Формируем содержимое сообщения с фото
        const photoMessageContent = `[Photo ${tempSelectedImage.match(/\/(\d+)\.jpg$/)?.[1] || ''}] [${preloadedImages.find(img => img.url === tempSelectedImage)?.prompt || 'User sent an image'}]${priceInfo}${commentInfo} [model sent photo]`;

        // Проверяем, есть ли уже начатый разговор с этим пользователем в Grok
        const existingConversation = userConversations[selectedUser];

        // Сохраняем сообщение пользователя в чат через API
        await chatService.sendMessage(
          currentTestSessionId,
          photoMessageContent,
          '', // employeeId пустой, так как мы используем sessionId
          chatNumber,
          existingConversation && existingConversation.conversationId && existingConversation.parentResponseId
            ? {
                conversationId: existingConversation.conversationId,
                parentResponseId: existingConversation.parentResponseId
              } 
            : undefined
        );
        
        // Создаем массив сообщений для отправки в Grok API
        let messagesToSend: { role: 'user' | 'assistant' | 'system', content: string }[] = [];
        
        // Если есть существующий разговор, отправляем только текущее сообщение
        if (existingConversation && existingConversation.conversationId && existingConversation.parentResponseId) {
          // Для продолжающегося чата отправляем только текущее сообщение
          messagesToSend = [{
            role: 'user',
            content: photoMessageContent
          }];
          console.log('Continuing existing conversation - sending only current message');
        } else {
          // Для нового чата отправляем системный промпт и текущее сообщение
          messagesToSend = [
            {
              role: 'system',
              content: userPrompts[selectedUser]
            },
            {
              role: 'user',
              content: photoMessageContent
            }
          ];
          console.log('Starting new conversation with system prompt and message');
        }
        
        // Вызываем Grok API
        const grokResponse = await grokService.generateResponse(
          messagesToSend,
          existingConversation && existingConversation.conversationId && existingConversation.parentResponseId
            ? {
                conversationId: existingConversation.conversationId,
                parentResponseId: existingConversation.parentResponseId
              }
            : undefined
        );

        // Сохраняем информацию о разговоре для будущих сообщений
        console.log('Updating conversation details after photo message:', {
          conversationId: grokResponse.conversation_id,
          parentResponseId: grokResponse.parent_response_id
        });

        setUserConversations(prev => ({
          ...prev,
          [selectedUser]: {
            conversationId: grokResponse.conversation_id,
            parentResponseId: grokResponse.parent_response_id,
            chatLink: grokResponse.chat_link
          }
        }));

        if (grokResponse.error) {
          const errorMessage = {
            id: `error-${Date.now()}`,
            sender: selectedUser,
            content: `Error: ${grokResponse.error}`,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            isOwn: false,
            isRead: false,
            error: true,
            errorDetails: grokResponse.error
          };

          setChatHistories(prev => ({
            ...prev,
            [selectedUser]: [...prev[selectedUser], errorMessage]
          }));
        } else {
          // Имитируем печатание ответа перед его отображением
          await simulateTypingDelay(selectedUser);
          
          // Проверяем, содержит ли ответ теги [Bought]/[Not Bought]
          const botResponse = grokResponse.response;
          const boughtTag = botResponse.includes('[Bought]');
          const notBoughtTag = botResponse.includes('[Not Bought]');
          
          // Очищаем ответ от тегов
          let cleanResponse = botResponse
            .replace(/\[\s*Bought\s*\]/gi, '')
            .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
            .replace(/\[[^\]]*\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Сохраняем ответ ассистента в чат через API
          await chatService.sendMessage(
            currentTestSessionId,
            cleanResponse,
            '', // employeeId пустой, так как мы используем sessionId
            chatNumber,
            {
              conversationId: grokResponse.conversation_id,
              parentResponseId: grokResponse.parent_response_id
            }
          );

          const assistantMessage = {
            id: `assistant-${Date.now()}`,
            sender: selectedUser,
            content: cleanResponse,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
            isOwn: false,
            isRead: false
          };

          setChatHistories(prev => ({
            ...prev,
            [selectedUser]: [...prev[selectedUser], assistantMessage]
          }));
          
          // Обрабатываем теги [Bought]/[Not Bought]
          if (boughtTag) {
            // Обновляем статус фото на "bought"
            const photoMsg = newMessage;
            setChatHistories(prev => {
              const newHistory = [...prev[selectedUser]];
              const photoIndex = newHistory.findIndex(msg => msg.id === photoMsg.id);
              
              if (photoIndex !== -1 && photoMsg.price && photoMsg.price !== 'FREE') {
                newHistory[photoIndex] = {
                  ...photoMsg,
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
        }

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
          console.warn('Failed to update chat status:', statusError);
          // Игнорируем ошибку, так как это не критичная функциональность
        }
      } catch (error) {
          console.error('Error in sending photo message:', error);
        
        const errorMessage = {
          id: `error-${Date.now()}`,
          sender: selectedUser,
            content: 'Error sending photo. Please try again.',
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

    // Запускаем асинхронную отправку фото
    sendPhotoMessage();
  };

  // Функция для отмены выбора изображения
  const cancelImageSelection = () => {
    setTempSelectedImage(null); // Очищаем временное изображение
    setSelectedPrice('FREE'); // Сбрасываем цену на FREE
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
      handleSendMessage(e);
    }
  };

  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    
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
    navigate(`/test-completed`);
  };

  // Отслеживание состояния анализа для каждой сессии
  const activeAnalysisSessions = new Set<string>();

  // Обработчик для анализа диалогов и сохранения результатов
  const analyzeDialogsAndSaveResults = async (sessionId: string) => {
    // Проверяем, не выполняется ли уже анализ для этой сессии
    if (activeAnalysisSessions.has(sessionId)) {
      console.log(`Analysis already in progress for session ${sessionId}, skipping duplicate request`);
      return;
    }

    // Добавляем сессию в список активных
    activeAnalysisSessions.add(sessionId);
    console.log(`Starting analysis for session ${sessionId}. Total active analyses: ${activeAnalysisSessions.size}`);

    try {
      console.log('Starting dialog analysis for session:', sessionId);
      
      // Используем API для анализа
      const result = await testResultService.analyze(sessionId, '');  // employeeId получаем на сервере
      
      // Если удалось получить результат анализа
      if (result && result.analysisResult) {
        // Сохраняем результат в состоянии
        setAnalysisResult(result.analysisResult);
        setAnalysisComplete(true);
        console.log('Analysis completed and results saved');
      } else {
        console.error('No valid analysis result found in response');
        
        // Создаем базовый результат анализа, чтобы избежать отображения ошибки
        const defaultResult: DialogAnalysisResult = {
          dialog_analysis: {
            metrics: {
              engagement: { score: 3.0, verdict: "Результат по умолчанию" },
              charm_and_tone: { score: 3.0, verdict: "Результат по умолчанию" },
              creativity: { score: 3.0, verdict: "Результат по умолчанию" },
              adaptability: { score: 3.0, verdict: "Результат по умолчанию" },
              self_promotion: { score: 3.0, verdict: "Результат по умолчанию" },
              pricing_policy: { score: 3.0, verdict: "Результат по умолчанию", strengths: [], improvements: [] }
            },
            overall_conclusion: "Автоматический анализ не удался, поэтому отображены результаты по умолчанию."
          }
        };
        
        // Устанавливаем результат по умолчанию
        setAnalysisResult(defaultResult);
        setAnalysisComplete(true);
        
        // Даже если анализ не удался, сохраняем базовую запись через API
        try {
          console.log('Saving basic test result without analysis data');
          await testResultService.save({
            test_session_id: sessionId,
            // Не указываем employee_id, он будет определен на сервере
            raw_prompt: "Анализ не выполнен",
            analysis_result: defaultResult,
            engagement_score: 3.0,
            charm_score: 3.0,
            creativity_score: 3.0,
            adaptability_score: 3.0,
            self_promotion_score: 3.0,
            pricing_policy_score: 3.0
          });
          console.log('Created basic test result record with default data');
        } catch (saveError) {
          console.error('Failed to save basic test result:', saveError);
        }
      }
    } catch (error) {
      console.error('Error in analyzeDialogsAndSaveResults:', error);
      
      // Создаем результат при ошибке анализа
      const errorResult: DialogAnalysisResult = {
        dialog_analysis: {
          metrics: {
            engagement: { score: 3.0, verdict: "Ошибка анализа" },
            charm_and_tone: { score: 3.0, verdict: "Ошибка анализа" },
            creativity: { score: 3.0, verdict: "Ошибка анализа" },
            adaptability: { score: 3.0, verdict: "Ошибка анализа" },
            self_promotion: { score: 3.0, verdict: "Ошибка анализа" },
            pricing_policy: { score: 3.0, verdict: "Ошибка анализа", strengths: [], improvements: [] }
          },
          overall_conclusion: "Произошла ошибка при анализе диалогов."
        }
      };
      
      // Устанавливаем результат при ошибке
      setAnalysisResult(errorResult);
      setAnalysisComplete(true);
    } finally {
      // В любом случае завершаем расчет результатов
      setCalculatingResults(false);
      
      // Удаляем сессию из списка активных
      activeAnalysisSessions.delete(sessionId);
      console.log(`Completed analysis for session ${sessionId}. Remaining active analyses: ${activeAnalysisSessions.size}`);
    }
  };

  // Функция для отправки обычных текстовых сообщений
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Получаем ID текущей тестовой сессии из sessionStorage
    let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
    
    // Проверяем существование тестовой сессии
    if (!currentTestSessionId) {
      console.error('No test session ID found in storage. Please reload the page to create a new session.');
      return;
    }

    const newMessage = {
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

    try {
      // Определяем номер чата на основе выбранного пользователя
      const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
      if (chatNumber < 1 || chatNumber > 4) {
        throw new Error('Invalid chat number');
      }

      // Проверяем, есть ли уже начатый разговор с этим пользователем в Grok
      const existingConversation = userConversations[selectedUser];
      
      console.log('Existing conversation details:', existingConversation);

      // Отправляем сообщение через API маршрут /api/chat с данными о существующем чате
      const chatResponse = await chatService.sendMessage(
        currentTestSessionId,
        message,
        '', // employeeId пустой, так как мы используем sessionId
        chatNumber,
        existingConversation && existingConversation.conversationId && existingConversation.parentResponseId
          ? {
              conversationId: existingConversation.conversationId,
              parentResponseId: existingConversation.parentResponseId
            } 
          : undefined
      );

      // Обрабатываем ответ от API
      if (chatResponse.error) {
        throw new Error(chatResponse.error);
      }

      console.log('API response:', chatResponse);
      
      // Проверяем, содержит ли ответ теги [Bought]/[Not Bought]
      const { botResponse } = chatResponse;
      
      if (botResponse && botResponse.error) {
        throw new Error(botResponse.error);
      }

      if (botResponse && botResponse.response) {
        // Имитируем печатание ответа перед его отображением
        await simulateTypingDelay(selectedUser);
        
        const assistantMessage = {
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
        
        // Если ответ содержит тег [Bought] и в сообщении перед ним было фото с ценой
        if (botResponse.boughtTag) {
          console.log('Обнаружен тег [Bought], ищем последнее фото пользователя...');
          
          // Находим последнее сообщение с фотографией от пользователя
          const chatHistory = chatHistories[selectedUser];
          const chatHistoryReversed = [...chatHistory].reverse();
          
          const lastUserPhotoMsgIndex = chatHistoryReversed.findIndex(
            msg => msg.isOwn && (msg.imageUrl || (msg.content && msg.content.includes('[Фото')))
          );
          
          if (lastUserPhotoMsgIndex !== -1) {
            const realIndex = chatHistory.length - 1 - lastUserPhotoMsgIndex;
            const photoMsg = chatHistory[realIndex];
            
            // Обновляем статус фото на "bought"/"pending"/"purchased"
            setChatHistories(prev => {
              const newHistory = [...prev[selectedUser]];
              // Только если цена не равна FREE и не пуста
              if (photoMsg.price && photoMsg.price !== 'FREE') {
                console.log('Обновляем статус фото на bought=true и добавляем статусы pending/purchased');
                newHistory[realIndex] = {
                  ...photoMsg,
                  bought: true, // Добавляем флаг, что фото куплено
                  pending: true, // Статус "в ожидании покупки"
                  purchased: true // Статус "куплено"
                };
              }
              return {
                ...prev,
                [selectedUser]: newHistory
              };
            });
          }
        }
        
        // Сохраняем информацию о разговоре для будущих сообщений
        if (botResponse.conversation_id && botResponse.parent_response_id) {
          console.log('Updating conversation details for future messages:', {
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

      // Обновляем статус чата
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
        // Игнорируем ошибку, так как это не критичная функциональность
      }
      
    } catch (error) {
      console.error('Error in message sending:', error);
      
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
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    navigate(`/test-completed`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      {/* Окно поздравления */}
      {showCongratulations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d2d2d] rounded-xl border border-pink-500/20 p-8 max-w-md w-full shadow-2xl transform animate-scale-in-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
                Поздравляем!
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                Вы успешно завершили тестирование коммуникативных навыков.
              </p>
              
              {calculatingResults ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                  <p className="text-gray-400">Подсчитываем результаты...</p>
                  <p className="text-gray-400 text-sm mt-2">Это займет несколько секунд</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Check className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-gray-400 mb-2">Результаты готовы!</p>
                  <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 w-full">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Сообщений отправлено:</span>
                      <span className="text-pink-500 font-semibold">
                        {Object.values(chatHistories).reduce(
                          (total, messages) => total + messages.filter(msg => msg.isOwn).length, 
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ответов получено:</span>
                      <span className="text-purple-500 font-semibold">
                        {Object.values(chatHistories).reduce(
                          (total, messages) => total + messages.filter(msg => !msg.isOwn).length, 
                          0
                        )}
                      </span>
                    </div>
                        <div className="w-full h-px bg-gray-700 my-3"></div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Общий рейтинг:</span>
                          <span className="text-green-500 font-semibold">
                        {analysisResult ? (
                          ((
                              analysisResult.dialog_analysis.metrics.engagement.score +
                              analysisResult.dialog_analysis.metrics.charm_and_tone.score +
                              analysisResult.dialog_analysis.metrics.creativity.score +
                              analysisResult.dialog_analysis.metrics.adaptability.score +
                              analysisResult.dialog_analysis.metrics.self_promotion.score
                          ) / 5).toFixed(1)
                        ) : '3.0'} / 5
                          </span>
                        </div>
                  </div>
                  <button
                    onClick={handleGoodbye}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    До свидания
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <nav className="bg-[#2d2d2d] border-b border-[#3d3d3d] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Menu className="w-6 h-6 text-pink-500" />
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
          <Bell className="w-6 h-6" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-80 bg-[#2d2d2d] border-r border-[#3d3d3d] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              className="w-full bg-[#1a1a1a] rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="mt-6 space-y-4">
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
              const imagePrompt = msg.content.match(/\[Фото \d+\] \[(.*?)\]/)?.[1];
              const priceMatch = msg.content.match(/\[Цена: (.*?)\]/);
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
                      if (photoMsg.isOwn && (photoMsg.imageUrl || photoMsg.content.includes('[Фото'))) {
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
                                src={msg.imageUrl || `/foto/${msg.content.match(/\[Фото (\d+)\]/)?.[1]}.jpg`} 
                            alt="Отправленное изображение" 
                                className="max-w-[200px] h-auto rounded-md border border-[#3d3d3d]"
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
                <h3 className="text-xl font-bold text-white mb-4">Set Photo Price</h3>
                
                <div className="mb-6">
                  <img 
                    src={tempSelectedImage} 
                    alt="Selected" 
                    className="w-full h-48 object-contain bg-black rounded-md mb-4" 
                  />
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Photo Price
                      </label>
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

                      {/* Поле для ручного ввода цены */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                          Custom Price (1-100$)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="Enter price"
                            value={selectedPrice !== 'FREE' && !['3.99', '7.99', '9.99', '14.99', '19.99'].includes(selectedPrice) ? selectedPrice : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setSelectedPrice('FREE');
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                                  setSelectedPrice(numValue.toString());
                                }
                              }
                            }}
                            className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <span className="ml-2 text-white">$</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Photo Comment
                      </label>
                      <textarea 
                        value={imageComment} 
                        onChange={(e) => setImageComment(e.target.value)}
                        placeholder="Write a comment for the photo..."
                        className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={cancelImageSelection}
                    className="px-4 py-2 bg-[#3d3d3d] text-white rounded-md hover:bg-[#4d4d4d]"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={() => {
                      confirmImageSelection();
                      setShowPriceModal(false); // Дополнительно закрываем окно после вызова функции
                    }} 
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-md hover:opacity-90"
                  >
                    SAVE
                  </button>
                </div>
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
                  alt="Preview" 
                    className="h-16 w-auto rounded-md border border-[#3d3d3d]" 
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

          {/* Image Gallery */}
          {showImageGallery && (
            <div className="fixed bottom-[80px] left-[320px] right-4 bg-[#2d2d2d] border-t border-[#3d3d3d] rounded-t-lg shadow-lg">
              <div className="flex justify-between items-center p-4">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveTab('preloaded')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      activeTab === 'preloaded' 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#3d3d3d]'
                    }`}
                  >
                    Готовые фото
                  </button>
                  <button 
                    onClick={() => setActiveTab('custom')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      activeTab === 'custom' 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#3d3d3d]'
                    }`}
                  >
                    Мои фото {customImages.length > 0 && `(${customImages.length})`}
                  </button>
                </div>
                <button 
                  onClick={toggleImageGallery}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activeTab === 'preloaded' && (
                <div className="h-[calc(100vh-280px)] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2">
                    {preloadedImages.map((image) => (
                      <div 
                        key={image.id}
                        onClick={() => selectImage(image.url)}
                        className="cursor-pointer relative group"
                      >
                        <img 
                          src={image.thumbnail} 
                          alt={image.description} 
                          className="w-full aspect-[4/3] object-contain bg-black rounded-lg border border-[#3d3d3d] transition-all duration-200 group-hover:border-pink-500"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-lg">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ImagePlus className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{image.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'custom' && (
                <>
                  <div className="mb-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={handleUploadClick}
                      disabled={uploadingImage}
                      className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                        uploadingImage
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'
                      }`}
                    >
                      {uploadingImage ? (
                        <span>Загрузка...</span>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Загрузить фото</span>
                        </>
                      )}
                    </button>
                  </div>

                  {customImages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ImagePlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>У вас пока нет загруженных фото</p>
                      <p className="text-sm mt-1">Нажмите кнопку выше, чтобы загрузить</p>
                    </div>
                  ) : (
                    <div className="h-[calc(100vh-340px)] overflow-y-auto">
                      <div className="grid grid-cols-4 gap-3">
                        {customImages.map((image) => (
                          <div 
                            key={image.id}
                            className="cursor-pointer relative group"
                          >
                            <img 
                              src={image.thumbnail} 
                              alt={image.description} 
                              className="w-full aspect-video object-cover rounded-lg border border-[#3d3d3d] transition-all duration-200 group-hover:border-pink-500"
                              onClick={() => selectImage(image.url)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-lg">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button
                                  onClick={() => selectImage(image.url)}
                                  className="p-1 bg-pink-500 rounded-full"
                                >
                                  <ImagePlus className="w-4 h-4 text-white" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomImage(image.id);
                                  }}
                                  className="p-1 bg-red-500 rounded-full"
                                >
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[192px]">{image.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              console.log('Form submitted');
              handleSendMessage(e);
            }} 
            className="p-4 border-t border-[#3d3d3d]"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-[#2d2d2d] rounded-full flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Введите сообщение..."
                  className="flex-1 bg-transparent px-4 py-2 focus:outline-none"
                  disabled={loadingStates[selectedUser]}
                />
                <div className="flex items-center space-x-2 px-3">
                  <Image 
                    className="w-5 h-5 text-gray-400 cursor-pointer hover:text-pink-500 transition-colors" 
                    onClick={toggleImageGallery}
                  />
                  <AtSign className="w-5 h-5 text-gray-400 cursor-pointer hover:text-pink-500 transition-colors" />
                  <DollarSign className="w-5 h-5 text-gray-400 cursor-pointer hover:text-pink-500 transition-colors" />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!message.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
                  !message.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
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