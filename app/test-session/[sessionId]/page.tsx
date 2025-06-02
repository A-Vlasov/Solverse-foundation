'use client';

import { useEffect, useState } from 'react';
import Chat from '../../../src/components/Chat';
import { LocaleProvider } from '../../../src/contexts/LocaleContext';

export default function ChatPage({ params }: { params: { sessionId: string } }) {
  // Обертка с передачей параметров для совместимости с компонентом
  return (
    <LocaleProvider>
      <div id="chat-container" data-session-id={params.sessionId}>
        <Chat />
      </div>
    </LocaleProvider>
  );
} 