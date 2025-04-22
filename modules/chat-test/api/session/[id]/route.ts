
import { NextResponse } from 'next/server';


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sessionId = params.id;
  
  return NextResponse.json({ error: 'Not implemented', sessionId }, { status: 501 });
}


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const sessionId = params.id;
  const body = await request.json();
  
  return NextResponse.json({ error: 'Not implemented', sessionId, action: body.action }, { status: 501 });
} 