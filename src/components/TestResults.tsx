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
  DollarSign
} from 'lucide-react';
import { 
  getTestResultForSession, 
  getTestSession, 
  getEmployee,
  TestResult, 
  DialogAnalysisResult 
} from '../lib/supabase';

function TestResults() {
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
      console.log('React Router hooks not available');
    }
  }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  // Устанавливаем флаг монтирования и получаем sessionId из DOM
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      const container = document.getElementById('test-results-container');
      if (container) {
        const id = container.getAttribute('data-session-id');
        if (id) {
          setSessionIdFromDOM(id);
        }
      }
    }
  }, []);
  
  // Получаем актуальный sessionId с приоритетом из DOM для Next.js
  const sessionId = sessionIdFromDOM || sessionIdFromRouter;
  
  useEffect(() => {
    if (!isMounted || !sessionId) return;
    
    const fetchData = async () => {
      try {
        // Загружаем результаты тестирования
        const result = await getTestResultForSession(sessionId);
        
        if (!result) {
          setError('Результаты тестирования не найдены');
          setLoading(false);
          return;
        }
        
        setTestResult(result);
        
        // Загружаем информацию о соискателе
        try {
          const employee = await getEmployee(result.employee_id);
          if (employee) {
            setEmployeeId(employee.id);
            setEmployeeName(`${employee.first_name}`);
          }
        } catch (employeeError) {
          console.error('Error fetching employee:', employeeError);
          setEmployeeName('Неизвестный соискатель');
        }
      } catch (err) {
        console.error('Error loading test results:', err);
        setError('Ошибка при загрузке результатов тестирования');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Результаты тестирования
          </h1>
          <p className="text-gray-400 mt-1">
            Соискатель: {employeeName}
          </p>
        </div>
      </div>

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
                  <span className="text-gray-300">{testResult?.test_session_id || 'Недоступно'}</span>
            </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Дата проведения:</span>
                  <span className="text-gray-300">
                    {testResult?.created_at 
                      ? new Date(testResult.created_at).toLocaleString() 
                      : 'Недоступно'
                    }
                  </span>
                      </div>
                    </div>
                  </div>

            <button
              onClick={handleBackClick}
              className="mt-6 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Вернуться на главную
            </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default TestResults;