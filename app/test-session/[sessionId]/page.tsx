'use client';

import { useEffect, useState } from 'react';
import Chat from '../../../src/components/Chat';

export default function ChatPage({ params }: { params: { sessionId: string } }) {
  // Обертка с передачей параметров для совместимости с компонентом
  return (
    <div id="chat-container" data-session-id={params.sessionId}>
      <Chat />
    </div>
  );
} 