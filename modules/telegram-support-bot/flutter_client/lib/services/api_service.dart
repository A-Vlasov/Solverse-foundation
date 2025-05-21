import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  // Базовый URL API
  final String baseUrl;
  
  // Инициализация с URL
  ApiService({required this.baseUrl});

  // Отправка сообщения боту
  Future<Map<String, dynamic>> sendMessage(String message, String chatId) async {
    try {
      // baseUrl уже содержит правильный хост, порт и базовый путь /api (например, http://localhost:3000/api)
      // Добавляем эндпоинт /telegram-chat (без слеша в конце, согласно редиректу 308)
      final url = '$baseUrl/telegramApi/handleChatMessage';
      
      // Для отладки выводим URL в консоль
      print('Отправка запроса на URL: $url');
      
      // Создаем тело запроса с сообщением и chatId
      final body = jsonEncode({
        'message': message,
        'chatId': chatId
      });
      
      // Отправляем POST запрос
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      );
      
      // Для отладки выводим статус-код
      print('Получен ответ с кодом: ${response.statusCode}');
      if (response.statusCode != 200) {
        print('Тело ответа: ${response.body}');
      }
      
      // Проверяем успешность запроса
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        // Обрабатываем ошибку статус кода
        return {
          'status': 'error',
          'message': 'Ошибка сервера: ${response.statusCode}'
        };
      }
    } catch (e) {
      // Обрабатываем исключения
      print('Ошибка запроса: $e');
      return {
        'status': 'error',
        'message': 'Ошибка подключения: $e'
      };
    }
  }
} 