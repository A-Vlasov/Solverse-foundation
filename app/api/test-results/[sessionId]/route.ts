import { NextRequest, NextResponse } from 'next/server';
import { getTestResultForSession } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionId = params.sessionId;
  
  console.log(`[API] /api/test-results/${sessionId}: Запрос получения результатов тестирования`);
  
  if (!sessionId) {
    console.error('[API] /api/test-results/[sessionId]: Не указан ID сессии');
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }
  
  // Проверка валидности ID сессии (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    console.error(`[API] /api/test-results/[sessionId]: Невалидный формат ID сессии: ${sessionId}`);
    return NextResponse.json(
      { error: 'Invalid session ID format' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`[API] /api/test-results/${sessionId}: Запрос данных из базы...`);
    const result = await getTestResultForSession(sessionId);
    
    if (!result) {
      console.warn(`[API] /api/test-results/${sessionId}: Результаты не найдены`);
      return NextResponse.json(
        { message: 'No test results found for this session' },
        { status: 404 }
      );
    }
    
    console.log(`[API] /api/test-results/${sessionId}: Результаты успешно получены`);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] /api/test-results/${sessionId}: Ошибка:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch test results: ${errorMessage}` },
      { status: 500 }
    );
  }
} 