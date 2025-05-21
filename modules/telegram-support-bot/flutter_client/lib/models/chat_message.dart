import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:uuid/uuid.dart';

// Тип сообщения для приложения
enum MessageType {
  text,
  system,
  error
}

// Модель сообщения для внутреннего использования
class ChatMessage {
  final String id;
  final String text;
  final String sender;
  final DateTime timestamp;
  final MessageType type;

  ChatMessage({
    String? id,
    required this.text,
    required this.sender,
    DateTime? timestamp,
    this.type = MessageType.text,
  }) : 
    id = id ?? const Uuid().v4(),
    timestamp = timestamp ?? DateTime.now();

  // Преобразование в Map для хранения
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'sender': sender,
      'timestamp': timestamp.toIso8601String(),
      'type': type.index,
    };
  }

  // Создание из Map
  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      text: json['text'],
      sender: json['sender'],
      timestamp: DateTime.parse(json['timestamp']),
      type: MessageType.values[json['type'] ?? 0],
    );
  }

  // Преобразование в тип сообщения для flutter_chat_ui
  types.Message toUiMessage() {
    final author = types.User(id: sender, firstName: sender == 'user' ? 'Вы' : 'Бот');
    
    switch (type) {
      case MessageType.text:
        return types.TextMessage(
          id: id,
          author: author,
          text: text,
          createdAt: timestamp.millisecondsSinceEpoch,
        );
      case MessageType.system:
        return types.SystemMessage(
          id: id,
          text: text,
          createdAt: timestamp.millisecondsSinceEpoch,
        );
      case MessageType.error:
        return types.SystemMessage(
          id: id,
          text: "Ошибка: $text",
          createdAt: timestamp.millisecondsSinceEpoch,
        );
    }
  }
} 