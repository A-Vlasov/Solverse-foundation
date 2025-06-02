import { NextRequest, NextResponse } from 'next/server';
import { getRemainingSessionTime, extendSessionTime } from '../../../../src/lib/supabase';
import { TIMER_DURATION_SECONDS } from '../../../../src/constants/time';

/**
 * GET /api/test-sessions/timer - получить оставшееся время тестовой сессии
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      console.error('[API Timer] Ошибка: ID сессии не указан');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    console.log('[API Timer] Запрос оставшегося времени для сессии:', sessionId);
    
    // Получаем оставшееся время (используем константу TIMER_DURATION_SECONDS)
    const remainingTime = await getRemainingSessionTime(sessionId, TIMER_DURATION_SECONDS);
    
    console.log('[API Timer] Оставшееся время:', remainingTime, 'секунд');
    
    return NextResponse.json({
      success: true,
      remainingTime,
      formattedTime: formatTime(remainingTime)
    });
  } catch (error) {
    console.error('[API Timer] Ошибка при получении оставшегося времени:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get remaining time',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/test-sessions/timer - обновить таймер сессии (продлить время)
 */
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      console.error('[API Timer] Ошибка: ID сессии не указан');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const { action, additionalSeconds = TIMER_DURATION_SECONDS } = data; // Используем константу TIMER_DURATION_SECONDS вместо 300
    
    if (action !== 'extend') {
      console.error('[API Timer] Неизвестное действие:', action);
      return NextResponse.json(
        { error: 'Unknown action. Only "extend" is supported.' },
        { status: 400 }
      );
    }
    
    console.log('[API Timer] Продление времени сессии:', sessionId, 'на', additionalSeconds, 'секунд');
    
    // Продлеваем время сессии
    const updatedRemainingTime = await extendSessionTime(sessionId, additionalSeconds);
    
    console.log('[API Timer] Обновленное оставшееся время:', updatedRemainingTime, 'секунд');
    
    return NextResponse.json({
      success: true,
      remainingTime: updatedRemainingTime,
      formattedTime: formatTime(updatedRemainingTime)
    });
  } catch (error) {
    console.error('[API Timer] Ошибка при продлении времени сессии:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extend session time',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для форматирования времени
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
} 