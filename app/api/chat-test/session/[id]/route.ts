import { NextRequest, NextResponse } from 'next/server';

import { validateToken } from '@/modules/auth/lib/jwtUtils'; 





async function findChatSessionById(sessionId: string, userId: string) {
    
    console.log(`Fetching session ${sessionId} for user ${userId}`);
    if (sessionId === 'test-session-123') { 
        return {
            id: sessionId,
            status: 'active', 
            startTime: new Date(Date.now() - 60 * 1000 * 5).toISOString(), 
            timeLimitSeconds: 60 * 15, 
            participants: [
                { id: 'user', name: 'User', isBot: false },
                { id: 'model1', name: 'Model Alpha', isBot: true, avatarUrl: '/foto/1.jpg' },
            ],
            
        };
    }
    return null;
}

export async function GET(
    request: NextRequest, 
    { params }: { params: { id: string } }
) {
    const sessionId = params.id;
    
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const validationResult = await validateToken(token);

    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = validationResult.user.id;

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    try {
        
        const chatSession = await findChatSessionById(sessionId, userId);

        if (!chatSession) {
            return NextResponse.json({ message: 'Chat session not found or access denied' }, { status: 404 });
        }

        
        

        return NextResponse.json(chatSession);

    } catch (error) {
        console.error(`Error fetching chat session ${sessionId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 