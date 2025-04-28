# Technical Context

## Tech Stack
- **Frontend**: 
  - Next.js 14
  - React 18
  - TypeScript
  - TailwindCSS
  
- **Backend**: 
  - Next.js API Routes
  - Node.js

- **External Services**:
  - Telegram Bot API

## Development Environment
- **Node.js**: v18+
- **Package Manager**: npm/yarn
- **Dev Server**: Next.js dev server

## Key Dependencies
- **Next.js**: Full-stack React framework
- **TailwindCSS**: Utility-first CSS framework
- **TypeScript**: Static typing for JavaScript
- **Telegram Bot SDK/API**: Для интеграции с Telegram

## Project Structure
```
/                 # Root directory
├── public/       # Static assets
├── src/
│   ├── app/      # Next.js App Router
│   │   ├── api/  # API Routes
│   │   ├── components/ # React components
│   │   └── page.tsx # Main page
│   ├── hooks/    # Custom React hooks
│   ├── lib/      # Библиотеки и утилиты
│   │   ├── telegram-bot.ts # Интеграция с Telegram ботом
│   │   └── telegram-account.ts # Работа с Telegram аккаунтом
│   └── types/    # TypeScript type definitions
├── .next/        # Next.js build directory
└── memory-bank/  # Project documentation
```

## Configuration
- **next.config.mjs**: Next.js configuration
- **tsconfig.json**: TypeScript configuration
- **postcss.config.mjs**: PostCSS configuration (for TailwindCSS)
- **eslint.config.mjs**: ESLint configuration

## APIs and Integrations
- **Telegram Bot API**:
  - Отправка сообщений от пользователя боту
  - Получение ответов от бота
  - Пересылка сообщений в указанный Telegram аккаунт

## Error Handling
- Минимальный набор обработки ошибок
- Тихие ошибки (без логирования)
- Пользователю отображаются общие сообщения об ошибках

## Technical Constraints
- Локальное хранение данных ограничено возможностями localStorage
- Ограничения Telegram Bot API по количеству сообщений и размеру сообщений

## Deployment
- Приложение может быть развернуто на Vercel, Netlify или других платформах, поддерживающих Next.js

## Testing
- Ручное тестирование интерфейса
- Тестирование API endpoints с помощью Postman или аналогичных инструментов 