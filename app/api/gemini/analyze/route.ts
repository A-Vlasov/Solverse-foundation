import { NextRequest, NextResponse } from 'next/server';
import { analyzeDialogs } from '../../../../src/services/gemini';

/**
 * Обработчик POST-запросов к /api/gemini/analyze
 * Проксирует запросы на анализ диалогов через Gemini API, чтобы все обращения происходили со стороны сервера
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { prompt } = data;
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Промпт отсутствует или имеет неверный формат' },
        { status: 400 }
      );
    }
    
    console.log('[API] /api/gemini/analyze: Обработка запроса на анализ');
    console.log('Длина промпта:', prompt.length);
    
    // Вызываем сервис анализа диалогов
    const analysisResult = await analyzeDialogs(prompt);
    
    console.log('[API] /api/gemini/analyze: Получен результат анализа');
    
    // Возвращаем ответ клиенту
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('[API] /api/gemini/analyze: Ошибка:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    );
  }
}

// Для совместимости с сервисом API, который использует PUT
export const PUT = POST; 