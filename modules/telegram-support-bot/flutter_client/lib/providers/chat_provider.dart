import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../utils/constants.dart';

class ChatProvider with ChangeNotifier {
  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  String? _chatId;
  
  // Экземпляры сервисов
  final ApiService _apiService;
  final StorageService _storageService;
  
  // Геттеры
  List<ChatMessage> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get chatId => _chatId;
  
  // Конструктор
  ChatProvider({
    ApiService? apiService,
    StorageService? storageService,
  }) : 
    _apiService = apiService ?? ApiService(baseUrl: AppConstants.apiBaseUrl),
    _storageService = storageService ?? StorageService() {
    _initializeChat();
  }
  
  // Инициализация чата
  Future<void> _initializeChat() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // Получаем chatId
      _chatId = await _storageService.getChatId();
      
      // Загружаем сообщения из хранилища
      _messages = await _storageService.loadMessages();
      
      // Если сообщений нет, добавляем приветственное сообщение
      if (_messages.isEmpty) {
        _messages.add(ChatMessage(
          text: 'Привет! Я бот-помощник. Чем могу помочь?',
          sender: 'bot',
          type: MessageType.system,
        ));
        
        // Сохраняем приветственное сообщение
        await _storageService.saveMessages(_messages);
      }
    } catch (e) {
      // Обрабатываем ошибки инициализации
      _messages.add(ChatMessage(
        text: 'Ошибка инициализации чата: $e',
        sender: 'system',
        type: MessageType.error,
      ));
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Отправка сообщения
  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty || _chatId == null) return;
    
    // Создаем сообщение пользователя
    final userMessage = ChatMessage(
      text: text,
      sender: 'user',
    );
    
    // Добавляем сообщение пользователя в список
    _messages.add(userMessage);
    _isLoading = true;
    notifyListeners();
    
    // Сохраняем сообщения в хранилище
    await _storageService.saveMessages(_messages);
    
    try {
      // Отправляем сообщение боту
      final response = await _apiService.sendMessage(text, _chatId!);
      
      // Проверяем успешность запроса
      if (response['status'] == 'ok') {
        // Создаем сообщение бота
        final botMessage = ChatMessage(
          text: response['reply'],
          sender: 'bot',
        );
        
        // Добавляем сообщение бота в список
        _messages.add(botMessage);
      } else {
        // Создаем сообщение об ошибке
        final errorMessage = ChatMessage(
          text: response['message'] ?? 'Неизвестная ошибка',
          sender: 'system',
          type: MessageType.error,
        );
        
        // Добавляем сообщение об ошибке в список
        _messages.add(errorMessage);
      }
    } catch (e) {
      // Обрабатываем исключения
      final errorMessage = ChatMessage(
        text: 'Ошибка отправки сообщения: $e',
        sender: 'system',
        type: MessageType.error,
      );
      
      _messages.add(errorMessage);
    } finally {
      _isLoading = false;
      
      // Сохраняем сообщения в хранилище
      await _storageService.saveMessages(_messages);
      notifyListeners();
    }
  }
  
  // Очистка истории чата
  Future<void> clearChat() async {
    _messages = [
      ChatMessage(
        text: 'История чата очищена',
        sender: 'system',
        type: MessageType.system,
      ),
      ChatMessage(
        text: 'Привет! Я бот-помощник. Чем могу помочь?',
        sender: 'bot',
        type: MessageType.system,
      ),
    ];
    
    await _storageService.saveMessages(_messages);
    notifyListeners();
  }
} 