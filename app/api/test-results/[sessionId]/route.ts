import { NextRequest, NextResponse } from 'next/server';
import { getTestResultForSession, supabase } from '../../../../src/lib/supabase';

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
    
    // Сначала пробуем стандартный способ получения результата через getTestResultForSession
    let result = await getTestResultForSession(sessionId);
    
    // Если стандартный метод не вернул результат, проверяем напрямую наличие дубликатов
    if (!result) {
      console.log(`[API] /api/test-results/${sessionId}: Результаты не найдены стандартным методом, проверяем наличие дубликатов...`);
      
      // Проверяем наличие множественных записей для данного session_id
      const { data: duplicateResults, error: duplicateError } = await supabase
        .from('test_results')
        .select('*')
        .eq('test_session_id', sessionId);
      
      if (duplicateError) {
        console.error(`[API] /api/test-results/${sessionId}: Ошибка при проверке дубликатов:`, duplicateError);
      } else if (duplicateResults && duplicateResults.length > 0) {
        console.log(`[API] /api/test-results/${sessionId}: Найдено ${duplicateResults.length} результатов! Возвращаем первый.`);
        result = duplicateResults[0];
      }
    }
    
    if (!result) {
      console.warn(`[API] /api/test-results/${sessionId}: Результаты не найдены даже после проверки дубликатов`);
      return NextResponse.json(
        { message: 'No test results found for this session' },
        { status: 404 }
      );
    }
    
    console.log(`[API] /api/test-results/${sessionId}: Результаты успешно получены, ID результата: ${result.id}`);
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