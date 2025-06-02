import React from 'react';
import { getTestSession, createTestSession } from '../../src/lib/supabase';

interface TestInfoProps {
  employeeId: string;
  sessionId?: string;
}

// Функция для проверки сессии или создания новой
async function getOrCreateSession(employeeId: string, sessionId?: string) {
  // Если указан ID сессии, проверяем его
  if (sessionId) {
    const session = await getTestSession(sessionId);
    
    // Проверяем, что сессия существует и принадлежит этому сотруднику
    if (session && session.employee_id === employeeId) {
      return { 
        sessionExists: true,
        isCompleted: session.completed,
        sessionData: session 
      };
    }
  }
  
  // Если сессия не найдена или не принадлежит сотруднику, создаем новую
  return { 
    sessionExists: false,
    isCompleted: false,
    sessionData: null
  };
}

export default async function TestInfo({ employeeId, sessionId }: TestInfoProps) {
  // Проверяем сессию
  const { sessionExists, isCompleted, sessionData } = await getOrCreateSession(employeeId, sessionId);
  
  // Если сессия завершена, показываем соответствующее сообщение
  if (sessionExists && isCompleted) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Тест завершен</h2>
        <p className="mb-4">
          Этот тест уже завершен. Вы можете посмотреть результаты или начать новый тест.
        </p>
        <div className="flex space-x-4">
          <a
            href={`/test-results/${sessionId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Посмотреть результаты
          </a>
          <a
            href={`/start-test/${employeeId}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Начать новый тест
          </a>
        </div>
      </div>
    );
  }
  
  // Если сессия существует и не завершена, предлагаем продолжить
  if (sessionExists && !isCompleted) {
    const startTime = sessionData?.created_at ? new Date(sessionData.created_at) : new Date();
    const timeSinceStart = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60)); // в минутах
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Продолжить тест</h2>
        <p className="mb-2">
          У вас есть незавершенный тест, начатый {startTime.toLocaleString()}.
        </p>
        <p className="mb-4 text-sm text-gray-600">
          (Тест в процессе {timeSinceStart > 0 ? `${timeSinceStart} минут` : 'менее минуты'})
        </p>
        <div className="flex space-x-4">
          <a
            href={`/chat?sessionId=${sessionId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Продолжить тест
          </a>
          <a
            href={`/start-test/${employeeId}`}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Начать новый тест
          </a>
        </div>
      </div>
    );
  }
  
  // Если сессии нет, предлагаем начать новый тест
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Начать новый тест</h2>
      <p className="mb-4">
        Нет активных тестов. Вы можете начать новый тест прямо сейчас.
      </p>
      <a
        href={`/start-test/${employeeId}`}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-block"
      >
        Начать тест
      </a>
    </div>
  );
} 