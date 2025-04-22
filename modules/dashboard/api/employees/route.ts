import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../utils/authCheck';
import { getEmployees } from '@/modules/dashboard/lib/supabase';

/**
 * GET-запрос на получение списка сотрудников (с проверкой авторизации)
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    
    const employees = await getEmployees();
    
    
    return NextResponse.json({ employees });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Ошибка при получении списка сотрудников' },
      { status: 500 }
    );
  }
}); 