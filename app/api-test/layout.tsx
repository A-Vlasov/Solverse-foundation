import React from 'react';
import Link from 'next/link';

export default function ApiTestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Тестирование API</h1>
        </div>
      </header>
      
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <ul className="flex space-x-6">
            <li>
              <Link 
                href="/api-test" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Генерация сообщений
              </Link>
            </li>
            <li>
              <Link 
                href="/api-test/analyze-test" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Анализ диалогов
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <main>
        {children}
      </main>
      
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Тестовая страница для проверки API Grok и Gemini
        </div>
      </footer>
    </div>
  );
} 