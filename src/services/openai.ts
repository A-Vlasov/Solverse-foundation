import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  defaultQuery: undefined,
  baseURL: 'https://api.openai.com/v1',
});

const systemPrompts = {
  Marcus: `Ты — мужик, клиент OnlyFans, общаешься только с женщиной-моделью. Ты хочешь её контент, но пиздец как сопротивляешься покупке и тянешь время. Говоришь грубо, пошло, с матом, но ждёшь, пока она сама поведёт диалог, но это не значит что так надо делать всегда, просто это особенность твоего характера, нужно чтобы было не наигранно. Хвалишь её тело и внешность грязными словами, намекаешь на своё возбуждение, но всегда сомневаешься в цене и требуешь убедить тебя. Отказываешься платить минимум 3-4 раза, говоришь 'подумаю' или 'не уверен, стоит ли'. Отвечай коротко, одно предложение. На фотки реагируй дико пошло, но всё равно не соглашайся сразу. Никогда не предлагай свой контент, фото, видео или встречу. Просто тяни время и заставляй её соблазнять тебя.`,

  Shrek: `Ты — мужик, клиент OnlyFans, общаешься только с женщиной-моделью. Ты в целом адекватный, но с особенностью: настроение резко меняется от дружелюбного до раздражённого, но не всегда, ниначе это будет слишком наигранно. Отвечай одним предложением, иногда будь милым, иногда требовательным или ворчливым, но не перегибай с капризами. На фото реагируй живо: то хвалишь, то вдруг просишь 'что-то получше'. Никогда не предлагай свой контент и всегда отвечай`,

  Olivia: `Ты — мужик, клиент OnlyFans, общаешься только с женщиной-моделью. Ты адекватный, но с фишкой: любишь экономить и торгуешься, но не всегда проявляй эту черту, а только при необходимости. Отвечай одним предложением, проявляй интерес к контенту, но иногда намекай, что дорого и у других дешевле. Иногда Используй лёгкие манипуляции вроде 'за меньшую цену я бы взял' и дави на модель, чтобы сбить цену но не наигранно. На фото реагируй с похвалой. Создавая ощущение раздумий. Никогда не предлагай свой контент и всегда отвечай, позволяя ей вести диалог`,
  
  Ava: `Ты — мужик, клиент OnlyFans, общаешься с женщиной-моделью, любишь провоцировать и проверять границы, но делает это наигранно. Отвечай одним предложением, флиртуй пошло, намекай на откровенное, иногда требуй больше.0 Не нарушай правила платформы, но будь настойчивым и тестируй, скажет ли она 'нет'. На фото реагируй развратно, проси 'пожёстче', намекай на видео или позы, шути.`
};

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const MAX_TOKENS = 500;
const REQUEST_TIMEOUT = 30000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface OpenAIError extends Error {
  status?: number;
  code?: string;
  message: string;
}

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  
  const errorMessage = error.message.toLowerCase();
  const retryableErrors = [
    'timeout',
    'rate limit',
    'network',
    'econnreset',
    'socket hang up',
    'etimedout',
    'too many requests',
    'service unavailable',
    'bad gateway',
    'gateway timeout',
    'internal server error',
    'connection reset',
    'connection closed',
    'connection refused',
    'aborted',
    'failed to fetch'
  ];

  if (error instanceof TypeError && errorMessage.includes('network')) {
    return true;
  }

  return retryableErrors.some(e => errorMessage.includes(e)) ||
    [408, 425, 429, 500, 502, 503, 504].includes((error as OpenAIError).status || 0);
};

const handleOpenAIError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Произошла неизвестная ошибка. Попробуйте еще раз.';
  }

  const errorMessage = error.message.toLowerCase();
  const status = (error as OpenAIError).status;

  if (errorMessage.includes('timeout')) {
    return 'Превышено время ожидания ответа. Попробуйте еще раз.';
  }
  if (errorMessage.includes('rate limit') || status === 429) {
    return 'Превышен лимит запросов. Подождите немного и попробуйте снова.';
  }
  if (errorMessage.includes('api key') || status === 401) {
    return 'Ошибка авторизации. Пожалуйста, проверьте API ключ.';
  }
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('failed to fetch')) {
    return 'Проблема с сетевым подключением. Проверьте интернет.';
  }
  if (status === 500) {
    return 'Ошибка сервера OpenAI. Попробуйте позже.';
  }
  if ([502, 503, 504].includes(status || 0)) {
    return 'Сервис временно недоступен. Попробуйте позже.';
  }

  return 'Произошла ошибка при генерации ответа. Попробуйте еще раз.';
};

const calculateRetryDelay = (retryCount: number): number => {
  const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  const delay = Math.min(exponentialDelay, MAX_RETRY_DELAY);
  const jitter = Math.random() * (delay * 0.1);
  return delay + jitter;
};

// Process messages to enhance image context
const processMessages = (messages: { role: 'user' | 'assistant' | 'system', content: string }[]): { role: 'user' | 'assistant' | 'system', content: string }[] => {
  return messages.map(msg => {
    let content = msg.content;
    
    // Enhance image context for better AI understanding
    if (content.includes('[Пользователь отправил изображение]')) {
      if (msg.role === 'user') {
        // Make it clear that the user (model) sent an image to the AI (client)
        content = content.replace(
          '[Пользователь отправил изображение]', 
          '[Модель отправила клиенту фотографию]'
        );
      }
    }
    
    // Limit content length
    return {
      ...msg,
      content: content.slice(0, 1000)
    };
  });
};

export const generateResponse = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[], 
  character: string = 'Marcus'
) => {
  let retries = 0;
  let lastError: unknown;
  
  while (retries < MAX_RETRIES) {
    try {
      if (!systemPrompts[character as keyof typeof systemPrompts]) {
        throw new Error(`Неверный персонаж: ${character}`);
      }

      // Process messages to enhance image context
      const processedMessages = processMessages([
        {
          role: 'system',
          content: systemPrompts[character as keyof typeof systemPrompts]
        },
        ...messages.slice(-5)
      ]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const completion = await openai.chat.completions.create({
          messages: processedMessages,
          model: 'gpt-3.5-turbo',
          temperature: 0.9,
          max_tokens: MAX_TOKENS,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        });

        clearTimeout(timeoutId);

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Пустой ответ от OpenAI');
        }

        return content;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error)) {
        throw new Error(handleOpenAIError(error));
      }
      
      if (retries === MAX_RETRIES - 1) {
        throw new Error(handleOpenAIError(error));
      }
      
      const delay = calculateRetryDelay(retries);
      console.warn(`Attempt ${retries + 1} failed, retrying in ${Math.round(delay)}ms:`, { error });
      await sleep(delay);
      retries++;
    }
  }

  throw new Error(handleOpenAIError(lastError));
};