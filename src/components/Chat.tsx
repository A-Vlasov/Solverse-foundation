import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { MessageCircle, Send, Menu, Bell, Settings, Search, Heart, Image, AtSign, DollarSign, Timer, Bot, AlertCircle, Info, Check, CheckCheck, X, ImagePlus, Upload, Trash2, ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateGrokResponse } from '../services/grok';
import { userPrompts, getPromptSummary } from '../data/userPrompts';
import PromptModal from './PromptModal';
import { 
  addMessageToTestSession, 
  createTestSession, 
  completeTestSession,
  ChatMessage as SupabaseChatMessage,
  getEmployees,
  getTestSessionChats,
  TestSession
} from '../lib/supabase';

// Типы для использования в Chat компоненте
type MessageRoleInternal = 'user' | 'assistant' | 'system';

// Интерфейс для сообщений из базы данных
interface DatabaseChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_own: boolean;
  chat_number: number;
  test_session_id: string;
}

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

// Обновляем интерфейс GrokConversation
interface GrokConversation {
  messages: GrokMessage[];
  lastMessageTime: string;
}

// Обновляем интерфейс UserConversations
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

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResults: {
    totalMessages: number;
    duration: string;
    completedAt: string;
  };
}

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, onClose, testResults }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2d2d2d] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Поздравляем!</h2>
          <p className="text-gray-300 mb-6">Вы успешно завершили тестирование!</p>
          
          <div className="space-y-4 text-left bg-[#1a1a1a] rounded-lg p-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Всего сообщений:</p>
              <p className="text-lg font-semibold">{testResults.totalMessages}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Длительность теста:</p>
              <p className="text-lg font-semibold">{testResults.duration}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Завершено:</p>
              <p className="text-lg font-semibold">{testResults.completedAt}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 transition-opacity font-semibold"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};

// Добавляем новый интерфейс для сессий тестирования
interface TestSessions {
  [key: string]: string | null; // key - имя сотрудника, value - ID сессии
}

// Добавляем интерфейс для таймеров сотрудников
interface EmployeeTimers {
  [key: string]: number;
}

