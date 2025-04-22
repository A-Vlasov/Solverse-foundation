import { NextRequest, NextResponse } from 'next/server';
import { AuthDataValidator } from '@telegram-auth/server'; 
import { generateToken } from '@/modules/auth/lib/jwtUtils';
import { Employee, getEmployeeByTelegramId } from '@/modules/dashboard/lib/supabase'; 

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is not set!');
  
}

const validator = new AuthDataValidator({ botToken: BOT_TOKEN || '' });

/**
 * Обработчик для верификации данных от Telegram и создания сессии
 * Использует @telegram-auth/server для валидации
 */
export async function POST(request: NextRequest) {
  try {
    const authDataObj = await request.json(); 

    
    const authDataMap = new Map<string, string>();
    for (const key in authDataObj) {
      if (Object.prototype.hasOwnProperty.call(authDataObj, key)) {
        
        authDataMap.set(key, String(authDataObj[key]));
      }
    }

    
    const telegramUser = await validator.validate(authDataMap);

    
    
    if (!telegramUser || typeof telegramUser.id === 'undefined') {
      throw new Error('Validation result does not contain user ID');
    }
    const employee = await getEmployeeByTelegramId(String(telegramUser.id));

    if (!employee) {
       console.error(`Employee not found for validated Telegram ID: ${telegramUser.id}`);
      return NextResponse.json(
        { error: 'Пользователь Telegram подтвержден, но не найден в системе.' },
        { status: 403 } 
      );
    }

    
    const token = generateToken(employee);

    
    const response = NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        name: employee.first_name,
        telegram_id: employee.telegram_id,
      }
    });

    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, 
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    
    console.error('Telegram verification error (using @telegram-auth/server):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка верификации данных Telegram' },
      { status: 400 } 
    );
  }
} 