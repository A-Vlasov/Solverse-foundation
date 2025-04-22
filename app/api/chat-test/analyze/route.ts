import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils';


async function triggerAnalysis(sessionId: string, userId: string): Promise<boolean> {
    console.log(`Triggering analysis for session ${sessionId}, requested by user ${userId}`);
    
    
    if (sessionId === 'test-session-123') {
        
        console.log(`Analysis job for ${sessionId} queued.`);
        await new Promise(resolve => setTimeout(resolve, 100)); 
        return true; 
    }
    throw new Error('Cannot trigger analysis for this session.');
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const validationResult = await validateToken(token);
    if (!validationResult.isValid || !validationResult.user?.id) {
        return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const { sessionId } = body;
    const userId = validationResult.user.id;

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    try {
        const success = await triggerAnalysis(sessionId, userId);
        if (success) {
            
            
            return NextResponse.json({ message: 'Analysis process started' }, { status: 202 });
        }
        
        return NextResponse.json({ message: 'Failed to start analysis' }, { status: 500 });

    } catch (error: any) {
        console.error(`Error triggering analysis for session ${sessionId}:`, error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
} 