import TelegramBot from 'node-telegram-bot-api';

// Проверяем, что мы на сервере (а не в браузере)
const isServer = typeof window === 'undefined';

// Интерфейс для сообщений от бота
export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    first_name: string;
    username?: string;
    type: string;
  };
  date: number;
  text?: string;
  [key: string]: any;
}

// Глобальная переменная для бота
let botInstance: TelegramBot | null = null;

// Функция для инициализации бота
export function getTelegramBot(): TelegramBot | null {
  // Проверяем, что мы на сервере
  if (!isServer) {
    return null;
  }

  // Если бот уже инициализирован, возвращаем его
  if (botInstance) {
    return botInstance;
  }

  // Получаем токен бота из переменных окружения
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    return null;
  }

  try {
    // Создаем нового бота с опцией polling для получения обновлений
    botInstance = new TelegramBot(token, { polling: true });
    return botInstance;
  } catch (err) {
    return null;
  }
}

// Функция для отправки сообщений
export async function sendTelegramMessage(chatId: number, text: string): Promise<TelegramMessage | null> {
  const bot = getTelegramBot();
  
  if (!bot) {
    return null;
  }
  
  try {
    return await bot.sendMessage(chatId, text);
  } catch (err) {
    return null;
  }
}

// Функция для пересылки сообщений в личный аккаунт
export async function forwardToAccount(message: string): Promise<boolean> {
  const bot = getTelegramBot();
  if (!bot) {
    return false;
  }
  
  // Получаем ID чата для пересылки из переменных окружения
  const accountChatId = process.env.TELEGRAM_ACCOUNT_CHAT_ID;
  
  if (!accountChatId) {
    return false;
  }
  
  try {
    // Отправляем сообщение в личный аккаунт
    await bot.sendMessage(accountChatId, message);
    return true;
  } catch (err) {
    return false;
  }
} 