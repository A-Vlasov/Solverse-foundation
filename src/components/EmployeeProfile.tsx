import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  User,
  Target,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Zap,
  FileText,
  Moon,
  Sun,
  Sunset,
} from 'lucide-react';
import { getCandidateFormByEmployeeId, CandidateFormData, getEmployee, Employee } from '../lib/supabase';

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidateForm, setCandidateForm] = useState<CandidateFormData | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

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
  };

  const getShiftDisplay = (shift: string) => {
    switch (shift?.toLowerCase()) {
      case '#ночь 0-8':
        return {
          icon: <Moon className="w-4 h-4 text-blue-400" />,
          text: 'с 00:00 до 08:00',
          label: 'Ночная смена'
        };
      case '#день 8-16':
        return {
          icon: <Sun className="w-4 h-4 text-yellow-400" />,
          text: 'с 08:00 до 16:00',
          label: 'Дневная смена'
        };
      case '#вечер 16-0':
        return {
          icon: <Sunset className="w-4 h-4 text-orange-400" />,
          text: 'с 16:00 до 00:00',
          label: 'Вечерняя смена'
        };
      default:
        return {
          icon: null,
          text: shift,
          label: 'Смена'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-6 mb-8 bg-[#2d2d2d] p-6 rounded-2xl border border-[#3d3d3d] shadow-lg">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-pink-500 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Личное дело сотрудника
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Последнее обновление: {employeeStats.lastTest}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Form Data */}
        <div className="bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <FileText className="w-5 h-5 text-pink-500" />
            Анкета соискателя
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-pink-500 rounded-full"></div>
            </div>
          ) : candidateForm ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">Имя</p>
                <p className="font-medium text-white">{candidateForm.first_name}</p>
              </div>
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">Telegram</p>
                <p className="font-medium text-white">{candidateForm.telegram_tag}</p>
              </div>
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">Смена</p>
                {candidateForm && (
                  <div className="flex items-center gap-3">
                    {getShiftDisplay(candidateForm.shift).icon}
                    <div>
                      <p className="font-medium text-white">{getShiftDisplay(candidateForm.shift).label}</p>
                      <p className="text-sm text-gray-400">{getShiftDisplay(candidateForm.shift).text}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">Опыт работы</p>
                <p className="font-medium text-white">{candidateForm.experience}</p>
              </div>
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">Причина выбора</p>
                <p className="font-medium text-white">{candidateForm.motivation}</p>
              </div>
              <div className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <p className="text-gray-400 mb-1 text-sm">О себе</p>
                <p className="font-medium text-white">{candidateForm.about_me}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Анкета не найдена</p>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-3xl font-bold shadow-lg transform hover:scale-105 transition-transform duration-300">
              {employee?.first_name?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {employee?.first_name || 'Загрузка...'}
              </h2>
              <p className="text-gray-400">{employee?.department || 'Загрузка...'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
              <span className="text-gray-400">Уровень</span>
              <span className="font-medium text-white">{employee?.level || 'Загрузка...'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
              <span className="text-gray-400">Общий КПД</span>
              <span className="font-medium text-white">{employee?.success || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
              <span className="text-gray-400">Прогресс за месяц</span>
              <div className="flex items-center gap-2">
                <span className={employee?.trend === 'up' ? 'text-green-400' : 'text-red-400'}>
                  {employee?.improvement || '0%'}
                </span>
                {employee?.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Прогресс за месяц
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">Текущий показатель</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {employeeStats.monthlyProgress.current}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 mb-1">Предыдущий месяц</p>
                <p className="text-3xl font-bold text-gray-400">
                  {employeeStats.monthlyProgress.previous}%
                </p>
              </div>
            </div>

            <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden shadow-lg">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000 ease-in-out"
                style={{ width: `${employeeStats.monthlyProgress.current}%` }}
              />
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div className="bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <BookOpen className="w-5 h-5 text-pink-500" />
            Путь обучения
          </h3>

          <div className="space-y-6">
            <div>
              <p className="text-gray-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-400" />
                Завершенные курсы
              </p>
              {employeeStats.learningPath.completed.map((course, index) => (
                <div key={index} className="pl-6 py-2 text-green-400 hover:text-green-300 transition-colors">
                  {course}
                </div>
              ))}
            </div>

            <div>
              <p className="text-gray-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                В процессе
              </p>
              <div className="pl-6 py-2 text-yellow-400 hover:text-yellow-300 transition-colors">
                {employeeStats.learningPath.inProgress}
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                Рекомендуемые курсы
              </p>
              {employeeStats.learningPath.recommended.map((course, index) => (
                <div key={index} className="pl-6 py-2 text-blue-400 hover:text-blue-300 transition-colors">
                  {course}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Analysis */}
        <div className="lg:col-span-2 bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <Target className="w-5 h-5 text-pink-500" />
            Анализ навыков
          </h3>

          <div className="grid gap-6">
            <div>
              <p className="text-green-400 mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                Отличные навыки
              </p>
              <div className="grid gap-2">
                {employeeStats.skillAnalysis.excellent.map((skill, index) => (
                  <div key={index} className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-green-500/20 hover:border-green-500/50 transition-all duration-300">
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-yellow-400 mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                Хорошие навыки
              </p>
              <div className="grid gap-2">
                {employeeStats.skillAnalysis.good.map((skill, index) => (
                  <div key={index} className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-red-400 mb-3 flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                Требуют улучшения
              </p>
              <div className="grid gap-2">
                {employeeStats.skillAnalysis.needsImprovement.map((skill, index) => (
                  <div key={index} className="p-4 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-red-500/20 hover:border-red-500/50 transition-all duration-300">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Dialogues */}
        <div className="lg:col-span-3 bg-[#2d2d2d]/50 backdrop-blur rounded-2xl p-6 border border-[#3d3d3d] shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            Последние диалоги
          </h3>

          <div className="grid gap-4">
            {employeeStats.recentDialogues.map((dialogue, index) => (
              <div key={index} className="p-6 bg-[#1a1a1a]/50 backdrop-blur rounded-lg border border-[#3d3d3d] hover:border-pink-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{dialogue.date}</span>
                    <span className={`px-4 py-1 rounded-full text-sm ${
                      dialogue.status === 'успех' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    }`}>
                      {dialogue.status}
                    </span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {dialogue.score}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-green-400 mb-3 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Сильные стороны
                    </p>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      {dialogue.highlights.map((highlight, idx) => (
                        <li key={idx} className="hover:text-white transition-colors">{highlight}</li>
                      ))}
                    </ul>
                  </div>

                  {dialogue.improvements.length > 0 && (
                    <div>
                      <p className="text-red-400 mb-3 flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4" />
                        Требуют улучшения
                      </p>
                      <ul className="list-disc list-inside text-gray-300 space-y-2">
                        {dialogue.improvements.map((improvement, idx) => (
                          <li key={idx} className="hover:text-white transition-colors">{improvement}</li>
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
    </div>
  );
}

export default EmployeeProfile;