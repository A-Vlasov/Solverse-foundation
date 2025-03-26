import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  MessageCircle, 
  Smile, 
  Lightbulb, 
  RefreshCw, 
  DollarSign,
  Download,
  Share2,
  Printer,
  CheckCircle,
  XCircle,
  Flame,
  Users,
  ShoppingCart,
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  getChatHistory, 
  TestSession, 
  Chat, 
  ChatMessage, 
  getEmployeeTestSessions,
  getTestResultForSession,
  getEmployee,
  getTestSession,
  TestResult,
  DialogAnalysisResult
} from '../lib/supabase';
import { fetchWithCache } from '../lib/cache';

// Add new interfaces for chat data
interface DialogueMessage {
  id: string;
  time: string;
  content: string;
  isOwn: boolean;
  isRead?: boolean;
  role?: 'user' | 'assistant';
}

interface Dialogue {
  id: string;
  title: string;
  date: string;
  score: number;
  messages: DialogueMessage[];
}

interface TestResultState {
  candidateName: string;
  overallScore: number;
  date: string;
  duration: string;
  parameters: Array<{
    name: string;
    score: number;
    comment: string;
    icon: JSX.Element;
    color: string;
  }>;
  recommendations: string[];
  pricingEvaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    level?: string;
    details?: string;
  };
  salesPerformance: {
    introduction: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
    warmup: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
    sales: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  dialogues: Dialogue[];
}

// Сделаем функцию очистки тегов более универсальной и эффективной
const cleanMessageTags = (text: string): string => {
  // Удаляем все теги в формате [тег]
  return text
    .replace(/\[\s*Bought\s*\]/gi, '')
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .trim()
    .replace(/\s+/g, ' '); // Убираем лишние пробелы
};

// Добавим интерфейс для диалогов с информацией о покупке
interface DialogueMessageWithPurchaseInfo extends DialogueMessage {
  bought?: boolean;
  price?: string;
}

// Добавляем функцию для диагностики
const debug = (sessionId: string, chats: Chat[], testResult: TestResultState) => {
  console.log('=== ДИАГНОСТИКА ДАННЫХ СЕССИИ ===');
  console.log('SessionId:', sessionId || 'Не указан');
  console.log('Формат URL страницы должен быть: /admin/session/:sessionId');
  console.log('Chats:', chats.length > 0 ? {
    count: chats.length,
    messagesCounts: chats.map(c => c.messages?.length || 0)
  } : 'Отсутствуют');
  console.log('Test Result:', testResult.parameters?.length > 0 ? {
    candidateName: testResult.candidateName,
    overallScore: testResult.overallScore,
    parameters: testResult.parameters.length
  } : 'Отсутствует');
  
  console.log('Возможные причины проблемы:');
  console.log('1. Сессия существует, но чаты не созданы (должно быть 4 чата)');
  console.log('2. Чаты созданы, но сообщения отсутствуют (messagesCounts должны быть > 0)');
  console.log('3. Сессия и чаты существуют, но анализ отсутствует (Test Result отсутствует)');
  console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');
};

