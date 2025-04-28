# System Architecture & Patterns

## High-Level Architecture
Приложение использует клиент-серверную архитектуру с Next.js:
1. **Frontend**: React.js + TailwindCSS + TypeScript
2. **Backend API**: Next.js API Routes
3. **External Integration**: Telegram Bot API

```
[Browser Client] <--> [Next.js Frontend] <--> [Next.js API Routes] <--> [Telegram Bot API]
```

## Component Structure
1. **Page Components**
   - Single Page Application (SPA) с главной страницей чата

2. **React Components**
   - `Chat`: Главный компонент чата
   - `ChatMessages`: Компонент для отображения сообщений
   - `ChatInput`: Компонент для ввода сообщений

3. **API Routes**
   - `/api/telegram-chat`: Обработка сообщений чата
   - `/api/telegram-webhook`: API для вебхуков Telegram
   - `/api/setup-telegram`: Настройка и получение chatId

## Design Patterns
1. **Модульный подход**
   - Компоненты разделены на логические модули
   - Типы и hooks вынесены в отдельные файлы

2. **Custom Hooks**
   - `useChatStorage`: Хук для работы с localStorage
   - `useChatId`: Хук для генерации и хранения chatId

3. **Stateful Components**
   - Использование React Hooks (useState, useEffect, useRef, useCallback)
   - Локальное состояние для управления чатом

## Data Flow
1. **Сообщения пользователя**
   - Ввод пользователя -> ChatInput -> Chat (state) -> API запрос -> Telegram -> Ответ -> Chat (state) -> ChatMessages

2. **Сохранение данных**
   - Сообщения сохраняются в localStorage
   - ChatId уникален для каждой сессии браузера

## Cross-Cutting Concerns
1. **Error Handling**
   - Обработка ошибок сети и API
   - Отображение ошибок в интерфейсе

2. **Persistence**
   - Использование localStorage для хранения истории чата
   - Сохранение уникального ID чата

3. **Responsive Design**
   - Адаптивный дизайн с использованием TailwindCSS
   - Mobile-first подход 