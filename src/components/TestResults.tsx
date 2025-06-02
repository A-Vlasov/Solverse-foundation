import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart, 
  Heart, 
  Zap, 
  Lightbulb, 
  Palette, 
  MessageCircle, 
  Star,
  CheckCircle,
  Info,
  DollarSign,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { 
  getTestResultForSession, 
  getTestSession, 
  getEmployee,
  getChatHistory,
  TestResult, 
  DialogAnalysisResult,
  Chat,
  ChatMessage
} from '../lib/supabase';

// Интерфейс для сообщений диалога
interface DialogueMessage {
  id: string;
  time: string;
  content: string;
  isOwn: boolean;
  isRead?: boolean;
  role?: 'user' | 'assistant';
}

// Интерфейс для диалогов
interface Dialogue {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: number;
  messages: DialogueMessage[];
}

// Хук для логирования
function useLogging(componentName: string) {
  const log = (message: string, data?: any) => {
    console.log(`[${componentName}] ${message}`, data || '');
  };
  
  const error = (message: string, err?: any) => {
    console.error(`[${componentName}] ERROR: ${message}`, err || '');
  };
  
  return { log, error };
}

// Функция для очистки контента сообщений от служебных тегов
const cleanContent = (text: string): string => {
  return (text || '')
    .replace(/\[\s*Bought\s*\]/gi, '')
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

function TestResults() {
  const { log, error: logError } = useLogging('TestResults');
  
  // Добавляем режим отладки
  const [debugMode, setDebugMode] = useState(true); // По умолчанию включен
  
  // Используем безопасный подход к получению параметров и навигации
  const [isMounted, setIsMounted] = useState(false);
  const [sessionIdFromDOM, setSessionIdFromDOM] = useState<string | null>(null);
  
  // Объявляем переменные без инициализации хуками react-router-dom
  let sessionIdFromRouter: string | undefined;
  let navigateFunction: any;
  
  // Безопасно инициализируем на клиенте
  if (typeof window !== 'undefined') {
    try {
      const params = useParams<{ sessionId: string }>();
      sessionIdFromRouter = params.sessionId;
      navigateFunction = useNavigate();
    } catch (e) {
      // Игнорируем ошибку, если react-router-dom не доступен
      log('React Router hooks not available');
    }
  }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Устанавливаем флаг монтирования и получаем sessionId из DOM
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      const container = document.getElementById('test-results-container');
      if (container) {
        const id = container.getAttribute('data-session-id');
        if (id) {
          setSessionIdFromDOM(id);
          log('Retrieved sessionId from DOM:', id);
        } else {
          logError('No sessionId found in DOM container');
        }
      } else {
        logError('Could not find test-results-container in DOM');
      }
    }
  }, []);
  
  // Получаем актуальный sessionId с приоритетом из DOM для Next.js
  const sessionId = sessionIdFromDOM || sessionIdFromRouter;
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (!isMounted) {
      log('Component not mounted yet, skipping data fetch');
      return;
    }
    
    if (!sessionId) {
      logError('No sessionId available, skipping data fetch');
      return;
    }
    
    log('Starting data fetch with sessionId:', sessionId);
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDataLoaded(false);
        
        log('Loading data for sessionId:', sessionId);
        
        // Проверяем, передан ли ID сессии
        if (sessionId) {
          log('Trying to load test session:', sessionId);
          
          // Получаем информацию о сессии (независимо от результатов анализа)
          try {
            const session = await getTestSession(sessionId);
            log('Session loaded:', session);
            
            if (session) {
              // Загружаем историю чатов независимо от результатов анализа
              log('Loading chat history for session:', sessionId);
              const chatHistory = await getChatHistory(sessionId);
              log('Chat history loaded, chats count:', chatHistory?.length || 0);
              setChats(chatHistory || []);
              
              // Обновляем основную информацию о сессии и сотруднике
              if (session.employee) {
                setEmployeeName(`${session.employee.first_name}`);
                if ('id' in session.employee) {
                  setEmployeeId(session.employee.id as string);
                }
                log('Employee info loaded from session:', session.employee.first_name);
              } else if (session.employee_id) {
                try {
                  const employee = await getEmployee(session.employee_id);
                  if (employee) {
                    setEmployeeName(`${employee.first_name}`);
                    if ('id' in employee) {
                      setEmployeeId(employee.id as string);
                    }
                    log('Employee info loaded from direct call:', employee.first_name);
                  }
                } catch (empError) {
                  logError('Error loading employee:', empError);
                  setEmployeeName('Неизвестный соискатель');
                }
              }
              
              // Преобразуем чаты в формат диалогов для отображения
              if (chatHistory && chatHistory.length > 0) {
                // Массив имен персонажей
                const characterNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
                
                const newDialogues: Dialogue[] = chatHistory.map((chat, index) => ({
                  id: chat.id || `chat-${index}`,
                  title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
                  date: new Date(chat.created_at || Date.now()).toLocaleDateString(),
                  duration: '15 минут',
                  score: 0, // Рассчитаем позже
                  messages: Array.isArray(chat.messages) ? chat.messages.map((msg, msgIndex): DialogueMessage => ({
                    id: `msg-${msgIndex}`,
                    time: new Date().toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                    content: msg.content || '',
                    isOwn: msg.isOwn || false,
                    isRead: msg.isRead || false,
                    role: msg.isOwn ? 'user' : 'assistant'
                  })) : []
                }));
                
                // Сортируем диалоги по номеру чата
                newDialogues.sort((a, b) => {
                  const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
                  const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
                  return aNumber - bNumber;
                });
                
                log('Dialogues processed:', newDialogues.length);
                setDialogues(newDialogues);
                
                // Если есть диалоги, выбираем первый по умолчанию
                if (newDialogues.length > 0) {
                  setSelectedDialogue(newDialogues[0].id);
                }
              } else {
                log('No chat history found or empty chats');
                setDialogues([]);
              }
            }
          } catch (sessionError) {
            logError('Error loading session:', sessionError);
          }
          
          // Загружаем результаты анализа для сессии (отдельно от базовой информации)
          try {
            log('Loading test results for session:', sessionId);
            const result = await getTestResultForSession(sessionId);
            log('Test results loaded:', result?.id ? 'Found' : 'Not found');
            
            if (result) {
              setTestResult(result);
              // Если у нас уже есть диалоги, обновим их оценки на основе результатов анализа
              if (dialogues.length > 0 && result.analysis_result?.dialog_analysis?.metrics) {
                const overallScore = calculateOverallScore(result.analysis_result.dialog_analysis.metrics);
                setDialogues(prev => prev.map(dialogue => ({
                  ...dialogue,
                  score: overallScore
                })));
              }
            }
          } catch (resultError) {
            logError('Error loading test results:', resultError);
          }
        }
        
        // После успешной загрузки данных
        setDataLoaded(true);
        setLoading(false);
      } catch (err) {
        logError('Error during data loading:', err);
        setError('Ошибка при загрузке данных');
        setLoading(false);
      }
    };
    
    loadData();
  }, [sessionId, isMounted]);
  
  // Функция для расчёта средней оценки на основе всех метрик
  const calculateOverallScore = (metrics: DialogAnalysisResult['dialog_analysis']['metrics'] | undefined): number => {
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
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 3.5) return 'text-green-400';
    if (score >= 2.5) return 'text-yellow-500';
    if (score >= 1.5) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 4.5) return <Star className="w-5 h-5 text-green-500" />;
    if (score >= 3.5) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= 2.5) return <Info className="w-5 h-5 text-yellow-500" />;
    if (score >= 1.5) return <Info className="w-5 h-5 text-orange-500" />;
    return <Info className="w-5 h-5 text-red-500" />;
  };
  
  const analysis = testResult?.analysis_result?.dialog_analysis;
  
  const handleBackClick = () => {
    if (typeof window !== 'undefined') {
      if (navigateFunction) {
        navigateFunction('/admin');
      } else {
        window.location.href = '/admin';
      }
    }
  };
  
  // Функция для переключения режима отладки
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    log(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
  };
  
  // Функция для переключения выбранного диалога
  const toggleDialogue = (dialogueId: string) => {
    if (selectedDialogue === dialogueId) {
      setSelectedDialogue(null);
    } else {
      setSelectedDialogue(dialogueId);
    }
  };
  
  // Показываем загрузчик, если компонент еще не смонтирован
  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
              Ошибка
            </h1>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={handleBackClick}
              className="mt-6 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              Результаты тестирования
            </h1>
            <p className="text-gray-400 mt-1">
              Соискатель: {employeeName}
            </p>
          </div>
          <button 
            onClick={toggleDebugMode} 
            className="px-3 py-1 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700"
          >
            {debugMode ? 'Скрыть отладку' : 'Режим отладки'}
          </button>
        </div>

        {/* Режим отладки */}
        {debugMode && (
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Отладочная информация</h2>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">ID сеанса</h3>
              <pre className="text-xs text-green-400 bg-black p-2 rounded">{sessionId || 'Не найден'}</pre>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Данные загружены</h3>
              <pre className="text-xs text-green-400 bg-black p-2 rounded">{dataLoaded ? 'Да' : 'Нет'}</pre>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Данные тестового результата</h3>
              <pre className="text-xs text-green-400 bg-black p-2 rounded overflow-auto max-h-40">
                {testResult ? JSON.stringify({
                  id: testResult.id,
                  test_session_id: testResult.test_session_id,
                  employee_id: testResult.employee_id,
                  has_analysis: !!testResult.analysis_result
                }, null, 2) : 'Нет данных'}
              </pre>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">Данные чатов ({chats.length})</h3>
              <pre className="text-xs text-green-400 bg-black p-2 rounded overflow-auto max-h-40">
                {chats.length > 0 
                  ? JSON.stringify(chats.map(c => ({
                      id: c.id,
                      chat_number: c.chat_number,
                      messages_count: c.messages?.length || 0
                    })), null, 2) 
                  : 'Нет данных'}
              </pre>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="font-semibold mb-2">Данные диалогов ({dialogues.length})</h3>
              <pre className="text-xs text-green-400 bg-black p-2 rounded overflow-auto max-h-40">
                {dialogues.length > 0 
                  ? JSON.stringify(dialogues.map(d => ({
                      id: d.id,
                      title: d.title,
                      messages_count: d.messages.length
                    })), null, 2) 
                  : 'Нет данных'}
              </pre>
            </div>
          </div>
        )}

        {analysis ? (
          <div className="space-y-6">
            {/* Общий результат */}
            <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
              <div className="flex items-center gap-3 mb-4">
                <BarChart className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-semibold">Общий результат</h2>
              </div>
            
              <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Общий рейтинг:</span>
                  <span className={`font-bold text-2xl ${getScoreColor(calculateOverallScore(analysis?.metrics))}`}>
                    {calculateOverallScore(analysis?.metrics).toFixed(1)}/5
                  </span>
                </div>
              </div>

              {analysis.result_summary ? (
                <div className="bg-[#1a1a1a] rounded-lg p-5 border border-[#3d3d3d] mb-4">
                  <h3 className="font-semibold mb-3 text-xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Итоговый результат</h3>
                  <p className="text-gray-100">{analysis.result_summary}</p>
                </div>
              ) : (
                <p className="text-gray-300">
                  {analysis.overall_conclusion}
                </p>
              )}
              
              {analysis.result_summary && analysis.overall_conclusion && (
                <div className="mt-4 pt-4">
                  <h3 className="font-semibold mb-2 text-gray-300">Дополнительная информация:</h3>
                  <p className="text-gray-400">{analysis.overall_conclusion}</p>
                </div>
              )}
            </div>

            {/* Критерии оценки */}
            <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-semibold">Критерии оценки</h2>
              </div>

              <div className="space-y-6">
                {/* Вовлеченность */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">Вовлеченность</h3>
                    </div>
                    <span className={`font-bold ${getScoreColor(analysis.metrics.engagement.score)}`}>
                      {analysis.metrics.engagement.score}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{analysis.metrics.engagement.verdict}</p>
                </div>

                {/* Обаяние и тон */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">Обаяние и тон</h3>
                    </div>
                    <span className={`font-bold ${getScoreColor(analysis.metrics.charm_and_tone.score)}`}>
                      {analysis.metrics.charm_and_tone.score}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{analysis.metrics.charm_and_tone.verdict}</p>
                </div>

                {/* Креативность */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">Креативность</h3>
                    </div>
                    <span className={`font-bold ${getScoreColor(analysis.metrics.creativity.score)}`}>
                      {analysis.metrics.creativity.score}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{analysis.metrics.creativity.verdict}</p>
                </div>
                
                {/* Адаптивность */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">Адаптивность</h3>
                    </div>
                    <span className={`font-bold ${getScoreColor(analysis.metrics.adaptability.score)}`}>
                      {analysis.metrics.adaptability.score}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{analysis.metrics.adaptability.verdict}</p>
                </div>

                {/* Умение продавать себя */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">Умение продавать себя</h3>
                    </div>
                    <span className={`font-bold ${getScoreColor(analysis.metrics.self_promotion.score)}`}>
                      {analysis.metrics.self_promotion.score}/5
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{analysis.metrics.self_promotion.verdict}</p>
                </div>

                {/* Ценовая политика */}
                {analysis.metrics.pricing_policy && (
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                        <h3 className="font-semibold">Ценовая политика</h3>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.metrics.pricing_policy.score)}`}>
                        {analysis.metrics.pricing_policy.score}/5
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{analysis.metrics.pricing_policy.verdict}</p>
                    
                    {/* Отображение сильных сторон и областей улучшения, если они есть */}
                    {(analysis.metrics.pricing_policy.strengths && analysis.metrics.pricing_policy.strengths.length > 0) || 
                     (analysis.metrics.pricing_policy.improvements && analysis.metrics.pricing_policy.improvements.length > 0) ? (
                      <div className="mt-3 border-t border-[#2d2d2d] pt-3">
                        {analysis.metrics.pricing_policy.strengths && analysis.metrics.pricing_policy.strengths.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 text-xs font-semibold">Сильные стороны</span>
                            </div>
                            <ul className="text-gray-400 text-sm ml-6 space-y-1 list-disc">
                              {analysis.metrics.pricing_policy.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.metrics.pricing_policy.improvements && analysis.metrics.pricing_policy.improvements.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Info className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-semibold">Требуют улучшения</span>
                            </div>
                            <ul className="text-gray-400 text-sm ml-6 space-y-1 list-disc">
                              {analysis.metrics.pricing_policy.improvements.map((improvement, idx) => (
                                <li key={idx}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            
            {/* Диалоги секция */}
            {dialogues.length > 0 && (
              <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-6 h-6 text-pink-500" />
                  <h2 className="text-xl font-semibold">Диалоги</h2>
                </div>
                
                <div className="space-y-4">
                  {dialogues.map((dialogue) => (
                    <div key={dialogue.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                      {/* Заголовок диалога */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-all duration-200"
                        onClick={() => toggleDialogue(dialogue.id)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-pink-500" />
                          <div>
                            <h3 className="font-semibold">{dialogue.title}</h3>
                            <p className="text-xs text-gray-400">{dialogue.date} • {dialogue.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${getScoreColor(dialogue.score)}`}>{dialogue.score.toFixed(1)}</span>
                          {selectedDialogue === dialogue.id ? 
                            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </div>
                      
                      {/* Содержимое диалога */}
                      {selectedDialogue === dialogue.id && (
                        <div className="p-4 border-t border-[#2d2d2d] max-h-96 overflow-y-auto">
                          <div className="space-y-4">
                            {dialogue.messages.map((message, index) => (
                              <div 
                                key={`${message.id || index}`} 
                                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[80%] p-3 rounded-md ${
                                    message.isOwn ? 
                                    'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 
                                    'bg-[#2a2a2a] text-gray-200'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1 text-right">
                                    {message.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Результаты недоступны</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Анализ результатов тестирования не был завершен или произошла ошибка при обработке данных.
            </p>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
              <p className="text-gray-400">
                Тест был проведен, но аналитические данные недоступны. Возможные причины:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-400">
                <li>Проблемы с соединением во время анализа</li>
                <li>Ошибка обработки данных на стороне сервера</li>
                <li>Недостаточно сообщений для полноценного анализа</li>
              </ul>
            </div>
            
            {/* Информация о тесте */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="font-semibold mb-2">Информация о тесте</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID сессии:</span>
                  <span className="text-gray-300">{testResult?.test_session_id || sessionId || 'Недоступно'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Дата проведения:</span>
                  <span className="text-gray-300">
                    {testResult?.created_at ? new Date(testResult.created_at).toLocaleDateString() : 'Недоступно'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Диалоги при отсутствии анализа */}
        {!analysis && dialogues.length > 0 && (
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] mt-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-pink-500" />
              <h2 className="text-xl font-semibold">Диалоги</h2>
            </div>
            
            <div className="space-y-4">
              {dialogues.map((dialogue) => (
                <div key={dialogue.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                  {/* Заголовок диалога */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-all duration-200"
                    onClick={() => toggleDialogue(dialogue.id)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-pink-500" />
                      <div>
                        <h3 className="font-semibold">{dialogue.title}</h3>
                        <p className="text-xs text-gray-400">{dialogue.date} • {dialogue.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedDialogue === dialogue.id ? 
                        <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>
                  
                  {/* Содержимое диалога */}
                  {selectedDialogue === dialogue.id && (
                    <div className="p-4 border-t border-[#2d2d2d] max-h-96 overflow-y-auto">
                      <div className="space-y-4">
                        {dialogue.messages.map((message, index) => (
                          <div 
                            key={`${message.id || index}`} 
                            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-md ${
                                message.isOwn ? 
                                'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 
                                'bg-[#2a2a2a] text-gray-200'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs opacity-70 mt-1 text-right">
                                {message.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться назад
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestResults;