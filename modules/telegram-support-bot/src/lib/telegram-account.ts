import axios from 'axios';

// Функция для получения chat_id по номеру телефона
export async function getAccountChatId(): Promise<string | null> {
  try {
    // Проверяем наличие сохраненного chat_id в переменных окружения
    // if (process.env.TELEGRAM_ACCOUNT_CHAT_ID) {
    //   return process.env.TELEGRAM_ACCOUNT_CHAT_ID;
    // }
    
    // Если chat_id не сохранен, используем API Telegram для его получения
    // Для этого обычно используется Bot API, и бот должен быть добавлен в контакты аккаунта
    
    // Получаем бот токен из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен!');
    }
    
    // URL для получения обновлений бота
    const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
    
    // Отправляем запрос для получения последних обновлений
    const response = await axios.get(url);
    
    if (response.data && response.data.ok) {
      // Ищем сообщения от нужного аккаунта
      const updates = response.data.result;
      const phoneNumber = process.env.PHONE_NUMBER?.replace(/\+/g, '');
      
      if (!phoneNumber) {
        throw new Error('PHONE_NUMBER не установлен!');
      }
      
      // Просматриваем обновления в поисках совпадений
      for (const update of updates) {
        if (update.message && update.message.from) {
          const fromUser = update.message.from;
          // Проверяем, содержит ли контакт нужный номер телефона
          // Обратите внимание, что Telegram Bot API не предоставляет номера телефона
          // Для точного сопоставления потребуется, чтобы пользователь отправил боту сообщение
          // Здесь мы просто проверяем наличие сообщения от пользователя
          
          // Возвращаем ID чата, где было сообщение
          return update.message.chat.id.toString();
        }
      }
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

// Инструкции для настройки:
// 1. Пользователь должен найти бота и отправить ему сообщение /start
// 2. После этого нужно выполнить getAccountChatId() для получения chat_id
// 3. Полученный chat_id нужно сохранить в .env как TELEGRAM_ACCOUNT_CHAT_ID 