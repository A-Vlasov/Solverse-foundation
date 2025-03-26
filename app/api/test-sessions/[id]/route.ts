import { NextResponse } from 'next/server';
import { getTestSession } from '../../../../src/lib/supabase';

// GET /api/test-sessions/:id - получить информацию о тестовой сессии по ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Необходимо указать ID сессии' },
        { status: 400 }
      );
    }
    
    const session = await getTestSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching test session:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных сессии' },
      { status: 500 }
    );
  }
} 