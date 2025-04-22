import { NextResponse } from 'next/server';

import { validateCandidateToken } from '@/modules/candidate-form/lib/supabase';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateCandidateToken(token);

    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error validating candidate token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Token validation failed: ${message}` }, { status: 500 });
  }
} 