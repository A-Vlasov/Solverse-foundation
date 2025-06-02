import { NextResponse } from 'next/server';
import {
  getTestSessionChats,
  addMessageToTestSession,
  ChatMessage
} from '../../../src/lib/supabase';
import { generateGrokResponse } from '../../../src/services/gemini';
import { userPrompts } from '../../../src/data/userPrompts';

// Определяем типы для сообщений Gemini
type MessageRole = 'user' | 'assistant' | 'system';

interface GrokMessage {
  role: MessageRole;
  content: string;
}

// Определяем интерфейс для ответа Gemini
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
    
    console.log(`Обрабатываем сообщение пользователя: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.log(`Номер чата: ${chatNumber}, ID сессии: ${sessionId}`);
    
    if (conversationDetails) {
      console.log('Продолжение существующего разговора с ID:', 
        conversationDetails.conversationId, 
        'и parentResponseId:', 
        conversationDetails.parentResponseId);
    } else {
      console.log('Начало нового разговора');
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
    
    // Получаем предыдущие сообщения для контекста (но не используем их для отправки в Gemini)
    const chatHistory = await getTestSessionChats(sessionId);
    const currentChat = chatHistory.find(chat => chat.chat_number === chatNumber);
    
    if (!currentChat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }
    
    // Формируем сообщения для Gemini
    let messagesForGrok: GrokMessage[] = [];
    
    // Добавляем системный промпт в зависимости от номера чата только для новых чатов или если явно не указаны детали разговора
    // chat_number соответствует следующим пользователям из userPrompts: 1: Marcus, 2: Shrek, 3: Oliver, 4: Alex
    const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
    const userName = userNames[chatNumber - 1] || 'Marcus';
    
    // Если это продолжение существующего чата, мы отправляем только текущее сообщение пользователя
    // Это предотвращает проблему отправки сообщений Gemini обратно в систему
    if (conversationDetails && conversationDetails.conversationId && conversationDetails.parentResponseId) {
      console.log('Продолжаем существующий чат, отправляем только текущее сообщение пользователя');
      // Отправляем только текущее сообщение пользователя без системного промпта
      messagesForGrok = [{
        role: 'user',
        content: message
      }];
      console.log('Сообщение для отправки:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    } else {
      // Для нового чата добавляем системный промпт
      console.log('Добавляем системный промпт для нового чата с', userName);
      const systemPrompt = userPrompts[userName] || 'You are a friendly assistant.';
      messagesForGrok.push({
        role: 'system',
        content: systemPrompt
      });
      
      // Для нового чата добавляем только текущее сообщение пользователя
      messagesForGrok.push({
        role: 'user',
        content: message
      });
      console.log('Начинаем новый разговор с системным промптом и текущим сообщением');
    }
    
    console.log('Итоговые сообщения для Gemini:', messagesForGrok.map(m => ({ 
      role: m.role, 
      contentPreview: m.content.substring(0, 30) + (m.content.length > 30 ? '...' : '')
    })));
    
    // Получаем ответ от Gemini
    let botResponse;
    try {
      // Для нового чата отправляем системный промпт отдельно, а не в массиве сообщений
      if (conversationDetails && conversationDetails.conversationId && conversationDetails.parentResponseId) {
        // Для существующего чата просто продолжаем разговор как раньше
        console.log('Continuing existing conversation with Gemini');
        const geminiResult = await generateGrokResponse(
          messagesForGrok, 
          {
            conversationId: conversationDetails.conversationId,
            parentResponseId: conversationDetails.parentResponseId
          },
          undefined, // системный промпт не нужен для существующего чата
          undefined, // имя пользователя не нужно для существующего чата
          chatNumber // передаем номер чата для восстановления контекста при необходимости
        );
        
        // Обрабатываем специальные теги (если они есть)
        let responseContent = geminiResult.response;
        console.log('Original Gemini response:', responseContent);
        
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
          conversation_id: geminiResult.conversation_id,
          parent_response_id: geminiResult.parent_response_id,
          chat_link: geminiResult.chat_link
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
      } else {
        // Для нового чата извлекаем системный промпт и сообщение пользователя
        console.log('Starting new conversation with Gemini');
        const systemPromptMessage = messagesForGrok.find(msg => msg.role === 'system');
        const userMessage = messagesForGrok.find(msg => msg.role === 'user');
        
        if (!userMessage) {
          throw new Error('User message not found');
        }
        
        // Вызываем Gemini API с системным промптом как отдельным параметром
        const geminiResult = await generateGrokResponse(
          // Отправляем только сообщение пользователя в массиве сообщений
          [{ role: 'user', content: userMessage.content }],
          // Не передаем информацию о существующем разговоре
          undefined,
          // Передаем системный промпт как отдельный параметр
          systemPromptMessage?.content,
          // Передаем имя пользователя
          userName,
          // Передаем номер чата
          chatNumber
        );
        
        // Обрабатываем специальные теги (если они есть)
        let responseContent = geminiResult.response;
        console.log('Original Gemini response:', responseContent);
        
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
          conversation_id: geminiResult.conversation_id,
          parent_response_id: geminiResult.parent_response_id,
          chat_link: geminiResult.chat_link
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
      }
    } catch (geminiError) {
      console.error('Error generating Gemini response:', geminiError);
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