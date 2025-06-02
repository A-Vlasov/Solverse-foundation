import { NextResponse } from 'next/server';
import { 
  createEmployee, 
  completeAllEmployeeTestSessions, 
  createCandidateToken 
} from '../../../../src/lib/supabase';

// POST /api/employees/create - создать нового сотрудника
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { firstName, department, level, status } = data;
    
    // Создаем сотрудника в Supabase
    const employee = await createEmployee({
      first_name: firstName || '',
      department: department || 'Candidates',
      level: level || 'Junior',
      success: 0,
      trend: 'up',
      improvement: '',
      status: status || 'Active'
    });
    
    console.log('Employee created successfully:', employee);
    
    // Завершаем все активные сессии для этого сотрудника (на всякий случай)
    try {
      await completeAllEmployeeTestSessions(employee.id);
      console.log('All previous sessions for this employee have been marked as completed');
    } catch (sessionError) {
      console.error('Error completing previous sessions:', sessionError);
      // Продолжаем выполнение даже при ошибке
    }

    // Создаем токен для кандидата
    const token = await createCandidateToken(employee.id);
    console.log('Created candidate token:', token);
    
    // Генерируем ссылку для тестирования (базовая часть будет добавлена на клиенте)
    const origin = request.headers.get('origin') || '';
    const testLink = `${origin}/candidate?token=${token}`;
    
    return NextResponse.json({
      success: true,
      employee,
      token,
      testLink
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
} 