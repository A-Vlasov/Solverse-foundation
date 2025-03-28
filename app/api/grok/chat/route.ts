import { NextResponse } from 'next/server';
import { generateGrokResponse } from '../../../../src/services/grok';

/**
 * Обработчик POST-запросов к /api/grok/chat
 * Проксирует запросы к Grok API, чтобы все обращения происходили со стороны сервера
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
    
    console.log('[API] /api/grok/chat: Обработка запроса к Grok API');
    console.log('Количество сообщений:', messages.length);
    console.log('Данные о беседе:', conversationDetails || 'Новая беседа');
    
    // Вызываем сервис Grok API
    const grokResponse = await generateGrokResponse(messages, conversationDetails);
    
    // Проверяем наличие ошибок
    if (grokResponse.error) {
      console.error('[API] /api/grok/chat: Ошибка Grok API:', grokResponse.error);
      return NextResponse.json(
        { error: grokResponse.error },
        { status: 500 }
      );
    }
    
    console.log('[API] /api/grok/chat: Получен ответ от Grok API');
    
    // Обрабатываем специальные теги
    let responseContent = grokResponse.response;
    
    const boughtTag = responseContent.includes('[Bought]');
    const notBoughtTag = responseContent.includes('[Not Bought]');
    
    // Возвращаем ответ клиенту
    return NextResponse.json({
      conversation_id: grokResponse.conversation_id,
      parent_response_id: grokResponse.parent_response_id,
      response: responseContent,
      chat_link: grokResponse.chat_link,
      boughtTag,
      notBoughtTag
    });
  } catch (error) {
    console.error('[API] /api/grok/chat: Ошибка:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    );
  }
} 