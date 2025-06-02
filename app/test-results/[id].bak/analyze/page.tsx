import React from 'react';
import { getTestSession, generateAnalysisPrompt, saveTestResult } from '../../../../src/lib/supabase';
import { analyzeDialogs } from '../../../../src/services/gemini';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * Страница для запуска анализа результатов теста
 * Выполняет анализ диалогов и сохраняет результаты
 */
export default async function AnalyzeTestResult({ params }: { params: { id: string } }) {
  const sessionId = params.id;
  
  // Проверяем существование сессии и её статус
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
  
  // Проверяем, что сессия завершена
  if (!session.completed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-yellow-600">Сессия не завершена</h1>
          <p className="mb-4">Тестовая сессия не завершена. Сначала завершите тест, чтобы запустить анализ.</p>
          <div className="flex space-x-4">
            <Link 
              href={`/chat?sessionId=${sessionId}`} 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Вернуться к тесту
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Перейти на дашборд
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  try {
    // Генерируем промпт для анализа
    const prompt = await generateAnalysisPrompt(sessionId);
    
    if (!prompt) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Ошибка генерации промпта</h1>
            <p className="mb-4">Не удалось сгенерировать промпт для анализа диалогов.</p>
            <Link 
              href={`/test-results/${sessionId}`} 
              className="text-blue-600 hover:underline"
            >
              Вернуться к результатам теста
            </Link>
          </div>
        </div>
      );
    }
    
    // Выполняем анализ диалогов
    const analysisResult = await analyzeDialogs(prompt);
    
    // Сохраняем результаты анализа
    await saveTestResult({
      test_session_id: sessionId,
      employee_id: session.employee_id,
      analysis_result: analysisResult,
      raw_prompt: prompt
    });
    
    // Перенаправляем на страницу результатов
    redirect(`/test-results/${sessionId}`);
  } catch (error) {
    console.error('Error analyzing test results:', error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Ошибка анализа</h1>
          <p className="mb-4">Произошла ошибка при анализе результатов теста. Пожалуйста, попробуйте еще раз.</p>
          <p className="mb-4 text-sm text-gray-600">Технические детали: {(error as Error).message}</p>
          <div className="flex space-x-4">
            <Link 
              href={`/test-results/${sessionId}`} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Вернуться к результатам
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Этот код не должен выполниться благодаря redirect,
  // но возвращаем сообщение о загрузке на случай, если redirect не сработает
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Анализ диалогов</h1>
        <p className="mb-4">Выполняется анализ диалогов и сохранение результатов...</p>
        <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
        <p className="mt-4 text-sm text-gray-600">
          Это может занять некоторое время. Пожалуйста, не закрывайте страницу.
        </p>
      </div>
    </div>
  );
} 