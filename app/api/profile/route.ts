import { NextResponse } from 'next/server';
import {
  getEmployee,
  getTestResultsForEmployee,
  getCandidateFormByEmployeeId
} from '../../../src/lib/supabase';

// GET /api/profile - получить профиль сотрудника с дополнительными данными
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID сотрудника не указан' },
        { status: 400 }
      );
    }
    
    // Получаем данные о сотруднике
    const employee = await getEmployee(id);
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }
    
    // Получаем результаты тестов для сотрудника
    const testResults = await getTestResultsForEmployee(id);
    
    // Получаем данные формы кандидата
    const candidateForm = await getCandidateFormByEmployeeId(id);
    
    // Формируем итоговый профиль
    const profile = {
      ...employee,
      test_results: testResults || [],
      candidate_form: candidateForm || null
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении профиля сотрудника' },
      { status: 500 }
    );
  }
} 