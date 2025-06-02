import React from 'react';
import { getEmployee, createTestSession } from '../../../src/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/**
 * Страница для начала нового теста
 * Получает ID сотрудника из параметров, создает новую тестовую сессию
 * и перенаправляет на страницу чата
 */
export default async function StartTest({ params }: { params: { sessionId: string } }) {
  const employeeId = params.sessionId;
  
  // Проверяем существование сотрудника
  const employee = await getEmployee(employeeId);
  
  if (!employee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Сотрудник не найден</h1>
          <p className="mb-4">Сотрудник с ID {employeeId} не найден.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }
  
  // Создаем новую тестовую сессию
  try {
    const session = await createTestSession(employeeId);
    
    if (!session) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Ошибка создания сессии</h1>
            <p className="mb-4">Не удалось создать тестовую сессию. Пожалуйста, попробуйте еще раз.</p>
            <Link href="/" className="text-blue-600 hover:underline">
              Вернуться на главную
            </Link>
          </div>
        </div>
      );
    }
    
    // Перенаправляем на страницу чата с новой сессией
    redirect(`/chat?sessionId=${session.id}`);
  } catch (error) {
    console.error('Error creating test session:', error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Ошибка создания сессии</h1>
          <p className="mb-4">Произошла ошибка при создании тестовой сессии. Пожалуйста, попробуйте еще раз.</p>
          <p className="mb-4 text-sm text-gray-600">Технические детали: {(error as Error).message}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }
  
  // Этот код не должен выполниться благодаря redirect,
  // но возвращаем сообщение о загрузке на случай, если redirect не сработает
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Создание тестовой сессии</h1>
        <p className="mb-4">Создание тестовой сессии и перенаправление на страницу чата...</p>
        <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
      </div>
    </div>
  );
} 