// Добавляем простую функцию для очистки сообщений от тегов прямо перед возвратом компонента
const cleanContent = (text: string): string => {
  return text
    .replace(/\[\s*Bought\s*\]/gi, '')
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Добавляем функцию для определения статуса покупки фотографии
const checkPhotoPurchaseStatus = (dialogueMessages: DialogueMessage[], photoMsgIndex: number): boolean => {
  // Проверяем все сообщения после фотографии
  for (let i = photoMsgIndex + 1; i < dialogueMessages.length; i++) {
    // Ищем только в ответах бота
    if (!dialogueMessages[i].isOwn && dialogueMessages[i].content.includes('[Bought]')) {
      return true;
    }
  }
  return false;
};

function TestResultsAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const container = document.querySelector('.test-result-container');
  
  // Состояния
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultState | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Параметры из URL
  const paramSessionId = params.sessionId;
  const lastSegment = location.pathname.split('/').pop();
  const containerSessionId = container?.getAttribute('data-session-id');
  
  // Более простая проверка валидности UUID
  const isValidUUID = (id: string | null): boolean => {
    if (!id) return false;
    // Очень простая проверка - просто убедимся, что это не 'admin'
    return id !== 'admin';
  };
  
  // Определяем, находимся ли на странице /admin без указания ID или на странице сессии
  const isAdminPage = location.pathname === '/admin' || location.pathname === '/admin/';
  const isSessionPage = location.pathname.includes('/admin/session/') || 
                       location.pathname.includes('/test-results/');
  
  // Создаем переменную для отладки, чтобы отследить откуда получен sessionId
  let sessionIdSource = 'не определен';

  // Пытаемся получить sessionId из URL-пути для страницы /admin/session/:sessionId
  let sessionIdFromPath = null;
  if (location.pathname.includes('/admin/session/')) {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'session' && isValidUUID(lastPart)) {
      sessionIdFromPath = lastPart;
      console.log('[TestResultsAdmin] Извлечен sessionId из URL пути:', sessionIdFromPath);
    }
  }

  // Переопределяем console.log для оптимизации в зависимости от режима
  const isDevMode = process.env.NODE_ENV === 'development';
  const logInfo = isDevMode ? console.log : () => {};
  const logDebug = isDevMode ? console.debug : () => {};

  // Улучшенная логика определения sessionId
  // Приоритет: 1. из URL-пути, 2. параметр из URL, 3. из state, 4. из контейнера, 5. из последнего сегмента URL
  let finalSessionId = null;
  let fromDashboard = false;

  // Проверяем все возможные источники с подробным логированием
  if (sessionIdFromPath) {
    finalSessionId = sessionIdFromPath;
    sessionIdSource = 'URL путь /admin/session/:sessionId';
    logDebug('[TestResultsAdmin] Получен sessionId из URL пути /admin/session/:sessionId:', sessionIdFromPath);
  } else if (paramSessionId && isValidUUID(paramSessionId)) {
    finalSessionId = paramSessionId;
    sessionIdSource = 'URL параметр';
    logDebug('[TestResultsAdmin] Получен sessionId из URL параметра:', paramSessionId);
  } else if (location.state?.sessionId && isValidUUID(location.state?.sessionId)) {
    finalSessionId = location.state.sessionId;
    sessionIdSource = 'state при навигации';
    fromDashboard = location.state?.fromDashboard || false;
    logDebug('[TestResultsAdmin] Получен sessionId из state:', location.state.sessionId, 'fromDashboard:', fromDashboard);
  } else if (containerSessionId && isValidUUID(containerSessionId)) {
    finalSessionId = containerSessionId;
    sessionIdSource = 'data-атрибут контейнера';
    logDebug('[TestResultsAdmin] Получен sessionId из контейнера:', containerSessionId);
  } else if (!isAdminPage && lastSegment && lastSegment !== 'admin' && isValidUUID(lastSegment)) {
    finalSessionId = lastSegment;
    sessionIdSource = 'последний сегмент URL';
    logDebug('[TestResultsAdmin] Получен sessionId из последнего сегмента URL:', lastSegment);
  } else {
    console.warn('[TestResultsAdmin] Не удалось определить валидный sessionId ни из одного источника. URL:', location.pathname);
  }

  // Используем sessionId только если мы на странице сессии
  // На админ-странице sessionId всегда null
  const sessionId = isSessionPage ? finalSessionId : 
                   (isAdminPage ? null : finalSessionId);
                   
  // Отладочный параметр для принудительной загрузки тестовых данных
  const force_load = location.search.includes('force_load=true');
  if (force_load) {
    console.log('[TestResultsAdmin] Принудительная загрузка тестовых данных включена');
  }

  // В режиме разработки выводим подробную отладочную информацию
  if (isDevMode) {
    console.groupCollapsed('[DEBUG] TestResultsAdmin: Получение sessionId');
    console.log('URL path:', location.pathname);
    console.log('URL path parts:', location.pathname.split('/'));
    console.log('Last URL segment:', lastSegment);
    console.log('sessionIdFromPath:', sessionIdFromPath);
    console.log('Container sessionId:', containerSessionId);
    console.log('State sessionId:', location.state?.sessionId);
    console.log('Props sessionId:', paramSessionId);
    console.log('isAdminPage:', isAdminPage);
    console.log('isSessionPage:', isSessionPage);
    console.log('Источник sessionId:', sessionIdSource);
    console.log('Final sessionId:', finalSessionId);
    console.log('Used sessionId:', sessionId);
    console.log('fromDashboard:', fromDashboard);
    console.groupEnd();
  }
  
  // Mock data с той же структурой
  const [testResults, setTestResults] = useState<TestResultState>({
    candidateName: '',
    overallScore: 0,
    date: '',
    duration: '',
    parameters: [],
    recommendations: [],
    pricingEvaluation: {
      score: 0,
      strengths: [],
      weaknesses: [],
      level: 'Не определен',
      details: 'Информация отсутствует'
    },
    salesPerformance: {
      introduction: {
        score: 0,
        conversionRate: 0,
        strengths: [],
        weaknesses: []
      },
      warmup: {
        score: 0,
        conversionRate: 0,
        strengths: [],
        weaknesses: []
      },
      sales: {
        score: 0,
        conversionRate: 0,
        strengths: [],
        weaknesses: []
      }
    },
    dialogues: []
  });

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 4.0) return 'text-green-400';
    if (score >= 3.5) return 'text-blue-400';
    if (score >= 3.0) return 'text-blue-300';
    if (score >= 2.5) return 'text-yellow-400';
    if (score >= 2.0) return 'text-yellow-300';
    if (score >= 1.5) return 'text-orange-400';
    if (score >= 1.0) return 'text-orange-300';
    return 'text-red-500';
  };

  // Function to get background color class for parameter icon
  const getParameterBgClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'yellow': return 'bg-yellow-100 text-yellow-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'pink': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Function to get progress bar color based on percentage
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Function to render star rating
  const renderStars = (score: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  // Calculate overall score from metrics
  const calculateOverallScore = (metrics: Record<string, any>) => {
    const scores = [
      metrics.engagement.score,
      metrics.charm_and_tone.score,
      metrics.creativity.score,
      metrics.adaptability.score,
      metrics.self_promotion.score
    ];
    
    // Если есть ценовая политика, добавляем её оценку
    if (metrics.pricing_policy && metrics.pricing_policy.score) {
      scores.push(metrics.pricing_policy.score);
    }
    
    // Вычисляем среднее
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5
      }
    }
  };

  // Функция для загрузки списка всех сессий
  const loadAllSessions = async () => {
    if (!isAdminPage) return;
    
    try {
      setLoadingSessions(true);
      
      // Используем созданный API-маршрут для загрузки сессий
      logInfo('[TestResultsAdmin] Загрузка списка сессий через API');
      const response = await fetch('/api/test-sessions');
      
      if (!response.ok) {
        throw new Error(`Ошибка при загрузке списка сессий: ${response.statusText}`);
      }
      
      const sessions = await response.json();
      
      if (Array.isArray(sessions) && sessions.length > 0) {
        logInfo('[TestResultsAdmin] Загружены сессии:', sessions.length);
        setAllSessions(sessions);
      } else {
        console.warn('[TestResultsAdmin] Сессии не найдены, используем тестовые данные');
        // Создаем тестовый набор сессий для отображения
        const mockSessions = [
          { 
            id: 'test-id-1', 
            created_at: new Date().toISOString(), 
            employee_id: 'emp-1',
            start_time: new Date().toISOString(),
            end_time: null,
            completed: false,
            updated_at: new Date().toISOString(),
            employee: { first_name: 'Тестовый', last_name: 'Пользователь' } 
          },
          { 
            id: 'test-id-2', 
            created_at: new Date(Date.now() - 86400000).toISOString(), 
            employee_id: 'emp-2',
            start_time: new Date(Date.now() - 86400000).toISOString(),
            end_time: new Date(Date.now() - 86300000).toISOString(),
            completed: true,
            updated_at: new Date(Date.now() - 86300000).toISOString(),
            employee: { first_name: 'Иван', last_name: 'Петров' } 
          },
          { 
            id: 'test-id-3', 
            created_at: new Date(Date.now() - 172800000).toISOString(), 
            employee_id: 'emp-3',
            start_time: new Date(Date.now() - 172800000).toISOString(),
            end_time: new Date(Date.now() - 172700000).toISOString(),
            completed: true,
            updated_at: new Date(Date.now() - 172700000).toISOString(),
            employee: { first_name: 'Мария', last_name: 'Сидорова' } 
          },
        ];
        setAllSessions(mockSessions as TestSession[]);
      }
    } catch (error) {
      console.error('[TestResultsAdmin] Ошибка при загрузке списка сессий:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Добавляем улучшенную функцию для обработки имени кандидата
  const formatCandidateName = (name: string | null | undefined): string => {
    if (!name || name.trim() === '') return 'Неизвестный кандидат';
    if (name.toLowerCase().includes('неизвестный')) return 'Неизвестный кандидат';
    return name.trim();
  };

  // Загрузка данных при изменении sessionId
  useEffect(() => {
    loadData();
  }, [sessionId]);

  // Специальный эффект для бесшовной загрузки при переходе с дашборда
  useEffect(() => {
    // Если мы пришли с дашборда и есть сессия, запускаем предварительную загрузку
    if (fromDashboard && finalSessionId) {
      // Настраиваем начальное состояние анимации
      setDataLoaded(false);
      
      // Инициируем загрузку данных с небольшим таймаутом 
      // для того чтобы react успел отрисовать предварительную анимацию
      const timer = setTimeout(() => {
        loadData();
      }, 50); // Минимальная задержка для отрисовки UI
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Функция для преобразования результатов анализа в формат для отображения
  const processTestResults = (testResult: any, candidateName: string, testDate: string, testDuration: string, dialogues: Dialogue[]): TestResultState => {
    console.log('[TestResultsAdmin] Обработка результатов анализа...');
    
    // Проверяем и форматируем имя кандидата
    const formattedCandidateName = formatCandidateName(candidateName);
      
    if (!testResult || !testResult.analysis_result || !testResult.analysis_result.analysisResult) {
      console.warn('[TestResultsAdmin] Результаты анализа отсутствуют или имеют неверный формат');
      return {
        candidateName: formattedCandidateName,
        overallScore: 0,
        date: testDate,
        duration: testDuration,
        parameters: [],
        recommendations: [],
        pricingEvaluation: {
          score: 0,
          strengths: [],
          weaknesses: [],
          level: 'Не определен',
          details: 'Информация отсутствует'
        },
        salesPerformance: {
          introduction: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
          warmup: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
          sales: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] }
        },
        dialogues: dialogues || []
      };
    }
    
    try {
      const analysisData = testResult.analysis_result.analysisResult.dialog_analysis;
      const metrics = analysisData.metrics;
      
      // Рассчитываем общую оценку
      const overallScore = calculateOverallScore(metrics);
      
      // Преобразуем метрики в параметры для отображения
      const parameters = [
        {
          name: 'Вовлеченность',
          score: metrics.engagement.score,
          comment: metrics.engagement.verdict,
          icon: <MessageCircle className="w-5 h-5" />,
          color: 'blue'
        },
        {
          name: 'Обаяние и тон',
          score: metrics.charm_and_tone.score,
          comment: metrics.charm_and_tone.verdict,
          icon: <Smile className="w-5 h-5" />,
          color: 'yellow'
        },
        {
          name: 'Креативность',
          score: metrics.creativity.score,
          comment: metrics.creativity.verdict,
          icon: <Lightbulb className="w-5 h-5" />,
          color: 'purple'
        },
        {
          name: 'Адаптивность',
          score: metrics.adaptability.score,
          comment: metrics.adaptability.verdict,
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'green'
        },
        {
          name: 'Самопродвижение',
          score: metrics.self_promotion.score,
          comment: metrics.self_promotion.verdict,
          icon: <Star className="w-5 h-5" />,
          color: 'pink'
        }
      ];
      
      // Формируем рекомендации из общего заключения и result_summary
      const recommendationsArray = [];

      // Добавляем overall_conclusion, если он есть
      if (analysisData.overall_conclusion) {
        recommendationsArray.push(analysisData.overall_conclusion);
      }

      // Обрабатываем result_summary
      const recommendationsText = analysisData.result_summary || '';
      if (recommendationsText) {
        const splitRecommendations = recommendationsText
          .split('.')
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 10 && !r.includes('Рекомендации:'));
        
        // Добавляем найденные рекомендации в общий массив
        recommendationsArray.push(...splitRecommendations);
      }
      
      // Ценовая политика с дополнительными полями
      const pricingScore = metrics.pricing_policy?.score || 0;
      const pricingEvaluation = {
        score: pricingScore,
        strengths: metrics.pricing_policy?.strengths || [],
        weaknesses: metrics.pricing_policy?.improvements || [],
        // Добавляем уровень и детали
        level: pricingScore >= 4 ? 'Высокая' : 
               pricingScore >= 3 ? 'Средняя' : 
               pricingScore > 0 ? 'Низкая' : 'Не определен',
        details: metrics.pricing_policy?.verdict || 'Информация отсутствует'
      };
      
      // Стадии продаж с вычислением конверсии
      const salesPerformance = {
        introduction: {
          score: metrics.sales_stages?.introduction?.score || 0,
          conversionRate: Math.round((metrics.sales_stages?.introduction?.score || 0) * 20), // Преобразуем оценку 0-5 в процент 0-100
          strengths: metrics.sales_stages?.introduction?.strengths || [],
          weaknesses: metrics.sales_stages?.introduction?.weaknesses || []
        },
        warmup: {
          score: metrics.sales_stages?.warmup?.score || 0,
          conversionRate: Math.round((metrics.sales_stages?.warmup?.score || 0) * 20),
          strengths: metrics.sales_stages?.warmup?.strengths || [],
          weaknesses: metrics.sales_stages?.warmup?.weaknesses || []
        },
        sales: {
          score: metrics.sales_stages?.closing?.score || 0,
          conversionRate: Math.round((metrics.sales_stages?.closing?.score || 0) * 20),
          strengths: metrics.sales_stages?.closing?.strengths || [],
          weaknesses: metrics.sales_stages?.closing?.weaknesses || []
        }
      };
      
      console.log('[TestResultsAdmin] Данные успешно обработаны для отображения');
      
      // Возвращаем обработанные данные
      return {
        candidateName: formattedCandidateName,
        overallScore,
        date: testDate,
        duration: testDuration,
        parameters,
        recommendations: recommendationsArray,
        pricingEvaluation,
        salesPerformance,
        dialogues: dialogues || []
      };
    } catch (error) {
      console.error('[TestResultsAdmin] Ошибка при обработке результатов анализа:', error);
      return {
        candidateName: formattedCandidateName,
        overallScore: 0,
        date: testDate,
        duration: testDuration,
        parameters: [],
        recommendations: [],
        pricingEvaluation: {
          score: 0,
          strengths: [],
          weaknesses: [],
          level: 'Не определен',
          details: 'Ошибка при обработке данных'
        },
        salesPerformance: {
          introduction: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
          warmup: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
          sales: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] }
        },
        dialogues: dialogues || []
      };
    }
  };

  // Функция загрузки данных
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    logInfo('[TestResultsAdmin] Начинаем загрузку данных...');
    
    if (!sessionId && isAdminPage) {
      logInfo('[TestResultsAdmin] Это страница админ-панели, загружаем список сессий');
      await loadAllSessions();
      setLoading(false);
      return;
    }
    
    if (!sessionId && !force_load) {
      console.error('[TestResultsAdmin] Отсутствует ID сессии для загрузки данных');
      setError('Не указан ID сессии. Пожалуйста, вернитесь в панель управления и выберите сессию.');
      setLoading(false);
      return;
    }
    
    // Проверка формата sessionId с UUID только если не принудительная загрузка
    if (!force_load) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (sessionId && !uuidRegex.test(sessionId)) {
        console.error('[TestResultsAdmin] Неверный формат ID сессии, не соответствует UUID');
        setError(`Некорректный ID сессии: ${sessionId}`);
        setLoading(false);
        return;
      }
    }
    
    try {
      // Используем прямые API запросы вместо вызовов supabase
      logInfo('[TestResultsAdmin] Выполняем API запросы для получения данных...');
      
      if (isDevMode) {
        console.time('Время загрузки данных');
      }
      
      // Получаем информацию о сессии тестирования напрямую через API
      const sessionResponse = await fetch(`/api/test-sessions/${sessionId}`);
      
      if (!sessionResponse.ok) {
        throw new Error(`Ошибка при загрузке сессии: ${sessionResponse.statusText}`);
      }
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData || !sessionData.session) {
        throw new Error('Данные о сессии не найдены');
      }
      
      // Извлекаем данные сессии и чатов из ответа API
      const session = sessionData.session;
      const chats = sessionData.chats || [];
      
      console.log('[TestResultsAdmin] Получены данные сессии:', {
        sessionId: session.id,
        employee: session.employee,
        created_at: session.created_at,
        chatsCount: chats.length
      });
      
      // Получаем результаты тестирования через API
      const testResultResponse = await fetch(`/api/test-results/${sessionId}`);
      
      // Обрабатываем результаты тестирования, даже если их нет
      let testResultData = null;
      if (testResultResponse.ok) {
        testResultData = await testResultResponse.json();
        console.log('[TestResultsAdmin] Получены результаты тестирования:', {
          resultId: testResultData.id,
          hasAnalysis: !!testResultData.analysis_result
        });
      } else if (testResultResponse.status !== 404) {
        // Если статус не 404 (Not Found), то это ошибка
        console.error('[TestResultsAdmin] Ошибка при загрузке результатов:', testResultResponse.statusText);
      } else {
        console.warn('[TestResultsAdmin] Результаты тестирования не найдены для сессии');
      }
      
      if (isDevMode) {
        console.timeEnd('Время загрузки данных');
      }
      
      // Обрабатываем историю чатов
      const formattedDialogues = formatDialogues(chats || []);
      
      // Обрабатываем данные кандидата из сессии
      const candidateName = session.employee && session.employee.first_name 
        ? `${session.employee.first_name} ${session.employee.last_name || ''}`.trim()
        : 'Неизвестный кандидат';
      
      // Обрабатываем дату и продолжительность
      const testDate = formatDate(session.created_at);
      const testDuration = calculateTestDuration(session.start_time, session.end_time);
      
      // Обрабатываем результаты тестирования
      const processedResults = processTestResults(
        testResultData, 
        candidateName, 
        testDate, 
        testDuration, 
        formattedDialogues
      );
      
      // Устанавливаем обработанные результаты
      setTestResult(processedResults);
      setTestResults(processedResults); // Устанавливаем также в дубликат для отображения
      
      // Устанавливаем диалоги отдельно, чтобы они всегда были доступны
      setDialogues(formattedDialogues || []);
      setChats(chats || []);
      
      // Если диалоги есть, выбираем первый
      if (formattedDialogues && formattedDialogues.length > 0) {
        setSelectedDialogue(formattedDialogues[0].id);
      }
      
      // Устанавливаем флаг загрузки данных
      setDataLoaded(true);
      
      if (!testResultData) {
        setWarning('Результаты анализа для этой сессии отсутствуют, но вы можете просмотреть диалоги');
      } else {
        logInfo('[TestResultsAdmin] Результаты анализа успешно загружены');
      }
      
      // Добавляем дополнительную диагностику
      debug(sessionId, chats, processedResults);
      
    } catch (error) {
      console.error('[TestResultsAdmin] Ошибка при загрузке данных:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(`Произошла ошибка при загрузке данных: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указана';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Неверный формат даты';
    }
  };

  // Функция для форматирования диалогов из чатов
  const formatDialogues = (chatHistory: Chat[]): Dialogue[] => {
    if (!chatHistory || chatHistory.length === 0) {
      return [];
    }
    
    // Массив имен персонажей
    const characterNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
    
    const dialogues: Dialogue[] = chatHistory.map((chat: Chat) => ({
      id: chat.id,
      title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
      date: formatDate(chat.created_at || ''),
      score: 85,
      messages: Array.isArray(chat.messages) ? chat.messages.map((msg: ChatMessage, msgIndex: number): DialogueMessage => ({
        id: `msg-${msgIndex}`,
        time: new Date(msg.time || chat.created_at || Date.now()).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        content: msg.content || '',
        isOwn: Boolean(msg.isOwn),
        isRead: Boolean(msg.isRead),
        role: Boolean(msg.isOwn) ? 'user' : 'assistant'
      })) : []
    }));
    
    // Сортируем диалоги по номеру чата
    dialogues.sort((a, b) => {
      const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
      const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
      return aNumber - bNumber;
    });
    
    return dialogues;
  };

  // Функция для вычисления продолжительности теста
  const calculateTestDuration = (startTime: string | null | undefined, endTime: string | null | undefined): string => {
    if (!startTime) {
      return 'Не начат';
    }
    
    if (!endTime) {
      return 'Не завершен';
    }
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      if (durationMinutes < 1) {
        return 'Меньше минуты';
      } else if (durationMinutes < 60) {
        return `${durationMinutes} мин.`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours} ч. ${minutes > 0 ? `${minutes} мин.` : ''}`;
      }
    } catch (error) {
      console.error('Ошибка при расчете продолжительности теста:', error);
      return 'Ошибка расчёта';
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <div className="mx-auto py-8 px-4">
        {/* Заголовок - оставляем только здесь кнопку назад */}
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/admin'} 
            className="p-2 bg-[#2a2a2a] rounded-full hover:bg-[#3a3a3a] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Результаты тестирования</h1>
            <p className="text-gray-400">Детальный анализ диалогов</p>
          </div>
        </div>

        {/* Основное содержимое */}
        {loading ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Загрузка результатов...</p>
            
            {/* Скелетон для бесшовной загрузки при переходе с дашборда */}
            {fromDashboard && (
              <motion.div 
                className="w-full max-w-4xl mx-auto mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] mb-6">
                  <div className="h-8 w-64 bg-[#3d3d3d] rounded-md mb-4 animate-pulse"></div>
                  <div className="h-4 w-full bg-[#3d3d3d] rounded-md mb-2 animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-[#3d3d3d] rounded-md animate-pulse"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
                    <div className="h-6 w-48 bg-[#3d3d3d] rounded-md mb-6 animate-pulse"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
                          <div className="h-5 w-full bg-[#3d3d3d] rounded-md mb-2 animate-pulse"></div>
                          <div className="h-4 w-3/4 bg-[#3d3d3d] rounded-md animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
                    <div className="h-6 w-40 bg-[#3d3d3d] rounded-md mb-6 animate-pulse"></div>
                    <div className="space-y-4">
                      <div className="h-5 w-full bg-[#3d3d3d] rounded-md mb-2 animate-pulse"></div>
                      <div className="h-4 w-2/3 bg-[#3d3d3d] rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-semibold">Ошибка загрузки данных</h3>
            </div>
            <p className="text-gray-400 mb-6">{error}</p>
            
            {isAdminPage && (
              <>
                <div className="mb-6">
                  <h4 className="font-medium text-white text-lg mb-3">Доступные сессии тестирования:</h4>
                  
                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-500/20 rounded-full animate-spin"></div>
                    </div>
                  ) : allSessions.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {allSessions.map(session => (
                        <div 
                          key={session.id}
                          className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3d3d3d] hover:border-blue-500 transition-all cursor-pointer"
                          onClick={() => navigate(`/admin/session/${session.id}`)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">
                                {session.employee ? 
                                  `${session.employee.first_name || ''}`.trim() :
                                  'Неизвестный кандидат'}
                              </h5>
                              <p className="text-sm text-gray-400">{formatDate(session.created_at)}</p>
                            </div>
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                              <ArrowLeft className="w-5 h-5 transform rotate-180" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#2a2a2a] rounded-lg">
                      <p className="text-gray-400">Нет доступных сессий тестирования</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => loadAllSessions()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Обновить список сессий
                  </button>
                </div>
              </>
            )}
          </div>
        ) : !dataLoaded ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Получение данных анализа...</p>
          </div>
        ) : (
          <>
            {/* Основной контент, показываем только если есть реальные данные */}
            {testResults && dialogues.length > 0 ? (
              <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
                {/* Удаляем дублирующийся заголовок, оставляем только информацию о кандидате */}
                <div className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-gray-400">
                      <span className="font-medium text-white">Кандидат:</span> {testResults.candidateName || 'Неизвестный кандидат'} | 
                      <span className="font-medium text-white ml-2">Дата:</span> {testResults.date || 'Не указана'}
                    </p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Overall Score Card */}
                  <motion.div 
                    className="lg:col-span-3 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <h2 className="text-xl font-semibold text-gray-300 mb-2">Общая оценка</h2>
                      <div>
                        <span className={`text-5xl font-bold ${getScoreColorClass(testResults.overallScore)}`}>
                          {testResults.overallScore.toFixed(1)}
                        </span>
                        <span className="text-2xl text-gray-400">/ 5</span>
                      </div>
                      <div className="flex items-center gap-1 mb-4">
                        {renderStars(Math.round(testResults.overallScore))}
                      </div>
                      <div className="w-full max-w-md h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(testResults.overallScore / 5) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Detailed Parameters */}
                  <motion.div 
                    className="lg:col-span-2 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="text-xl font-semibold mb-6">Детальные результаты</h3>
                    
                    <div className="space-y-6">
                      {testResults.parameters.map((param, index) => (
                        <motion.div 
                          key={index}
                          variants={itemVariants}
                          className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${getParameterBgClass(param.color)}`}>
                              {param.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-medium">{param.name}</h4>
                                <div className="flex items-center gap-1">
                                  {renderStars(param.score)}
                                </div>
                              </div>
                              <p className="text-gray-400">{param.comment}</p>
                              <div className="mt-2 text-right">
                                <span className={`${getScoreColorClass(param.score)} font-semibold`}>{param.score.toFixed(1)}</span>
                                <span className="text-gray-400 text-sm"> / 5</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Pricing Evaluation */}
                  <motion.div 
                    className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]"
                    variants={fadeInVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-pink-500" />
                      Ценовая политика
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Оценка:</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${getScoreColorClass(testResults.pricingEvaluation.score)}`}>
                            {testResults.pricingEvaluation.score.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-400">/ 5</span>
                        </div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Уровень цен:</span>
                          <span className="font-medium text-blue-400">{testResults.pricingEvaluation.level}</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{testResults.pricingEvaluation.details}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Сильные стороны
                        </h4>
                        <ul className="text-sm space-y-1">
                          {testResults.pricingEvaluation.strengths.map((strength, idx) => (
                            <li key={idx} className="text-gray-300 flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {testResults.pricingEvaluation.weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Требуют улучшения
                          </h4>
                          <ul className="text-sm space-y-1">
                            {testResults.pricingEvaluation.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-gray-300 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Sales Performance Section */}
                  <motion.div 
                    className="lg:col-span-3 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-pink-500" />
                      Эффективность продаж
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Introduction Section */}
                      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h3 className="font-semibold">Знакомство</h3>
                           </div>
                          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColorClass(testResults.salesPerformance.introduction.score)}`}>
                            {testResults.salesPerformance.introduction.score.toFixed(1)}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Конверсия</span>
                            <span className="font-medium">{testResults.salesPerformance.introduction.conversionRate}%</span>
                          </div>
                          <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${getProgressBarColor(testResults.salesPerformance.introduction.conversionRate)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${testResults.salesPerformance.introduction.conversionRate}%` }}
                              transition={{ duration: 1, delay: 0.7 }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Сильные стороны
                            </h4>
                            <ul className="text-sm space-y-1">
                              {testResults.salesPerformance.introduction.strengths.map((strength, idx) => (
                                <li key={idx} className="text-gray-300 flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {strength}
                                </li>
                              ))}
                             </ul>
                          </div>

                          {testResults.salesPerformance.introduction.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Области для улучшения
                              </h4>
                              <ul className="text-sm space-y-1">
                                {testResults.salesPerformance.introduction.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Warmup Section */}
                      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold">Прогрев</h3>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColorClass(testResults.salesPerformance.warmup.score)}`}>
                            {testResults.salesPerformance.warmup.score.toFixed(1)}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Конверсия</span>
                            <span className="font-medium">{testResults.salesPerformance.warmup.conversionRate}%</span>
                          </div>
                          <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${getProgressBarColor(testResults.salesPerformance.warmup.conversionRate)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${testResults.salesPerformance.warmup.conversionRate}%` }}
                              transition={{ duration: 1, delay: 0.8 }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Сильные стороны
                            </h4>
                            <ul className="text-sm space-y-1">
                              {testResults.salesPerformance.warmup.strengths.map((strength, idx) => (
                                <li key={idx} className="text-gray-300 flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {strength}
                                </li>
                              ))}
                             </ul>
                          </div>

                          {testResults.salesPerformance.warmup.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Области для улучшения
                              </h4>
                              <ul className="text-sm space-y-1">
                                {testResults.salesPerformance.warmup.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sales Section */}
                      <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <h3 className="font-semibold">Продажи</h3>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColorClass(testResults.salesPerformance.sales.score)}`}>
                            {testResults.salesPerformance.sales.score.toFixed(1)}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Конверсия</span>
                            <span className="font-medium">{testResults.salesPerformance.sales.conversionRate}%</span>
                          </div>
                          <div className="h-2 bg-[#2d2d2d] rounded-full overflow-hidden">
                            <motion.div 
                              className={`h-full ${getProgressBarColor(testResults.salesPerformance.sales.conversionRate)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${testResults.salesPerformance.sales.conversionRate}%` }}
                              transition={{ duration: 1, delay: 0.9 }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Сильные стороны
                            </h4>
                            <ul className="text-sm space-y-1">
                              {testResults.salesPerformance.sales.strengths.map((strength, idx) => (
                                <li key={idx} className="text-gray-300 flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {testResults.salesPerformance.sales.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Области для улучшения
                              </h4>
                              <ul className="text-sm space-y-1">
                                {testResults.salesPerformance.sales.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div 
                    className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]"
                    variants={fadeInVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="text-xl font-semibold mb-6">Рекомендации и заключение</h3>
                    
                    <div className="space-y-4">
                      {testResults.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-300">{rec}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 space-y-4">
                      <h4 className="text-lg font-medium">Действия</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] hover:bg-[#3d3d3d] transition-colors">
                          <Download className="w-5 h-5 text-blue-400" />
                          <span>Скачать отчет</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] hover:bg-[#3d3d3d] transition-colors">
                          <Share2 className="w-5 h-5 text-green-400" />
                          <span>Поделиться</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] hover:bg-[#3d3d3d] transition-colors sm:col-span-2">
                          <Printer className="w-5 h-5 text-purple-400" />
                          <span>Распечатать результаты</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Dialogue History */}
                  <motion.div 
                    className="lg:col-span-2 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]"
                    variants={fadeInVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-500" />
                      История диалогов
                    </h3>

                    {dialogues.length > 0 ? (
                      <div className="space-y-6">
                        {/* Dialog List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dialogues.map((dialogue) => (
                            <div 
                              key={dialogue.id} 
                              className={`p-4 rounded-lg border ${selectedDialogue === dialogue.id ? 'bg-[#3d3d3d] border-purple-500' : 'bg-[#1a1a1a] border-[#3d3d3d] hover:bg-[#262626] hover:border-[#4d4d4d]'} cursor-pointer transition-colors`}
                              onClick={() => setSelectedDialogue(dialogue.id)}
                            >
                              <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-medium">{dialogue.title}</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-[#2d2d2d] text-gray-300">{dialogue.date}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-400">
                                {dialogue.messages && dialogue.messages.length > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    {dialogue.messages.length} сообщений
                                  </span>
                                ) : (
                                  <span className="text-yellow-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Нет сообщений
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Selected Dialog */}
                        {selectedDialogue && dialogues.length > 0 && (
                          <div className="mt-6 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] p-4">
                            <h4 className="font-medium mb-4">
                              {dialogues.find(d => d.id === selectedDialogue)?.title || 'Диалог'}
                            </h4>
                            
                            <div className="space-y-4">
                              {(() => {
                                // Получаем объект диалога, чтобы не выполнять поиск многократно
                                const currentDialogue = dialogues.find(d => d.id === selectedDialogue);
                                
                                if (!currentDialogue || !currentDialogue.messages || currentDialogue.messages.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-gray-400">
                                      <AlertCircle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                                      <p>В этом диалоге пока нет сообщений.</p>
                                    </div>
                                  );
                                }
                                
                                // Добавляем отладочную информацию в консоль
                                console.log("Отображаем диалог:", 
                                  currentDialogue.messages.map(m => ({
                                    isOwn: m.isOwn,
                                    content: m.content,
                                    hasBoughtTag: !m.isOwn && m.content.includes('[Bought]'),
                                    hasNotBoughtTag: !m.isOwn && m.content.includes('[Not Bought]')
                                  }))
                                );
                                
                                return currentDialogue.messages.map((message, index) => {
                                  // ВАЖНО: Всегда очищаем текст сообщения от тегов перед отображением
                                  // Эта строка критична для устранения тегов из интерфейса
                                  const displayContent = cleanMessageTags(message.content);
                                  
                                  // Отладочная информация
                                  console.log(`Очистка сообщения #${index}`, {
                                    original: message.content,
                                    cleaned: displayContent,
                                    hasTags: message.content.includes('[Bought]') || message.content.includes('[Not Bought]')
                                  });
                                  
                                  // Проверяем, содержит ли сообщение фото
                                  const imageMatch = displayContent.match(/\[Photo (\d+)\] \[(.*?)\]/);
                                  
                                  // Информация о цене и статусе покупки
                                  const priceMatch = message.content.match(/\[Price: (.*?)\]/);
                                  const price = priceMatch ? priceMatch[1] : null;
                                  
                                  // Проверяем, есть ли сообщение с тегом [Bought] после фото
                                  let isPaid = false;
                                  if (message.isOwn && imageMatch && price && price !== 'FREE') {
                                    // Используем функцию для проверки статуса покупки
                                    isPaid = checkPhotoPurchaseStatus(currentDialogue.messages, index);
                                  }
                                  
                                  return (
                                    <div
                                      key={message.id}
                                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[80%] p-3 rounded-lg ${
                                          message.isOwn
                                            ? 'bg-purple-900 text-white rounded-tr-none' 
                                            : 'bg-[#2d2d2d] text-gray-200 rounded-tl-none'
                                        }`}
                                      >
                                        <div className="text-xs text-gray-400 mb-1 flex justify-between">
                                          <span>{message.isOwn ? 'Соискатель' : 'AI-клиент'}</span>
                                          <span>{message.time}</span>
                                        </div>
                                        {imageMatch ? (
                                          <div className="mt-1 rounded-md overflow-hidden">
                                            <img 
                                              src={`/foto/${imageMatch[1]}.jpg`}
                                              alt="Отправленное изображение" 
                                              className="max-w-[200px] h-auto rounded-md border border-[#3d3d3d]"
                                            />
                                            {price && price !== 'FREE' && (
                                              <div className="flex items-center justify-end gap-2 mt-1">
                                                <span className="text-xs text-white font-bold flex items-center gap-1">
                                                  <span>${price && `${price.replace('$', '')}`}</span>
                                                  <span className="text-gray-400 mx-1.5">•</span>
                                                  <span>{isPaid ? 'paid' : 'not paid'}</span>
                                                  {isPaid ? (
                                                    <Check className="w-3 h-3 text-green-500" />
                                                  ) : (
                                                    <Check className="w-3 h-3 text-gray-400" />
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <p>{displayContent}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                        <h4 className="text-xl font-medium mb-2">История диалогов отсутствует</h4>
                        <p className="text-gray-400 mb-4">Для данной сессии не найдены диалоги.</p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            ) : warning ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-xl font-semibold">Предупреждение</h3>
                </div>
                <p className="text-gray-400 mb-6">{warning}</p>
                
                {dialogues.length > 0 && (
                  <div className="bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d] mt-4">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-500" />
                      История диалогов
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dialogues.map((dialogue) => (
                        <div 
                          key={dialogue.id} 
                          className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3d3d3d] hover:bg-[#262626] hover:border-[#4d4d4d] cursor-pointer transition-colors"
                          onClick={() => setSelectedDialogue(dialogue.id)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium">{dialogue.title}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#2d2d2d] text-gray-300">{dialogue.date}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {dialogue.messages?.length || 0} сообщений
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h4 className="text-xl font-medium mb-2">Данные не найдены</h4>
                <p className="text-gray-400 mb-4">Не удалось загрузить данные для этой сессии.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TestResultsAdmin;