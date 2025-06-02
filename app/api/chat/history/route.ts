import { NextResponse } from 'next/server';
import { getChatHistory } from '../../../../src/lib/supabase';

// GET /api/chat/history - получить историю чата по sessionId
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId' },
        { status: 400 }
      );
    }
    
    const history = await getChatHistory(sessionId);
    
    if (!history || history.length === 0) {
      console.log('No chat history found for session:', sessionId);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении истории чата' },
      { status: 500 }
    );
  }
} 