import { NextResponse } from 'next/server';
import {
  getEmployees,
  getEmployee,
  createEmployee
} from '../../../src/lib/supabase';

// GET /api/employees - получить всех сотрудников или конкретного по id
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Если указан id, возвращаем конкретного сотрудника
    if (id) {
      const employee = await getEmployee(id);
      
      if (!employee) {
        return NextResponse.json(
          { error: 'Сотрудник не найден' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(employee);
    }
    
    // Иначе возвращаем список всех сотрудников
    const employees = await getEmployees();
    
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных о сотрудниках' },
      { status: 500 }
    );
  }
}

// POST /api/employees/create - создать нового сотрудника
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Минимальная валидация данных
    if (!data.first_name) {
      return NextResponse.json(
        { error: 'Имя сотрудника обязательно' },
        { status: 400 }
      );
    }
    
    // Создаем нового сотрудника
    const employee = await createEmployee({
      first_name: data.first_name,
      department: data.department || '',
      level: data.level || '',
      status: data.status || 'pending',
      success: data.success || null,
      improvement: data.improvement || null,
      trend: data.trend || null
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Не удалось создать сотрудника' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
} 