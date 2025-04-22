
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  return NextResponse.json({ error: 'Not implemented', sessionId }, { status: 501 });
}


export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const body = await request.json();
  const additionalSeconds = body.additionalSeconds;
  
  return NextResponse.json({ error: 'Not implemented', sessionId, additionalSeconds }, { status: 501 });
} 