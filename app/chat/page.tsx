'use client';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '../../src/locales';

export default function ChatPage() {
  // Определяем текущую локаль
  let locale = DEFAULT_LOCALE;
  
  // Пытаемся получить локаль из localStorage
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale === 'ru' || savedLocale === 'en') {
      locale = savedLocale;
    }
  }
  
  // Проверяем, можем ли мы использовать localStorage (только на клиенте)
  let existingDemoId = null;
  if (typeof window !== 'undefined') {
    existingDemoId = localStorage.getItem('activeDemoSessionId');
  }
  
  // Определяем ID сессии
  const sessionId = existingDemoId || `demo-session-${Date.now()}`;
  
  // Если создали новую сессию, сохраняем её
  if (!existingDemoId && typeof window !== 'undefined') {
    localStorage.setItem('activeDemoSessionId', sessionId);
    console.log('Created new demo session:', sessionId);
  } else if (existingDemoId) {
    console.log('Using existing demo session:', existingDemoId);
  }
  
  // Перенаправляем на тест с указанной сессией
  redirect(`/test-session/${sessionId}?lang=${locale}`);
  
  // Это просто для совместимости, не должно отображаться
  return (
    <div>
      <h1>Redirecting to chat...</h1>
      <Link href={`/test-session/${sessionId}?lang=${locale}`}>
        Click here if you are not redirected automatically
      </Link>
    </div>
  );
} 