function Chat() {
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('Marcus');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 минуты
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

  // Обновляем состояние для хранения чатов Grok
  const [userConversations, setUserConversations] = useState<UserConversations>({
    Marcus: { messages: [], lastMessageTime: '' },
    Shrek: { messages: [], lastMessageTime: '' },
    Olivia: { messages: [], lastMessageTime: '' },
    Ava: { messages: [], lastMessageTime: '' }
  });
  
  // Добавляем состояние для модального окна промпта
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  
  // Обновляем состояние для хранения сессий тестирования
  const [testSessions, setTestSessions] = useState<TestSessions>({
    Marcus: null,
    Shrek: null,
    Olivia: null,
    Ava: null
  });

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [testResults, setTestResults] = useState({
    totalMessages: 0,
    duration: '',
    completedAt: ''
  });

  // Добавляем состояние для хранения таймеров каждого сотрудника
  const [employeeTimers, setEmployeeTimers] = useState<EmployeeTimers>({
    Marcus: 120,
    Shrek: 120,
    Olivia: 120,
    Ava: 120
  });

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

  // Объявляем функцию createSessionForEmployee перед её использованием
  const createSessionForEmployee = async (employeeName: string) => {
    try {
      console.log('Creating test session for:', employeeName);
      
      const employees = await getEmployees();
      if (!employees || employees.length === 0) {
        throw new Error('No employees found');
      }
      
      const session = await createTestSession(employees[0].id);
      
      // Устанавливаем новую сессию и сбрасываем таймер
      setTestSessions(prev => ({
        ...prev,
        [employeeName]: session.id
      }));
      
      setEmployeeTimers(prev => ({
        ...prev,
        [employeeName]: 120
      }));
      
      // Если это текущий сотрудник, обновляем текущий таймер
      if (employeeName === selectedUser) {
        setTimeRemaining(120);
      }
      
      sessionStorage.setItem(`testSession_${employeeName}`, session.id);

      // Загружаем историю чатов для новой сессии
      const chats = await getTestSessionChats(session.id);
      if (chats && chats.length > 0) {
        // Преобразуем сообщения из всех чатов в единый список
        const allMessages = chats.flatMap(chat => 
          (chat.messages || []).map(msg => ({
            id: `msg-${Date.now()}-${Math.random()}`,
            sender: msg.isOwn ? 'You' : employeeName,
            content: msg.content,
            time: new Date(msg.time).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: 'numeric', 
              hour12: true 
            }),
            isOwn: msg.isOwn,
            isRead: msg.isRead ?? true
          }))
        );

        // Обновляем историю чатов для этого сотрудника
        setChatHistories(prev => ({
          ...prev,
          [employeeName]: allMessages
        }));

        // Обновляем контекст Grok
        const grokMessages = allMessages.map(msg => ({
          role: msg.isOwn ? 'user' as MessageRoleInternal : 'assistant' as MessageRoleInternal,
          content: msg.content
        }));

        setUserConversations(prev => ({
          ...prev,
          [employeeName]: {
            messages: [
              { role: 'system', content: userPrompts[employeeName] },
              ...grokMessages
            ],
            lastMessageTime: new Date().toISOString()
          }
        }));
      } else {
        // Если чатов нет, инициализируем пустые массивы
        setChatHistories(prev => ({
          ...prev,
          [employeeName]: []
        }));

        setUserConversations(prev => ({
          ...prev,
          [employeeName]: {
            messages: [{ role: 'system', content: userPrompts[employeeName] }],
            lastMessageTime: new Date().toISOString()
          }
        }));
      }
      
      console.log(`Test session created for ${employeeName}:`, session.id);
      return session.id;
    } catch (error) {
      console.error(`Error creating test session for ${employeeName}:`, error);
      return null;
    }
  };

  // Обновляем useEffect для переключения между сотрудниками
  useEffect(() => {
    // При смене сотрудника обновляем текущий таймер
    setTimeRemaining(employeeTimers[selectedUser]);

    // Если у сотрудника нет активной сессии, создаем новую
    if (!testSessions[selectedUser]) {
      createSessionForEmployee(selectedUser);
    }
  }, [selectedUser, employeeTimers, testSessions]);

  // Обновляем useEffect для таймера
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          
          // Подсчитываем сообщения только текущего сотрудника
          const totalMessages = chatHistories[selectedUser].length;

          // Формируем результаты тестирования
          setTestResults({
            totalMessages,
            duration: '2 минуты',
            completedAt: new Date().toLocaleString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          });

          // Завершаем только текущую сессию
          const currentSessionId = testSessions[selectedUser];
          if (currentSessionId) {
            const completeSession = async () => {
              try {
                await completeTestSession(currentSessionId);
                console.log(`Test session completed for ${selectedUser}`);
                
                // Очищаем сессию и таймер только для текущего сотрудника
                setTestSessions(prev => ({
                  ...prev,
                  [selectedUser]: null
                }));
                setEmployeeTimers(prev => ({
                  ...prev,
                  [selectedUser]: 0
                }));
                sessionStorage.removeItem(`testSession_${selectedUser}`);
                
                // Показываем модальное окно с результатами
                setShowCompletionModal(true);
              } catch (error) {
                console.error('Error completing test session:', error);
              }
            };
            
            completeSession();
          }
          
          return 0;
        }
        
        // Обновляем таймер для текущего сотрудника
        setEmployeeTimers(prev => ({
          ...prev,
          [selectedUser]: prevTime - 1
        }));
        
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedUser, testSessions]);

  // Обновляем сессию после добавления каждого сообщения
  useEffect(() => {
    const updateMessageCount = async () => {
      if (testSessions[selectedUser]) {
        try {
          // Подсчитываем общее количество сообщений
          const totalMessages = chatHistories[selectedUser].length;
          
          console.log('Total messages in session:', totalMessages);
        } catch (error) {
          console.error('Error counting messages:', error);
        }
      }
    };
    
    updateMessageCount();
  }, [chatHistories, selectedUser, testSessions]);

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
    
    // Remove the error message
    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: prev[selectedUser].filter(msg => msg.id !== failedMessage.id)
    }));
    
    // Set loading state
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));
    setRetryingMessage(failedMessage);

    try {
      const currentSessionId = testSessions[selectedUser];
      if (!currentSessionId) {
        throw new Error('No test session ID available');
      }

      // Определяем номер чата на основе выбранного пользователя
      const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
      if (chatNumber < 1 || chatNumber > 4) {
        throw new Error('Invalid chat number');
      }

      // Получаем текущий контекст чата для выбранного пользователя
      const currentConversation = userConversations[selectedUser];
      
      // Получаем ответ от Grok, используя существующий контекст
      const grokResponse = await generateGrokResponse(currentConversation.messages);

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
        // Сохраняем ответ ассистента
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: grokResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        // Сохраняем ответ в базу данных
        const assistantChatMessage: SupabaseChatMessage = {
          content: grokResponse.response,
          time: new Date().toISOString(),
          isOwn: false,
          isRead: false
        };

        await addMessageToTestSession(
          currentSessionId,
          chatNumber as 1 | 2 | 3 | 4,
          assistantChatMessage
        );

        // Обновляем историю чата
        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));

        // Обновляем контекст Grok
        setUserConversations(prev => ({
          ...prev,
          [selectedUser]: {
            messages: [...currentConversation.messages, { role: 'assistant', content: grokResponse.response }],
            lastMessageTime: new Date().toISOString()
          }
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
    
    // Получаем ID сессии для текущего сотрудника
    const currentSessionId = testSessions[selectedUser];
    if (!currentSessionId) {
      throw new Error(`No test session found for ${selectedUser}`);
    }

    // Определяем номер чата на основе выбранного пользователя
    const chatNumber = users.findIndex(user => user.name === selectedUser) + 1;
    if (chatNumber < 1 || chatNumber > 4) {
      throw new Error('Invalid chat number');
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

    // Сохраняем сообщение пользователя в базу данных
    const userChatMessage: SupabaseChatMessage = {
      content: messageContent,
      time: new Date().toISOString(),
      isOwn: true,
      isRead: true
    };

    await addMessageToTestSession(
      currentSessionId,
      chatNumber as 1 | 2 | 3 | 4,
      userChatMessage
    );

    setChatHistories(prev => ({
      ...prev,
      [selectedUser]: [...prev[selectedUser], newMessage]
    }));
    setMessage('');
    setSelectedImage(null);
    
    setLoadingStates(prev => ({ ...prev, [selectedUser]: true }));

    try {
      // Получаем текущий контекст чата для выбранного пользователя
      const currentConversation = userConversations[selectedUser];
      
      // Создаем новое сообщение для Grok
      const newGrokMessage: GrokMessage = {
        role: 'user',
        content: newMessage.imageUrl 
          ? `${newMessage.content} [Пользователь отправил изображение]` 
          : newMessage.content
      };
      
      // Обновляем контекст чата
      const updatedMessages = [...currentConversation.messages, newGrokMessage];
      
      // Если это первое сообщение, добавляем системный промпт
      if (currentConversation.messages.length === 0) {
        updatedMessages.unshift({
          role: 'system',
          content: userPrompts[selectedUser]
        });
      }

      // Получаем ответ от Grok
      const grokResponse = await generateGrokResponse(updatedMessages);

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
        // Сохраняем ответ ассистента
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          sender: selectedUser,
          content: grokResponse.response,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          isOwn: false,
          isRead: false
        };

        // Сохраняем ответ в базу данных
        const assistantChatMessage: SupabaseChatMessage = {
          content: grokResponse.response,
          time: new Date().toISOString(),
          isOwn: false,
          isRead: false
        };

        await addMessageToTestSession(
          currentSessionId,
          chatNumber as 1 | 2 | 3 | 4,
          assistantChatMessage
        );

        // Обновляем историю чата
        setChatHistories(prev => ({
          ...prev,
          [selectedUser]: [...prev[selectedUser], assistantMessage]
        }));

        // Обновляем контекст Grok
        setUserConversations(prev => ({
          ...prev,
          [selectedUser]: {
            messages: [...updatedMessages, { role: 'assistant', content: grokResponse.response }],
            lastMessageTime: new Date().toISOString()
          }
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

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
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
                      ) : lastMessage ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {lastMessage.isOwn ? 'Вы:' : `${user.name}:`}
                          </span>
                          <span className="truncate">{lastMessage.content}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Нет сообщений</span>
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

      {/* Добавляем модальное окно с результатами */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          navigate('/');
        }}
        testResults={testResults}
      />
    </div>
  );
}

export default Chat;