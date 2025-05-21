import 'package:serverpod/serverpod.dart';
// Путь к сгенерированному protocol.dart может немного отличаться
// после первой генерации, посмотрим.
// Обычно это: import '../generated/protocol.dart';
// Или если модели в protocol/: import '../protocol/protocol.dart';
// Пока оставим так, Serverpod должен сам разобраться или мы поправим.
import '../generated/protocol.dart'; // Предполагаем, что ChatMessageResponse будет здесь
import '../services/telegram_service.dart'; // Импортируем наш сервис

// TODO: Инициализировать и управлять экземпляром бота где-то здесь или в отдельном сервисе
// import 'package:televerse/televerse.dart';

class TelegramApiEndpoint extends Endpoint {
  String _processCommands(String message) {
    // Обработка команды /start
    if (message.trim() == '/start') {
      return 'Привет! Я бот-помощник. Чем могу помочь?';
    }

    // Обработка команды /help
    if (message.trim() == '/help') {
      return 'Я могу отвечать на ваши сообщения и выполнять некоторые команды. Попробуйте /start или /help.';
    }

    // Обработка команды /time
    if (message.trim() == '/time') {
      final now = DateTime.now();
      return 'Текущее время: ${now.hour}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    }

    // Обработка команды /date
    if (message.trim() == '/date') {
      final now = DateTime.now();
      return 'Сегодня: ${now.day.toString().padLeft(2, '0')}.${now.month.toString().padLeft(2, '0')}.${now.year}';
    }

    // Проверка на приветствие
    if (RegExp(r'привет|здравствуй|хай|hello|hi', caseSensitive: false)
        .hasMatch(message)) {
      return 'Привет! Как я могу вам помочь?';
    }

    // Проверка на прощание
    if (RegExp(r'пока|до свидания|увидимся|bye|goodbye', caseSensitive: false)
        .hasMatch(message)) {
      return 'До свидания! Буду рад помочь вам снова.';
    }

    // Если нет специальной команды, возвращаем эхо-ответ
    return 'Ваше сообщение принято в обработку.';
  }

  // Метод для обработки сообщения из чата
  Future<ChatMessageResponse> handleChatMessage(Session session, String message, String chatId) async {
    session.log('Handling chat message: "$message" from chatID: $chatId');

    String botReply = _processCommands(message);
    bool forwardedSuccessfully = false;
    String? errorMessage;

    try {
      final telegramService = TelegramService();
      forwardedSuccessfully = await telegramService.forwardMessage(session, message, chatId);
      if (!forwardedSuccessfully) {
        // Можно установить errorMessage, если forwardMessage вернул false по известной причине
        // errorMessage = "Не удалось переслать сообщение."; 
        // (но пока forwardMessage не возвращает причину, только false)
      }
    } catch (e, stackTrace) {
      session.log('Ошибка при вызове TelegramService.forwardMessage: $e', level: LogLevel.error, stackTrace: stackTrace);
      errorMessage = "Внутренняя ошибка сервера при пересылке сообщения.";
      forwardedSuccessfully = false; // Убедимся, что false в случае исключения
    }

    return ChatMessageResponse(
      reply: botReply,
      forwarded: forwardedSuccessfully,
      status: errorMessage == null ? "ok" : "error",
      errorMessage: errorMessage,
    );
  }

  // Метод для получения chat_id для настройки
  Future<String?> getSetupChatId(Session session) async {
    session.log('Handling getSetupChatId request');
    try {
      final telegramService = TelegramService();
      // TODO: Доработать getChatIdForSetup в TelegramService для реальной логики
      return await telegramService.getChatIdForSetup(session);
    } catch (e, stackTrace) {
      session.log('Ошибка при вызове TelegramService.getChatIdForSetup: $e', level: LogLevel.error, stackTrace: stackTrace);
      return null; // или выбросить ошибку, чтобы клиент получил 500
    }
  }
} 