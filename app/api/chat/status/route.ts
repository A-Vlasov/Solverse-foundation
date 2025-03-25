import { NextResponse } from 'next/server';
import { 
  getTestSession,
  updateChatStatus 
} from '../../../../src/lib/supabase';

// POST /api/chat/status - обновить статус чата (печатание, прочитано и т.д.)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId, chatNumber, status } = data;
    
    if (!sessionId || !chatNumber || !status) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId, chatNumber и status' },
        { status: 400 }
      );
    }
    
    // Проверяем, что chatNumber в диапазоне 1-4
    if (chatNumber < 1 || chatNumber > 4) {
      return NextResponse.json(
        { error: 'Номер чата должен быть от 1 до 4' },
        { status: 400 }
      );
    }
    
    // Получаем сессию для проверки её существования
    const session = await getTestSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }
    
    // Проверяем, что сессия не завершена
    if (session.completed) {
      return NextResponse.json(
        { error: 'Невозможно обновить статус для завершенной сессии' },
        { status: 400 }
      );
    }
    
    // Обновляем статус чата
    // Примечание: функция updateChatStatus должна быть реализована в supabase.ts
    // Если её нет, нужно будет её добавить или использовать другую подходящую функцию
    const result = await updateChatStatus(sessionId, chatNumber as 1 | 2 | 3 | 4, status);
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error updating chat status:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса чата' },
      { status: 500 }
    );
  }
} 