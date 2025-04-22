
import { NextResponse } from 'next/server';


export async function PATCH(request: Request) {
  const body = await request.json();
  const { sessionId, chatNumber, ...statusData } = body;
  
  return NextResponse.json({ error: 'Not implemented', received: body }, { status: 501 });
} 