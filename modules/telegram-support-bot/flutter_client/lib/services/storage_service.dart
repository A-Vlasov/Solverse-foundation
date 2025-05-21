import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/chat_message.dart';

class StorageService {
  // Ключи для SharedPreferences
  static const String _chatIdKey = 'chatId';
  static const String _messagesKey = 'chatMessages';
  
  // Получение или создание уникального chatId
  Future<String> getChatId() async {
    final prefs = await SharedPreferences.getInstance();
    String? chatId = prefs.getString(_chatIdKey);
    
    // Если chatId не существует, создаем новый
    if (chatId == null) {
      chatId = const Uuid().v4();
      await prefs.setString(_chatIdKey, chatId);
    }
    
    return chatId;
  }
  
  // Сохранение списка сообщений
  Future<void> saveMessages(List<ChatMessage> messages) async {
    final prefs = await SharedPreferences.getInstance();
    
    // Преобразуем сообщения в JSON
    final messagesJson = messages.map((message) => message.toJson()).toList();
    final messagesString = jsonEncode(messagesJson);
    
    // Сохраняем в SharedPreferences
    await prefs.setString(_messagesKey, messagesString);
  }
  
  // Загрузка списка сообщений
  Future<List<ChatMessage>> loadMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final messagesString = prefs.getString(_messagesKey);
    
    // Если сообщений нет, возвращаем пустой список
    if (messagesString == null) {
      return [];
    }
    
    try {
      // Декодируем JSON и преобразуем в список сообщений
      final List<dynamic> messagesJson = jsonDecode(messagesString);
      return messagesJson
          .map((json) => ChatMessage.fromJson(json))
          .toList();
    } catch (e) {
      // В случае ошибки возвращаем пустой список
      return [];
    }
  }
  
  // Очистка истории сообщений
  Future<void> clearMessages() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_messagesKey);
  }
} 