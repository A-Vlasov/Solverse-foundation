# Интеграция модуля авторизации в другие модули

## Введение

Модуль авторизации (`modules/auth`) предоставляет централизованную систему авторизации через Telegram. Эта документация описывает, как интегрировать авторизацию в новый модуль приложения.

## Шаг 1: Создание структуры модуля

Создайте базовую структуру нового модуля, следуя атомарному дизайну:

```
modules/your-module/
├── components/
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── lib/
├── hooks/
└── api/
    └── utils/
```

## Шаг 2: Импорт необходимых компонентов и утилит

Все компоненты и функции авторизации доступны через единую точку входа:

```typescript

import { 
  useAuth,           
  UserProfile,       
  isAuthenticated    
} from '@/modules/auth';
```

## Шаг 3: Защита клиентских компонентов

### Использование хука `useAuth`

```typescript
'use client';


import React from 'react';
import { useAuth } from '@/modules/auth';

const ProtectedComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Загрузка...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Доступ запрещен</div>;
  }
  
  return (
    <div>
      <h1>Привет, {user?.name}!</h1>
      <p>Это защищенный компонент в вашем модуле</p>
    </div>
  );
};

export default ProtectedComponent;
```

### Создание защищенной страницы

```typescript

'use client';

import { useAuthRequired } from '@/modules/auth';
import YourModuleContent from '@/modules/your-module/components/organisms/YourModuleContent';

export default function ProtectedPage() {
  
  const { isLoading } = useAuthRequired();
  
  if (isLoading) {
    return <div>Загрузка...</div>;
  }
  
  return <YourModuleContent />;
}
```

## Шаг 4: Создание защищенных API-маршрутов

### Создание утилиты для проверки авторизации в вашем модуле

```typescript


import { withAuth } from '@/modules/dashboard/api/utils/authCheck';
export { withAuth };


export function hasModulePermission(user: any) {
  
  return true; 
}
```

### Создание защищенного API-маршрута

```typescript


import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../utils/auth';

export const GET = withAuth(async (request: NextRequest, user) => {
  
  
  
  
  const data = { 
    message: 'Защищенные данные модуля',
    userId: user.id
  };
  
  return NextResponse.json(data);
});
```

### Регистрация API-маршрута в Next.js

```typescript


import { GET, POST } from '@/modules/your-module/api/data';
export { GET, POST };
```

## Шаг 5: Получение данных авторизованного пользователя

### В клиентских компонентах

```typescript
'use client';
import { useAuth } from '@/modules/auth';

function UserInfo() {
  const { user } = useAuth();
  
  return (
    <div>
      <p>ID: {user?.id}</p>
      <p>Имя: {user?.name}</p>
      <p>Telegram: {user?.telegram_id ? `@${user.telegram_id}` : 'Не указан'}</p>
    </div>
  );
}
```

### В утилитах и сервисах

```typescript

import { getUser, getAuthHeader } from '@/modules/auth';

export async function fetchProtectedData() {
  
  const user = getUser();
  if (!user) {
    throw new Error('Требуется авторизация');
  }
  
  
  const headers = getAuthHeader();
  
  
  const response = await fetch('/api/your-module/data', {
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}
```

## Шаг 6: Настройка защиты для всего раздела модуля

Создайте компонент-обёртку для вашего модуля:

```typescript

'use client';

import React from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';

interface ModuleAuthWrapperProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function ModuleAuthWrapper({ 
  children, 
  requiredPermission 
}: ModuleAuthWrapperProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?from=/your-module');
    }
  }, [isAuthenticated, isLoading, router]);
  
  
  if (requiredPermission && user?.permissions) {
    const hasPermission = user.permissions.includes(requiredPermission);
    if (!hasPermission) {
      return <div>У вас нет прав для доступа к этому модулю</div>;
    }
  }
  
  if (isLoading) {
    return <div>Загрузка...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : null;
}
```

Используйте эту обёртку в layout вашего модуля:

```typescript

'use client';

import React from 'react';
import ModuleAuthWrapper from '@/modules/your-module/lib/ModuleAuthWrapper';

export default function YourModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleAuthWrapper requiredPermission="your-module:access">
      <div className="your-module-layout">
        {children}
      </div>
    </ModuleAuthWrapper>
  );
}
```

## Рекомендуемые паттерны

1. **Ленивая загрузка данных**: Загружайте данные только после проверки авторизации
2. **Уровни авторизации**: Используйте разные уровни проверки в зависимости от важности данных
3. **Централизация проверок**: Вынесите логику проверки прав в отдельные функции
4. **Обработка ошибок**: Всегда обрабатывайте случаи, когда авторизация отсутствует

## Проверка интеграции

После интеграции модуля авторизации убедитесь, что:

1. Неавторизованные пользователи перенаправляются на страницу входа
2. Авторизованные пользователи имеют доступ ко всем компонентам модуля
3. API-маршруты отклоняют запросы без токена авторизации
4. В профиле пользователя отображается корректная информация

## Полезные ссылки

- [Документация по использованию модуля авторизации](/docs/auth-module-usage.md)
- [Настройка Telegram авторизации](/docs/telegram-auth-setup.md) 