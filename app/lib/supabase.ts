'use client';

import { createClient } from '@supabase/supabase-js';

// Получаем переменные окружения из процесса
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Экспортируем интерфейсы и функции из исходного файла
export interface Employee {
  id: string;
  first_name: string;
  department?: string;
  level?: string;
  success?: number;
  improvement?: string;
  trend?: string;
  status?: string;
  created_at?: string;
}

export interface CandidateToken {
  id: string;
  employee_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
}

export interface ChatMessage {
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
}

export interface Chat {
  id: string;
  test_session_id: string;
  chat_number: 1 | 2 | 3 | 4;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface TestSession {
  id: string;
  employee_id: string;
  start_time: string;
  end_time?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
  };
  chats?: Chat[];
}

// Основные функции Supabase будут добавлены по мере необходимости
// Вы можете скопировать и добавить нужные функции из исходного файла src/lib/supabase.ts 