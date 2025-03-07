import React from 'react';
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
} from 'lucide-react';

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with real data from your backend
  const employee = {
    id: '1',
    name: 'Иван Петров',
    department: 'Продажи',
    level: 'Средний',
    success: 85,
    improvement: '+8%',
    status: 'растёт',
    avatar: 'И',
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
        <div>
          <h1 className="text-2xl font-bold">Личное дело сотрудника</h1>
          <p className="text-gray-400 mt-1">Последнее обновление: {employee.lastTest}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
              {employee.avatar}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{employee.name}</h2>
              <p className="text-gray-400">{employee.department}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-gray-400">Уровень</span>
              <span className="font-medium">{employee.level}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-gray-400">Общий КПД</span>
              <span className="font-medium">{employee.success}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-gray-400">Прогресс за месяц</span>
              <div className="flex items-center gap-2">
                <span className={employee.monthlyProgress.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {employee.monthlyProgress.change}
                </span>
                {employee.monthlyProgress.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Прогресс за месяц
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-1">Текущий показатель</p>
                <p className="text-2xl font-bold">{employee.monthlyProgress.current}%</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 mb-1">Предыдущий месяц</p>
                <p className="text-2xl font-bold text-gray-400">{employee.monthlyProgress.previous}%</p>
              </div>
            </div>

            <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                style={{ width: `${employee.monthlyProgress.current}%` }}
              />
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Путь обучения
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-500" />
                Завершенные курсы
              </p>
              {employee.learningPath.completed.map((course, index) => (
                <div key={index} className="pl-6 py-1 text-green-400">
                  {course}
                </div>
              ))}
            </div>

            <div>
              <p className="text-gray-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                В процессе
              </p>
              <div className="pl-6 py-1 text-yellow-400">
                {employee.learningPath.inProgress}
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                Рекомендуемые курсы
              </p>
              {employee.learningPath.recommended.map((course, index) => (
                <div key={index} className="pl-6 py-1 text-blue-400">
                  {course}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Analysis */}
        <div className="lg:col-span-2 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
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
              <div className="grid gap-2">
                {employee.skillAnalysis.excellent.map((skill, index) => (
                  <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-green-500/20">
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
                {employee.skillAnalysis.good.map((skill, index) => (
                  <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-yellow-500/20">
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
                {employee.skillAnalysis.needsImprovement.map((skill, index) => (
                  <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg border border-red-500/20">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Dialogues */}
        <div className="lg:col-span-3 bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Последние диалоги
          </h3>

          <div className="grid gap-4">
            {employee.recentDialogues.map((dialogue, index) => (
              <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{dialogue.date}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      dialogue.status === 'успех' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {dialogue.status}
                    </span>
                  </div>
                  <span className="text-xl font-bold">{dialogue.score}%</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-green-400 mb-2 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      Сильные стороны
                    </p>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {dialogue.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  </div>

                  {dialogue.improvements.length > 0 && (
                    <div>
                      <p className="text-red-400 mb-2 flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4" />
                        Требуют улучшения
                      </p>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {dialogue.improvements.map((improvement, idx) => (
                          <li key={idx}>{improvement}</li>
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