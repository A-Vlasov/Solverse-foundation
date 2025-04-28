import { NextResponse } from 'next/server';
import { getAccountChatId } from '@/lib/telegram-account';

// Обработчик GET запросов для настройки Telegram аккаунта
export async function GET() {
  try {
    // Получаем chat_id для указанного аккаунта
    const chatId = await getAccountChatId();
    
    if (!chatId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Не удалось получить chat_id. Убедитесь, что вы отправили сообщение /start боту.' 
      }, { status: 400 });
    }
    
    // Возвращаем полученный chat_id
    return NextResponse.json({ 
      status: 'ok', 
      chatId: chatId,
      message: 'Chat ID успешно получен. Добавьте его в .env файл как TELEGRAM_ACCOUNT_CHAT_ID' 
    });
  } catch (err) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Внутренняя ошибка сервера' 
    }, { status: 500 });
  }
} 