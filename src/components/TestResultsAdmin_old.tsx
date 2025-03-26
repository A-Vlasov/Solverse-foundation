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
  duration: string;
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
const debug = (sessionId: string, chats: Chat[], testResult: TestResult | null) => {
  console.log('=== ДИАГНОСТИКА ДАННЫХ СЕССИИ ===');
  console.log('SessionId:', sessionId);
  console.log('Формат URL страницы должен быть: /admin/session/:sessionId');
  console.log('Chats:', {
    count: chats.length,
    withMessages: chats.filter(c => c.messages && c.messages.length > 0).length,
    chatNumbers: chats.map(c => c.chat_number),
    messagesCounts: chats.map(c => (c.messages ? c.messages.length : 0))
  });
  console.log('Test Result:', testResult ? {
    id: testResult.id,
    hasAnalysisResult: !!testResult.analysis_result,
    metrics: testResult.analysis_result?.dialog_analysis?.metrics ? 
      Object.keys(testResult.analysis_result.dialog_analysis.metrics) : 
      'отсутствуют'
  } : 'отсутствует');
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

// Добавляем функцию определения статуса покупки фотографии прямо перед возвратом компонента
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
  const { sessionId: paramSessionId } = useParams<{ sessionId: string }>();
  
  // Дополнительно проверяем URL напрямую
  const pathSegments = location.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  const sessionId = paramSessionId || lastSegment;
  
  console.log('URL path:', location.pathname);
  console.log('Extracted sessionId from URL:', sessionId);

  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [testResult, setTestResult] = useState<TestResultState>({
    candidateName: '',
    overallScore: 0,
    date: '',
    duration: '',
    parameters: [],
    recommendations: [],
    pricingEvaluation: {
      score: 0,
      strengths: [],
      weaknesses: []
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

  // Mock data - поменяем на пустой объект с той же структурой
  const [testResults, setTestResults] = useState({
    candidateName: '',
    overallScore: 0,
    date: '',
    duration: '',
    parameters: [],
    recommendations: [],
    pricingEvaluation: {
      score: 0,
      strengths: [],
      weaknesses: []
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
    if (score >= 3.5) return 'text-blue-500';
    if (score >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Function to get background color class based on parameter color
  const getParameterBgClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-500',
      'purple': 'bg-purple-500',
      'yellow': 'bg-yellow-500',
      'green': 'bg-green-500',
      'pink': 'bg-pink-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  // Function to get progress bar color based on percentage
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-500 to-green-400';
    if (percentage >= 60) return 'bg-gradient-to-r from-blue-500 to-blue-400';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  };

  // Function to render stars based on score
  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index} 
        className={`w-5 h-5 ${index < score ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} 
      />
    ));
  };

  // Рассчитываем среднюю оценку по всем метрикам
  const calculateOverallScore = (metrics: Record<string, any>) => {
    if (!metrics) return 0;
    
    const scores = [
      metrics.engagement.score,
      metrics.charm_and_tone.score,
      metrics.creativity.score,
      metrics.adaptability.score,
      metrics.self_promotion.score,
      metrics.pricing_policy?.score || 0 // Добавляем ценовую политику, если она есть
    ];
    
    // Рассчитываем среднее значение
    const validScores = scores.filter(score => score > 0);
    const sum = validScores.reduce((acc, score) => acc + score, 0);
    return validScores.length > 0 ? sum / validScores.length : 0;
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

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDataLoaded(false);

        console.log('Loading data for sessionId:', sessionId);

        // Проверяем, передан ли ID сессии в URL
        if (sessionId) {
          console.log('Trying to load test session:', sessionId);
          
          // Получаем информацию о сессии (независимо от результатов анализа)
          try {
            const session = await getTestSession(sessionId);
            console.log('Session loaded:', session);
            
            if (session) {
              // Загружаем историю чатов независимо от результатов анализа
              console.log('Loading chat history for session:', sessionId);
              const chatHistory = await getChatHistory(sessionId);
              console.log('Chat history loaded, chats count:', chatHistory?.length || 0);
              setChats(chatHistory || []);
              
              // Обновляем основную информацию о сессии
              setTestResults(prev => ({
                ...prev,
                candidateName: session.employee ? 
                  `${session.employee.first_name}` : 
                  'Неизвестный соискатель',
                date: new Date(session.created_at).toLocaleDateString(),
                duration: session.end_time ? 
                  `${Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} минут` : 
                  'В процессе'
              }));
              
              // Преобразуем чаты в формат диалогов для отображения
              if (chatHistory && chatHistory.length > 0) {
                // Массив имен персонажей
                const characterNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
                
                const newDialogues: Dialogue[] = chatHistory.map((chat, index) => ({
                  id: chat.id,
                  title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
                  date: new Date(chat.created_at).toLocaleDateString(),
                  duration: '15 минут',
                  score: 85,
                  messages: Array.isArray(chat.messages) ? chat.messages.map((msg, msgIndex): DialogueMessage => ({
                    id: `msg-${msgIndex}`,
                    time: new Date(session.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    content: msg.content,
                    isOwn: msg.isOwn,
                    isRead: msg.isRead,
                    role: msg.isOwn ? 'user' : 'assistant'
                  })) : []
                }));

                // Сортируем диалоги по номеру чата
                newDialogues.sort((a, b) => {
                  const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
                  const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
                  return aNumber - bNumber;
                });

                setDialogues(newDialogues);
              } else {
                console.log('No chat history found or empty chats');
                setDialogues([]);
              }
            }
          } catch (sessionError) {
            console.error('Error loading session:', sessionError);
          }
          
          // Загружаем результаты анализа для сессии (отдельно от базовой информации)
          try {
            console.log('Loading test results for session:', sessionId);
            const result = await getTestResultForSession(sessionId);
            console.log('Test results loaded:', result?.id ? 'Found' : 'Not found');
            
            if (result && result.analysis_result) {
              setTestResult(result);
              const analysis = result.analysis_result.dialog_analysis;
              
              // Рассчитываем общую оценку
              const overallScore = calculateOverallScore(analysis.metrics);
              
              // Обновляем тестовые результаты реальными данными
              setTestResults(prev => ({
                ...prev,
                overallScore: parseFloat(overallScore.toFixed(1)),
                parameters: [
                  {
                    name: 'Вовлеченность',
                    score: analysis.metrics.engagement.score,
                    comment: analysis.metrics.engagement.verdict,
                    icon: <MessageCircle className="w-6 h-6" />,
                    color: 'blue'
                  },
                  {
                    name: 'Обаяние и тон',
                    score: analysis.metrics.charm_and_tone.score,
                    comment: analysis.metrics.charm_and_tone.verdict,
                    icon: <Smile className="w-6 h-6" />,
                    color: 'purple'
                  },
                  {
                    name: 'Креативность',
                    score: analysis.metrics.creativity.score,
                    comment: analysis.metrics.creativity.verdict,
                    icon: <Lightbulb className="w-6 h-6" />,
                    color: 'yellow'
                  },
                  {
                    name: 'Адаптивность',
                    score: analysis.metrics.adaptability.score,
                    comment: analysis.metrics.adaptability.verdict,
                    icon: <RefreshCw className="w-6 h-6" />,
                    color: 'green'
                  },
                  {
                    name: 'Умение продавать себя',
                    score: analysis.metrics.self_promotion.score,
                    comment: analysis.metrics.self_promotion.verdict,
                    icon: <DollarSign className="w-6 h-6" />,
                    color: 'pink'
                  }
                ],
                // Обновляем данные о ценовой политике, если они доступны
                ...(analysis.metrics.pricing_policy ? {
                  pricingEvaluation: {
                    score: analysis.metrics.pricing_policy.score,
                    level: analysis.metrics.pricing_policy.score >= 4 ? 'Высокая' : 
                           analysis.metrics.pricing_policy.score >= 3 ? 'Средняя' : 'Низкая',
                    strengths: analysis.metrics.pricing_policy.strengths || [],
                    weaknesses: analysis.metrics.pricing_policy.improvements || [],
                    details: analysis.metrics.pricing_policy.verdict
                  }
                } : {}),
                
                // Обновляем данные о трех этапах продаж, если они доступны
                ...(analysis.metrics.sales_stages ? {
                  salesPerformance: {
                    introduction: {
                      score: analysis.metrics.sales_stages.introduction.score,
                      conversionRate: Math.round(analysis.metrics.sales_stages.introduction.score * 20), // Преобразуем оценку 0-5 в процент 0-100
                      strengths: analysis.metrics.sales_stages.introduction.strengths || [],
                      weaknesses: analysis.metrics.sales_stages.introduction.weaknesses || []
                    },
                    warmup: {
                      score: analysis.metrics.sales_stages.warmup.score,
                      conversionRate: Math.round(analysis.metrics.sales_stages.warmup.score * 20),
                      strengths: analysis.metrics.sales_stages.warmup.strengths || [],
                      weaknesses: analysis.metrics.sales_stages.warmup.weaknesses || []
                    },
                    sales: {
                      score: analysis.metrics.sales_stages.closing.score,
                      conversionRate: Math.round(analysis.metrics.sales_stages.closing.score * 20),
                      strengths: analysis.metrics.sales_stages.closing.strengths || [],
                      weaknesses: analysis.metrics.sales_stages.closing.weaknesses || []
                    }
                  }
                } : {}),
                
                recommendations: analysis.result_summary ? [analysis.result_summary] : ['Нет рекомендаций']
              }));
            } else {
              console.log('Test results not found or analysis not available, using default scores');
            }
          } catch (resultError) {
            console.error('Error loading test results:', resultError);
          }
          
          // Вызываем функцию диагностики после загрузки данных
          debug(sessionId, chats, testResult);
          
          // После успешной загрузки данных
          setDataLoaded(true);
        } else if (location.state?.employeeId) {
          // Если передан ID сотрудника через location.state, используем его
          const employeeId = location.state.employeeId;
          console.log('Loading data by employeeId:', employeeId);
          await loadChatHistory(employeeId);
          
          // После успешной загрузки данных
          setDataLoaded(true);
        } else {
          // Если нет ни ID сессии, ни ID сотрудника, используем тестовые данные
          console.log('Using mock data, no sessionId or employeeId provided');
          setLoading(false);
          setDataLoaded(true);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Ошибка при загрузке данных. Используются тестовые данные.');
        setDataLoaded(true);
      } finally {
        setLoading(false);
        
        // Дополнительная диагностика после завершения загрузки
        if (sessionId) {
          debug(sessionId, chats, testResult);
        }
      }
    };
    
    loadData();
  }, [sessionId, location.state?.employeeId, location.pathname]);

  // Обновляем функцию loadChatHistory для обработки сообщений
  const loadChatHistory = async (employeeId: string) => {
    try {
      console.log('Loading employee test sessions for:', employeeId);
      const employeeSessions = await getEmployeeTestSessions(employeeId);
      console.log('Employee sessions found:', employeeSessions.length);
          
      if (employeeSessions.length > 0) {
        const latestSession = employeeSessions[0];
        console.log('Using latest session:', latestSession.id);
            
        const chatHistory = await getChatHistory(latestSession.id);
        console.log('Chats loaded for session:', chatHistory.length);
        setChats(chatHistory);

        // Массив имен персонажей
        const characterNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];

        // Преобразуем чаты в диалоги с обработкой тегов покупки
        const newDialogues = chatHistory.map((chat, index) => {
          // Создаем массив для обработанных сообщений
          const processedMessages: DialogueMessageWithPurchaseInfo[] = [];
          
          // Обрабатываем каждое сообщение
          for (let i = 0; i < chat.messages.length; i++) {
            const msg = chat.messages[i];
            
            // Создаем обработанное сообщение
            const processedMsg: DialogueMessageWithPurchaseInfo = {
              ...msg,
              id: `msg-${chat.id}-${i}`,
              time: new Date(msg.time || latestSession.created_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              role: msg.isOwn ? 'user' : 'assistant',
              content: msg.content // Содержимое пока оставляем без изменений
            };
            
            // Проверяем сообщения от бота
            if (!msg.isOwn) {
              // Проверяем наличие тега [Bought]
              const hasBoughtTag = msg.content.includes('[Bought]');
              console.log('Message from bot:', msg.content, 'Has bought tag:', hasBoughtTag);
              
              if (hasBoughtTag) {
                // Ищем последнее фото от пользователя
                for (let j = i - 1; j >= 0; j--) {
                  if (chat.messages[j].isOwn && chat.messages[j].content.includes('[Фото')) {
                    console.log('Found photo message:', chat.messages[j].content);
                    
                    // Ищем информацию о цене
                    const priceMatch = chat.messages[j].content.match(/\[Цена: (.*?)\]/);
                    const price = priceMatch ? priceMatch[1] : null;
                    
                    if (price && price !== 'FREE') {
                      // Находим сообщение с фото в обработанных сообщениях
                      const photoIndex = processedMessages.findIndex(m => m.id === `msg-${chat.id}-${j}`);
                      
                      if (photoIndex !== -1) {
                        console.log('Updating photo message with bought status');
                        processedMessages[photoIndex].bought = true;
                        processedMessages[photoIndex].price = price;
                      }
                    }
                    break;
                  }
                }
              }
              
              // Очищаем сообщение от тегов
              processedMsg.content = cleanMessageTags(msg.content);
            } else {
              // Проверяем сообщения пользователя на наличие цены
              const priceMatch = msg.content.match(/\[Цена: (.*?)\]/);
              if (priceMatch && priceMatch[1] !== 'FREE') {
                processedMsg.price = priceMatch[1];
              }
            }
            
            // Добавляем обработанное сообщение в массив
            processedMessages.push(processedMsg);
          }
          
          // Создаем объект диалога с обработанными сообщениями
          return {
            id: chat.id,
            title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
            date: new Date(chat.created_at).toLocaleDateString(),
            duration: '15 минут',
            score: 85,
            messages: processedMessages
          };
        });

        // Сортируем диалоги по имени персонажа
        newDialogues.sort((a, b) => {
          const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
          const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
          return aNumber - bNumber;
        });

        setDialogues(newDialogues);
        
        // Обновляем информацию о кандидате
        const firstName = latestSession?.employee?.first_name || '';
        const employeeName = firstName ? firstName : 'Неизвестный сотрудник';
        
        setTestResults(prev => ({
          ...prev,
          candidateName: employeeName,
          date: new Date(latestSession.created_at).toLocaleDateString(),
          duration: latestSession.end_time 
            ? `${Math.round((new Date(latestSession.end_time).getTime() - new Date(latestSession.created_at).getTime()) / 60000)} минут`
            : 'В процессе'
        }));
      } else {
        console.log('No test sessions found for employee');
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Ошибка при загрузке истории чатов');
    }
  };

  // Добавим простую проверку на наличие данных
  const hasRealData = () => {
    return testResults.candidateName !== '' && testResults.parameters.length > 0;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <div className="mx-auto py-8 px-4">
        {/* Заголовок */}
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')} 
            className="p-2 bg-[#2a2a2a] rounded-full hover:bg-[#3a3a3a] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Результаты тестирования</h1>
            <p className="text-gray-400">Детальный анализ диалогов</p>
          </div>
        </div>

        {/* Основное содержимое - добавляем условие для отображения */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Загрузка результатов...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка загрузки данных</h3>
            <p className="text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-all"
            >
              Попробовать снова
            </button>
          </div>
        ) : !dataLoaded ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Получение данных анализа...</p>
          </div>
        ) : (
          <>
            {/* Основной контент, показываем только если есть реальные данные */}
            <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
              {/* Header - убираем дублирующуюся кнопку назад */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-2xl font-bold">Результаты теста модели (Админ-панель)</h1>
                  <p className="text-gray-400 mt-1">Кандидат: {testResults.candidateName} | Дата: {testResults.date} | Продолжительность: {testResults.duration}</p>
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
                        {testResults.overallScore}
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
                  <h3 className="text-xl font-semibold mb-6">Рекомендации</h3>
                  
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
                              <span>{dialogue.duration}</span>
                              {dialogue.messages.length > 0 ? (
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
                      {selectedDialogue && (
                        <div className="mt-6 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] p-4">
                          <h4 className="font-medium mb-4">
                            {dialogues.find(d => d.id === selectedDialogue)?.title}
                          </h4>
                          
                          <div className="space-y-4">
                            {selectedDialogue && dialogues.find(d => d.id === selectedDialogue)?.messages?.length > 0 ? (
                              (() => {
                                // Получаем объект диалога, чтобы не выполнять поиск многократно
                                const currentDialogue = dialogues.find(d => d.id === selectedDialogue);
                                if (!currentDialogue) return null;
                                
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
                                  const imageMatch = displayContent.match(/\[Фото (\d+)\] \[(.*?)\]/);
                                  
                                  // Информация о цене и статусе покупки
                                  const priceMatch = message.content.match(/\[Цена: (.*?)\]/);
                                  const price = priceMatch ? priceMatch[1] : null;
                                  
                                  // Проверяем, есть ли сообщение с тегом [Bought] после фото
                                  let isPaid = false;
                                  if (message.isOwn && imageMatch && price && price !== 'FREE') {
                                    // Проверяем все следующие сообщения от бота
                                    for (let i = index + 1; i < currentDialogue.messages.length; i++) {
                                      const nextMsg = currentDialogue.messages[i];
                                      if (!nextMsg.isOwn && nextMsg.content.includes('[Bought]')) {
                                        isPaid = true;
                                        break;
                                      }
                                    }
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
                                                  {isPaid ? 'purchased' : 'pending'}
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
                              })()
                            ) : (
                              <div className="text-center py-8 text-gray-400">
                                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                                <p>В этом диалоге пока нет сообщений.</p>
                              </div>
                            )}
                          </div>
                            </div>
                          )}
                        </div>
                  ) : (
                    <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                      <h4 className="text-xl font-medium mb-2">История диалогов отсутствует</h4>
                      <p className="text-gray-400 mb-4">Для данной сессии не найдены диалоги.</p>
                      
                      <div className="max-w-lg mx-auto text-left bg-[#262626] p-4 rounded-lg border border-[#3d3d3d]">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                          Диагностика данных
                        </h5>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>ID сессии: <code className="bg-[#1a1a1a] px-1 py-0.5 rounded">{sessionId || 'отсутствует'}</code></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>Чаты: {chats.length ? `${chats.length} (все пустые)` : 'не найдены'}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>Анализ: {testResult ? 'доступен' : 'отсутствует'}</span>
                          </li>
                        </ul>
                        
                        <div className="mt-4 text-xs text-gray-400">
                          <p>Возможные причины проблемы:</p>
                          <ol className="list-decimal pl-5 mt-1 space-y-1">
                            <li>Тестовая сессия не была завершена</li>
                            <li>Сообщения не были добавлены в чаты</li>
                            <li>Результаты анализа не были сгенерированы</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TestResultsAdmin;