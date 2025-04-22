import { NextResponse } from 'next/server';
import {
  getCandidateFormByEmployeeId,
  saveCandidateForm
} from './../lib/supabase';


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const employeeId = url.searchParams.get('employeeId');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Необходимо указать employeeId' },
        { status: 400 }
      );
    }
    
    const form = await getCandidateFormByEmployeeId(employeeId);
        
    if (!form) {
      return NextResponse.json(
        { error: 'Форма не найдена' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching candidate form:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении формы кандидата' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.employee_id) {
      return NextResponse.json(
        { error: 'Необходимо указать employee_id' },
        { status: 400 }
      );
    }
    
    if (!data.formData) {
         return NextResponse.json(
        { error: 'Необходимо указать formData' },
        { status: 400 }
      );
    }

    const result = await saveCandidateForm({
        employee_id: data.employee_id, 
        first_name: data.formData.first_name,
        telegram_tag: data.formData.telegram_tag,
        shift: data.formData.shift,
        experience: data.formData.experience,
        motivation: data.formData.motivation,
        about_me: data.formData.about_me
    });
    
    return NextResponse.json({
      success: true,
      form: result
    });
  } catch (error) {
    console.error('Error saving candidate form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return NextResponse.json(
      { error: `Ошибка при сохранении формы кандидата: ${errorMessage}` },
      { status: 500 }
    );
  }
} 