import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Target,
  Award,
  Search,
  Filter,
  Calendar,
  Building,
  ChevronDown,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { getRecentTestSessions, TestSession } from '../lib/supabase';

// Локальный интерфейс для отображения сессий в таблице
interface SessionDisplay extends TestSession {
  character_name?: string;
  messages_count?: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    department: 'all',
    level: 'all',
    date: 'all',
  });
  
  // Состояние для хранения данных о недавних тестированиях
  const [recentTestSessions, setRecentTestSessions] = useState<SessionDisplay[]>([]);
  const [loadingTestSessions, setLoadingTestSessions] = useState(true);

  // Загружаем данные о недавних тестированиях при монтировании компонента
  useEffect(() => {
    const fetchRecentTestSessions = async () => {
      try {
        setLoadingTestSessions(true);
        const sessions = await getRecentTestSessions(10); // Увеличим количество сессий до 10
        console.log('Fetched recent test sessions:', sessions);
        
        // Проверяем наличие данных о соискателях
        sessions.forEach(session => {
          if (!session.employee || !session.employee.first_name || !session.employee.last_name) {
            console.warn('Missing employee data for session:', session.id);
          }
        });
        
        // Сортируем сессии: сначала активные, потом завершенные
        const sortedSessions = sessions.sort((a, b) => {
          if (a.completed === b.completed) {
            // Если статусы одинаковые, сортируем по времени создания (новые сверху)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          // Активные сессии показываем первыми
          return a.completed ? 1 : -1;
        });
        
        // Добавляем недостающие поля для отображения в таблице
        const displaySessions: SessionDisplay[] = sortedSessions.map(session => ({
          ...session,
          character_name: getCharacterNameBySessionNumber(session.id),
          messages_count: getMessagesCount(session)
        }));
        
        setRecentTestSessions(displaySessions);
      } catch (error) {
        console.error('Error fetching recent test sessions:', error);
      } finally {
        setLoadingTestSessions(false);
      }
    };
    
    // Загружаем данные сразу при монтировании
    fetchRecentTestSessions();
    
    // Устанавливаем интервал для автоматического обновления
    const intervalId = setInterval(fetchRecentTestSessions, 30000); // Обновляем каждые 30 секунд
    
    // Очищаем интервал при размонтировании
    return () => clearInterval(intervalId);
  }, []);

  // Функция для получения имени персонажа по номеру сессии
  const getCharacterNameBySessionNumber = (sessionId: string): string => {
    // Используем последнюю цифру ID сессии для определения персонажа (упрощенная логика)
    const lastChar = sessionId.charAt(sessionId.length - 1);
    const charNum = parseInt(lastChar, 10) % 4;
    
    switch(charNum) {
      case 0: return 'Marcus';
      case 1: return 'Shrek';
      case 2: return 'Olivia';
      case 3: return 'Ava';
      default: return 'Unknown';
    }
  };
  
  // Функция для получения количества сообщений в сессии
  const getMessagesCount = (session: TestSession): number => {
    // Если есть данные о чатах, считаем общее количество сообщений
    if (session.chats && session.chats.length > 0) {
      return session.chats.reduce((total, chat) => total + (chat.messages?.length || 0), 0);
    }
    // Иначе возвращаем случайное значение для демонстрации
    return Math.floor(Math.random() * 20) + 5;
  };

  // Mock data - replace with real data from your backend
  const stats = {
    todayTrainees: 24,
    successRate: 78,
    commonErrors: [
      { error: 'Неправильное приветствие', count: 15 },
      { error: 'Отсутствие эмпатии', count: 12 },
      { error: 'Неточные формулировки', count: 8 },
    ],
  };

  const employees = [
    {
      id: '1',
      name: 'Иван Петров',
      department: 'Продажи',
      level: 'Средний',
      success: 85,
      trend: 'up',
      improvement: '+8%',
      status: 'растёт',
      avatar: 'И',
    },
    {
      id: '2',
      name: 'Анна Смирнова',
      department: 'Поддержка',
      level: 'Новичок',
      success: 40,
      trend: 'down',
      improvement: '-5%',
      status: 'ошибки в аргументации',
      avatar: 'А',
    },
    {
      id: '3',
      name: 'Дмитрий Орлов',
      department: 'Продажи',
      level: 'Эксперт',
      success: 65,
      trend: 'down',
      improvement: '-3%',
      status: 'слаб в закрытии сделок',
      avatar: 'Д',
    },
    {
      id: '4',
      name: 'Елена Козлова',
      department: 'Маркетинг',
      level: 'Средний',
      success: 75,
      trend: 'up',
      improvement: '+12%',
      status: 'стабильный рост',
      avatar: 'Е',
    },
  ];

  const departments = ['Все отделы', 'Продажи', 'Поддержка', 'Маркетинг'];
  const levels = ['Все уровни', 'Новичок', 'Средний', 'Эксперт'];
  const dateRanges = ['Все время', 'Сегодня', 'Неделя', 'Месяц'];

  const filteredEmployees = employees.filter(employee => {
    return (
      (filters.department === 'all' || employee.department === filters.department) &&
      (filters.level === 'all' || employee.level === filters.level)
    );
  });

  const handleEmployeeClick = (id: string) => {
    navigate(`/admin/employee/${id}`);
  };

  const handleNewEmployeeClick = () => {
    // Generate a unique ID for the new employee
    const newEmployeeId = Date.now().toString();
    
    // Create a new employee object with default values
    const newEmployee = {
      id: newEmployeeId,
      name: 'Новый сотрудник',
      department: 'Продажи',
      level: 'Новичок',
      success: 0,
      trend: 'up',
      improvement: '0%',
      status: 'новый сотрудник',
      avatar: 'Н',
    };

    // In a real application, you would:
    // 1. Make an API call to create the employee in the database
    // 2. Update the local state with the new employee
    // 3. Handle any errors that might occur

    // For now, we'll just navigate to the new employee form
    navigate('/admin/new-employee');
  };

  const handleViewTestResults = (employeeId?: string) => {
    // Получаем ID сессии из первой (последней) доступной сессии сотрудника
    const targetEmployeeId = employeeId || recentTestSessions[0]?.employee_id;
    const employeeSession = recentTestSessions.find(session => session.employee_id === targetEmployeeId);
    
    if (employeeSession) {
      navigate(`/admin/session/${employeeSession.id}`);
    } else {
      console.error('Не удалось найти сессию для сотрудника', targetEmployeeId);
      // Можно добавить всплывающее уведомление о том, что сессия не найдена
    }
  };

  const handleViewAllTestResults = () => {
    handleViewTestResults();
  };

  const handleViewEmployeeTestResults = (id: string) => {
    // Ищем последнюю тестовую сессию для этого сотрудника
    const employeeSession = recentTestSessions.find(session => session.employee_id === id);
    
    if (employeeSession) {
      navigate(`/admin/session/${employeeSession.id}`);
    } else {
      console.error('Не удалось найти сессию для сотрудника', id);
      // Можно добавить всплывающее уведомление о том, что сессия не найдена
    }
  };

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 3.5) return 'text-blue-500';
    if (score >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Функция для форматирования даты и времени
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ru-RU'),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Панель управления
          </h1>
          <p className="text-gray-400 mt-2">Обзор тренингов и прогресса сотрудников</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleViewAllTestResults}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg hover:bg-[#3d3d3d] transition-colors"
          >
            <Target className="w-5 h-5 text-purple-500" />
            <span>Результаты тестов</span>
          </button>
          <button
            onClick={handleNewEmployeeClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-5 h-5" />
            <span>Новый сотрудник</span>
          </button>
        </div>
      </div>

      {/* Recent Test Sessions */}
      <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d] mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Недавние тестирования
          </h2>
          <button 
            onClick={handleViewAllTestResults}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Смотреть все
          </button>
        </div>

        {loadingTestSessions ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-purple-500 rounded-full"></div>
          </div>
        ) : recentTestSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Пока нет данных о тестированиях</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#3d3d3d]">
                  <th className="pb-3 pl-4">Пользователь</th>
                  <th className="pb-3">ФИО соискателя</th>
                  <th className="pb-3">Дата/Время</th>
                  <th className="pb-3">Сообщения</th>
                  <th className="pb-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3d3d]">
                {recentTestSessions.map((session) => {
                  const { date, time } = formatDateTime(session.created_at);
                  // Используем первые две буквы имени сотрудника как инициалы
                  const initials = session.employee ? 
                    (session.employee.first_name[0] + session.employee.last_name[0]).toUpperCase() :
                    '??';
                  
                  return (
                    <tr 
                      key={session.id} 
                      className="hover:bg-[#3d3d3d]/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/session/${session.id}`)}
                    >
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium">
                              {session.employee ? 
                                `${session.employee.first_name} ${session.employee.last_name}` :
                                'Сотрудник не найден'
                              }
                            </div>
                            <div className="text-sm text-gray-400">
                              Участник тестирования
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="font-medium">
                          {session.character_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          Тестовый персонаж
                        </div>
                      </td>
                      <td className="py-4">
                        <div>{date}</div>
                        <div className="text-sm text-gray-400">{time}</div>
                      </td>
                      <td className="py-4">
                        <div className="font-medium">{session.messages_count}</div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            session.completed
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {session.completed ? 'Завершено' : 'Активно'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Common Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-pink-500" />
              Частые ошибки
            </h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.commonErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{index + 1}.</span>
                  <span>{error.error}</span>
                </div>
                <span className="text-gray-400">{error.count} раз</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employees Section */}
        <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Сотрудники
            </h2>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <select
                className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-4 py-2 appearance-none cursor-pointer text-gray-300"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept === 'Все отделы' ? 'all' : dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-4 py-2 appearance-none cursor-pointer text-gray-300"
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              >
                {levels.map((level) => (
                  <option key={level} value={level === 'Все уровни' ? 'all' : level}>
                    {level}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-4 py-2 appearance-none cursor-pointer text-gray-300"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              >
                {dateRanges.map((range) => (
                  <option key={range} value={range === 'Все время' ? 'all' : range}>
                    {range}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Employees List */}
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                onClick={() => handleEmployeeClick(employee.id)}
                className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#3d3d3d] cursor-pointer hover:border-pink-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center font-semibold">
                    {employee.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium">{employee.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{employee.department}</span>
                      <span className="text-gray-600">•</span>
                      <span className={`${
                        employee.level === 'Эксперт' ? 'text-purple-400' :
                        employee.level === 'Средний' ? 'text-blue-400' :
                        'text-green-400'
                      }`}>{employee.level}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{employee.success}%</span>
                    <div className={`flex items-center gap-1 ${
                      employee.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {employee.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>{employee.improvement}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{employee.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;