
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId } = body;
  
  
  return NextResponse.json({ error: 'Not implemented', sessionId }, { status: 501 });
}







