
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, message, employeeId, chatNumber, conversationDetails } = body;
  
  
  
  
  return NextResponse.json({ error: 'Not implemented', received: body }, { status: 501 });
} 