import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateToken } from '../lib/jwtUtils'; 

/**
 * Обработчик для получения данных текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    
    const { isValid, user } = await validateToken(token);
    
    if (!isValid || !user) {
      
      const response = NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }
    
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении данных пользователя' },
      { status: 500 }
    );
  }
} 