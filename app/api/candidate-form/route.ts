import { NextResponse } from 'next/server';
import {
  getCandidateForm,
  getCandidateFormByEmployeeId,
  saveCandidateForm
} from '../../../src/lib/supabase';

// GET /api/candidate-form - получить форму кандидата по id или employeeId
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const employeeId = url.searchParams.get('employeeId');
    
    // Должен быть указан либо id, либо employeeId
    if (!id && !employeeId) {
      return NextResponse.json(
        { error: 'Необходимо указать id или employeeId' },
        { status: 400 }
      );
    }
    
    let form;
    
    if (id) {
      form = await getCandidateForm(id);
    } else if (employeeId) {
      form = await getCandidateFormByEmployeeId(employeeId);
    }
    
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

// POST /api/candidate-form - сохранить форму кандидата
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Проверяем наличие userId
    if (!data.userId) {
      return NextResponse.json(
        { error: 'Необходимо указать userId' },
        { status: 400 }
      );
    }
    
    const formData = {
      first_name: data.first_name,
      telegram_tag: data.telegram_tag,
      shift: data.shift,
      experience: data.experience,
      motivation: data.motivation,
      about_me: data.about_me
    };
    
    const result = await saveCandidateForm(data.userId, formData);
    
    return NextResponse.json({
      success: true,
      form: result
    });
  } catch (error) {
    console.error('Error saving candidate form:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении формы кандидата' },
      { status: 500 }
    );
  }
} 