import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils';
import { Message } from '@/modules/chat-test/hooks/useChatMessages'; 


async function saveMessage(sessionId: string, userId: string, messageData: Partial<Message>): Promise<Message> {
    console.log(`Saving message for session ${sessionId}, user ${userId}:`, messageData);
    
    if (sessionId === 'test-session-123') {
        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            sender: userId, 
            content: messageData.content || '',
            time: new Date().toISOString(),
            isOwn: true, 
            imageUrl: messageData.imageUrl,
            price: messageData.price,
            imageComment: messageData.imageComment,
        };
        
        await new Promise(resolve => setTimeout(resolve, 50));
        return newMessage;
    }
    throw new Error('Failed to save message to this session.');
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

    const { sessionId, content, imageUrl, price, imageComment } = body;
    const userId = validationResult.user.id; 

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }
    if (!content && !imageUrl) { 
        return NextResponse.json({ message: 'Message content or image URL is required' }, { status: 400 });
    }

    try {
        
        const messageToSave: Partial<Message> = {
            sender: userId,
            content,
            imageUrl,
            price,
            imageComment,
        };
        
        const savedMessage = await saveMessage(sessionId, userId, messageToSave);

        

        return NextResponse.json(savedMessage, { status: 201 }); 

    } catch (error: any) {
        console.error(`Error sending message for session ${sessionId}:`, error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
} 