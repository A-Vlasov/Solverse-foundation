'use client';

import React from 'react';
import { useParams } from 'next/navigation'; 
import ChatInterface from '@/modules/chat-test/components/organisms/ChatInterface';
import { LocaleProvider } from '@/modules/chat-test/lib/LocaleContext'; 
import { SWRConfig } from 'swr'; 

export default function ChatTestPage() {
    
    
    const params = useParams();
    const sessionId = params?.sessionId as string || 'test-session-123'; 

    if (!sessionId) {
        
        return <div>Loading session...</div>; 
    }

    return (
        <LocaleProvider> {}
          <SWRConfig value={{ fetcher: (url) => fetch(url).then(res => res.json()) }}> {}
                <div className="flex h-screen bg-[#1e1e1e] text-white">
                    {}
                    <ChatInterface sessionId={sessionId} />
                </div>
            </SWRConfig>
        </LocaleProvider>
    );
} 