import { NextResponse } from 'next/server';
import { getTestSession, getTestSessionChats } from '../../../../src/lib/supabase';

// GET /api/test-sessions/:sessionId - получить сессию тестирования по ID
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      );
    }

    // Получаем информацию о сессии
    const session = await getTestSession(sessionId);
    
    // Дополнительно получаем историю чатов для этой сессии
    const chats = await getTestSessionChats(sessionId);
    
    // Возвращаем объединенный результат
    return NextResponse.json({
      session,
      chats
    });
  } catch (error) {
    console.error('Error fetching test session:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении сессии тестирования' },
      { status: 500 }
    );
  }
} 