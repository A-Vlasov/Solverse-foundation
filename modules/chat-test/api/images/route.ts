
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const description = formData.get('description') as string;
  const prompt = formData.get('prompt') as string;
  
  
  
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}







