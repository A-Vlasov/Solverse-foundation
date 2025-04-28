import { NextResponse } from 'next/server';
import { getTelegramBot, sendTelegramMessage, forwardToAccount } from '@/lib/telegram-bot';

// Обработчик POST запросов для чата с ботом через веб-интерфейс
export async function POST(request: Request) {
  try {
    const { message, chatId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Некорректное сообщение' 
      }, { status: 400 });
    }
    
    // Получаем экземпляр бота
    const bot = getTelegramBot();
    
    if (!bot) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Бот не инициализирован' 
      }, { status: 500 });
    }
    
    try {
      // Пересылаем сообщение в указанный Telegram аккаунт
      const forwardResult = await forwardToAccount(message);
      
      // Генерируем ответ бота используя обработчик команд
      const botReply = processCommands(message);
      
      // Отправляем ответ клиенту
      return NextResponse.json({ 
        status: 'ok', 
        reply: botReply,
        forwarded: forwardResult
      });
    } catch (err) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Ошибка при генерации ответа' 
      }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
}

// Обработчик команд и сообщений
export function processCommands(message: string): string {
  // Обработка команды /start
  if (message.trim() === '/start') {
    return 'Привет! Я бот-помощник. Чем могу помочь?';
  }
  
  // Обработка команды /help
  if (message.trim() === '/help') {
    return 'Я могу отвечать на ваши сообщения и выполнять некоторые команды. Попробуйте /start или /help.';
  }
  
  // Обработка команды /time
  if (message.trim() === '/time') {
    return `Текущее время: ${new Date().toLocaleTimeString()}`;
  }
  
  // Обработка команды /date
  if (message.trim() === '/date') {
    return `Сегодня: ${new Date().toLocaleDateString()}`;
  }
  
  // Проверка на приветствие
  if (/привет|здравствуй|хай|hello|hi/i.test(message.toLowerCase())) {
    return 'Привет! Как я могу вам помочь?';
  }
  
  // Проверка на прощание
  if (/пока|до свидания|увидимся|bye|goodbye/i.test(message.toLowerCase())) {
    return 'До свидания! Буду рад помочь вам снова.';
  }
  
  // Если нет специальной команды, возвращаем эхо-ответ
  return `Ваше сообщение принято в обработку.`;
} 