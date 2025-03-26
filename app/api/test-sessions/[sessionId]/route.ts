import { NextRequest, NextResponse } from 'next/server';
import { getTestSession, getTestSessionChats } from '../../../../src/lib/supabase';

// GET /api/test-sessions/:sessionId - получить сессию тестирования по ID
export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  
  console.log(`[API] /api/test-sessions/${sessionId}: Запрос получения сессии`);
  
  if (!sessionId) {
    console.error('[API] /api/test-sessions/[sessionId]: Не указан ID сессии');
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }
  
  // Проверка валидности ID сессии (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    console.error(`[API] /api/test-sessions/[sessionId]: Невалидный формат ID сессии: ${sessionId}`);
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`[API] /api/test-sessions/${sessionId}: Запрос данных из базы...`);
    const session = await getTestSession(sessionId);
    
    if (!session) {
      console.warn(`[API] /api/test-sessions/${sessionId}: Сессия не найдена`);
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }
    
    console.log(`[API] /api/test-sessions/${sessionId}: Сессия успешно получена`);
    
    // Дополнительно получаем историю чатов для этой сессии
    const chats = await getTestSessionChats(sessionId);
    
    // Возвращаем объединенный результат
    return NextResponse.json({
      session,
      chats
    });
  } catch (error) {
    console.error(`[API] /api/test-sessions/${sessionId}: Ошибка:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch test session: ${errorMessage}` },
      { status: 500 }
    );
  }
} 