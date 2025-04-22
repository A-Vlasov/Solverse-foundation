'use client';

import React from 'react';
import { useParams } from 'next/navigation'; 
import Chat from '../components/organisms/Chat'; 
import { LocaleProvider, useLocale } from '../contexts/LocaleContext';
import { useRouter } from 'next/navigation';


export default function ChatSessionEntryPage() {
  const { t } = useLocale();
  const router = useRouter();

  const handleCreateChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    router.push(`/chat-test/${newSessionId}`);
  };

  return (
    <LocaleProvider>
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={handleCreateChat}
        >
          {t('testInfoStartTest') || 'Создать чат'}
        </button>
      </div>
    </LocaleProvider>
  );
} 