import React from 'react';
import { getTestSession, getTestResultForSession, getEmployee } from '../../../src/lib/supabase';
import Link from 'next/link';

// Функция для форматирования оценки
function formatScore(score: number | undefined): React.ReactNode {
  if (!score && score !== 0) return '-';
  
  // Определяем цвет на основе оценки
  const color = score >= 4 ? 'text-green-600' :
               score >= 3 ? 'text-yellow-600' :
               'text-red-600';
  
  return <span className={`font-bold ${color}`}>{score.toFixed(1)}/5.0</span>;
}

// Функция для создания индикатора прогресса
function ProgressBar({ score }: { score: number | undefined }) {
  if (!score && score !== 0) return <div className="h-2 bg-gray-200 rounded-full"></div>;
  
  const width = Math.round((score / 5) * 100);
  
  const color = score >= 4 ? 'bg-green-600' :
               score >= 3 ? 'bg-yellow-600' :
               'bg-red-600';
  
  return (
    <div className="h-2 bg-gray-200 rounded-full">
      <div 
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
}

export default async function TestResults({ params }: { params: { id: string } }) {
  // Получаем данные о сессии и результаты теста
  const sessionId = params.id;
  const session = await getTestSession(sessionId);
  
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Сессия не найдена</h1>
          <p className="mb-4">Тестовая сессия с ID {sessionId} не найдена.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }
  
  const testResult = await getTestResultForSession(sessionId);
  const employee = await getEmployee(session.employee_id);
  
  // Проверяем, есть ли результаты анализа
  const hasAnalysis = testResult && testResult.analysis_result && testResult.analysis_result.dialog_analysis;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Результаты теста</h1>
          
          <div className="flex space-x-2">
            <Link 
              href={`/employee/${session.employee_id}`} 
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Профиль сотрудника
            </Link>
            <Link 
              href={`/chat?sessionId=${sessionId}`} 
              className="px-3 py-1 bg-green-600 text-white rounded text-sm"
            >
              {session.completed ? 'Просмотреть диалоги' : 'Продолжить тест'}
            </Link>
          </div>
        </div>
        
        {/* Информация о сессии */}
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Информация о сессии</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">ID сессии</p>
              <p className="font-medium">{sessionId}</p>
            </div>
            <div>
              <p className="text-gray-600">Дата создания</p>
              <p className="font-medium">
                {session.created_at ? new Date(session.created_at).toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Статус</p>
              <p className="font-medium">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {session.completed ? 'Завершена' : 'В процессе'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-600">Сотрудник</p>
              <p className="font-medium">{employee ? employee.first_name : 'Неизвестный сотрудник'}</p>
            </div>
          </div>
        </div>
        
        {/* Результаты анализа */}
        {hasAnalysis ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Результаты анализа</h2>
            
            {/* Общий вывод */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Общее заключение</h3>
              <p className="text-gray-700">
                {testResult?.analysis_result?.dialog_analysis?.overall_conclusion}
              </p>
            </div>
            
            {/* Метрики */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Вовлеченность */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Вовлеченность</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.engagement?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.engagement?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.engagement?.verdict}
                </p>
              </div>
              
              {/* Общение и тон */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Общение и тон</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.charm_and_tone?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.charm_and_tone?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.charm_and_tone?.verdict}
                </p>
              </div>
              
              {/* Креативность */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Креативность</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.creativity?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.creativity?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.creativity?.verdict}
                </p>
              </div>
              
              {/* Адаптивность */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Адаптивность</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.adaptability?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.adaptability?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.adaptability?.verdict}
                </p>
              </div>
              
              {/* Самопродвижение */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Самопродвижение</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.self_promotion?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.self_promotion?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.self_promotion?.verdict}
                </p>
              </div>
              
              {/* Ценовая политика */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Ценовая политика</h3>
                <div className="flex justify-between items-center mb-2">
                  <span>Оценка</span>
                  {formatScore(testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.score)}
                </div>
                <ProgressBar score={testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.score} />
                <p className="mt-2 text-sm text-gray-700">
                  {testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.verdict}
                </p>
                
                {/* Сильные стороны и области для улучшения */}
                {testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.strengths && 
                 testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.strengths.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-green-700 mb-1">Сильные стороны:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.improvements && 
                 testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.improvements.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-red-700 mb-1">Области для улучшения:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {testResult?.analysis_result?.dialog_analysis?.metrics?.pricing_policy?.improvements.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4 text-yellow-600">Анализ не выполнен</h2>
            <p className="mb-4">
              {session.completed ? 
                'Тест завершен, но анализ результатов еще не выполнен.' : 
                'Тест не завершен. Сначала завершите тест, чтобы увидеть результаты анализа.'
              }
            </p>
            
            {session.completed ? (
              <Link 
                href={`/test-results/${sessionId}/analyze`} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Запустить анализ
              </Link>
            ) : (
              <Link 
                href={`/chat?sessionId=${sessionId}`} 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Продолжить тест
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 