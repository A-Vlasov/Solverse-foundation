import { NextResponse } from 'next/server';
import { 
  getTestSession, 
  generateAnalysisPrompt, 
  saveTestResult 
} from '../../../../src/lib/supabase';
import { analyzeDialogs } from '../../../../src/services/grok';

// POST /api/chat/analyze - анализировать диалоги в чате и сохранить результаты
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId } = data;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      );
    }
    
    // Получаем сессию для проверки её существования и получения ID сотрудника
    const session = await getTestSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }
    
    // Генерируем промпт для анализа
    const prompt = await generateAnalysisPrompt(sessionId);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать промпт для анализа' },
        { status: 500 }
      );
    }
    
    // Выполняем анализ диалогов
    const analysisResult = await analyzeDialogs(prompt);
    
    // Сохраняем результаты анализа
    const savedResult = await saveTestResult({
      test_session_id: sessionId,
      employee_id: session.employee_id,
      analysis_result: analysisResult,
      raw_prompt: prompt
    });
    
    return NextResponse.json({
      success: true,
      analysisResult,
      savedResult
    });
  } catch (error) {
    console.error('Error analyzing chat:', error);
    return NextResponse.json(
      { error: 'Ошибка при анализе чата' },
      { status: 500 }
    );
  }
} 