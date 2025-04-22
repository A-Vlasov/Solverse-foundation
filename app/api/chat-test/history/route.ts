import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils';
import { Message } from '@/modules/chat-test/hooks/useChatMessages'; 


async function findMessagesBySessionId(sessionId: string, userId: string): Promise<Message[]> {
    console.log(`Fetching messages for session ${sessionId}, user ${userId}`);
    
    if (sessionId === 'test-session-123') {
        
        return [
            {
                id: 'msg1',
                sender: 'model1',
                content: 'Здравствуйте! Чем могу помочь?',
                time: new Date(Date.now() - 60 * 1000 * 3).toISOString(),
                isOwn: false, 
            },
            {
                id: 'msg2',
                sender: 'user', 
                content: 'Расскажи анекдот',
                time: new Date(Date.now() - 60 * 1000 * 2).toISOString(),
                isOwn: true, 
            },
            {
                id: 'msg3',
                sender: 'model1',
                content: 'Колобок повесился.',
                time: new Date(Date.now() - 60 * 1000 * 1).toISOString(),
                isOwn: false, 
            },
        ].map(msg => ({ ...msg, isOwn: msg.sender === 'user' })); 
        
    }
    return [];
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const validationResult = await validateToken(token);
    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    try {
        
        const messages = await findMessagesBySessionId(sessionId, validationResult.user.id);
        
        const processedMessages = messages.map(msg => ({
            ...msg,
            isOwn: msg.sender === validationResult.user!.id || (msg.sender === 'user' && !msg.sender.startsWith('model')) 
            
        }));
        return NextResponse.json(processedMessages);
    } catch (error) {
        console.error(`Error fetching chat history for session ${sessionId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 