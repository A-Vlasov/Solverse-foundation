import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  User,
  Target,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BookOpen,
  ThumbsUp,
  Zap,
  FileText,
  Star,
  BarChart2,
  LineChart,
  Activity,
  Briefcase,
  Lightbulb,
  Layers,
  Hexagon,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react';
import { getCandidateFormByEmployeeId, CandidateFormData, getEmployee, Employee } from '../lib/supabase';

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidateForm, setCandidateForm] = useState<CandidateFormData | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setLoading(true);
          const [employeeData, formData] = await Promise.all([
            getEmployee(id),
            getCandidateFormByEmployeeId(id)
          ]);
          setEmployee(employeeData);
          setCandidateForm(formData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id]);

  // Mock data - replace with real data from your backend
  const employeeStats = {
    joinDate: '15.01.2024',
    totalTests: 45,
    averageTime: '25 мин',
    lastTest: '2 часа назад',
    monthlyProgress: {
      current: 85,
      previous: 77,
      change: '+8%',
      trend: 'up',
    },
    skillAnalysis: {
      excellent: [
        'Поддержание интереса клиента',
        'Выявление явных потребностей',
        'Работа с базовыми возражениями',
      ],
      good: [
        'Презентация продукта',
        'Установление контакта',
      ],
      needsImprovement: [
        'Выявление скрытых потребностей',
        'Работа со сложными возражениями',
        'Техники закрытия сделки',
      ],
    },
    recentDialogues: [
      {
        date: '22.03.2024',
        score: 92,
        status: 'успех',
        highlights: ['Отличное выявление потребностей', 'Грамотная презентация решения'],
        improvements: ['Можно усилить работу с возражениями'],
      },
      {
        date: '21.03.2024',
        score: 88,
        status: 'успех',
        highlights: ['Хороший контакт с клиентом', 'Качественная презентация'],
        improvements: ['Недостаточно проработаны скрытые потребности'],
      },
      {
        date: '20.03.2024',
        score: 75,
        status: 'требует улучшения',
        highlights: ['Вежливое общение'],
        improvements: ['Слабая работа с возражениями', 'Упущены возможности для кросс-продаж'],
      },
    ],
    learningPath: {
      completed: ['Базовый курс продаж', 'Работа с возражениями'],
      inProgress: 'Продвинутые техники продаж',
      recommended: ['Мастер-класс по закрытию сделок', 'Психология клиента'],
    },
    performance: [
      { month: 'Янв', score: 68 },
      { month: 'Фев', score: 72 },
      { month: 'Мар', score: 75 },
      { month: 'Апр', score: 79 },
      { month: 'Май', score: 82 },
      { month: 'Июнь', score: 85 },
    ],
    strengths: [
      { skill: 'Коммуникабельность', level: 90 },
      { skill: 'Стрессоустойчивость', level: 85 },
      { skill: 'Многозадачность', level: 75 },
      { skill: 'Работа с клиентами', level: 88 },
    ],
    certificates: [
      { name: 'Сертификат OnlyFans по обслуживанию клиентов', date: '12.01.2024' },
      { name: 'Техники эффективных коммуникаций', date: '03.03.2024' },
    ]
  };

  // Компонент загрузки
  const LoadingSpinner = () => (
    <div className="flex justify-center py-8">
      <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-pink-500 rounded-full"></div>
    </div>
  );

  // Компонент статистической карточки
  const StatCard = ({ 
    icon, 
    title, 
    value, 
    color = "pink" 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string; 
    color?: "pink" | "blue" | "green" | "amber";
  }) => {
    const colorVariants: Record<string, string> = {
      pink: "from-pink-500 to-purple-500",
      blue: "from-blue-500 to-indigo-600",
      green: "from-emerald-500 to-teal-600",
      amber: "from-amber-500 to-orange-500",
    };
    
    return (
      <div className="bg-[#2d2d2d] rounded-xl p-5 border border-[#3d3d3d] shadow-md hover:shadow-lg transition-all">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorVariants[color]} text-white`}>
            {icon}
          </div>
        </div>
        <h3 className="text-gray-400 text-sm mt-4">{title}</h3>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    );
  };

  // Компонент табов
  const Tabs = () => {
    const tabs = [
      { id: 'overview', name: 'Обзор', icon: <BarChart2 className="w-4 h-4" /> },
      { id: 'skills', name: 'Навыки', icon: <Star className="w-4 h-4" /> },
      { id: 'dialogues', name: 'Диалоги', icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'learning', name: 'Обучение', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'profile', name: 'Профиль', icon: <User className="w-4 h-4" /> },
    ];

    return (
      <div className="flex overflow-x-auto pb-2 no-scrollbar mb-6">
        <div className="inline-flex items-center bg-[#2d2d2d] rounded-xl p-1 border border-[#3d3d3d]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              } flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Компонент вкладки "Обзор"
  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Инфо профиля */}
      <div className="lg:col-span-3 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg">
            {employee?.first_name?.[0] || '?'}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl md:text-3xl font-bold">{employee?.first_name || 'Загрузка...'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-gray-300">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span>{employee?.department || 'Загрузка...'}</span>
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Layers className="w-4 h-4 text-gray-400" />
                <span>Уровень: {employee?.level || 'Загрузка...'}</span>
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>В команде с {employeeStats.joinDate}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-gray-300 text-sm">Эффективность:</span>
              <div className="w-40 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{ width: `${employee?.success || 0}%` }}
                />
              </div>
              <span className="text-gray-300">{employee?.success || 0}%</span>
            </div>
          </div>
          <div className="md:text-right">
            <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-sm inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Обновлено: {employeeStats.lastTest}</span>
            </span>
            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="text-sm text-gray-400">Прогресс за месяц:</span>
              <span className={`flex items-center gap-1 ${employee?.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {employee?.improvement || '+0%'}
                {employee?.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Карточки со статистикой */}
      <StatCard 
        icon={<Target className="w-5 h-5" />} 
        title="Общая успешность" 
        value={`${employee?.success || 0}%`} 
        color="pink"
      />
      
      <StatCard 
        icon={<Activity className="w-5 h-5" />} 
        title="Тесты за месяц" 
        value={employeeStats.totalTests.toString()} 
        color="blue"
      />
      
      <StatCard 
        icon={<Clock className="w-5 h-5" />} 
        title="Среднее время теста" 
        value={employeeStats.averageTime} 
        color="green"
      />
      
      {/* Графики производительности */}
      <div className="lg:col-span-2 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-pink-500" />
          Динамика показателей за полгода
        </h3>
        
        <div className="h-64 flex items-end justify-between px-2">
          {employeeStats.performance.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 w-1/6">
              <div 
                className="w-12 bg-gradient-to-t from-pink-600 to-purple-500 rounded-t-md" 
                style={{ height: `${item.score * 0.6}%` }}
              ></div>
              <span className="text-xs text-gray-400">{item.month}</span>
              <span className="text-xs font-medium">{item.score}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Сильные стороны */}
      <div className="bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Hexagon className="w-5 h-5 text-pink-500" />
          Сильные стороны
        </h3>
        
        <div className="space-y-4">
          {employeeStats.strengths.map((strength, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm">{strength.skill}</span>
                <span className="text-sm text-gray-400">{strength.level}%</span>
              </div>
              <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    strength.level >= 85 ? 'bg-green-500' : 
                    strength.level >= 75 ? 'bg-blue-500' : 
                    'bg-amber-500'
                  }`}
                  style={{ width: `${strength.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Последние тестирования */}
      <div className="lg:col-span-3 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-500" />
          Последние диалоги
        </h3>
        
        <div className="grid gap-4">
          {employeeStats.recentDialogues.map((dialogue, index) => (
            <div key={index} className="bg-[#1a1a1a] rounded-lg p-5 border border-[#3d3d3d] hover:border-pink-500/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl ${
                    dialogue.score >= 90 ? 'bg-green-500/20 text-green-400' :
                    dialogue.score >= 80 ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {dialogue.score}%
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dialogue.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        dialogue.status === 'успех' 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {dialogue.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors rounded-lg text-sm font-medium">
                  Смотреть детали
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#2d2d2d]/50 rounded-lg">
                  <p className="text-green-400 flex items-center gap-2 mb-2 text-sm font-medium">
                    <ThumbsUp className="w-4 h-4" />
                    Сильные стороны
                  </p>
                  <ul className="space-y-1 text-sm">
                    {dialogue.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {dialogue.improvements.length > 0 && (
                  <div className="p-4 bg-[#2d2d2d]/50 rounded-lg">
                    <p className="text-amber-400 flex items-center gap-2 mb-2 text-sm font-medium">
                      <Lightbulb className="w-4 h-4" />
                      Зоны роста
                    </p>
                    <ul className="space-y-1 text-sm">
                      {dialogue.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Компонент вкладки "Навыки"
  const SkillsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Анализ навыков */}
      <div className="lg:col-span-2 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Анализ навыков
        </h3>

        <div className="grid gap-6">
          <div>
            <p className="text-green-400 mb-3 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              Отличные навыки
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {employeeStats.skillAnalysis.excellent.map((skill, index) => (
                <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{skill}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-blue-400 mb-3 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              Хорошие навыки
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {employeeStats.skillAnalysis.good.map((skill, index) => (
                <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>{skill}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-amber-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Требуют улучшения
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {employeeStats.skillAnalysis.needsImprovement.map((skill, index) => (
                <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>{skill}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Сертификаты и достижения */}
      <div className="bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-pink-500" />
          Сертификаты
        </h3>
        
        <div className="space-y-4">
          {employeeStats.certificates.map((cert, index) => (
            <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d] hover:border-pink-500/30 transition-colors">
              <div className="flex gap-3">
                <div className="mt-1 text-pink-500">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium">{cert.name}</h4>
                  <p className="text-gray-400 text-sm mt-1">Получен: {cert.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Компонент вкладки "Диалоги"
  const DialoguesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <div className="bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-500" />
          История диалогов
        </h3>
        
        {/* Здесь будет расширенная история диалогов */}
        <p className="text-gray-400">Расширенная история диалогов в разработке</p>
      </div>
    </div>
  );
  
  // Компонент вкладки "Обучение"
  const LearningTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pink-500" />
          Путь обучения
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
            <p className="text-green-400 mb-4 flex items-center gap-2 text-lg">
              <Award className="w-5 h-5" />
              Завершенные курсы
            </p>
            <div className="space-y-3">
              {employeeStats.learningPath.completed.map((course, index) => (
                <div key={index} className="p-3 bg-[#2d2d2d] rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-green-400">{course}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
            <p className="text-yellow-400 mb-4 flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5" />
              В процессе
            </p>
            <div className="p-3 bg-[#2d2d2d] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400">{employeeStats.learningPath.inProgress}</span>
              </div>
              <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500" style={{width: "65%"}} />
              </div>
              <p className="text-right text-sm text-gray-400 mt-1">65% завершено</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-5 border border-[#3d3d3d]">
            <p className="text-blue-400 mb-4 flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5" />
              Рекомендуемые курсы
            </p>
            <div className="space-y-3">
              {employeeStats.learningPath.recommended.map((course, index) => (
                <div key={index} className="p-3 bg-[#2d2d2d] rounded-lg flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-blue-400">{course}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Компонент вкладки "Профиль"
  const ProfileTab = () => {
    // Функция для определения типа смены и её цветовой схемы
    const getShiftDetails = (shift: string | undefined) => {
      if (!shift) return { icon: <Clock className="w-5 h-5" />, label: 'Не указана', color: 'gray', time: '', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };

      const lowerShift = shift.toLowerCase();
      
      if (lowerShift.includes('дневн') || lowerShift.includes('day')) {
        return {
          icon: <Sun className="w-5 h-5" />,
          label: 'Дневная смена',
          color: 'amber',
          time: 'c 8:00 до 16:00',
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/20'
        };
      } else if (lowerShift.includes('ночн') || lowerShift.includes('night')) {
        return {
          icon: <Moon className="w-5 h-5" />,
          label: 'Ночная смена',
          color: 'indigo',
          time: 'c 00:00 до 8:00',
          bgColor: 'bg-indigo-500/10',
          textColor: 'text-indigo-400',
          borderColor: 'border-indigo-500/20'
        };
      } else if (lowerShift.includes('вечер') || lowerShift.includes('evening')) {
        return {
          icon: <Sunset className="w-5 h-5" />,
          label: 'Вечерняя смена',
          color: 'pink',
          time: 'c 16:00 до 00:00',
          bgColor: 'bg-pink-500/10',
          textColor: 'text-pink-400',
          borderColor: 'border-pink-500/20'
        };
      }
      
      return { icon: <Clock className="w-5 h-5" />, label: shift, color: 'gray', time: '', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20' };
    };
    
    const shiftDetails = getShiftDetails(candidateForm?.shift);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Данные анкеты соискателя */}
        <div className="lg:col-span-2 bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            Анкета соискателя
          </h3>

          {loading ? (
            <LoadingSpinner />
          ) : candidateForm ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1a1a1a] rounded-lg hover:border-l-2 hover:border-pink-500 transition-all">
                <p className="text-pink-400 mb-1 text-sm">Имя</p>
                <p className="font-medium">{employee?.first_name}</p>
              </div>
              <div className="p-4 bg-[#1a1a1a] rounded-lg hover:border-l-2 hover:border-pink-500 transition-all">
                <p className="text-pink-400 mb-1 text-sm">Telegram</p>
                <p className="font-medium">{candidateForm.telegram_tag}</p>
              </div>
              
              {/* Улучшенный блок Смены */}
              <div className={`p-4 bg-[#1a1a1a] rounded-lg border ${shiftDetails.borderColor}`}>
                <p className={`${shiftDetails.textColor} mb-2 text-sm font-medium`}>Рабочая смена</p>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${shiftDetails.bgColor} ${shiftDetails.textColor}`}>
                    {shiftDetails.icon}
                  </div>
                  <div>
                    <p className="font-medium">{shiftDetails.label}</p>
                    <p className="text-gray-400 text-sm">{shiftDetails.time}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-[#1a1a1a] rounded-lg hover:border-l-2 hover:border-pink-500 transition-all">
                <p className="text-pink-400 mb-1 text-sm">Опыт работы</p>
                <p className="font-medium">{candidateForm.experience}</p>
              </div>
              <div className="md:col-span-2 p-4 bg-[#1a1a1a] rounded-lg hover:border-l-2 hover:border-pink-500 transition-all">
                <p className="text-pink-400 mb-1 text-sm">Причина выбора</p>
                <p className="font-medium">{candidateForm.motivation}</p>
              </div>
              <div className="md:col-span-2 p-4 bg-[#1a1a1a] rounded-lg hover:border-l-2 hover:border-pink-500 transition-all">
                <p className="text-pink-400 mb-1 text-sm">О себе</p>
                <p className="font-medium">{candidateForm.about_me}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Анкета не найдена</p>
            </div>
          )}
        </div>
        
        {/* Дополнительная информация */}
        <div className="bg-[#2d2d2d] rounded-xl p-6 border border-[#3d3d3d]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-pink-500" />
            Информация о сотруднике
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-gray-400 mb-1">Уровень</p>
              <p className="font-medium">{employee?.level || 'Загрузка...'}</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-gray-400 mb-1">Отдел</p>
              <p className="font-medium">{employee?.department || 'Загрузка...'}</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-gray-400 mb-1">Дата начала работы</p>
              <p className="font-medium">{employeeStats.joinDate}</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-lg">
              <p className="text-gray-400 mb-1">Всего тестов</p>
              <p className="font-medium">{employeeStats.totalTests}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Личное дело сотрудника</h1>
          <p className="text-gray-400 mt-1">Последнее обновление: {employeeStats.lastTest}</p>
        </div>
      </div>

      {/* Система вкладок */}
      <Tabs />

      {/* Контент вкладки */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'skills' && <SkillsTab />}
          {activeTab === 'dialogues' && <DialoguesTab />}
          {activeTab === 'learning' && <LearningTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </>
      )}
    </div>
  );
}

export default EmployeeProfile;