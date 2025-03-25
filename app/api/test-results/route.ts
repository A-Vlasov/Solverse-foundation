import { NextResponse } from 'next/server';
import {
  getTestResultForSession,
  getTestResultsForEmployee,
  saveTestResult,
  generateAnalysisPrompt
} from '../../../src/lib/supabase';
import { analyzeDialogs } from '../../../src/services/grok';

// GET /api/test-results - получить результаты теста по sessionId или employeeId
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const employeeId = url.searchParams.get('employeeId');
    
    // Должен быть указан либо sessionId, либо employeeId
    if (!sessionId && !employeeId) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId или employeeId' },
        { status: 400 }
      );
    }
    
    let results;
    
    if (sessionId) {
      results = await getTestResultForSession(sessionId);
    } else if (employeeId) {
      results = await getTestResultsForEmployee(employeeId);
    }
    
    if (!results) {
      return NextResponse.json(
        { error: 'Результаты теста не найдены' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении результатов теста' },
      { status: 500 }
    );
  }
}

// POST /api/test-results - сохранить результаты теста
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId, employeeId, analyzeNow, ...resultData } = data;
    
    // Если указан параметр analyzeNow, выполняем анализ диалогов
    if (analyzeNow && sessionId) {
      try {
        // Генерируем промпт для анализа
        const prompt = await generateAnalysisPrompt(sessionId);
        
        if (!prompt) {
          return NextResponse.json(
            { error: 'Не удалось сгенерировать промпт для анализа' },
            { status: 500 }
          );
        }
        
        // Отправляем промпт на анализ
        const analysisResult = await analyzeDialogs(prompt);
        
        // Сохраняем результаты анализа
        const savedResult = await saveTestResult({
          test_session_id: sessionId,
          employee_id: employeeId,
          analysis_result: analysisResult
        });
        
        return NextResponse.json({
          success: true,
          analysisResult,
          savedResult
        });
      } catch (analysisError) {
        console.error('Error analyzing dialogs:', analysisError);
        return NextResponse.json(
          { error: 'Ошибка при анализе диалогов' },
          { status: 500 }
        );
      }
    }
    
    // Если не указан analyzeNow, просто сохраняем данные результатов
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId' },
        { status: 400 }
      );
    }
    
    const savedResult = await saveTestResult({
      test_session_id: sessionId,
      employee_id: employeeId,
      ...resultData
    });
    
    return NextResponse.json({
      success: true,
      result: savedResult
    });
  } catch (error) {
    console.error('Error saving test results:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении результатов теста' },
      { status: 500 }
    );
  }
} 