import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerateContentResult } from "@google/generative-ai";
import { DialogAnalysisResult } from '../lib/supabase';
import { userPrompts } from '../data/userPrompts';

// Gemini API service
interface GrokResponse {
  conversation_id: string;
  parent_response_id: string;
  response: string;
  chat_link?: string;
  error?: string;
}

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Создаем базовую модель без системного промпта
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-preview-03-25",
  //model: "gemini-2.0-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

// Функция для получения модели с системным промптом
function getModelWithSystemPrompt(systemPrompt?: string) {
  if (!systemPrompt) {
    return model; // Возвращаем базовую модель, если нет системного промпта
  }
  
  // Создаем новую модель с системным промптом
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
}

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 16384  ,
  responseMimeType: "text/plain",
};

// Map to track conversations by ID
const conversations = new Map<string, any>();
const conversationUserMap = new Map<string, string>();

// Generate a unique ID for conversations
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Увеличить максимальное количество попыток
const MAX_RETRIES = 50; // Значительно увеличено для лучшей надежности
const RETRY_DELAY = 3000; // Задержка между повторными попытками, в миллисекундах

// Создаем интерфейс для результата с ошибкой
interface ErrorResult {
  error: string;
}

// Функция для проверки, является ли результат ошибкой
function isErrorResult(result: any): result is ErrorResult {
  return result && typeof result === 'object' && 'error' in result;
}

// Добавить функцию для проверки, содержит ли результат свойство response
function hasResponse(result: any): result is GenerateContentResult {
  return result && typeof result === 'object' && 'response' in result && result.response !== undefined;
}

/**
 * Улучшенная функция для повторного выполнения запроса при ошибках API
 */
