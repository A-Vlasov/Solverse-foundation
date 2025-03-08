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
const API_BASE_URL = 'https://grok.ru.tuna.am/api';

/**
 * Sends a message to Grok API to start a new conversation
 */
export const startNewGrokConversation = async (message: string): Promise<GrokResponse> => {
  try {
    console.log('Starting new Grok conversation with message:', message);
    
    const response = await fetch(`${API_BASE_URL}/chat/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

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
    
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
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
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversation_id,
        parent_response_id
      })
    });

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
    
    return {
      conversation_id,
      parent_response_id,
      response: '',
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
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
  const systemMessage = messages.find(msg => msg.role === 'system');
  
  if (!lastUserMessage) {
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: 'No user message found'
    };
  }

  let messageToSend = lastUserMessage.content;
  
  if (systemMessage && !conversationDetails) {
    messageToSend = `${systemMessage.content}\n\nСообщение пользователя: ${messageToSend}`;
  }

  if (conversationDetails?.conversationId && conversationDetails?.parentResponseId) {
    return continueGrokConversation(
      messageToSend,
      conversationDetails.conversationId,
      conversationDetails.parentResponseId
    );
  }
  
  return startNewGrokConversation(messageToSend);
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

/**
 * Отправляет промпт на анализ в Grok и получает результат
 */
export const analyzeDialogs = async (prompt: string): Promise<any> => {
  try {
    console.log('Sending dialog analysis prompt to Grok, prompt length:', prompt.length);
    
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
        noStructuredData: true
      };
    } catch (parseError) {
      console.error('Error parsing analysis result:', parseError);
      return {
        ...data,
        parseError: true
      };
    }
  } catch (error) {
    console.error('Error analyzing dialogs:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};