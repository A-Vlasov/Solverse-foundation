import { NextResponse } from 'next/server';
import { 
  getTestSession, 
  completeTestSession 
} from '../../../../src/lib/supabase';

// POST /api/chat/complete - завершить тестовую сессию
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId } = data;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID сессии не указан' },
        { status: 400 }
      );
    }
    
    // Получаем сессию для проверки её существования
    const session = await getTestSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }
    
    // Проверяем, не завершена ли сессия уже
    if (session.completed) {
      return NextResponse.json({
        success: true,
        message: 'Сессия уже завершена',
        session
      });
    }
    
    // Завершаем сессию
    const completedSession = await completeTestSession(sessionId);
    
    return NextResponse.json({
      success: true,
      message: 'Сессия успешно завершена',
      session: completedSession
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Ошибка при завершении сессии' },
      { status: 500 }
    );
  }
} 