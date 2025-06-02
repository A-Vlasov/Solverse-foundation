import { NextResponse } from 'next/server';
import {
  getEmployees,
  getEmployee,
  createEmployee
} from '../../../src/lib/supabase';

// GET /api/employees - получить всех сотрудников или конкретного по id
export async function GET(request: Request) {
  try {
    console.log('API: Получен запрос на /api/employees');
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Если указан id, возвращаем конкретного сотрудника
    if (id) {
      console.log('API: Запрос сотрудника по ID:', id);
      try {
        const employee = await getEmployee(id);
        
        if (!employee) {
          console.log('API: Сотрудник не найден, ID:', id);
          return NextResponse.json(
            { error: 'Сотрудник не найден' },
            { status: 404 }
          );
        }
        
        console.log('API: Сотрудник найден, ID:', id);
        return NextResponse.json(employee);
      } catch (employeeError) {
        console.error('API: Ошибка при получении сотрудника по ID:', employeeError);
        return NextResponse.json(
          { error: 'Ошибка при получении данных о сотруднике', details: String(employeeError) },
          { status: 500 }
        );
      }
    }
    
    // Иначе возвращаем список всех сотрудников
    console.log('API: Запрос всех сотрудников');
    try {
      const employees = await getEmployees();
      console.log('API: Получены сотрудники, количество:', employees?.length || 0);
      
      return NextResponse.json(employees);
    } catch (listError) {
      console.error('API: Ошибка при получении списка сотрудников:', listError);
      return NextResponse.json(
        { error: 'Ошибка при получении данных о сотрудниках', details: String(listError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Глобальная ошибка в employees route:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных о сотрудниках', details: String(error) },
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