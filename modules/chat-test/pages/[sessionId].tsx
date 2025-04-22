import React from 'react';
import { useParams } from 'next/navigation';
import Chat from '../components/organisms/Chat';
import { LocaleProvider } from '../contexts/LocaleContext';

export default function ChatTestPage() {
  const params = useParams();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

  if (!sessionId) {
    return (
      <LocaleProvider>
        <div className="flex h-screen items-center justify-center">
          <p className="text-red-500 font-semibold">Session ID not found in URL.</p>
        </div>
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider>
      <Chat sessionId={sessionId} />
    </LocaleProvider>
  );
} 