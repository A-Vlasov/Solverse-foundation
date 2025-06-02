import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Получение списка всех пользователей
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  
  try {
    let query = supabase.from('users').select('*');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    return NextResponse.json({ users: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Создание нового пользователя
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role } = body;
    
    // Валидация
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email and role are required' },
        { status: 400 }
      );
    }
    
    // Проверка на уникальность email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // Если ошибка, но не "not found"
      console.error('Error checking user:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing user' },
        { status: 500 }
      );
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Добавление пользователя
    const { data, error } = await supabase
      .from('users')
      .insert([
        { name, email, role, created_at: new Date().toISOString() }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 