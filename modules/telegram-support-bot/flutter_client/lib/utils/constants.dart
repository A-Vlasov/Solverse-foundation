import 'dart:io';
import 'package:flutter/foundation.dart';

/// Класс с константами приложения
class AppConstants {
  /// Базовый URL для API 
  static String get apiBaseUrl {
    // Для веб-приложения и других платформ при локальной разработке
    // используем localhost с портом, на котором ожидается Next.js
    const String localDevUrl = 'http://localhost:8080'; // Базовый URL Serverpod

    if (kIsWeb) {
      return localDevUrl;
    }
    
    // Для Android эмулятора используем специальный IP с правильным портом
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api';
    }
    
    // По умолчанию используем localhost с правильным портом для других платформ (iOS симулятор и т.д.)
    return localDevUrl;
  }
  
  /// Название приложения
  static const String appName = 'Telegram Support Bot';
  
  /// Описание приложения
  static const String appDescription = 
      'Клиент для общения с Telegram-ботом через Flutter. '
      'Каждая сессия чата имеет уникальный идентификатор.';
} 