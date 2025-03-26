import OpenAI from 'openai';
import { DialogAnalysisResult } from '../lib/supabase';

// Grok API service
interface GrokResponse {
  conversation_id: string;
  parent_response_id: string;
  response: string;
  chat_link?: string;
  error?: string;
}

// Use environment variables for API URLs
const API_BASE_URL = 'http://145.223.85.248:3001/api';

// Функция для проверки доступности API
const checkApiAvailability = async (): Promise<boolean> => {
  try {
    console.log('Проверка доступности API сервера Grok...');
    
    // Устанавливаем тайм-аут для проверки доступности
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд тайм-аут
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    
    if (response && response.ok) {
      console.log('API сервер Grok доступен');
      return true;
    }
    
    console.warn('API сервер Grok недоступен');
    return false;
  } catch (error) {
    console.warn('Ошибка при проверке доступности API:', error);
    return false;
  }
};

/**
 * Sends a message to Grok API to start a new conversation
 */
export const startNewGrokConversation = async (message: string): Promise<GrokResponse> => {
  try {
    console.log('Starting new Grok conversation with message:', message);
    
    // Проверяем доступность API перед отправкой запроса
    const isApiAvailable = await checkApiAvailability();
    if (!isApiAvailable) {
      console.error('Grok API не доступен. Возвращаем заглушку ответа.');
      return {
        conversation_id: 'local-' + Date.now(),
        parent_response_id: 'local-' + Date.now(),
        response: 'Извините, сервис временно недоступен. Пожалуйста, повторите попытку позже.',
        error: 'API server is not available'
      };
    }
    
    // Используем функцию повторных попыток вместо простого fetch
    const response = await retryFetch(`${API_BASE_URL}/chat/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    }, 3, 1000); // 3 попытки с начальной задержкой 1 секунда

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Grok API:', data);
    return data;
  } catch (error) {
    console.error('Error starting new Grok conversation:', error);
    
    // Возвращаем локальный ответ в случае ошибки
    return {
      conversation_id: 'local-' + Date.now(),
      parent_response_id: 'local-' + Date.now(),
      response: 'Извините, произошла ошибка при обработке запроса. Пожалуйста, повторите попытку позже.',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Sends a message to an existing Grok conversation
 */
export const continueGrokConversation = async (
  message: string,
  conversation_id: string,
  parent_response_id: string
): Promise<GrokResponse> => {
  try {
    console.log('Continuing Grok conversation:', {
      message,
      conversation_id,
      parent_response_id
    });
    
    // Проверяем доступность API перед отправкой запроса
    const isApiAvailable = await checkApiAvailability();
    if (!isApiAvailable) {
      console.error('Grok API не доступен. Возвращаем заглушку ответа.');
      return {
        conversation_id: conversation_id || ('local-' + Date.now()),
        parent_response_id: parent_response_id || ('local-' + Date.now()),
        response: 'Извините, сервис временно недоступен. Пожалуйста, повторите попытку позже.',
        error: 'API server is not available'
      };
    }
    
    // Используем функцию повторных попыток вместо простого fetch
    const response = await retryFetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversation_id,
        parent_response_id
      })
    }, 3, 1000); // 3 попытки с начальной задержкой 1 секунда

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      
      // If chat not found, start a new conversation
      if (response.status === 404) {
        console.log('Chat not found, creating new conversation...');
        return startNewGrokConversation(message);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Grok API:', data);
    return data;
  } catch (error) {
    console.error('Error continuing Grok conversation:', error);
    
    // Возвращаем локальный ответ в случае ошибки
    return {
      conversation_id: conversation_id || ('local-' + Date.now()),
      parent_response_id: parent_response_id || ('local-' + Date.now()),
      response: 'Извините, произошла ошибка при обработке запроса. Пожалуйста, повторите попытку позже.',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generates a response using Grok
 */
export const generateGrokResponse = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  conversationDetails?: { conversationId: string; parentResponseId: string }
): Promise<GrokResponse> => {
  // Отфильтровываем пустые сообщения и строго проверяем их валидность
  const filteredMessages = messages.filter(msg => {
    // Проверка наличия контента и его непустоты
    if (!msg.content || !msg.content.trim()) {
      console.log('Отфильтровано пустое сообщение с ролью:', msg.role);
      return false;
    }
    
    return true;
  });
  
  // Проверяем, продолжаем ли мы существующий разговор
  const isExistingConversation = !!(
    conversationDetails && 
    conversationDetails.conversationId && 
    conversationDetails.parentResponseId
  );
  
  console.log(`----- Grok API: ${isExistingConversation ? 'Продолжаем существующий' : 'Начинаем новый'} разговор -----`);
  console.log('Количество сообщений:', filteredMessages.length);
  console.log('Роли сообщений:', filteredMessages.map(m => m.role).join(', '));
  
  // Для существующих бесед используем корректную передачу идентификаторов
  if (isExistingConversation) {
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
    console.log('Продолжаем разговор только с последним сообщением пользователя:');
    console.log(messageToSend.substring(0, 50) + (messageToSend.length > 50 ? '...' : ''));
    
    // Преобразуем идентификаторы из camelCase в snake_case для корректной работы API
    const conversation_id = conversationDetails.conversationId;
    const parent_response_id = conversationDetails.parentResponseId;
    console.log('Используем идентификаторы:', { conversation_id, parent_response_id });
    
    // Вызываем функцию продолжения разговора с переданными идентификаторами
    return continueGrokConversation(
      messageToSend,
      conversation_id,
      parent_response_id
    );
  }
  
  // Для нового разговора
  // Находим системное сообщение и последнее сообщение пользователя
  const systemMessage = filteredMessages.find(msg => msg.role === 'system');
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
  
  // Формируем сообщение для нового разговора
  let messageToSend = userMessage.content;
  
  // Добавляем системный промпт, если он есть
  if (systemMessage) {
    console.log('Добавляем системный промпт к новому разговору');
    messageToSend = `${systemMessage.content}\n\nGirls message: ${messageToSend}`;
  }
  
  // Выводим информационное сообщение о начале разговора
  console.log('Начинаем новый разговор, сообщение:');
  console.log('Системный промпт:', systemMessage ? systemMessage.content.substring(0, 50) + '...' : 'Отсутствует');
  console.log('Сообщение пользователя:', userMessage.content.substring(0, 50) + '...');
  
  // Запускаем новый разговор с системным промптом и сообщением пользователя
  const response = await startNewGrokConversation(messageToSend);
  console.log('----- Grok API: Получен ответ -----');
  
  return response;
};

// Функция для повторения запросов с задержкой
const retryFetch = async (url: string, options: RequestInit, maxRetries: number = 3, delay: number = 1000): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`API request attempt ${attempt + 1}/${maxRetries}`);
      
      // Устанавливаем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        // Ждем перед следующей попыткой с экспоненциальной задержкой
        const waitTime = delay * Math.pow(1.5, attempt);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
};

// Отслеживание активных запросов анализа для исключения дублирования
const activeAnalysisRequests = new Map<string, Promise<any>>();

/**
 * Отправляет промпт на анализ в Grok и получает результат
 */
export const analyzeDialogs = async (prompt: string): Promise<any> => {
  // Создаем уникальный ключ для запроса на основе первых 100 и последних 100 символов промпта
  // Это достаточно уникально, но при этом одинаковые запросы будут дедуплицированы
  const promptKey = `${prompt.slice(0, 100)}...${prompt.slice(-100)}`;
  
  // Проверяем, есть ли уже активный запрос с таким же ключом
  if (activeAnalysisRequests.has(promptKey)) {
    console.log('Duplicate analysis request detected, reusing existing request');
    return activeAnalysisRequests.get(promptKey);
  }

  try {
    console.log('Sending dialog analysis prompt to Grok, prompt length:', prompt.length);
    
    // Создаем промис для текущего запроса и сохраняем его в Map
    const analysisPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/chat/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: prompt })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server responded with error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log('Received analysis response from Grok API');
        
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