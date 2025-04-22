
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  
  return NextResponse.json({ error: 'Not implemented', sessionId }, { status: 501 });
} 