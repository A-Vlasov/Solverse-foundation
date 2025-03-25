import { NextRequest, NextResponse } from 'next/server';
import { analyzeDialogs } from '../../../../src/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: prompt is required and must be a string' }, 
        { status: 400 }
      );
    }

    // Вызов функции анализа диалогов
    const analysisResult = await analyzeDialogs(prompt);

    // Возвращаем результат
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing dialogs with Grok:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Для совместимости с сервисом API, который использует PUT
export const PUT = POST;