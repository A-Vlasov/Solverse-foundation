import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils';
import { UserStatusMap, UserStatus } from '@/modules/chat-test/hooks/useChatUsers'; 


async function getStatusesForSession(sessionId: string, userId: string): Promise<UserStatusMap> {
    console.log(`Fetching statuses for session ${sessionId}, user ${userId}`);
    
    if (sessionId === 'test-session-123') {
        
        const statuses: UserStatusMap = {
            'user': {
                isTyping: false,
                unreadCount: 0,
            },
            'model1': {
                isTyping: Math.random() > 0.8, 
                unreadCount: 0, 
            },
            
        };
        return statuses;
    }
    return {};
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
        const statuses = await getStatusesForSession(sessionId, validationResult.user.id);
        
        return NextResponse.json(statuses);
    } catch (error) {
        console.error(`Error fetching statuses for session ${sessionId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 