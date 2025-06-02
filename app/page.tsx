'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Более агрессивное перенаправление, которое должно работать в любом случае
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      // Используем Next.js router как запасной вариант
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
        </div>
        <p>Перенаправление...</p>
      </div>
    </div>
  );
} 