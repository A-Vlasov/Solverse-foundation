require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const PHONE_NUMBER = process.env.PHONE_NUMBER;

// Создаем строковую сессию для сохранения авторизации
const stringSession = new StringSession('');

(async () => {
  console.log('Инициализация Telegram клиента...');
  
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  
  // Запускаем клиент и авторизуемся
  await client.start({
    phoneNumber: PHONE_NUMBER,
    password: async () => await input.text('Введите пароль двухфакторной аутентификации (если есть): '),
    phoneCode: async () => await input.text('Введите код из Telegram: '),
    onError: (err) => console.log(err),
  });
  
  // Получаем и сохраняем строку сессии для последующих использований
  console.log('Авторизация успешна!');
  console.log('Данные сессии (сохраните для повторного использования):');
  console.log(client.session.save());
  
  // Функция для получения всех диалогов
  async function getDialogs() {
    console.log('Получение списка диалогов...');
    
    const dialogs = await client.getDialogs();
    console.log(`Найдено ${dialogs.length} диалогов`);
    
    // Фильтруем только личные чаты (пользователи)
    const userChats = dialogs.filter(dialog => {
      const entity = dialog.entity;
      return entity && entity.className === 'User' && !entity.bot;
    });
    
    console.log(`Из них ${userChats.length} личных чатов с пользователями`);
    
    return userChats;
  }
  
  // Функция для отправки сообщения пользователю
  async function sendMessage(userId, message) {
    try {
      console.log(`Отправка сообщения пользователю ${userId}...`);
      await client.sendMessage(userId, { message });
      console.log(`Сообщение успешно отправлено пользователю ${userId}`);
      return true;
    } catch (error) {
      console.error(`Ошибка при отправке сообщения пользователю ${userId}:`, error);
      return false;
    }
  }
  
  // Функция для массовой рассылки с задержкой
  async function bulkSend(userIds, message, delaySeconds = 2) {
    console.log(`Начинаем рассылку для ${userIds.length} пользователей с задержкой ${delaySeconds} сек...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of userIds) {
      const success = await sendMessage(userId, message);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Делаем задержку между отправками, чтобы не превысить лимиты
      if (userIds.indexOf(userId) < userIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }
    
    console.log(`Рассылка завершена. Успешно: ${successCount}, ошибок: ${failCount}`);
  }
  
  // Пример использования
  try {
    // Получаем список диалогов
    const userChats = await getDialogs();
    
    // Выводим первые 10 пользователей для примера
    console.log('\nСписок первых 10 пользователей:');
    userChats.slice(0, 10).forEach((chat, index) => {
      const user = chat.entity;
      console.log(`${index + 1}. ID: ${user.id}, Имя: ${user.firstName || ''} ${user.lastName || ''} (@${user.username || 'без юзернейма'})`);
    });
    
    // Демонстрация отправки сообщения первому пользователю в списке
    // if (userChats.length > 0) {
    //   const firstUser = userChats[0].entity;
    //   await sendMessage(firstUser.id, 'Тестовое сообщение от моего TeleGrammer');
    // }
    
    // Демонстрация массовой рассылки
    const userIds = userChats.slice(0, 10).map(chat => chat.entity.id); // Первые 3 пользователей
    await bulkSend(userIds, 'Привет! Это тестовая рассылка от TeleGrammer.');
    
  } catch (error) {
    console.error('Произошла ошибка:', error);
  } finally {
    // Отключаем клиент по завершении работы
    await client.disconnect();
    console.log('Клиент отключен');
  }
})(); 