async function retryOnOverload<T>(operation: () => Promise<T>, maxRetries: number = MAX_RETRIES): Promise<T | ErrorResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Расширенный список проверяемых ошибок - теперь проверяем любую ошибку
      const isRetryableError = true; // Считаем все ошибки повторяемыми
      
      if (!isRetryableError) {
        console.error('Не повторяемая ошибка:', error.message);
        throw error; // Если ошибка не связана с сетью, пробрасываем её
      }
      
      // Экспоненциальная задержка с случайным компонентом для избежания перегрузки
      const delay = Math.min(RETRY_DELAY * Math.pow(1.5, attempt) + Math.random() * 1000, 30000);
      console.warn(`Ошибка API Gemini: ${error.message}. Попытка ${attempt + 1}/${maxRetries}. Повторяем через ${Math.round(delay/1000)} с...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`Все ${maxRetries} попыток исчерпаны. Последняя ошибка:`, lastError);
  // Возвращаем контролируемую ошибку вместо выброса исключения
  return {
    error: `Не удалось выполнить запрос после ${maxRetries} попыток: ${lastError?.message || 'Неизвестная ошибка'}`
  };
}

/**
 * Sends a message to Gemini API to start a new conversation
 * @param message Сообщение пользователя
 * @param systemPrompt Системный промпт для модели (необязательный)
 * @param userName Имя пользователя (необязательно)
 */
export const startNewGrokConversation = async (
  message: string, 
  systemPrompt?: string,
  userName?: string,
  retryCount: number = 0
): Promise<GrokResponse> => {
  if (!message || typeof message !== 'string') {
    console.error('Invalid message provided to startNewGrokConversation:', message);
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: 'Некорректный формат сообщения'
    };
  }
  
  try {
    console.log('Starting new Gemini conversation with message length:', message.length);
    console.log('System prompt provided:', systemPrompt ? 'Yes' : 'No');
    console.log('User name:', userName || 'Not provided');
    console.log('Retry count:', retryCount);
    
    let chatSession;
    try {
      // Получаем модель с системным промптом
      const modelToUse = getModelWithSystemPrompt(systemPrompt);
      
      // Создаем новую чат-сессию
      chatSession = modelToUse.startChat({
        generationConfig,
        history: []
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      
      // Если превышен лимит попыток, возвращаем ошибку
      if (retryCount >= 5) {
        console.log('Исчерпаны все попытки создания сессии');
        return {
          conversation_id: '',
          parent_response_id: '',
          response: '',
          error: `Не удалось создать сессию чата после ${retryCount} попыток: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        };
      }
      
      // Иначе пробуем повторить запрос
      console.log('Повторяем попытку создания сессии');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return startNewGrokConversation(message, systemPrompt, userName, retryCount + 1);
    }
    
    // Защищенная отправка сообщения
    const result = await retryOnOverload(async () => {
      return await chatSession.sendMessage(message);
    });
    
    // Проверка на ошибку от retryOnOverload
    if (isErrorResult(result)) {
      console.error('Ошибка после всех попыток повтора:', result.error);
      
      // Если превышен лимит попыток, возвращаем ошибку
      if (retryCount >= 5) {
        console.log('Исчерпаны все попытки получения ответа');
        return {
          conversation_id: '',
          parent_response_id: '',
          response: '',
          error: `Ошибка API после ${retryCount} попыток: ${result.error}`
        };
      }
      
      // Иначе пробуем повторить запрос
      console.log('Повторяем всю операцию');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return startNewGrokConversation(message, systemPrompt, userName, retryCount + 1);
    }
    
    let responseText = '';
    try {
      // Проверяем, есть ли свойство response
      if (hasResponse(result)) {
        responseText = result.response.text();
      } else {
        throw new Error("Ответ не содержит текста");
      }
    } catch (error) {
      console.error('Error extracting response text:', error);
      
      // Если превышен лимит попыток, возвращаем ошибку
      if (retryCount >= 5) {
        console.log('Исчерпаны все попытки извлечения текста ответа');
        return {
          conversation_id: '',
          parent_response_id: '',
          response: '',
          error: `Не удалось извлечь текст ответа после ${retryCount} попыток: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        };
      }
      
      // Иначе пробуем повторить запрос
      console.log('Повторяем всю операцию после ошибки извлечения текста');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return startNewGrokConversation(message, systemPrompt, userName, retryCount + 1);
    }
    
    // Генерация ID только при успешном получении ответа
    const conversation_id = generateUniqueId();
    const parent_response_id = generateUniqueId();

    // Если предоставлено имя пользователя, сохраняем его
    if (userName) {
      conversationUserMap.set(conversation_id, userName);
      console.log(`Сохранен пользователь ${userName} для чата ${conversation_id}`);
    }

    // Безопасное сохранение разговора
    try {
      const historyItems = [];
      
      // Если был системный промпт, добавляем его в историю
      if (systemPrompt) {
        historyItems.push({ role: 'system', content: systemPrompt });
      }
      
      // Добавляем сообщение пользователя и ответ ассистента
      historyItems.push(
        { role: 'user', content: message },
        { role: 'assistant', content: responseText }
      );
      
      conversations.set(conversation_id, {
        chatSession,
        lastParentId: parent_response_id,
        history: historyItems,
        systemPrompt // Сохраняем системный промпт для возможного восстановления сессии
      });
    } catch (error) {
      console.error('Error storing conversation:', error);
      // Продолжаем даже при ошибке сохранения
    }

    return {
      conversation_id,
      parent_response_id,
      response: responseText,
    };
  } catch (error) {
    // Детальное логирование ошибки для диагностики
    console.error('Uncaught error in startNewGrokConversation:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    // Если превышен лимит попыток, возвращаем ошибку
    if (retryCount >= 5) {
      console.log('Исчерпаны все попытки после необработанной ошибки');
      return {
        conversation_id: '',
        parent_response_id: '',
        response: '',
        error: `Критическая ошибка после ${retryCount} попыток: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
    
    // Иначе пробуем повторить запрос
    console.log('Повторяем всю операцию после необработанной ошибки');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return startNewGrokConversation(message, systemPrompt, userName, retryCount + 1);
  }
};

/**
 * Sends a message to an existing Gemini conversation
 */
export const continueGrokConversation = async (
  message: string,
  conversation_id: string,
  parent_response_id: string,
  chatNumber?: number,
  retryCount: number = 0
): Promise<GrokResponse> => {
  if (!message || typeof message !== 'string') {
    console.error('Invalid message provided:', message);
    return {
      conversation_id,
      parent_response_id,
      response: '',
      error: 'Invalid message format'
    };
  }
  
  try {
    console.log('Continuing Gemini conversation:', {
      conversation_id,
      parent_response_id,
      messageLength: message.length,
      chatNumber: chatNumber !== undefined ? chatNumber : 'Not provided'
    });
    
    // Проверка наличия разговора
    if (!conversations.has(conversation_id)) {
      console.log('Chat not found, creating new conversation with appropriate prompt...');
      
      // Определяем, какой системный промпт использовать
      let systemPrompt: string | undefined;
      let userName: string | undefined;
      
      // Проверяем, сохранено ли имя пользователя для этого чата
      if (conversationUserMap.has(conversation_id)) {
        userName = conversationUserMap.get(conversation_id);
        systemPrompt = userPrompts[userName || ''];
        console.log(`Восстановление чата для пользователя ${userName} из карты пользователей`);
      } 
      // Если нет сохраненного имени, но есть номер чата
      else if (chatNumber !== undefined) {
        const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
        userName = userNames[chatNumber - 1] || 'Marcus';
        systemPrompt = userPrompts[userName];
        console.log(`Восстановление чата для пользователя ${userName} по номеру чата ${chatNumber}`);
      } 
      // Если нет ни имени, ни номера чата - используем дефолтный промпт
      else {
        userName = 'Marcus';
        systemPrompt = userPrompts[userName];
        console.log(`Используем дефолтный промпт для пользователя ${userName}`);
      }
      
      // Создаем новый чат с соответствующим системным промптом
      return startNewGrokConversation(message, systemPrompt, userName);
    }
    
    let conversationData;
    try {
      conversationData = conversations.get(conversation_id);
      if (!conversationData || !conversationData.chatSession) {
        throw new Error('Invalid conversation data structure');
      }
    } catch (error) {
      console.error('Error accessing conversation data:', error);
      
      // Восстановление сессии из истории, если она есть
      try {
        if (conversationData && Array.isArray(conversationData.history) && conversationData.history.length > 0) {
          console.log('Attempting to recover chat session from history');
          
          // Восстанавливаем системный промпт из истории, если он там есть
          const systemPromptMsg = conversationData.history.find((msg: any) => msg.role === 'system');
          const systemPrompt = systemPromptMsg ? systemPromptMsg.content : conversationData.systemPrompt;
          
          const chatSession = model.startChat({
            generationConfig,
            history: conversationData.history.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              parts: [{ text: msg.content }]
            })),
          });
          
          // Обновление данных разговора с новой сессией
          conversationData.chatSession = chatSession;
          conversations.set(conversation_id, conversationData);
          console.log('Successfully recovered chat session from history');
        } else {
          // Если нет истории, определяем промпт и начинаем новый разговор
          let systemPrompt: string | undefined;
          let userName: string | undefined;
          
          if (conversationUserMap.has(conversation_id)) {
            userName = conversationUserMap.get(conversation_id);
            systemPrompt = userPrompts[userName || ''];
          } else if (chatNumber !== undefined) {
            const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
            userName = userNames[chatNumber - 1] || 'Marcus';
            systemPrompt = userPrompts[userName];
          } else {
            userName = 'Marcus';
            systemPrompt = userPrompts[userName];
          }
          
          console.log(`No history found, starting new conversation for ${userName}`);
          return startNewGrokConversation(message, systemPrompt, userName);
        }
      } catch (recoveryError) {
        console.error('Failed to recover chat session:', recoveryError);
        
        // Если восстановление не удалось, определяем промпт и начинаем новый разговор
        let systemPrompt: string | undefined;
        let userName: string | undefined;
        
        if (conversationUserMap.has(conversation_id)) {
          userName = conversationUserMap.get(conversation_id);
          systemPrompt = userPrompts[userName || ''];
        } else if (chatNumber !== undefined) {
          const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
          userName = userNames[chatNumber - 1] || 'Marcus';
          systemPrompt = userPrompts[userName];
        } else {
          userName = 'Marcus';
          systemPrompt = userPrompts[userName];
        }
        
        return startNewGrokConversation(message, systemPrompt, userName);
      }
    }
    
    const chatSession = conversationData.chatSession;
    
    // Безопасный вызов API с повторными попытками
    const result = await retryOnOverload(async () => {
      return await chatSession.sendMessage(message);
    });
    
    // Проверка на ошибку от retryOnOverload
    if (isErrorResult(result)) {
      console.error('Ошибка после всех попыток повтора:', result.error);
      
      // Если превышен лимит попыток, возвращаем ошибку
      if (retryCount >= 5) {
        console.log('Исчерпаны все попытки получения ответа в продолжении разговора');
        return {
          conversation_id,
          parent_response_id,
          response: '',
          error: `Ошибка API после ${retryCount} попыток: ${result.error}`
        };
      }
      
      // Если это первая ошибка, пробуем восстановить контекст и повторить
      console.log('Пробуем восстановить контекст и повторить операцию');
      
      // Определим системный промпт
      let systemPrompt: string | undefined;
      let userName: string | undefined;
      
      if (conversationUserMap.has(conversation_id)) {
        userName = conversationUserMap.get(conversation_id);
        systemPrompt = userPrompts[userName || ''];
      } else if (chatNumber !== undefined) {
        const userNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
        userName = userNames[chatNumber - 1] || 'Marcus';
        systemPrompt = userPrompts[userName];
      } else {
        systemPrompt = userPrompts.Marcus;
        userName = 'Marcus';
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Если восстановление не удается после первой попытки, создаем новый чат с тем же контекстом
      if (retryCount >= 1) {
        return startNewGrokConversation(message, systemPrompt, userName);
      }
      
      // Повторяем с увеличенным счетчиком попыток
      return continueGrokConversation(
        message, 
        conversation_id, 
        parent_response_id, 
        chatNumber, 
        retryCount + 1
      );
    }
    
    let responseText = '';
    try {
      // Проверяем, есть ли свойство response
      if (hasResponse(result)) {
        responseText = result.response.text();
      } else {
        throw new Error("Ответ не содержит текста");
      }
    } catch (error) {
      console.error('Error extracting response text:', error);
      
      // Если превышен лимит попыток, возвращаем ошибку с детальной информацией
      if (retryCount >= 5) {
        return {
          conversation_id,
          parent_response_id,
          response: '',
          error: `Не удалось извлечь текст ответа после ${retryCount} попыток: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        };
      }
      
      // Иначе пробуем повторить запрос
      console.log('Повторяем всю операцию после ошибки извлечения текста');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return continueGrokConversation(message, conversation_id, parent_response_id, chatNumber, retryCount + 1);
    }
    
    // Генерируем новый parent_response_id
    const new_parent_response_id = generateUniqueId();
    
    // Обновление разговора только при успешном получении ответа
    try {
      conversationData.lastParentId = new_parent_response_id;
      conversationData.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: responseText }
      );
      
      // Ограничиваем историю, чтобы избежать переполнения памяти
      if (conversationData.history.length > 100) {
        // Оставляем только последние 50 сообщений
        conversationData.history = conversationData.history.slice(-50);
        console.log('История разговора обрезана до 50 последних сообщений');
      }
    } catch (error) {
      console.error('Error updating conversation history:', error);
      // Продолжаем работу даже при ошибке обновления истории
    }
    
    return {
      conversation_id,
      parent_response_id: new_parent_response_id,
      response: responseText,
    };
  } catch (error) {
    // Расширенная обработка ошибок
    console.error('Uncaught error in continueGrokConversation:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    // Если превышен лимит попыток, возвращаем ошибку с детальной информацией
    if (retryCount >= 5) {
      return {
        conversation_id,
        parent_response_id,
        response: '',
        error: `Критическая ошибка при продолжении разговора после ${retryCount} попыток: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
    
    // Иначе пробуем повторить запрос
    console.log('Повторяем всю операцию после необработанной ошибки');
    await new Promise(resolve => setTimeout(resolve, 3000));
    return continueGrokConversation(
      message, 
      conversation_id, 
      parent_response_id, 
      chatNumber, 
      retryCount + 1
    );
  }
};

/**
 * Generates a response using Gemini
 * @param messages Массив сообщений для диалога
 * @param conversationDetails Детали существующего разговора (опционально)
 * @param systemPrompt Системный промпт для новой сессии (опционально)
 * @param userName Имя пользователя (опционально)
 * @param chatNumber Номер чата (опционально)
 */
export const generateGrokResponse = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  conversationDetails?: { conversationId: string; parentResponseId: string },
  systemPrompt?: string,
  userName?: string,
  chatNumber?: number
): Promise<GrokResponse> => {
  try {
    // Проверка входных данных
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages array:', messages);
      return {
        conversation_id: '',
        parent_response_id: '',
        response: '',
        error: 'Invalid messages format'
      };
    }
    
    // Отфильтровываем пустые сообщения и строго проверяем их валидность
    const filteredMessages = messages.filter((msg: { role?: string; content?: string }) => {
      if (!msg || typeof msg !== 'object') {
        console.warn('Отфильтровано невалидное сообщение:', msg);
        return false;
      }
      
      if (!['user', 'assistant', 'system'].includes(msg.role || '')) {
        console.warn('Отфильтровано сообщение с неизвестной ролью:', msg.role);
        return false;
      }
      
      // Проверка наличия контента и его непустоты
      if (!msg.content || typeof msg.content !== 'string' || !msg.content.trim()) {
        console.log('Отфильтровано пустое сообщение с ролью:', msg.role);
        return false;
      }
      
      return true;
    });
    
    if (filteredMessages.length === 0) {
      console.error('All messages were filtered out as invalid');
      return {
        conversation_id: '',
        parent_response_id: '',
        response: '',
        error: 'No valid messages found'
      };
    }
    
    // Проверяем, продолжаем ли мы существующий разговор
    const isExistingConversation = !!(
      conversationDetails && 
      conversationDetails.conversationId && 
      conversationDetails.parentResponseId
    );
    
    console.log(`----- Gemini API: ${isExistingConversation ? 'Продолжаем существующий' : 'Начинаем новый'} разговор -----`);
    console.log('Количество сообщений:', filteredMessages.length);
    console.log('Роли сообщений:', filteredMessages.map(m => m.role).join(', '));
    
    // Для существующих бесед используем защищенную передачу идентификаторов
    if (isExistingConversation) {
      try {
        // Находим последнее сообщение пользователя
        const lastUserMessage = [...filteredMessages].reverse().find(msg => msg.role === 'user');
        
        if (!lastUserMessage) {
          console.error('Не найдено сообщение пользователя для продолжения разговора');
          return {
            conversation_id: '',
            parent_response_id: '',
            response: '',
            error: 'No user message found'
          };
        }
        
        // Убедимся, что отправляем оригинальное сообщение, без изменений
        const messageToSend = lastUserMessage.content;
        console.log('Продолжаем разговор с последним сообщением пользователя:');
        console.log(messageToSend.substring(0, 50) + (messageToSend.length > 50 ? '...' : ''));
        
        // Преобразуем идентификаторы из camelCase в snake_case для корректной работы API
        const conversation_id = conversationDetails.conversationId;
        const parent_response_id = conversationDetails.parentResponseId;
        console.log('Используем идентификаторы:', { conversation_id, parent_response_id });
        
        // Вызываем функцию продолжения разговора с переданными идентификаторами
        return continueGrokConversation(
          messageToSend,
          conversation_id,
          parent_response_id,
          chatNumber // Передаем номер чата
        );
      } catch (error) {
        console.error('Error in existing conversation flow:', error);
        
        // Пробуем запустить новый разговор как запасной вариант
        const systemMessage = filteredMessages.find(msg => msg.role === 'system');
        const userMessage = [...filteredMessages].reverse().find(msg => msg.role === 'user');
        
        if (!userMessage) {
          return {
            conversation_id: '',
            parent_response_id: '',
            response: '',
            error: 'Failed to continue conversation and no user message found for new conversation'
          };
        }
        
        let messageToSend = userMessage.content;
        
        // Добавляем системный промпт, если он есть
        if (systemMessage) {
          console.log('Falling back to new conversation with system prompt');
          messageToSend = `${systemMessage.content}\n\nGirls message: ${messageToSend}`;
        } else {
          console.log('Falling back to new conversation without system prompt');
        }
        
        return startNewGrokConversation(messageToSend);
      }
    }
    
    // Для нового разговора с защитой
    try {
      // Проверяем, был ли предоставлен системный промпт напрямую
      if (systemPrompt) {
        console.log('Используем предоставленный системный промпт напрямую');
      } else {
        // Находим системное сообщение среди сообщений
        const systemMessage = filteredMessages.find(msg => msg.role === 'system');
        if (systemMessage) {
          systemPrompt = systemMessage.content;
          console.log('Извлекли системный промпт из сообщений');
        }
      }
      
      const userMessage = [...filteredMessages].reverse().find(msg => msg.role === 'user');
      
      if (!userMessage) {
        console.error('Не найдено сообщение пользователя для нового разговора');
        return {
          conversation_id: '',
          parent_response_id: '',
          response: '',
          error: 'No user message found'
        };
      }
      
      // Выводим информационное сообщение о начале разговора
      console.log('Начинаем новый разговор, сообщение:');
      console.log('Системный промпт:', systemPrompt ? systemPrompt.substring(0, 50) + '...' : 'Отсутствует');
      console.log('Сообщение пользователя:', userMessage.content.substring(0, 50) + '...');
      console.log('Имя пользователя:', userName || 'Не указано');
      
      // Запускаем новый разговор с системным промптом и сообщением пользователя
      const response = await startNewGrokConversation(
        userMessage.content,
        systemPrompt, // Передаем системный промпт как параметр, если он есть
        userName // Передаем имя пользователя, если оно есть
      );
      
      console.log('----- Gemini API: Получен ответ -----');
      
      return response;
    } catch (error) {
      console.error('Error in new conversation flow:', error);
      return {
        conversation_id: '',
        parent_response_id: '',
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error in conversation creation'
      };
    }
  } catch (error) {
    // Глобальный обработчик ошибок
    console.error('Critical error in generateGrokResponse:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: 'Критическая ошибка при обработке запроса'
    };
  }
};

