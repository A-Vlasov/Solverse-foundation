import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Функция для проверки маршрутов API
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Защита API-маршрутов
  if (pathname.startsWith('/api/')) {
    // Здесь можно добавить проверку аутентификации и авторизации
    // В простом варианте можно проверить наличие заголовка авторизации
    // или использовать куки сессии
    
    // Пример проверки заголовка или куки (закомментирован)
    /*
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('session');
    
    // Если нет авторизации, возвращаем 401
    if (!authHeader && !sessionCookie) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    */
    
    // Для разработки пока пропускаем все запросы
    return NextResponse.next();
  }
  
  // Все остальные запросы пропускаем без изменений
  return NextResponse.next();
}

// Указываем, для каких маршрутов применять middleware
export const config = {
  matcher: [
    // Применяем для всех API-маршрутов
    '/api/:path*',
    // И для определенных защищенных маршрутов
    '/admin/:path*',
    '/dashboard/:path*',
    '/employee/:path*',
    '/test-results/:path*'
  ],
}; 