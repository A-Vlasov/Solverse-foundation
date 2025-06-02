import { NextResponse } from 'next/server';
import {
  getRecentTestSessions,
  getTestSession,
  createTestSession,
  completeTestSession,
  addMessageToTestSession
} from '../../../src/lib/supabase';

// GET /api/test-sessions - получить все сессии или конкретную по id
export async function GET(request: Request) {
  try {
    console.log('API: Получен запрос на /api/test-sessions');
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    
    // Если указан id, возвращаем конкретную сессию
    if (id) {
      console.log('API: Запрос сессии по ID:', id);
      try {
        const session = await getTestSession(id);
        
        if (!session) {
          console.log('API: Сессия не найдена, ID:', id);
          return NextResponse.json(
            { error: 'Сессия не найдена' },
            { status: 404 }
          );
        }
        
        console.log('API: Сессия найдена, ID:', id);
        return NextResponse.json(session);
      } catch (sessionError) {
        console.error('API: Ошибка при получении сессии по ID:', sessionError);
        return NextResponse.json(
          { error: 'Ошибка при получении данных о сессии', details: String(sessionError) },
          { status: 500 }
        );
      }
    }
    
    // Иначе возвращаем список всех сессий с ограничением, если оно указано
    console.log('API: Запрос всех сессий, лимит:', limit || 10);
    try {
      const sessions = await getRecentTestSessions(limit || 10);
      console.log('API: Получены сессии, количество:', sessions?.length || 0);
      
      return NextResponse.json(sessions);
    } catch (listError) {
      console.error('API: Ошибка при получении списка сессий:', listError);
      return NextResponse.json(
        { error: 'Ошибка при получении данных о тестовых сессиях', details: String(listError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Глобальная ошибка в test-sessions route:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных о тестовых сессиях', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/test-sessions - создать новую тестовую сессию
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId } = data;
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'ID сотрудника не указан' },
        { status: 400 }
      );
    }
    
    const session = await createTestSession(employeeId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Не удалось создать тестовую сессию' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании тестовой сессии' },
      { status: 500 }
    );
  }
}

// PATCH /api/test-sessions - обновить тестовую сессию (завершить или добавить сообщение)
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      );
    }
    
    // Проверяем, что тело запроса не пустое
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Требуется Content-Type: application/json' },
        { status: 400 }
      );
    }

    const text = await request.text();
    if (!text) {
      // Если тело запроса пустое, завершаем сессию без дополнительных данных
      if (id) {
        const result = await completeTestSession(id);
        return NextResponse.json({
          success: true,
          ...result
        });
      }
      return NextResponse.json(
        { error: 'Пустое тело запроса' },
        { status: 400 }
      );
    }
    
    const data = JSON.parse(text);
    const { action, chatId, message } = data;
    
    // Проверяем действие
    if (action === 'complete') {
      // Завершаем сессию
      const result = await completeTestSession(id);
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } else if (action === 'addMessage' && chatId !== undefined && message) {
      // Добавляем сообщение
      const result = await addMessageToTestSession(id, chatId, message);
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } else {
      return NextResponse.json(
        { error: 'Недопустимое действие или отсутствуют необходимые параметры' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating test session:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении тестовой сессии' },
      { status: 500 }
    );
  }
} 