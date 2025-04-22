import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Employee {
  id: string;
  first_name: string;
  department?: string;
  level?: string;
  success?: number;
  improvement?: string;
  trend?: string;
  status?: string;
  telegram_id?: string;
  created_at?: string;
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
  employee_name?: string;
  chats?: any[];
  telegram_tag?: string;
  message_count?: number;
}

export interface CandidateForm {
  id?: string;
  employee_id?: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
  created_at?: string;
}

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  return data || [];
}

export async function getRecentTestSessions(limit: number = 6): Promise<TestSession[]> {
  const { data, error } = await supabase
    .from('test_sessions')
    .select(`
      id,
      created_at,
      start_time,
      updated_at,
      completed,
      employee_id,
      chats (
        id,
        messages
      ),
      employee:employees (
        first_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Supabase: Ошибка при запросе последних сессий:', error);
    throw error;
  }

  const sessions = await Promise.all((data || []).map(async (session) => {
    let employeeName = 'Неизвестный сотрудник';
    if (session.employee && !Array.isArray(session.employee)) {
      const employeeData = session.employee as { first_name: string };
      employeeName = employeeData.first_name || employeeName;
    } else if (session.employee && Array.isArray(session.employee) && session.employee.length > 0) {
      const employeeData = session.employee[0] as { first_name: string };
      employeeName = employeeData.first_name || employeeName;
    }
    let telegram_tag: string | undefined = undefined;
    try {
      const candidateForm = await getCandidateForm(session.employee_id);
      telegram_tag = candidateForm?.telegram_tag || undefined;
    } catch {}
    let message_count = 0;
    if (session.chats && Array.isArray(session.chats)) {
      message_count = session.chats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
    }
    const { employee, ...restOfSession } = session;
    return {
      ...restOfSession,
      employee_name: employeeName,
      telegram_tag,
      message_count,
    };
  }));

  return sessions as unknown as TestSession[];
}

export async function getCandidateForm(employeeId: string): Promise<CandidateForm | null> {
  const { data, error } = await supabase
    .from('candidate_forms')
    .select('*')
    .eq('employee_id', employeeId)
    .single();
  if (error) return null;
  return data;
}

export interface FrequentError {
  id: string | number;
  description: string;
  count: number;
}

export async function getFrequentErrors(limit: number = 5): Promise<FrequentError[]> {
  console.warn('Функция getFrequentErrors использует моковые данные!');
  await new Promise(resolve => setTimeout(resolve, 100));
  return [
    { id: 1, description: 'Неправильное приветствие', count: 15 },
    { id: 2, description: 'Отсутствие эмпатии', count: 12 },
    { id: 3, description: 'Неточные формулировки', count: 8 },
  ].slice(0, limit);
}

/**
 * Проверяет существование сотрудника по Telegram ID
 */
export async function employeeExistsByTelegramId(telegramId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('telegram_id', telegramId)
    .single();
  
  if (error) {
    
    if (error.code === 'PGRST116') {
      return false;
    }
    
    throw error;
  }
  
  return !!data;
}

/**
 * Получает данные сотрудника по Telegram ID
 */
export async function getEmployeeByTelegramId(telegramId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  
  if (error) return null;
  return data;
}

/**
 * Проверяет и валидирует данные авторизации от Telegram
 * 
 */
/*
export async function validateTelegramAuth(authData: {
  id: string;
  first_name?: string;
  username?: string;
  auth_date: string;
  hash: string;
}): Promise<{ isValid: boolean; employee: Employee | null }> {
  
}
*/ 