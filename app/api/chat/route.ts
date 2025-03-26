import { NextResponse } from 'next/server';
import {
  getTestSessionChats,
  addMessageToTestSession,
  ChatMessage
} from '../../../src/lib/supabase';
import { generateGrokResponse } from '../../../src/services/grok';
import { userPrompts } from '../../../src/data/userPrompts';

// Определяем типы для сообщений Grok
type MessageRole = 'user' | 'assistant' | 'system';

interface GrokMessage {
  role: MessageRole;
  content: string;
}

// Определяем интерфейс для ответа Grok
interface GrokResponse {
  conversation_id: string;
  parent_response_id: string;
  response: string;
  chat_link?: string;
  error?: string;
}

// GET /api/chat - получить сообщения чата
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Отсутствует ID сессии' },
        { status: 400 }
      );
    }
    
    const chatHistory = await getTestSessionChats(sessionId);
    
    return NextResponse.json(chatHistory);
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
    const { sessionId, message, employeeId, chatNumber, conversationDetails } = data;
    
    // Валидация входных данных
    if (!sessionId || !message || chatNumber === undefined) {
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
    
    // Проверяем, есть ли хотя бы одно сообщение от пользователя
    const hasUserMessage = messagesForGrok.some(msg => msg.role === 'user');
    
    // Если нет сообщения от пользователя (что странно, но на всякий случай), добавляем текущее сообщение
    if (!hasUserMessage) {
      console.log('No user message found, adding current message:', message);
      messagesForGrok.push({
        role: 'user',
        content: message
      });
    }
    
    // Добавляем системный промпт в зависимости от номера чата
    // chat_number соответствует следующим пользователям из userPrompts: 1: Marcus, 2: Shrek, 3: Oliver, 4: Alex
    const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
    const userName = userNames[chatNumber - 1] || 'Marcus';
    
    // Добавляем системный промпт только если это новый чат (первое сообщение)
    // или если явно не переданы данные о существующей беседе
    if ((currentChat.messages.length <= 1 || !conversationDetails) && !messagesForGrok.some(msg => msg.role === 'system')) {
      console.log('Adding system prompt for', userName);
      const systemPrompt = userPrompts[userName] || 'You are a friendly assistant.';
      messagesForGrok.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
    
    console.log('Final messages for Grok:', messagesForGrok.map(m => ({ 
      role: m.role, 
      contentPreview: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : '')
    })));
    
    // Получаем ответ от Grok
    let botResponse;
    try {
      // Передаем данные о существующем разговоре, если они есть
      const grokResult = await generateGrokResponse(
        messagesForGrok, 
        conversationDetails ? {
          conversationId: conversationDetails.conversationId,
          parentResponseId: conversationDetails.parentResponseId
        } : undefined
      );
      
      // Обрабатываем специальные теги (если они есть)
      let responseContent = grokResult.response;
      console.log('Original Grok response:', responseContent);
      
      const boughtTag = responseContent.includes('[Bought]');
      const notBoughtTag = responseContent.includes('[Not Bought]');
      
      console.log('Tags found:', { boughtTag, notBoughtTag });
      
      // Удаляем все теги в квадратных скобках из отображаемого текста
      let cleanResponse = responseContent
        .replace(/\[\s*Bought\s*\]/gi, '')  // Более точное удаление тега [Bought]
        .replace(/\[\s*Not\s*Bought\s*\]/gi, '')  // Более точное удаление тега [Not Bought]
        .replace(/\[[^\]]*\]/g, '')  // Удаляем все оставшиеся теги в формате [текст]
        .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на один
        .trim();
      
      console.log('Cleaned response:', cleanResponse);
      
      botResponse = { 
        response: cleanResponse,
        originalResponse: responseContent,
        boughtTag,
        notBoughtTag,
        conversation_id: grokResult.conversation_id,
        parent_response_id: grokResult.parent_response_id,
        chat_link: grokResult.chat_link
      };
      
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