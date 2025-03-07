import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ChevronRight,
  Flame,
  Users,
  ShoppingCart,
  AlertCircle,
  Check
} from 'lucide-react';
import { getChatHistory, TestSession, Chat, ChatMessage, getEmployeeTestSessions } from '../lib/supabase';

// Add new interfaces for chat data
interface DialogueMessage extends ChatMessage {
  id: string;
}

interface Dialogue {
  id: string;
  title: string;
  date: string;
  duration: string;
  score: number;
  messages: DialogueMessage[];
}

function TestResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDialogue, setSelectedDialogue] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);

  // Mock data - in a real app, this would come from an API or context
  const testResults = {
    candidateName: 'Иван Петров',
    overallScore: 4.4,
    date: '24.07.2025',
    duration: '48 минут',
    parameters: [
      {
        name: 'Вовлеченность',
        score: 3,
        comment: 'Модель поддерживала диалог, но могла проявить больше инициативы',
        icon: <MessageCircle className="w-6 h-6" />,
        color: 'blue'
      },
      {
        name: 'Обаяние и тон',
        score: 4,
        comment: 'Игривый и соблазнительный тон, но можно добавить больше кокетства',
        icon: <Smile className="w-6 h-6" />,
        color: 'purple'
      },
      {
        name: 'Креативность',
        score: 5,
        comment: 'Уникальные и захватывающие предложения, идеально подошли для роли',
        icon: <Lightbulb className="w-6 h-6" />,
        color: 'yellow'
      },
      {
        name: 'Адаптивность',
        score: 4,
        comment: 'Хорошая реакция на сомнения, но иногда ответы могли быть гибче',
        icon: <RefreshCw className="w-6 h-6" />,
        color: 'green'
      },
      {
        name: 'Умение продавать себя',
        score: 5,
        comment: 'Отлично подчеркнула ценность контента, убедила клиента',
        icon: <DollarSign className="w-6 h-6" />,
        color: 'pink'
      }
    ],
    recommendations: [
      'Проявлять больше инициативы в начале диалога',
      'Добавить больше эмоциональных элементов в общение',
      'Продолжать использовать креативные подходы к презентации контента'
    ],
    pricingEvaluation: {
      score: 4.2,
      level: 'Высокая',
      strengths: [
        'Уверенно обосновывает стоимость контента',
        'Не снижает цену при первом возражении',
        'Подчеркивает уникальность предложения'
      ],
      weaknesses: [
        'Иногда слишком настойчиво продвигает премиум-контент'
      ],
      details: 'Модель установила оптимальную цену за контент, которая соответствует рыночным ожиданиям. Хорошо справляется с возражениями по цене.'
    },
    salesPerformance: {
      introduction: {
        score: 4.2,
        conversionRate: 85,
        strengths: [
          'Быстро устанавливает контакт',
          'Создает доверительную атмосферу'
        ],
        weaknesses: []
      },
      warmup: {
        score: 3.8,
        conversionRate: 70,
        strengths: [
          'Эффективно подогревает интерес',
          'Использует тизеры для привлечения внимания'
        ],
        weaknesses: [
          'Иногда слишком быстро переходит к продаже'
        ]
      },
      sales: {
        score: 4.5,
        conversionRate: 65,
        strengths: [
          'Уверенно закрывает сделки',
          'Хорошо работает с возражениями'
        ],
        weaknesses: [
          'Может улучшить работу с ценовыми возражениями'
        ]
      }
    },
    dialogues: [
      {
        id: 'dialogue1',
        title: 'Диалог с Marcus',
        date: '24.07.2025',
        duration: '15 минут',
        score: 92,
        messages: [
          {
            id: 'msg1',
            content: 'Привет! Как твои дела сегодня?',
            time: '14:30',
            isOwn: true
          },
          {
            id: 'msg2',
            content: 'Нормально, что показать умеешь?',
            time: '14:31',
            isOwn: false
          },
          {
            id: 'msg3',
            content: 'У меня есть отличные фото в купальнике. Хочешь посмотреть?',
            time: '14:32',
            isOwn: true
          },
          {
            id: 'msg4',
            content: 'Может быть, если они того стоят.',
            time: '14:33',
            isOwn: false
          }
        ]
      },
      {
        id: 'dialogue2',
        title: 'Диалог с Shrek',
        date: '23.07.2025',
        duration: '20 минут',
        score: 85,
        messages: [
          {
            id: 'msg1',
            content: 'Привет! Как настроение сегодня?',
            time: '10:15',
            isOwn: true
          },
          {
            id: 'msg2',
            content: 'УЖАСНО, ЧТО ЕЩЕ СПРАШИВАТЬ БУДЕШЬ?',
            time: '10:16',
            isOwn: false
          },
          {
            id: 'msg3',
            content: 'Ох, извини. Может, я смогу поднять тебе настроение? У меня есть новые фото.',
            time: '10:17',
            isOwn: true
          },
          {
            id: 'msg4',
            content: 'Ладно, давай посмотрим, что у тебя там.',
            time: '10:18',
            isOwn: false
          }
        ]
      },
      {
        id: 'dialogue3',
        title: 'Диалог с Olivia',
        date: '22.07.2025',
        duration: '18 минут',
        score: 78,
        messages: [
          {
            id: 'msg1',
            content: 'Привет! Рада видеть тебя снова!',
            time: '16:45',
            isOwn: true
          },
          {
            id: 'msg2',
            content: 'И сколько это будет стоить в этот раз?',
            time: '16:46',
            isOwn: false
          },
          {
            id: 'msg3',
            content: 'У меня специальное предложение для постоянных клиентов - всего 20$ за полный набор.',
            time: '16:47',
            isOwn: true
          },
          {
            id: 'msg4',
            content: 'А 15$ не хочешь? У других дешевле.',
            time: '16:48',
            isOwn: false
          }
        ]
      }
    ]
  };

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

  // Load chat messages when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const employeeId = location.state?.employeeId;
        
        if (employeeId) {
          // Получаем все тестовые сессии сотрудника
          const employeeSessions = await getEmployeeTestSessions(employeeId);
          
          if (employeeSessions.length > 0) {
            // Берем последнюю сессию
            const latestSession = employeeSessions[0];
            
            // Загружаем историю чатов для этой сессии
            const chatHistory = await getChatHistory(latestSession.id);
            setChats(chatHistory);

            // Массив имен персонажей
            const characterNames = ['Marcus', 'Shrek', 'Olivia', 'Ava'];

            // Преобразуем чаты в формат диалогов для отображения
            const newDialogues = chatHistory.map((chat, index) => ({
              id: chat.id,
              title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
              date: new Date(chat.created_at).toLocaleDateString(),
              duration: '15 минут',
              score: 85,
              messages: chat.messages.map((msg, msgIndex) => ({
                ...msg,
                id: `msg-${msgIndex}`,
                time: new Date(latestSession.created_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }))
            }));

            // Сортируем диалоги по номеру чата
            newDialogues.sort((a, b) => {
              const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
              const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
              return aNumber - bNumber;
            });

            setDialogues(newDialogues);
            
            // Обновляем информацию о сотруднике и дате тестирования
            if (latestSession.employee) {
              testResults.candidateName = `${latestSession.employee.first_name} ${latestSession.employee.last_name}`;
              testResults.date = new Date(latestSession.created_at).toLocaleDateString();
              
              // Вычисляем продолжительность тестирования
              if (latestSession.end_time) {
                const start = new Date(latestSession.created_at);
                const end = new Date(latestSession.end_time);
                const duration = Math.round((end.getTime() - start.getTime()) / 60000); // в минутах
                testResults.duration = `${duration} минут`;
              }
            }
          } else {
            console.log('No test sessions found for employee');
            setDialogues(testResults.dialogues);
          }
        } else {
          // Если нет ID сотрудника, используем тестовые данные
          console.log('Using mock data for dialogues');
          setDialogues(testResults.dialogues);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        // В случае ошибки также используем тестовые данные
        console.log('Error occurred, using mock data for dialogues');
        setDialogues(testResults.dialogues);
        setError(null); // Очищаем ошибку, так как используем тестовые данные
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [location.state?.employeeId]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
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
            <div className="flex items-center gap-2 mb-2">
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
                    <span>{strength}</span>
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
                      <span>{weakness}</span>
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
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {testResults.salesPerformance.introduction.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Требуют улучшения
                    </h4>
                    <ul className="text-sm space-y-1">
                      {testResults.salesPerformance.introduction.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-gray-300 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{weakness}</span>
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
                        <span>{strength}</span>
                      </li>
                    ))}
                   </ul>
                </div>

                {testResults.salesPerformance.warmup.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Требуют улучшения
                    </h4>
                    <ul className="text-sm space-y-1">
                      {testResults.salesPerformance.warmup.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-gray-300 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{weakness}</span>
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
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {testResults.salesPerformance.sales.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Требуют улучшения
                    </h4>
                    <ul className="text-sm space-y-1">
                      {testResults.salesPerformance.sales.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-gray-300 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{weakness}</span>
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

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-purple-500 rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          ) : dialogues.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>История диалогов пуста</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dialogues.map((dialogue) => (
                <div 
                  key={dialogue.id} 
                  className="bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-[#252525] transition-colors"
                    onClick={() => setSelectedDialogue(selectedDialogue === dialogue.id ? null : dialogue.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{dialogue.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <span>{dialogue.date}</span>
                          <span>•</span>
                          <span>{dialogue.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          {dialogue.messages.length} сообщений
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedDialogue === dialogue.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {selectedDialogue === dialogue.id && (
                    <div className="border-t border-[#3d3d3d] p-4 space-y-4">
                      {dialogue.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3 ${
                              message.isOwn
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                                : 'bg-[#3d3d3d]'
                            }`}
                          >
                            <p>{message.content}</p>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <p className="text-xs text-gray-300">{message.time}</p>
                              {message.isOwn && message.isRead && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default TestResults;