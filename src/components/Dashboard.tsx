import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../app/components/SimpleNavigation';
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
  Loader2,
} from 'lucide-react';
import { getRecentTestSessions, TestSession, getEmployees, Employee } from '../lib/supabase';

// Локальный интерфейс для отображения сессий в таблице
interface SessionDisplay extends TestSession {
  character_name?: string;
  messages_count?: number;
}

function Dashboard() {
  const { navigate, prefetch } = useNavigation();
  const [filters, setFilters] = useState({
    department: 'all',
    level: 'all',
    date: 'all',
  });
  
  // Состояние для хранения данных о сотрудниках
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  
  // Состояние для хранения данных о недавних тестированиях
  const [recentTestSessions, setRecentTestSessions] = useState<SessionDisplay[]>([]);
  const [loadingTestSessions, setLoadingTestSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных через API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Параллельная загрузка сотрудников и тестовых сессий
        const [employeesResponse, sessionsResponse] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/test-sessions')
        ]);
        
        if (!employeesResponse.ok || !sessionsResponse.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        
        const [employeesData, sessionsData] = await Promise.all([
          employeesResponse.json(),
          sessionsResponse.json()
        ]);
        
        setEmployees(employeesData);
        setRecentTestSessions(sessionsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Ошибка загрузки данных. Пожалуйста, попробуйте позже.');
      } finally {
        setLoadingEmployees(false);
        setLoadingTestSessions(false);
      }
    };
    
    fetchData();
  }, []);

  const stats = {
    todayTrainees: recentTestSessions.filter(session => {
      const today = new Date();
      const sessionDate = new Date(session.created_at);
      return sessionDate.toDateString() === today.toDateString();
    }).length,
    successRate: Math.round(
      (recentTestSessions.filter(session => session.completed).length / recentTestSessions.length) * 100
    ) || 0,
    commonErrors: [
      { error: 'Неправильное приветствие', count: 15 },
      { error: 'Отсутствие эмпатии', count: 12 },
      { error: 'Неточные формулировки', count: 8 },
    ],
  };

  const departments = ['Все отделы', 'Продажи', 'Поддержка', 'Маркетинг'];
  const levels = ['Все уровни', 'Новичок', 'Средний', 'Эксперт'];
  const dateRanges = ['Все время', 'Сегодня', 'Неделя', 'Месяц'];

  const filteredEmployees = employees
    // Сначала удаляем дубликаты по имени и нормализованному отделу
    .filter((employee, index, self) =>
      index === self.findIndex((e) => 
        (e.first_name || '') === (employee.first_name || '') && 
        ((e.department || '')?.toLowerCase() === (employee.department || '')?.toLowerCase())
      )
    )
    // Затем применяем фильтры
    .map(employee => ({
      ...employee,
      department: employee.department?.toLowerCase() === 'candidates' ? 'Candidates' : employee.department,
      level: employee.level?.toLowerCase() === 'candidate' ? 'Junior' : employee.level
    }))
    .filter(employee => {
      return (
        (filters.department === 'all' || employee.department === filters.department) &&
        (filters.level === 'all' || employee.level === filters.level)
      );
    });

  const handleEmployeeClick = (id: string) => {
    // Просто переходим по ссылке без лишней логики
    navigate(`/admin/employee/${id}`);
  };

  const handleNewEmployeeClick = () => {
    navigate('/admin/new-employee');
  };

  const handleViewTestResults = async (employeeId: string) => {
    try {
      // Получаем результаты тестирования сотрудника через API
      const response = await fetch(`/api/test-results?employeeId=${employeeId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки результатов тестирования');
      }
      
      const results = await response.json();
      
      // Если есть результаты, выбираем первый для отображения
      if (results && results.length > 0) {
        const sessionId = results[0].test_session_id;
        navigate(`/test-results/${sessionId}`);
      } else {
        // Если результатов нет, показываем сообщение
        alert('Для данного сотрудника еще нет результатов тестирования');
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      alert('Ошибка при загрузке результатов тестирования');
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

  const handleEmployeeMouseOver = (id: string) => {
    // Предварительно загружаем страницу при наведении
    prefetch(`/admin/employee/${id}`);
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
                  <th className="pb-3">Дата/Время</th>
                  <th className="pb-3">Сообщения</th>
                  <th className="pb-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3d3d]">
                {recentTestSessions.map((session) => {
                  const { date, time } = formatDateTime(session.created_at);
                  // Используем первую букву имени сотрудника как инициалы
                  const initials = session.employee && session.employee.first_name && session.employee.first_name[0] ? 
                    session.employee.first_name[0].toUpperCase() :
                    '?';
                  
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
                                `${session.employee.first_name}` :
                                'Неизвестный пользователь'}
                            </div>
                            <div className="text-sm text-gray-400">
                              Участник тестирования
                            </div>
                          </div>
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
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-[#3d3d3d]">
                      <th className="pb-3 text-sm font-medium text-gray-400">Сотрудник</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Отдел</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Уровень</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Успешность</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Тренд</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Статус</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-[#3d3d3d] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                        onClick={() => handleEmployeeClick(employee.id)}
                        onMouseOver={() => handleEmployeeMouseOver(employee.id)}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                              {employee.first_name && employee.first_name[0] ? employee.first_name[0].toUpperCase() : '?'}
                            </div>
                            <span className="text-white">{employee.first_name || 'Без имени'}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-gray-300">{employee.department}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-gray-300">{employee.level}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-[#3d3d3d]">
                              <div
                                className="h-full rounded-full bg-pink-500"
                                style={{ width: `${employee.success}%` }}
                              />
                            </div>
                            <span className="text-gray-300">{employee.success}%</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            {employee.trend === 'up' ? (
                              <ArrowUpRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-red-500" />
                            )}
                            <span className={employee.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                              {employee.improvement}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-gray-300">{employee.status}</span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEmployeeTestResults(employee.id);
                            }}
                            className="px-3 py-1 text-sm text-pink-500 hover:text-pink-400 transition-colors"
                          >
                            Результаты тестов
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Нет сотрудников, соответствующих выбранным фильтрам
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;