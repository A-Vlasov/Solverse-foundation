'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Генерируем уникальный ID сессии и перенаправляем
    const sessionId = `demo-session-${Date.now()}`;
    router.replace(`/test-session/${sessionId}`);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Перенаправление...</p>
    </div>
  );
} 