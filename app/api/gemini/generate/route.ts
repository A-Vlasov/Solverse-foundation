import { NextRequest, NextResponse } from 'next/server';
import { generateGrokResponse } from '../../../../src/services/gemini';

// POST /api/gemini/generate - генерировать ответ от Gemini
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, conversationDetails } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid input: messages is required and must be an array' }, 
        { status: 400 }
      );
    }

    // Проверка, что каждое сообщение имеет валидный формат
    for (const message of messages) {
      if (typeof message !== 'object' || !message.role || !message.content || 
          !['user', 'assistant', 'system'].includes(message.role)) {
        return NextResponse.json(
          { error: 'Invalid message format. Each message must have valid role and content' }, 
          { status: 400 }
        );
      }
    }

    // Вызов API Gemini
    const response = await generateGrokResponse(messages, conversationDetails);

    // Возвращаем результат
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 