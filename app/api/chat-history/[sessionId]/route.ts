import { NextRequest, NextResponse } from 'next/server';
import { getChatHistory } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  
  console.log(`[API] /api/chat-history/${sessionId}: Запрос получения истории чатов`);
  
  if (!sessionId) {
    console.error('[API] /api/chat-history/[sessionId]: Не указан ID сессии');
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }
  
  // Проверка валидности ID сессии (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    console.error(`[API] /api/chat-history/[sessionId]: Невалидный формат ID сессии: ${sessionId}`);
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`[API] /api/chat-history/${sessionId}: Запрос данных из базы...`);
    const chatHistory = await getChatHistory(sessionId);
    
    if (!chatHistory || chatHistory.length === 0) {
      console.warn(`[API] /api/chat-history/${sessionId}: История чатов пуста`);
      return NextResponse.json([]);
    }
    
    console.log(`[API] /api/chat-history/${sessionId}: Получено ${chatHistory.length} чатов`);
    return NextResponse.json(chatHistory);
  } catch (error) {
    console.error(`[API] /api/chat-history/${sessionId}: Ошибка:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch chat history: ${errorMessage}` },
      { status: 500 }
    );
  }
} 