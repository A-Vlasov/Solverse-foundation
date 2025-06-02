import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Директория для хранения загруженных изображений
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// GET /api/images/:id - получить информацию об изображении
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Здесь должна быть логика для получения информации о конкретном изображении
    // Например, поиск в БД или проверка файловой системы
    
    // Для примера предположим, что у нас есть файл с расширением .jpg
    const filePath = path.join(UPLOAD_DIR, `${id}.jpg`);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Изображение не найдено' },
        { status: 404 }
      );
    }
    
    // Возвращаем информацию об изображении
    return NextResponse.json({
      id,
      url: `/uploads/${id}.jpg`,
      thumbnail: `/uploads/${id}.jpg`
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении информации об изображении' },
      { status: 500 }
    );
  }
}

// DELETE /api/images/:id - удалить изображение
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Проверяем наличие файла с разными расширениями
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let filePath = '';
    let fileFound = false;
    
    for (const ext of extensions) {
      const testPath = path.join(UPLOAD_DIR, `${id}.${ext}`);
      if (existsSync(testPath)) {
        filePath = testPath;
        fileFound = true;
        break;
      }
    }
    
    if (!fileFound) {
      return NextResponse.json(
        { error: 'Изображение не найдено' },
        { status: 404 }
      );
    }
    
    // Удаляем файл
    await unlink(filePath);
    
    // Здесь также должна быть логика для удаления записи из БД, если она есть
    
    return NextResponse.json({
      success: true,
      message: 'Изображение успешно удалено'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении изображения' },
      { status: 500 }
    );
  }
}

// PATCH /api/images/:id - обновить метаданные изображения
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Проверяем существование файла
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let fileFound = false;
    let fileExt = '';
    
    for (const ext of extensions) {
      const testPath = path.join(UPLOAD_DIR, `${id}.${ext}`);
      if (existsSync(testPath)) {
        fileFound = true;
        fileExt = ext;
        break;
      }
    }
    
    if (!fileFound) {
      return NextResponse.json(
        { error: 'Изображение не найдено' },
        { status: 404 }
      );
    }
    
    // Здесь должна быть логика для обновления метаданных изображения в БД
    // В данном примере мы просто возвращаем обновленные данные
    
    return NextResponse.json({
      success: true,
      file: {
        id,
        url: `/uploads/${id}.${fileExt}`,
        thumbnail: `/uploads/${id}.${fileExt}`,
        description: data.description || '',
        prompt: data.prompt || ''
      }
    });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении метаданных изображения' },
      { status: 500 }
    );
  }
} 