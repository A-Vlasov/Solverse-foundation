import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Директория для хранения загруженных изображений
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Функция для создания директории, если она не существует
async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// POST /api/images - загрузить изображение
export async function POST(request: Request) {
  try {
    // Создаем директорию, если она не существует
    await ensureDir(UPLOAD_DIR);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }
    
    // Проверяем, что файл - изображение
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Загруженный файл должен быть изображением' },
        { status: 400 }
      );
    }
    
    // Получаем расширение файла
    const fileExt = file.name.split('.').pop() || 'jpg';
    
    // Генерируем уникальное имя файла
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // Чтение данных файла
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Запись файла на диск
    await writeFile(filePath, buffer);
    
    // Формируем URL для доступа к файлу
    const fileUrl = `/uploads/${fileName}`;
    
    // Получаем дополнительные метаданные из formData
    const description = formData.get('description') as string || '';
    const prompt = formData.get('prompt') as string || '';
    
    return NextResponse.json({
      success: true,
      file: {
        id: fileName.split('.')[0],
        name: file.name,
        url: fileUrl,
        thumbnail: fileUrl, // В этом примере используем то же изображение как превью
        description,
        prompt,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке изображения' },
      { status: 500 }
    );
  }
}

// GET /api/images - получить список изображений
export async function GET(request: Request) {
  try {
    // Здесь должна быть логика для получения списка изображений
    // Это может быть чтение из БД или сканирование директории
    
    // Для примера вернем пустой массив
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка изображений' },
      { status: 500 }
    );
  }
} 