// Отслеживание активных запросов анализа для исключения дублирования
const activeAnalysisRequests = new Map<string, Promise<any>>();

/**
 * Отправляет промпт на анализ в Gemini и получает результат
 */
export const analyzeDialogs = async (prompt: string): Promise<any> => {
  // Создаем уникальный ключ для запроса на основе первых 100 и последних 100 символов промпта
  const promptKey = `${prompt.slice(0, 100)}...${prompt.slice(-100)}`;
  
  // Проверяем, есть ли уже активный запрос с таким же ключом
  if (activeAnalysisRequests.has(promptKey)) {
    console.log('Duplicate analysis request detected, reusing existing request');
    return activeAnalysisRequests.get(promptKey);
  }

  try {
    console.log('Sending dialog analysis prompt to Gemini, prompt length:', prompt.length);
    
    // Создаем промис для текущего запроса и сохраняем его в Map
    const analysisPromise = (async () => {
      try {
        // Создаем новую сессию для анализа
        const chatSession = model.startChat({
          generationConfig,
          history: [],
        });
        
        // Отправляем запрос на анализ с автоматическим повтором при перегрузке
        const result = await retryOnOverload(async () => {
          return await chatSession.sendMessage(prompt);
        });
        
        const responseText = result.response.text();
        
        console.log('Received analysis response from Gemini API');
        
        // Создаем базовый объект ответа
        const data = {
          conversation_id: generateUniqueId(),
          parent_response_id: generateUniqueId(),
          response: responseText
        };
        
        // Парсим результат анализа
        try {
          if (typeof data.response === 'string') {
            // Сначала пытаемся найти валидный JSON с помощью регулярных выражений
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonStr = jsonMatch[0];
              try {
                const analysisResult = JSON.parse(jsonStr);
                return {
                  ...data,
                  analysisResult
                };
              } catch (jsonError) {
                console.error('Error parsing extracted JSON:', jsonError);
                // Дополнительная обработка - возможно, нужно нормализовать JSON
                const cleanedJson = jsonStr
                  .replace(/\\"/g, '"')       // Замена экранированных кавычек
                  .replace(/\n/g, ' ')        // Удаление переносов строк
                  .replace(/\s+/g, ' ')       // Замена множественных пробелов одним
                  .replace(/,\s*}/g, '}')     // Удаление висячих запятых
                  .replace(/,\s*]/g, ']');    // Удаление висячих запятых в массивах
                
                try {
                  const cleanedResult = JSON.parse(cleanedJson);
                  console.log('Successfully parsed cleaned JSON');
                  return {
                    ...data,
                    analysisResult: cleanedResult
                  };
                } catch (cleanedError) {
                  console.error('Error parsing cleaned JSON:', cleanedError);
                }
              }
            }
            
            // Если не удалось найти JSON, ищем ключевые метрики в тексте
            const metrics: Record<string, number> = {};
            const metricsRegex = /(\w+).*?score.*?(\d+(\.\d+)?)/gi;
            let match;
            while ((match = metricsRegex.exec(data.response)) !== null) {
              const metricName = match[1].toLowerCase();
              const score = parseFloat(match[2]);
              if (!isNaN(score) && score >= 0 && score <= 5) {
                metrics[metricName] = score;
              }
            }
            
            if (Object.keys(metrics).length > 0) {
              console.log('Extracted metrics from text:', metrics);
              // Формируем базовый результат на основе извлеченных метрик
              const result: DialogAnalysisResult = {
                dialog_analysis: {
                  metrics: {
                    engagement: { score: 0, verdict: "" },
                    charm_and_tone: { score: 0, verdict: "" },
                    creativity: { score: 0, verdict: "" },
                    adaptability: { score: 0, verdict: "" },
                    self_promotion: { score: 0, verdict: "" },
                    pricing_policy: { score: 0, verdict: "", strengths: [], improvements: [] }
                  },
                  overall_conclusion: "Анализ выполнен на основе извлеченных данных из текстового ответа."
                }
              };
              
              // Заполняем метрики
              for (const [key, score] of Object.entries(metrics)) {
                const verdict = `Оценка извлечена из текста ответа.`;
                if (key.includes('engage')) {
                  result.dialog_analysis.metrics.engagement = { score, verdict };
                } else if (key.includes('charm') || key.includes('tone')) {
                  result.dialog_analysis.metrics.charm_and_tone = { score, verdict };
                } else if (key.includes('creativ')) {
                  result.dialog_analysis.metrics.creativity = { score, verdict };
                } else if (key.includes('adapt')) {
                  result.dialog_analysis.metrics.adaptability = { score, verdict };
                } else if (key.includes('promot') || key.includes('self')) {
                  result.dialog_analysis.metrics.self_promotion = { score, verdict };
                } else if (key.includes('pric') || key.includes('policy')) {
                  result.dialog_analysis.metrics.pricing_policy = { 
                    score, 
                    verdict, 
                    strengths: ["Извлечено из текста"], 
                    improvements: ["Требуется детальный анализ"] 
                  };
                }
              }
              
              // Заполняем недостающие метрики средним значением
              const metricNames = [
                'engagement', 
                'charm_and_tone', 
                'creativity', 
                'adaptability', 
                'self_promotion',
                'pricing_policy'
              ] as const;
              const defaultVerdict = "Недостаточно данных для оценки.";
              const existingScores: number[] = [];
              
              for (const name of metricNames) {
                if (result.dialog_analysis.metrics[name].score === 0) {
                  result.dialog_analysis.metrics[name] = { score: 0, verdict: defaultVerdict };
                } else {
                  existingScores.push(result.dialog_analysis.metrics[name].score);
                }
              }
              
              // Для недостающих метрик используем среднее значение, если есть хотя бы одна метрика
              if (existingScores.length > 0) {
                const avgScore = existingScores.reduce((sum, score) => sum + score, 0) / existingScores.length;
                for (const name of metricNames) {
                  if (result.dialog_analysis.metrics[name].score === 0) {
                    result.dialog_analysis.metrics[name].score = avgScore;
                  }
                }
              }
              
              return {
                ...data,
                analysisResult: result
              };
            }
          }
          
          // Если не удалось извлечь JSON, возвращаем исходные данные с флагом
          console.warn('Could not extract structured data from response');
          return {
            ...data,
            parseError: true
          };
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          return {
            ...data,
            parseError: true,
            error: parseError instanceof Error ? parseError.message : 'Error parsing response'
          };
        }
      } catch (error) {
        console.error('Error in analysis request:', error);
        throw error;
      } finally {
        // Удаляем запрос из Map после завершения (успешного или с ошибкой)
        setTimeout(() => {
          activeAnalysisRequests.delete(promptKey);
          console.log(`Removed analysis request from tracking: ${promptKey.substring(0, 20)}...`);
        }, 1000); // Небольшая задержка перед удалением, чтобы избежать гонки условий
      }
    })();
    
    // Сохраняем промис в Map для отслеживания
    activeAnalysisRequests.set(promptKey, analysisPromise);
    console.log(`Added analysis request to tracking. Active requests: ${activeAnalysisRequests.size}`);
    
    // Возвращаем промис
    return analysisPromise;
  } catch (error) {
    console.error('Error in analyzeDialogs:', error);
    
    // Удаляем запрос из Map в случае ошибки
    activeAnalysisRequests.delete(promptKey);
    
    // Рекомендуется всегда возвращать объект одинаковой структуры
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred in analyzeDialogs'
    };
  }
}; 