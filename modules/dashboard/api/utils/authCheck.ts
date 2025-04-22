import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

/**
 * Проверяет авторизацию для API-маршрутов и возвращает данные пользователя
 * @param request Запрос Next.js
 * @returns Данные пользователя или null, если не авторизован
 */
export async function checkAuthAPI(request: NextRequest) {
  try {
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, user: null };
    }

    const token = authHeader.replace('Bearer ', '');
    
    
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      name: string;
      telegram_id: string;
    };
    
    
    return {
      isAuthenticated: true,
      user: {
        id: decoded.sub,
        name: decoded.name,
        telegram_id: decoded.telegram_id
      }
    };
  } catch (error) {
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Middleware для API маршрутов, требующих авторизации
 * @param handler Обработчик запроса
 */
export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const { isAuthenticated, user } = await checkAuthAPI(request);
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    
    return handler(request, user);
  };
} 