import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as CryptoJS from 'crypto-js';

// Инициализируем Supabase клиент для серверной части
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials missing');
}

// Создаем клиент с сервисным ключом для полного доступа
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

// Функция для хеширования пароля
function hashPassword(password: string) {
  return CryptoJS.MD5(password).toString();
}

// Обработчик POST запроса для входа в систему
export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const body = await request.json();
    const { username, password } = body;

    // Валидация входных данных
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Имя пользователя и пароль обязательны' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = hashPassword(password);

    // Запрос к базе данных
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single();

    // Обработка ошибок базы данных
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Ошибка при проверке учетных данных' },
        { status: 500 }
      );
    }

    // Если пользователь не найден
    if (!data) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    // Возвращаем данные пользователя
    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        role: 'admin',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Добавим GET для проверки сессии (если она была бы реализована)
export async function GET() {
  return NextResponse.json(
    { message: 'Требуется аутентификация через POST запрос' },
    { status: 200 }
  );
} 