import { NextResponse } from 'next/server';
import { generateGrokResponse, analyzeDialogs } from '../../../src/services/gemini';

// POST /api/gemini/generate - генерировать ответ от Gemini
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { messages, conversationDetails } = data;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать массив сообщений' },
        { status: 400 }
      );
    }
    
    const response = await generateGrokResponse(messages, conversationDetails);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return NextResponse.json(
      { error: 'Ошибка при генерации ответа от Gemini' },
      { status: 500 }
    );
  }
}

// PUT /api/gemini/analyze - анализировать диалоги с помощью Gemini
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { prompt } = data;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Необходимо указать промпт для анализа' },
        { status: 400 }
      );
    }
    
    const result = await analyzeDialogs(prompt);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing dialogs with Gemini:', error);
    return NextResponse.json(
      { error: 'Ошибка при анализе диалогов' },
      { status: 500 }
    );
  }
} 