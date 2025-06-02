import { NextResponse } from 'next/server';
import { generateGrokResponse } from '../../../../src/services/gemini';

/**
 * Обработчик POST-запросов к /api/gemini/chat
 * Проксирует запросы к Gemini API, чтобы все обращения происходили со стороны сервера
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { messages, conversationDetails } = data;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Сообщения отсутствуют или имеют неверный формат' },
        { status: 400 }
      );
    }
    
    console.log('[API] /api/gemini/chat: Обработка запроса к Gemini API');
    console.log('Количество сообщений:', messages.length);
    console.log('Данные о беседе:', conversationDetails || 'Новая беседа');
    
    // Вызываем сервис Gemini API
    const geminiResponse = await generateGrokResponse(messages, conversationDetails);
    
    // Проверяем наличие ошибок
    if (geminiResponse.error) {
      console.error('[API] /api/gemini/chat: Ошибка Gemini API:', geminiResponse.error);
      return NextResponse.json(
        { error: geminiResponse.error },
        { status: 500 }
      );
    }
    
    console.log('[API] /api/gemini/chat: Получен ответ от Gemini API');
    
    // Обрабатываем специальные теги
    let responseContent = geminiResponse.response;
    
    const boughtTag = responseContent.includes('[Bought]');
    const notBoughtTag = responseContent.includes('[Not Bought]');
    
    // Возвращаем ответ клиенту
    return NextResponse.json({
      conversation_id: geminiResponse.conversation_id,
      parent_response_id: geminiResponse.parent_response_id,
      response: responseContent,
      chat_link: geminiResponse.chat_link,
      boughtTag,
      notBoughtTag
    });
  } catch (error) {
    console.error('[API] /api/gemini/chat: Ошибка:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    );
  }
} 