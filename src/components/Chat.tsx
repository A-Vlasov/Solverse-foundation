import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { MessageCircle, Send, Menu, Bell, Settings, Search, Heart, Image, AtSign, DollarSign, Timer, Bot, AlertCircle, Info, Check, CheckCheck, X, ImagePlus, Upload, Trash2, ExternalLink, Eye, Loader, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateGrokResponse, analyzeDialogs } from '../services/grok';
import { userPrompts, getPromptSummary } from '../data/userPrompts';
import PromptModal from './PromptModal';
import { 
  addMessageToTestSession, 
  createTestSession, 
  completeTestSession,
  ChatMessage as SupabaseChatMessage,
  getEmployees,
  getTestSessionChats,
  getTestSession,
  TestSession,
  generateAnalysisPrompt,
  saveTestResult,
  DialogAnalysisResult
} from '../lib/supabase';

// Типы для использования в Chat компоненте
type MessageRoleInternal = 'user' | 'assistant';

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
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Горный пейзаж'
  },
  {
    id: 'img2',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Морской закат'
  },
  {
    id: 'img3',
    url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Озеро в горах'
  },
  {
    id: 'img4',
    url: 'https://images.unsplash.com/photo-1497449493050-aad1e7cad165?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1497449493050-aad1e7cad165?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Цветущий луг'
  },
  {
    id: 'img5',
    url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Лесное озеро'
  },
  {
    id: 'img6',
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&q=80',
    description: 'Поле на закате'
  }
];

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
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('Marcus');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [calculatingResults, setCalculatingResults] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DialogAnalysisResult | null>(null);
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [activeTab, setActiveTab] = useState<'preloaded' | 'custom'>('preloaded');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    Marcus: false,
    Shrek: false,
    Olivia: false,
    Ava: false
  });
  const [userStatus, setUserStatus] = useState<UserStatus>({
    Marcus: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Shrek: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Olivia: { isTyping: false, unreadCount: 0, lastMessageId: null },
    Ava: { isTyping: false, unreadCount: 0, lastMessageId: null }
  });
  const [retryingMessage, setRetryingMessage] = useState<Message | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory>({
    Marcus: [],
    Shrek: [],
    Olivia: [],
    Ava: [],
  });

  // Add new state for Grok conversations
  const [userConversations, setUserConversations] = useState<UserConversations>({});
  
  // Добавляем состояние для модального окна промпта
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  // Добавляем состояние для хранения id сессии тестирования
  const [testSessionId, setTestSessionId] = useState<string | null>(null);

  const users = [
    { name: 'Marcus', status: 'Online', lastMessage: 'Страстный клиент', role: 'Игривый' },
    { name: 'Shrek', status: 'Online', lastMessage: 'Капризный клиент', role: 'Нестабильный' },
    { name: 'Olivia', status: 'Away', lastMessage: 'Торгуется о цене', role: 'Экономный' },
    { name: 'Ava', status: 'Online', lastMessage: 'Проверяет границы', role: 'Провокационный' },
  ];

  // Load custom images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem('customImages');
    if (savedImages) {
      try {
        setCustomImages(JSON.parse(savedImages));
      } catch (error) {
        console.error('Error loading custom images:', error);
      }
    }
  }, []);

  // Save custom images to localStorage whenever they change
  useEffect(() => {
    if (customImages.length > 0) {
      localStorage.setItem('customImages', JSON.stringify(customImages));
    }
  }, [customImages]);

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
    // Добавляем флаг для предотвращения дублирования инициализаций
    let isInitializing = false;
    
    const initTestSession = async () => {
      // Если уже идет инициализация, выходим
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        console.log('Starting test session initialization');
        // Проверяем, существует ли уже сессия в sessionStorage
        const existingSessionId = sessionStorage.getItem('currentTestSessionId');
        if (existingSessionId) {
          console.log('Found existing session ID in storage:', existingSessionId);
          // Проверяем, существуют ли чаты для этой сессии
          try {
            const existingChats = await getTestSessionChats(existingSessionId);
            
            // Получаем данные текущего соискателя
            const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
            const candidateId = candidateData.userId;
            
            if (existingChats && existingChats.length > 0) {
              // Проверяем, что сессия принадлежит текущему соискателю
              // Получаем данные о сессии
              try {
                const session = await getTestSession(existingSessionId);
                if (session && session.employee_id === candidateId) {
                  // Если сессия и чаты существуют и принадлежат текущему соискателю, используем их
                  setTestSessionId(existingSessionId);
                  console.log('Using existing test session:', existingSessionId, 'for candidate:', candidateId);
                  isInitializing = false;
                  return;
                } else {
                  console.log('Session belongs to a different candidate, creating new one');
                  sessionStorage.removeItem('currentTestSessionId');
                }
              } catch (sessionError) {
                console.error('Error checking session ownership:', sessionError);
                sessionStorage.removeItem('currentTestSessionId');
              }
            } else {
              console.log('No chats found for existing session, will create new one');
              // Сессия существует, но чаты не найдены - удаляем ID сессии
              sessionStorage.removeItem('currentTestSessionId');
            }
          } catch (error) {
            console.error('Error checking existing session:', error);
            // В случае ошибки удаляем ID сессии
            sessionStorage.removeItem('currentTestSessionId');
          }
        }

        // Получаем ID соискателя из sessionStorage
        const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
        const candidateId = candidateData.userId;
        
        if (!candidateId) {
          throw new Error('No candidate ID found in session storage');
        }
        
        console.log('Looking for employee with ID:', candidateId);
        
        // Получаем список сотрудников
        const employees = await getEmployees();
        if (!employees || employees.length === 0) {
          throw new Error('No employees found');
        }
        
        // Ищем соискателя по ID
        const targetEmployee = employees.find(e => e.id === candidateId);
        
        if (!targetEmployee) {
          console.warn('Employee not found by ID:', candidateId);
          console.log('Found employees:', employees.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` })));
          console.log('Using first employee instead:', employees[0].id);
          // Если не найден, используем первого сотрудника
          const session = await createTestSession(employees[0].id);
          setTestSessionId(session.id);
          sessionStorage.setItem('currentTestSessionId', session.id);
          console.log('Test session ID saved to sessionStorage:', session.id);
        } else {
          console.log('Found employee:', { 
            id: targetEmployee.id, 
            name: `${targetEmployee.first_name} ${targetEmployee.last_name}` 
          });
          // Создаем сессию для найденного сотрудника
          const session = await createTestSession(targetEmployee.id);
          setTestSessionId(session.id);
          
          // Проверяем, что сессия создана успешно и содержит чаты
          if (session.chats && session.chats.length > 0) {
            console.log('Test session created with chats:', {
              sessionId: session.id,
              employeeId: session.employee_id,
              chatCount: session.chats.length,
              chatNumbers: session.chats.map(c => c.chat_number)
            });
          } else {
            console.warn('Test session created but no chats found:', {
              sessionId: session.id,
              employeeId: session.employee_id
            });
            
            // Получаем чаты для созданной сессии
            try {
              const sessionChats = await getTestSessionChats(session.id);
              console.log('Fetched chats for new session:', {
                sessionId: session.id,
                chats: sessionChats.map(c => ({ id: c.id, chatNumber: c.chat_number }))
              });
            } catch (chatsError) {
              console.error('Error fetching chats for new session:', chatsError);
            }
          }
          
          sessionStorage.setItem('currentTestSessionId', session.id);
          console.log('Test session ID saved to sessionStorage:', session.id);
        }
        
        // Сбрасываем информацию о разговорах с Grok при создании новой сессии
        setUserConversations({});
        
      } catch (error) {
        console.error('Error creating test session:', error);
      } finally {
        isInitializing = false;
      }
    };
    
    initTestSession();
    
    // Cleanup function для завершения сессии при закрытии компонента
    return () => {
      if (testSessionId) {
        const completeSession = async () => {
          try {
            // Подсчитываем общее количество сообщений
            const totalMessages = Object.values(chatHistories).reduce(
              (total, messages) => total + messages.length, 
              0
            );
            
            const testSessionId = sessionStorage.getItem('currentTestSessionId');
            if (!testSessionId) {
              console.error('No test session ID found');
              return;
            }
            await completeTestSession(testSessionId);
            console.log('Test session completed on unmount');
          } catch (error) {
            console.error('Error completing test session:', error);
          }
        };
        
        completeSession();
      }
    };
  }, []);
  
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
    if (timeRemaining <= 0) return; // Если время уже истекло, не запускаем таймер
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Показываем окно поздравления и запускаем расчет результатов
          setShowCongratulations(true);
          setCalculatingResults(true);
          
          // Завершаем тестовую сессию
          if (testSessionId) {
            const completeSession = async () => {
              try {
                await completeTestSession(testSessionId);
                console.log('Test session completed on time expiration');
                
                // Запускаем анализ диалогов и сохранение результатов
                await analyzeDialogsAndSaveResults(testSessionId);
                
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
  }, [navigate, testSessionId]);

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

  const selectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageGallery(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setUploadingImage(true);

    // Create a FileReader to read the image
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const imageUrl = event.target.result as string;
        
        // Create a thumbnail using canvas
        const imgElement = document.createElement('img');
        imgElement.onload = () => {
          // Create a canvas for the thumbnail
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail dimensions (maintaining aspect ratio)
          // For horizontal images, make width larger than height
          const maxWidth = 300;
          const maxHeight = 150;
          let width = imgElement.width;
          let height = imgElement.height;
          
          // Calculate aspect ratio
          const aspectRatio = width / height;
          
          // Resize to fit within maxWidth x maxHeight while maintaining aspect ratio
          if (aspectRatio > 1) { // Landscape orientation
            width = maxWidth;
            height = width / aspectRatio;
          } else { // Portrait orientation - force to landscape
            height = maxHeight;
            width = maxWidth; // Force wider thumbnail
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image on the canvas
          if (ctx) {
            // Fill with black background for portrait images
            if (aspectRatio < 1) {
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, width, height);
              
              // Calculate centered position
              const centerX = (width - (height * aspectRatio)) / 2;
              ctx.drawImage(imgElement, centerX, 0, height * aspectRatio, height);
            } else {
              ctx.drawImage(imgElement, 0, 0, width, height);
            }
            
            // Get the thumbnail as a data URL
            const thumbnailUrl = canvas.toDataURL(file.type);
            
            // Create a new custom image
            const newImage: CustomImage = {
              id: `custom-${Date.now()}`,
              url: imageUrl,
              thumbnail: thumbnailUrl,
              description: file.name
            };
            
            // Add the new image to the custom images array
            setCustomImages(prev => [...prev, newImage]);
            
            // Switch to the custom tab
            setActiveTab('custom');
            
            setUploadingImage(false);
          }
        };
        
        imgElement.src = imageUrl;
      }
    };
    
    reader.readAsDataURL(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomImage = (imageId: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== imageId));
    
    // If the deleted image was selected, clear the selection
    if (selectedImage && customImages.find(img => img.id === imageId)?.url === selectedImage) {
      setSelectedImage(null);
    }
  };

  const handleRetry = async (failedMessage: Message) => {
    // Find the last user message before the error
    const chatHistory = chatHistories[selectedUser];
    const failedIndex = chatHistory.findIndex(msg => msg.id === failedMessage.id);
    
    if (failedIndex <= 0) return;
    
    // Get the last user message before the error
    let lastUserMessageIndex = -1;
    for (let i = failedIndex - 1; i >= 0; i--) {
      if (chatHistory[i].isOwn) {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex === -1) return;
    
    // Remove the error message
    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: prev[selectedUser].filter(msg => msg.id !== failedMessage.id)
    }));
    
    // Set loading state
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));
    setRetryingMessage(failedMessage);

    try {
      const storedSessionId = sessionStorage.getItem('currentTestSessionId');
      if (!storedSessionId) {
        throw new Error('No test session ID available');
      }

      // Определяем номер чата на основе выбранного пользователя
      const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
      if (chatNumber < 1 || chatNumber > 4) {
        throw new Error('Invalid chat number');
      }

      // Получаем историю сообщений для текущего пользователя
      const messagesToSend = chatHistory.slice(0, failedIndex).map(msg => ({
        role: msg.isOwn ? 'user' : 'assistant',
        content: msg.imageUrl 
          ? `${msg.content} [Пользователь отправил изображение]` 
          : msg.content
      })) as { role: 'user' | 'assistant' | 'system', content: string }[];

      // Добавляем систему подсказку, если это первые сообщения в чате
      if (messagesToSend.length > 0 && !messagesToSend.some(msg => msg.role === 'system')) {
        messagesToSend.unshift({
          role: 'system',
          content: userPrompts[selectedUser]
        });
      }

      // Получаем данные о существующем разговоре с Grok, если они есть
      const conversationDetails = userConversations[selectedUser];
      
      const grokResponse = await generateGrokResponse(
        messagesToSend,
        conversationDetails
      );

      // Сохраняем информацию о разговоре для будущих сообщений
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
          content: `Ошибка: ${grokResponse.error}`,
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
        // Сохраняем ответ ассистента в чат
        const assistantChatMessage: SupabaseChatMessage = {
          content: grokResponse.response,
          time: new Date().toISOString(),
          isOwn: false,
          isRead: false
        };

        await addMessageToTestSession(
          storedSessionId,
          chatNumber as 1 | 2 | 3 | 4,
          assistantChatMessage
        );

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: grokResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));
      }
      
      setUserStatus(prev => ({
        ...prev,
        [selectedUser]: {
          ...prev[selectedUser],
          isTyping: false,
          lastMessageId: `assistant-${Date.now()}`
        }
      }));
    } catch (error) {
      console.error('Error retrying message:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: selectedUser,
        content: 'Произошла ошибка при повторной отправке сообщения. Пожалуйста, попробуйте еще раз.',
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
      setRetryingMessage(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedImage) return;
    
    const messageContent = message.trim();
    
    // Получаем данные пользователя из sessionStorage
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    if (!candidateData.userId) {
      console.error('No userId found');
      return;
    }
    
    // Получаем ID текущей тестовой сессии из sessionStorage
    let currentTestSessionId = sessionStorage.getItem('currentTestSessionId');
    
    // Проверяем существование тестовой сессии
    if (!currentTestSessionId) {
      throw new Error('No test session ID found in storage. Please reload the page to create a new session.');
    }

    const newMessage = {
      id: `user-${Date.now()}`,
      sender: 'You',
      content: messageContent,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
      isOwn: true,
      isRead: true,
      imageUrl: selectedImage || undefined
    };

    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: [...prev[selectedUser], newMessage]
    }));
    setMessage('');
    setSelectedImage(null);
    
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));

    try {
      // Определяем номер чата на основе выбранного пользователя
      const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
      if (chatNumber < 1 || chatNumber > 4) {
        throw new Error('Invalid chat number');
      }

      // Сохраняем сообщение пользователя в чат
      const chatMessage: SupabaseChatMessage = {
        content: messageContent,
        time: new Date().toISOString(),
        isOwn: true,
        isRead: true
      };

      console.log('Sending message to chat:', {
        sessionId: currentTestSessionId,
        chatNumber,
        message: chatMessage
      });

      try {
        const updatedChat = await addMessageToTestSession(
          currentTestSessionId,
          chatNumber as 1 | 2 | 3 | 4,
          chatMessage
        );
        console.log('Message sent successfully:', updatedChat);
      } catch (messageError) {
        console.error('Error adding message to chat:', messageError);
        
        // Проверяем существование чатов для сессии
        try {
          console.log('Checking chats for session:', currentTestSessionId);
          const sessionChats = await getTestSessionChats(currentTestSessionId);
          
          if (!sessionChats || sessionChats.length === 0) {
            console.warn('No chats found for session, session might be invalid. Creating new session...');
            
            // Удаляем старый ID сессии
            sessionStorage.removeItem('currentTestSessionId');
            
            // Получаем данные соискателя
            const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
            console.log('Retrieved candidate data:', candidateData);
            
            // Создаем новую сессию
            const employees = await getEmployees();
            if (employees && employees.length > 0) {
              const newSession = await createTestSession(employees[0].id);
              
              // Сохраняем новый ID сессии
              currentTestSessionId = newSession.id;
              setTestSessionId(newSession.id);
              sessionStorage.setItem('currentTestSessionId', newSession.id);
              console.log('Created new session:', newSession.id);
              
              // Пробуем снова отправить сообщение
              const updatedChat = await addMessageToTestSession(
                currentTestSessionId,
                chatNumber as 1 | 2 | 3 | 4,
                chatMessage
              );
              console.log('Message sent successfully after session recreation:', updatedChat);
            } else {
              throw new Error('No employees found to create a new session');
            }
          } else {
            console.log('Found chats for session:', sessionChats.map(c => ({ id: c.id, chatNumber: c.chat_number })));
            throw messageError; // Пробрасываем исходную ошибку
          }
        } catch (checkError) {
          console.error('Error checking session chats:', checkError);
          throw messageError; // Пробрасываем исходную ошибку
        }
      }

      // Получаем историю сообщений для текущего пользователя
      const chatHistory = chatHistories[selectedUser];
      
      // Создаем массив сообщений для отправки в API
      let messagesToSend = chatHistory.map(msg => ({
        role: msg.isOwn ? 'user' : 'assistant',
        content: msg.imageUrl 
          ? `${msg.content} [Пользователь отправил изображение]` 
          : msg.content
      })) as { role: 'user' | 'assistant' | 'system', content: string }[];
      
      messagesToSend.push({
        role: 'user',
        content: newMessage.imageUrl 
          ? `${newMessage.content} [Пользователь отправил изображение]` 
          : newMessage.content
      });

      // Если это первое сообщение в чате, добавляем системный промпт
      if (chatHistory.length === 0) {
        messagesToSend.unshift({
          role: 'system',
          content: userPrompts[selectedUser]
        });
      }

      // Получаем данные о существующем разговоре с Grok, если они есть
      const conversationDetails = userConversations[selectedUser];
      
      const grokResponse = await generateGrokResponse(
        messagesToSend,
        conversationDetails
      );

      // Сохраняем информацию о разговоре для будущих сообщений
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
          content: `Ошибка: ${grokResponse.error}`,
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
        // Сохраняем ответ ассистента в чат
        const assistantChatMessage: SupabaseChatMessage = {
          content: grokResponse.response,
          time: new Date().toISOString(),
          isOwn: false,
          isRead: false
        };

        await addMessageToTestSession(
          currentTestSessionId,
          chatNumber as 1 | 2 | 3 | 4,
          assistantChatMessage
        );

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: grokResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));
      }

      setUserStatus(prev => ({
        ...prev,
        [selectedUser]: {
          ...prev[selectedUser],
          isTyping: false,
          lastMessageId: `assistant-${Date.now()}`
        }
      }));
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
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
    // Прокручиваем чат к последнему сообщению при изменении истории чата
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistories]);

  // Обработчик для кнопки "До свидания"
  const handleGoodbye = () => {
    if (testSessionId) {
      navigate(`/test-results/${testSessionId}`);
    } else {
      navigate('/admin');
    }
  };

  // Обработчик для анализа диалогов и сохранения результатов
  const analyzeDialogsAndSaveResults = async (sessionId: string) => {
    try {
      console.log('Starting dialog analysis for session:', sessionId);
      
      // Получаем информацию о сессии для привязки к сотруднику
      const session = await getTestSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Генерируем промпт для анализа
      const prompt = await generateAnalysisPrompt(sessionId);
      console.log('Analysis prompt generated, length:', prompt.length);
      
      // Отправляем на анализ в Grok
      console.log('Sending prompt to Grok API...');
      const analysisResponse = await analyzeDialogs(prompt);
      console.log('Got response from Grok API:', analysisResponse);
      
      if (analysisResponse.error) {
        console.error('Analysis API error:', analysisResponse.error);
        throw new Error(`Analysis failed: ${analysisResponse.error}`);
      }
      
      console.log('Raw analysis response:', analysisResponse);
      
      let result: DialogAnalysisResult | null = null;
      
      // Извлекаем результат анализа
      if (analysisResponse.analysisResult) {
        console.log('Using pre-parsed analysis result');
        result = analysisResponse.analysisResult;
      } else if (typeof analysisResponse.response === 'string') {
        console.log('Trying to parse from response string, length:', analysisResponse.response.length);
        try {
          // Пытаемся извлечь JSON из текстового ответа
          const jsonMatch = analysisResponse.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            console.log('Extracted JSON string:', jsonStr.substring(0, 100) + '...');
            result = JSON.parse(jsonStr);
            console.log('Successfully parsed JSON result');
          } else {
            console.warn('No JSON pattern found in response');
          }
        } catch (parseError) {
          console.error('Error parsing analysis response:', parseError);
        }
      } else {
        console.warn('Response does not contain expected data structure:', analysisResponse);
      }
      
      // Если удалось получить результат анализа
      if (result) {
        // Сохраняем результат в состоянии
        setAnalysisResult(result);
        setAnalysisComplete(true);
        
        // Рассчитываем общий балл (среднее значение по всем метрикам)
        const metrics = result.dialog_analysis.metrics;
        const scores = [
          metrics.engagement.score,
          metrics.charm_and_tone.score,
          metrics.creativity.score,
          metrics.adaptability.score,
          metrics.self_promotion.score,
          metrics.pricing_policy.score // Включаем в расчёт, но не сохраняем в БД
        ];
        
        const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Сохраняем результат в базе данных
        console.log('Saving analysis results to database...');
        await saveTestResult({
          test_session_id: sessionId,
          employee_id: session.employee_id,
          raw_prompt: prompt,
          analysis_result: result,
          engagement_score: metrics.engagement.score,
          charm_tone_score: metrics.charm_and_tone.score,
          creativity_score: metrics.creativity.score,
          adaptability_score: metrics.adaptability.score,
          self_promotion_score: metrics.self_promotion.score,
          // pricing_policy_score не сохраняем, так как колонки нет в БД
          overall_score: overallScore
        });
        
        console.log('Analysis completed and results saved');
      } else {
        console.error('No valid analysis result found in response');
        
        // Даже если анализ не удался, сохраняем базовую запись в БД
        try {
          console.log('Saving basic test result without analysis data');
          await saveTestResult({
            test_session_id: sessionId,
            employee_id: session.employee_id,
            raw_prompt: prompt
          });
          console.log('Created basic test result record without analysis data');
        } catch (saveError) {
          console.error('Failed to save basic test result:', saveError);
        }
      }
    } catch (error) {
      console.error('Error in analyzeDialogsAndSaveResults:', error);
    } finally {
      // В любом случае завершаем расчет результатов
      setCalculatingResults(false);
    }
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
                    {analysisResult && (
                      <>
                        <div className="w-full h-px bg-gray-700 my-3"></div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Общий рейтинг:</span>
                          <span className="text-green-500 font-semibold">
                            {((
                              analysisResult.dialog_analysis.metrics.engagement.score +
                              analysisResult.dialog_analysis.metrics.charm_and_tone.score +
                              analysisResult.dialog_analysis.metrics.creativity.score +
                              analysisResult.dialog_analysis.metrics.adaptability.score +
                              analysisResult.dialog_analysis.metrics.self_promotion.score
                            ) / 5).toFixed(1)} / 5
                          </span>
                        </div>
                      </>
                    )}
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
                <p className="text-sm text-gray-400">{currentUser?.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleOpenPromptModal}
                className="flex items-center space-x-1 text-gray-400 hover:text-pink-500 transition-colors"
                title="Посмотреть промпт"
              >
                <Eye className="w-5 h-5" />
                <span className="text-sm">Промпт</span>
              </button>
              <Heart className="w-6 h-6 text-pink-500" />
              <Settings className="w-6 h-6" />
            </div>
          </div>

          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatHistories[selectedUser].map((msg) => (
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
                      <p>{msg.content}</p>
                      {msg.imageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <img 
                            src={msg.imageUrl} 
                            alt="Отправленное изображение" 
                            className="max-w-full h-auto"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 mt-1">
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
            ))}
          </div>

          {/* Image preview */}
          {selectedImage && (
            <div className="p-2 border-t border-[#3d3d3d] bg-[#2d2d2d]">
              <div className="relative inline-block">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="h-20 w-auto rounded-lg border border-[#3d3d3d]" 
                />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {showImageGallery && (
            <div className="p-4 border-t border-[#3d3d3d] bg-[#2d2d2d]">
              <div className="flex justify-between items-center mb-4">
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
                <div className="overflow-x-auto pb-2">
                  <div className="flex space-x-3" style={{ minWidth: 'max-content' }}>
                    {preloadedImages.map((image) => (
                      <div 
                        key={image.id}
                        onClick={() => selectImage(image.url)}
                        className="cursor-pointer relative group flex-shrink-0"
                      >
                        <img 
                          src={image.thumbnail} 
                          alt={image.description} 
                          className="w-48 h-24 object-cover rounded-lg border border-[#3d3d3d] transition-all duration-200 group-hover:border-pink-500"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-lg">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ImagePlus className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-[192px]">{image.description}</p>
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
                    <div className="overflow-x-auto pb-2">
                      <div className="flex space-x-3" style={{ minWidth: 'max-content' }}>
                        {customImages.map((image) => (
                          <div 
                            key={image.id}
                            className="cursor-pointer relative group flex-shrink-0"
                          >
                            <img 
                              src={image.thumbnail} 
                              alt={image.description} 
                              className="w-48 h-24 object-cover rounded-lg border border-[#3d3d3d] transition-all duration-200 group-hover:border-pink-500"
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
                disabled={!message.trim() && !selectedImage}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-opacity ${
                  !message.trim() && !selectedImage
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