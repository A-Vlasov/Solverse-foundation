import 'package:serverpod/serverpod.dart';
import 'package:televerse/televerse.dart';

class TelegramService {
  Bot? _bot; // Экземпляр бота, ленивая инициализация
  String? _botToken;
  String? _forwardChatId;
  bool _isBotInitialized = false;

  // Метод для инициализации бота (если еще не инициализирован)
  // Вызывается перед первым использованием бота
  Future<void> _ensureBotInitialized(Session session) async {
    if (_isBotInitialized && _bot != null) {
      return;
    }

    // ЗАХАРДКОЖЕННЫЕ ЗНАЧЕНИЯ ДЛЯ ОТЛАДКИ:
    _botToken = "7955134547:AAEgnoYBfGmnye9b1nid0DdXXLIa2Cs83SA";
    _forwardChatId = "5528789469"; 

    // Закомментируем получение из passwords.yaml
    // _botToken = await session.passwords['TELEGRAM_BOT_TOKEN'];
    // _forwardChatId = await session.passwords['TELEGRAM_ACCOUNT_CHAT_ID'];

    if (_botToken == null || _botToken!.isEmpty) { // Добавим проверку на пустоту
      session.log('TELEGRAM_BOT_TOKEN не настроен (захардкожен или из passwords.yaml)', level: LogLevel.error);
      throw Exception('TELEGRAM_BOT_TOKEN не настроен');
    }
    // if (_forwardChatId == null) { // Это может быть null, если не используется getSetupChatId
    //   session.log('TELEGRAM_ACCOUNT_CHAT_ID не найден (захардкожен или из passwords.yaml)', level: LogLevel.warning);
    // }

    try {
      _bot = Bot(_botToken!);
      _isBotInitialized = true;
      session.log('TelegramService: Бот инициализирован с захардкоженным токеном.');
    } catch (e, stackTrace) {
      session.log('Ошибка инициализации Telegram бота: $e', level: LogLevel.error, stackTrace: stackTrace);
      _isBotInitialized = false;
      _bot = null;
      throw Exception('Ошибка инициализации Telegram бота: $e');
    }
  }

  // Метод для пересылки сообщения
  Future<bool> forwardMessage(Session session, String originalMessage, String originalChatId) async {
    await _ensureBotInitialized(session);
    if (_bot == null || _forwardChatId == null || _forwardChatId!.isEmpty) { // Добавим проверку на пустоту
      session.log('Бот не инициализирован или TELEGRAM_ACCOUNT_CHAT_ID не указан (захардкожен), пересылка невозможна.', level: LogLevel.error);
      return false;
    }

    final messageToSend = 'Сообщение из веб-чата (ID: $originalChatId):\n\n$originalMessage';
    
    try {
      // ID чата в televerse должен быть типа num (int или double)
      final targetChatIdNum = int.tryParse(_forwardChatId!);
      if (targetChatIdNum == null) {
        session.log('TELEGRAM_ACCOUNT_CHAT_ID (захардкожен) имеет неверный формат: $_forwardChatId', level: LogLevel.error);
        return false;
      }
      await _bot!.api.sendMessage(ChatID(targetChatIdNum), messageToSend);
      session.log('Сообщение успешно переслано на chat_id: $_forwardChatId');
      return true;
    } catch (e, stackTrace) {
      session.log('Ошибка при пересылке сообщения: $e', level: LogLevel.error, stackTrace: stackTrace);
      return false;
    }
  }

  // Метод для получения chat_id (заглушка, нужно доработать)
  Future<String?> getChatIdForSetup(Session session) async {
    await _ensureBotInitialized(session);
    if (_bot == null) {
      session.log('Бот не инициализирован, получение chat_id невозможно.', level: LogLevel.error);
      return null;
    }
    
    session.log('TelegramService: Пытаемся получить chat_id для настройки, ищем команду /getmyid...');
    
    try {
      final updates = await _bot!.api.getUpdates(); 
      
      if (updates.isEmpty) {
        session.log('Нет обновлений от Telegram бота.', level: LogLevel.info);
        return null;
      }

      for (final update in updates.reversed) {
        if (update.message != null && update.message!.text != null) {
          final messageText = update.message!.text!;
          if (messageText.trim().toLowerCase() == '/getmyid') {
            final chatId = update.message!.chat.id.toString();
            session.log('Найдена команда /getmyid от chat_id: $chatId');
            return chatId;
          }
        }
      }
      session.log('Команда /getmyid не найдена в последних обновлениях.', level: LogLevel.info);
      return null; 
    } catch (e, stackTrace) {
      session.log('Ошибка при получении обновлений от Telegram: $e', level: LogLevel.error, stackTrace: stackTrace);
      return null;
    }
  }
} 