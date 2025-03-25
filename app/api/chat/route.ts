import { NextResponse } from 'next/server';
import {
  getTestSessionChats,
  addMessageToTestSession,
  ChatMessage
} from '../../../src/lib/supabase';
import { generateGrokResponse } from '../../../src/services/grok';

// Определяем типы для сообщений Grok
type MessageRole = 'user' | 'assistant' | 'system';
type GrokMessage = {
  role: MessageRole;
  content: string;
};

// GET /api/chat - получить сообщения для сессии
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      );
    }
    
    const messages = await getTestSessionChats(sessionId);
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении сообщений чата' },
      { status: 500 }
    );
  }
}

// POST /api/chat - отправить сообщение и получить ответ
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId, message, employeeId, chatNumber } = data;
    
    if (!sessionId || !message || !employeeId || !chatNumber) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }
    
    // Проверяем, что chatNumber в диапазоне 1-4
    if (chatNumber < 1 || chatNumber > 4) {
      return NextResponse.json(
        { error: 'Номер чата должен быть от 1 до 4' },
        { status: 400 }
      );
    }
    
    // Сохраняем сообщение пользователя
    await addMessageToTestSession(
      sessionId,
      chatNumber as 1 | 2 | 3 | 4,
      {
        content: message,
        time: new Date().toISOString(),
        isOwn: true,
        isRead: true
      }
    );
    
    // Получаем предыдущие сообщения для контекста
    const chatHistory = await getTestSessionChats(sessionId);
    const currentChat = chatHistory.find(chat => chat.chat_number === chatNumber);
    
    if (!currentChat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }
    
    // Формируем сообщения для Grok
    const messagesForGrok: GrokMessage[] = currentChat.messages.map((msg: any) => ({
      role: (msg.isOwn ? 'user' : 'assistant') as MessageRole,
      content: msg.content
    }));
    
    // Получаем ответ от Grok
    let botResponse;
    try {
      const grokResult = await generateGrokResponse(messagesForGrok);
      botResponse = { response: grokResult.response };
      
      // Сохраняем ответ бота
      if (botResponse.response) {
        await addMessageToTestSession(
          sessionId,
          chatNumber as 1 | 2 | 3 | 4,
          {
            content: botResponse.response,
            time: new Date().toISOString(),
            isOwn: false,
            isRead: false
          }
        );
      }
    } catch (grokError) {
      console.error('Error generating Grok response:', grokError);
      botResponse = { error: 'Не удалось получить ответ от модели' };
    }
    
    return NextResponse.json({
      success: true,
      userMessage: message,
      botResponse
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Ошибка при обработке сообщения чата' },
      { status: 500 }
    );
  }
} 